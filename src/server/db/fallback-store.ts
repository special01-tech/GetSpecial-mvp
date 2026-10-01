import fs from 'fs';
import path from 'path';

/* =============================================================================
 * Fallback In-Memory & File-Persisted Store
 *
 * Assure la persistance locale transparente des données (restaurant, profil,
 * offres, opportunités, posts, publications, signaux, feedbacks, audit)
 * lorsque PostgreSQL distant (Supabase) est inaccessible ou non configuré.
 * Stocké dans .data/getspecial_store.json pour survivre aux rechargements serveur.
 * ============================================================================= */

interface StoreData {
  users: any[];
  restaurants: any[];
  restaurantProfiles: any[];
  offers: any[];
  socialAccounts: any[];
  signals: any[];
  opportunities: any[];
  posts: any[];
  publications: any[];
  feedbackEvents: any[];
  auditLogs: any[];
}

export class LocalFallbackStore {
  private filePath: string;
  private data: StoreData = {
    users: [],
    restaurants: [],
    restaurantProfiles: [],
    offers: [],
    socialAccounts: [],
    signals: [],
    opportunities: [],
    posts: [],
    publications: [],
    feedbackEvents: [],
    auditLogs: [],
  };

  constructor() {
    const dir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Ignorer si déjà existant
      }
    }
    this.filePath = path.join(dir, 'getspecial_store.json');
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || [],
          restaurants: parsed.restaurants || [],
          restaurantProfiles: parsed.restaurantProfiles || [],
          offers: parsed.offers || [],
          socialAccounts: parsed.socialAccounts || [],
          signals: parsed.signals || [],
          opportunities: parsed.opportunities || [],
          posts: parsed.posts || [],
          publications: parsed.publications || [],
          feedbackEvents: parsed.feedbackEvents || [],
          auditLogs: parsed.auditLogs || [],
        };
      }
    } catch (e) {
      console.warn('[FALLBACK_STORE] Erreur de lecture du store local, initialisation vide:', e);
    }
  }

  private persist() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[FALLBACK_STORE] Erreur d’écriture du store local:', e);
    }
  }

  get user() {
    return {
      findUnique: async ({ where }: any) => {
        return this.data.users.find((u) => u.id === where.id || u.email === where.email) || null;
      },
      findFirst: async ({ where }: any = {}) => {
        if (!where) return this.data.users[0] || null;
        return (
          this.data.users.find((u) => {
            if (where.id && u.id !== where.id) return false;
            if (where.email && u.email !== where.email) return false;
            return true;
          }) || null
        );
      },
      create: async ({ data }: any) => {
        const item = {
          id: data.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          email: data.email,
          name: data.name || null,
          avatarUrl: data.avatarUrl || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.data.users.push(item);
        this.persist();
        return item;
      },
      upsert: async ({ where, create, update }: any) => {
        const idx = this.data.users.findIndex((u) => u.id === where.id || u.email === where.email);
        if (idx !== -1) {
          this.data.users[idx] = {
            ...this.data.users[idx],
            ...update,
            updatedAt: new Date(),
          };
          this.persist();
          return this.data.users[idx];
        } else {
          const item = {
            id: where.id || create.id || `usr_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...create,
          };
          this.data.users.push(item);
          this.persist();
          return item;
        }
      },
    };
  }

  get restaurant() {
    return {
      findUnique: async ({ where, include }: any) => {
        const rest = this.data.restaurants.find((r) => r.id === where.id);
        if (!rest) return null;
        return this.hydrateRestaurant(rest, include);
      },
      findFirst: async ({ where, include }: any = {}) => {
        let list = [...this.data.restaurants];
        if (where?.userId) {
          list = list.filter((r) => r.userId === where.userId);
        }
        if (where?.id) {
          list = list.filter((r) => r.id === where.id);
        }
        if (list.length === 0) return null;
        return this.hydrateRestaurant(list[0], include);
      },
      findMany: async ({ where, include, orderBy }: any = {}) => {
        let list = [...this.data.restaurants];
        if (where?.userId) {
          list = list.filter((r) => r.userId === where.userId);
        }
        if (where?.status) {
          list = list.filter((r) => r.status === where.status);
        }
        if (orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list.map((r) => this.hydrateRestaurant(r, include));
      },
      count: async ({ where }: any = {}) => {
        let list = [...this.data.restaurants];
        if (where?.userId) list = list.filter((r) => r.userId === where.userId);
        return list.length;
      },
      create: async ({ data, include }: any) => {
        const id = `rest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const { profile, offers, socialAccounts, ...restFields } = data;
        const item = {
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
          isPaused: false,
          timezone: 'Europe/Paris',
          specialties: [],
          ...restFields,
        };
        this.data.restaurants.push(item);

        if (profile?.create) {
          const profileItem = {
            id: `prof_${Date.now()}`,
            restaurantId: id,
            tone: profile.create.tone || 'Convivial',
            hasTerrace: Boolean(profile.create.hasTerrace),
            offPeakDays: profile.create.offPeakDays || [],
            constraints: profile.create.constraints || [],
            customRules: profile.create.customRules || null,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.data.restaurantProfiles.push(profileItem);
        }

        if (offers?.create && Array.isArray(offers.create)) {
          for (const off of offers.create) {
            this.data.offers.push({
              id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              restaurantId: id,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
              ...off,
            });
          }
        }

        this.persist();
        return this.hydrateRestaurant(item, include);
      },
      update: async ({ where, data, include }: any) => {
        const idx = this.data.restaurants.findIndex((r) => r.id === where.id);
        if (idx === -1) throw new Error('Restaurant introuvable');
        const { profile, ...restFields } = data;

        this.data.restaurants[idx] = {
          ...this.data.restaurants[idx],
          ...restFields,
          updatedAt: new Date(),
        };

        if (profile?.upsert) {
          const profIdx = this.data.restaurantProfiles.findIndex((p) => p.restaurantId === where.id);
          if (profIdx !== -1) {
            this.data.restaurantProfiles[profIdx] = {
              ...this.data.restaurantProfiles[profIdx],
              ...profile.upsert.update,
              updatedAt: new Date(),
            };
          } else {
            this.data.restaurantProfiles.push({
              id: `prof_${Date.now()}`,
              restaurantId: where.id,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
              ...profile.upsert.create,
            });
          }
        }

        this.persist();
        return this.hydrateRestaurant(this.data.restaurants[idx], include);
      },
    };
  }

  get restaurantProfile() {
    return {
      findUnique: async ({ where }: any) => {
        return this.data.restaurantProfiles.find((p) => p.restaurantId === where.restaurantId || p.id === where.id) || null;
      },
      upsert: async ({ where, create, update }: any) => {
        const idx = this.data.restaurantProfiles.findIndex(
          (p) => p.restaurantId === where.restaurantId || p.id === where.id
        );
        if (idx !== -1) {
          this.data.restaurantProfiles[idx] = {
            ...this.data.restaurantProfiles[idx],
            ...update,
            updatedAt: new Date(),
          };
          this.persist();
          return this.data.restaurantProfiles[idx];
        } else {
          const item = {
            id: `prof_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'active',
            ...create,
          };
          this.data.restaurantProfiles.push(item);
          this.persist();
          return item;
        }
      },
    };
  }

  get offer() {
    return {
      findMany: async ({ where }: any = {}) => {
        let list = [...this.data.offers];
        if (where?.restaurantId) list = list.filter((o) => o.restaurantId === where.restaurantId);
        if (where?.status) list = list.filter((o) => o.status === where.status);
        return list;
      },
      count: async ({ where }: any = {}) => {
        let list = [...this.data.offers];
        if (where?.restaurantId) list = list.filter((o) => o.restaurantId === where.restaurantId);
        return list.length;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'active',
          recurrence: 'none',
          recurrenceDays: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.data.offers.push(item);
        this.persist();
        return item;
      },
    };
  }

  get socialAccount() {
    return {
      findMany: async ({ where }: any = {}) => {
        let list = [...this.data.socialAccounts];
        if (where?.restaurantId) list = list.filter((s) => s.restaurantId === where.restaurantId);
        return list;
      },
      upsert: async ({ where, create, update }: any) => {
        const restaurantId = where?.restaurantId_platform?.restaurantId || where?.restaurantId;
        const platform = where?.restaurantId_platform?.platform || where?.platform;

        const idx = this.data.socialAccounts.findIndex(
          (s) => s.restaurantId === restaurantId && s.platform === platform
        );

        if (idx !== -1) {
          this.data.socialAccounts[idx] = {
            ...this.data.socialAccounts[idx],
            ...update,
            updatedAt: new Date(),
          };
          this.persist();
          return this.data.socialAccounts[idx];
        } else {
          const item = {
            id: `soc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...create,
          };
          this.data.socialAccounts.push(item);
          this.persist();
          return item;
        }
      },
    };
  }

  get signal() {
    return {
      create: async ({ data }: any) => {
        const item = {
          id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          detectedAt: new Date(),
          createdAt: new Date(),
          status: 'active',
          ...data,
        };
        this.data.signals.push(item);
        this.persist();
        return item;
      },
      findFirst: async ({ where }: any = {}) => {
        let list = [...this.data.signals];
        if (where?.restaurantId) list = list.filter((s) => s.restaurantId === where.restaurantId);
        if (where?.type) list = list.filter((s) => s.type === where.type);
        if (where?.source) list = list.filter((s) => s.source === where.source);
        return list[0] || null;
      },
      findMany: async ({ where, orderBy, take }: any = {}) => {
        let list = [...this.data.signals];
        if (where?.restaurantId) list = list.filter((s) => s.restaurantId === where.restaurantId);
        if (where?.type) list = list.filter((s) => s.type === where.type);
        if (orderBy?.detectedAt === 'desc') {
          list.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
        }
        if (take) {
          list = list.slice(0, take);
        }
        return list;
      },
    };
  }

  get opportunity() {
    return {
      findUnique: async ({ where }: any) => {
        const opp = this.data.opportunities.find((o) => o.id === where.id);
        if (!opp) return null;
        const rest = this.data.restaurants.find((r) => r.id === opp.restaurantId);
        return {
          ...opp,
          restaurant: rest ? this.hydrateRestaurant(rest, { profile: true }) : null,
        };
      },
      findMany: async ({ where, orderBy }: any = {}) => {
        let list = [...this.data.opportunities];
        if (where?.restaurantId) list = list.filter((o) => o.restaurantId === where.restaurantId);
        if (where?.status) list = list.filter((o) => o.status === where.status);
        if (orderBy?.suggestedAt === 'desc') {
          list.sort((a, b) => new Date(b.suggestedAt).getTime() - new Date(a.suggestedAt).getTime());
        }
        return list;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `opp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          suggestedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'pending',
          urgency: 'medium',
          relevanceScore: 0.85,
          ...data,
        };
        this.data.opportunities.push(item);
        this.persist();
        return item;
      },
      update: async ({ where, data }: any) => {
        const idx = this.data.opportunities.findIndex((o) => o.id === where.id);
        if (idx === -1) throw new Error('Opportunité introuvable');
        this.data.opportunities[idx] = {
          ...this.data.opportunities[idx],
          ...data,
          updatedAt: new Date(),
        };
        this.persist();
        return this.data.opportunities[idx];
      },
    };
  }

  get post() {
    return {
      findUnique: async ({ where }: any) => {
        const post = this.data.posts.find((p) => p.id === where.id);
        if (!post) return null;
        const rest = this.data.restaurants.find((r) => r.id === post.restaurantId);
        return {
          ...post,
          restaurant: rest ? this.hydrateRestaurant(rest, { socialAccounts: true, profile: true }) : null,
        };
      },
      findMany: async ({ where, include, orderBy }: any = {}) => {
        let list = [...this.data.posts];
        if (where?.restaurantId) list = list.filter((p) => p.restaurantId === where.restaurantId);
        if (where?.status?.in) list = list.filter((p) => where.status.in.includes(p.status));
        if (orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list.map((p) => {
          const copy = { ...p };
          if (include?.publications) {
            copy.publications = this.data.publications
              .filter((pub) => pub.postId === p.id)
              .map((pub) => {
                const pubCopy = { ...pub };
                if (include.publications.include?.feedbackEvents) {
                  pubCopy.feedbackEvents = this.data.feedbackEvents.filter((f) => f.publicationId === pub.id);
                }
                return pubCopy;
              });
          }
          return copy;
        });
      },
      create: async ({ data, include }: any) => {
        const id = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const { publications, ...postFields } = data;
        const item = {
          id,
          status: 'pending_approval',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...postFields,
        };
        this.data.posts.push(item);

        if (publications?.create) {
          const pubs = Array.isArray(publications.create) ? publications.create : [publications.create];
          for (const pub of pubs) {
            this.data.publications.push({
              id: `pub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              postId: id,
              status: pub.status || 'pending',
              createdAt: new Date(),
              updatedAt: new Date(),
              ...pub,
            });
          }
        }

        this.persist();

        const copy = { ...item };
        if (include?.publications) {
          copy.publications = this.data.publications.filter((pub) => pub.postId === id);
        }
        return copy;
      },
      update: async ({ where, data }: any) => {
        const idx = this.data.posts.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error('Post introuvable');
        this.data.posts[idx] = {
          ...this.data.posts[idx],
          ...data,
          updatedAt: new Date(),
        };
        this.persist();
        return this.data.posts[idx];
      },
    };
  }

  get publication() {
    return {
      findMany: async ({ where, include, orderBy }: any = {}) => {
        let list = [...this.data.publications];
        if (where?.restaurantId) list = list.filter((p) => p.restaurantId === where.restaurantId);
        if (where?.status) list = list.filter((p) => p.status === where.status);
        if (orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list.map((pub) => {
          const copy = { ...pub };
          if (include?.post) {
            copy.post = this.data.posts.find((p) => p.id === pub.postId) || null;
          }
          if (include?.feedbackEvents) {
            copy.feedbackEvents = this.data.feedbackEvents.filter((f) => f.publicationId === pub.id);
          }
          return copy;
        });
      },
      findUnique: async ({ where }: any) => {
        return this.data.publications.find((p) => p.id === where.id) || null;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `pub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'pending',
          attempts: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.data.publications.push(item);
        this.persist();
        return item;
      },
      update: async ({ where, data }: any) => {
        const idx = this.data.publications.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error('Publication introuvable');
        this.data.publications[idx] = {
          ...this.data.publications[idx],
          ...data,
          updatedAt: new Date(),
        };
        this.persist();
        return this.data.publications[idx];
      },
    };
  }

  get feedbackEvent() {
    return {
      create: async ({ data }: any) => {
        const item = {
          id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'active',
          createdAt: new Date(),
          ...data,
        };
        this.data.feedbackEvents.push(item);
        this.persist();
        return item;
      },
      findMany: async ({ where, orderBy }: any = {}) => {
        let list = [...this.data.feedbackEvents];
        if (where?.restaurantId) list = list.filter((f) => f.restaurantId === where.restaurantId);
        if (where?.type) list = list.filter((f) => f.type === where.type);
        if (orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list;
      },
    };
  }

  get auditLog() {
    return {
      create: async ({ data }: any) => {
        const item = {
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date(),
          status: 'logged',
          ...data,
        };
        this.data.auditLogs.push(item);
        this.persist();
        return item;
      },
      findMany: async () => [...this.data.auditLogs],
    };
  }

  private hydrateRestaurant(rest: any, include: any = {}) {
    const copy = { ...rest };
    if (include?.profile) {
      copy.profile = this.data.restaurantProfiles.find((p) => p.restaurantId === rest.id) || null;
    }
    if (include?.offers) {
      copy.offers = this.data.offers.filter((o) => o.restaurantId === rest.id);
    }
    if (include?.socialAccounts) {
      copy.socialAccounts = this.data.socialAccounts.filter((a) => a.restaurantId === rest.id);
    }
    if (include?.signals) {
      copy.signals = this.data.signals.filter((s) => s.restaurantId === rest.id);
    }
    if (include?.opportunities) {
      copy.opportunities = this.data.opportunities.filter((o) => o.restaurantId === rest.id);
    }
    if (include?.posts) {
      copy.posts = this.data.posts.filter((p) => p.restaurantId === rest.id);
    }
    if (include?.feedbackEvents) {
      copy.feedbackEvents = this.data.feedbackEvents.filter((f) => f.restaurantId === rest.id);
    }
    return copy;
  }
}

export const fallbackStore = new LocalFallbackStore();
