import fs from 'fs';
import path from 'path';

export interface DataStore {
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

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? path.join('/tmp', '.data') : path.join(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'getspecial_store.json');

const INITIAL_DATA: DataStore = {
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

class LocalFallbackStore {
  private data: DataStore;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DataStore {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        return { ...INITIAL_DATA, ...JSON.parse(raw) };
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
      return { ...INITIAL_DATA };
    } catch {
      return { ...INITIAL_DATA };
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[FALLBACK_STORE] Warning: Could not persist to disk:', err);
    }
  }

  // Model accessors conforming to Prisma interface
  get user() {
    return {
      findUnique: async ({ where }: any) => {
        if (!where) return null;
        if (where.id) return this.data.users.find((u) => u.id === where.id) || null;
        if (where.email) return this.data.users.find((u) => u.email && u.email.toLowerCase() === where.email.toLowerCase()) || null;
        return null;
      },
      findFirst: async ({ where }: any = {}) => {
        if (!where) return this.data.users[0] || null;
        if (where.OR && Array.isArray(where.OR)) {
          for (const cond of where.OR) {
            const found = this.data.users.find((u) => {
              if (cond.id && u.id === cond.id) return true;
              if (cond.email && u.email && u.email.toLowerCase() === cond.email.toLowerCase()) return true;
              return false;
            });
            if (found) return found;
          }
          return null;
        }
        if (where.id) return this.data.users.find((u) => u.id === where.id) || null;
        if (where.email) return this.data.users.find((u) => u.email && u.email.toLowerCase() === where.email.toLowerCase()) || null;
        return null;
      },
      findMany: async () => [...this.data.users],
      create: async ({ data }: any) => {
        const item = {
          id: data.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.data.users.push(item);
        this.persist();
        return item;
      },
      update: async ({ where, data }: any) => {
        const idx = this.data.users.findIndex((u) => u.id === where.id || (where.email && u.email && u.email.toLowerCase() === where.email.toLowerCase()));
        if (idx === -1) throw new Error('Utilisateur non trouvé');
        this.data.users[idx] = { ...this.data.users[idx], ...data, updatedAt: new Date() };
        this.persist();
        return this.data.users[idx];
      },
      upsert: async ({ where, update, create }: any) => {
        const existing = await this.user.findFirst({ where });
        if (existing) {
          return this.user.update({ where: { id: existing.id }, data: update });
        }
        return this.user.create({ data: create });
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
        let list = this.data.restaurants;
        if (where?.userId) list = list.filter((r) => r.userId === where.userId);
        if (where?.id) list = list.filter((r) => r.id === where.id);
        if (where?.status) list = list.filter((r) => r.status === where.status);
        const rest = list[0] || null;
        if (!rest) return null;
        return this.hydrateRestaurant(rest, include);
      },
      findMany: async ({ where, include }: any = {}) => {
        let list = [...this.data.restaurants];
        if (where?.userId) list = list.filter((r) => r.userId === where.userId);
        if (where?.status) list = list.filter((r) => r.status === where.status);
        return list.map((r) => this.hydrateRestaurant(r, include));
      },
      create: async ({ data, include }: any) => {
        const id = data.id || `rest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const profileData = data.profile?.create;
        const offersData = data.offers?.create;
        const socialData = data.socialAccounts?.create;
        const rest = {
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
          isPaused: false,
          timezone: data.timezone || 'America/New_York',
          ...data,
        };
        delete rest.profile;
        delete rest.offers;
        delete rest.socialAccounts;
        this.data.restaurants.push(rest);

        if (profileData) {
          const prof = {
            id: `prof_${id}`,
            restaurantId: id,
            tone: profileData.tone || 'chaleureux',
            hasTerrace: !!profileData.hasTerrace,
            hasDelivery: !!profileData.hasDelivery,
            capacityCovers: profileData.capacityCovers || null,
            averageTicket: profileData.averageTicket || null,
            currency: profileData.currency || 'EUR',
            baselineCovers: profileData.baselineCovers || 15,
            foodCostPct: profileData.foodCostPct || null,
            drinkCostPct: profileData.drinkCostPct || null,
            maxDiscountPct: profileData.maxDiscountPct || null,
            offPeakDays: profileData.offPeakDays || [],
            constraints: profileData.constraints || [],
            targetAudience: profileData.targetAudience || [],
            marketingGoal: profileData.marketingGoal || null,
            logoUrl: profileData.logoUrl || null,
            photos: profileData.photos || [],
            brandColors: profileData.brandColors || [],
            menuUrl: profileData.menuUrl || null,
            maxPostsPerDay: profileData.maxPostsPerDay || 1,
            autoApprove: !!profileData.autoApprove,
            customRules: profileData.customRules || {},
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.data.restaurantProfiles.push(prof);
        }

        if (offersData) {
          this.data.offers.push({
            id: `offer_${id}`,
            restaurantId: id,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            ...offersData,
          });
        }

        if (Array.isArray(socialData)) {
          for (const s of socialData) {
            this.data.socialAccounts.push({
              id: `sa_${id}_${s.platform}`,
              restaurantId: id,
              createdAt: new Date(),
              updatedAt: new Date(),
              status: 'connected',
              ...s,
            });
          }
        }

        this.persist();
        return this.hydrateRestaurant(rest, include);
      },
      update: async ({ where, data }: any) => {
        const idx = this.data.restaurants.findIndex((r) => r.id === where.id);
        if (idx === -1) throw new Error('Restaurant introuvable');
        this.data.restaurants[idx] = {
          ...this.data.restaurants[idx],
          ...data,
          updatedAt: new Date(),
        };
        this.persist();
        return this.data.restaurants[idx];
      },
    };
  }

  get restaurantProfile() {
    return {
      findUnique: async ({ where }: any) => {
        return this.data.restaurantProfiles.find((p) => p.restaurantId === where.restaurantId) || null;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `prof_${data.restaurantId || Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
          ...data,
        };
        this.data.restaurantProfiles.push(item);
        this.persist();
        return item;
      },
      update: async ({ where, data }: any) => {
        const idx = this.data.restaurantProfiles.findIndex(
          (p) => p.restaurantId === where.restaurantId || p.id === where.id
        );
        if (idx === -1) throw new Error('Profil restaurant introuvable');
        this.data.restaurantProfiles[idx] = {
          ...this.data.restaurantProfiles[idx],
          ...data,
          updatedAt: new Date(),
        };
        this.persist();
        return this.data.restaurantProfiles[idx];
      },
      upsert: async ({ where, update, create }: any) => {
        const idx = this.data.restaurantProfiles.findIndex((p) => p.restaurantId === where.restaurantId);
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
            id: `prof_${where.restaurantId}`,
            createdAt: new Date(),
            updatedAt: new Date(),
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
      findUnique: async ({ where }: any) => {
        if (!where?.id) return null;
        return this.data.offers.find((o) => o.id === where.id) || null;
      },
      findFirst: async ({ where }: any = {}) => {
        let list = [...this.data.offers];
        if (where?.id) list = list.filter((o) => o.id === where.id);
        if (where?.restaurantId) list = list.filter((o) => o.restaurantId === where.restaurantId);
        if (where?.status) list = list.filter((o) => o.status === where.status);
        return list[0] || null;
      },
      findMany: async ({ where, orderBy }: any = {}) => {
        let list = [...this.data.offers];
        if (where?.restaurantId) list = list.filter((o) => o.restaurantId === where.restaurantId);
        if (where?.status) {
          if (typeof where.status === 'object' && where.status.not) {
            list = list.filter((o) => o.status !== where.status.not);
          } else if (typeof where.status === 'object' && Array.isArray(where.status.in)) {
            list = list.filter((o) => where.status.in.includes(o.status));
          } else {
            list = list.filter((o) => o.status === where.status);
          }
        }
        if (orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.data.offers.push(item);
        this.persist();
        return item;
      },
      update: async ({ where, data }: any) => {
        const idx = this.data.offers.findIndex((o) => o.id === where.id);
        if (idx === -1) throw new Error('Offre introuvable');
        this.data.offers[idx] = {
          ...this.data.offers[idx],
          ...data,
          updatedAt: new Date(),
        };
        this.persist();
        return this.data.offers[idx];
      },
      delete: async ({ where }: any) => {
        const idx = this.data.offers.findIndex((o) => o.id === where.id);
        if (idx === -1) throw new Error('Offre introuvable');
        const [removed] = this.data.offers.splice(idx, 1);
        this.persist();
        return removed;
      },
    };
  }

  get socialAccount() {
    return {
      findMany: async ({ where }: any = {}) => {
        let list = [...this.data.socialAccounts];
        if (where?.restaurantId) list = list.filter((a) => a.restaurantId === where.restaurantId);
        return list;
      },
      upsert: async ({ where, update, create }: any) => {
        const { restaurantId, platform } = where.restaurantId_platform || where;
        const idx = this.data.socialAccounts.findIndex(
          (a) => a.restaurantId === restaurantId && a.platform === platform
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
            id: `soc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
      findUnique: async ({ where }: any) => {
        if (!where?.id) return null;
        return this.data.signals.find((s) => s.id === where.id) || null;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'active',
          detectedAt: new Date(),
          createdAt: new Date(),
          ...data,
        };
        this.data.signals.push(item);
        this.persist();
        return item;
      },
      findFirst: async ({ where }: any = {}) => {
        let list = [...this.data.signals];
        if (where?.id) list = list.filter((s) => s.id === where.id);
        if (where?.restaurantId) list = list.filter((s) => s.restaurantId === where.restaurantId);
        if (where?.type) list = list.filter((s) => s.type === where.type);
        if (where?.source) list = list.filter((s) => s.source === where.source);
        if (where?.externalId) list = list.filter((s) => s.externalId === where.externalId);
        if (where?.status) list = list.filter((s) => s.status === where.status);
        if (where?.detectedAt?.gte) {
          const gte = new Date(where.detectedAt.gte).getTime();
          list = list.filter((s) => new Date(s.detectedAt).getTime() >= gte);
        }
        return list[0] || null;
      },
      findMany: async ({ where, orderBy, take }: any = {}) => {
        let list = [...this.data.signals];
        if (where?.restaurantId) list = list.filter((s) => s.restaurantId === where.restaurantId);
        if (where?.type) list = list.filter((s) => s.type === where.type);
        if (where?.source) list = list.filter((s) => s.source === where.source);
        if (where?.status) {
          if (typeof where.status === 'object' && where.status.not) {
            list = list.filter((s) => s.status !== where.status.not);
          } else {
            list = list.filter((s) => s.status === where.status);
          }
        }
        if (where?.detectedAt?.gte) {
          const gte = new Date(where.detectedAt.gte).getTime();
          list = list.filter((s) => new Date(s.detectedAt).getTime() >= gte);
        }
        if (orderBy?.detectedAt === 'desc') {
          list.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
        }
        if (take) {
          list = list.slice(0, take);
        }
        return list;
      },
      update: async ({ where, data }: any) => {
        const idx = this.data.signals.findIndex((s) => s.id === where.id);
        if (idx === -1) {
          const item = {
            id: where.id || `sig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            status: 'active',
            detectedAt: new Date(),
            createdAt: new Date(),
            ...data,
          };
          this.data.signals.push(item);
          this.persist();
          return item;
        }
        this.data.signals[idx] = {
          ...this.data.signals[idx],
          ...data,
          updatedAt: new Date(),
        };
        this.persist();
        return this.data.signals[idx];
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        this.data.signals = this.data.signals.map((s) => {
          let match = true;
          if (where?.restaurantId && s.restaurantId !== where.restaurantId) match = false;
          if (where?.status && s.status !== where.status) match = false;
          if (where?.endsAt?.lt && (!s.endsAt || new Date(s.endsAt).getTime() >= new Date(where.endsAt.lt).getTime())) match = false;
          if (match) {
            count++;
            return { ...s, ...data, updatedAt: new Date() };
          }
          return s;
        });
        this.persist();
        return { count };
      },
      upsert: async ({ where, create, update }: any) => {
        const idx = this.data.signals.findIndex(
          (s) => s.id === where.id || (where.restaurantId && s.restaurantId === where.restaurantId && where.externalId && s.externalId === where.externalId)
        );
        if (idx !== -1) {
          this.data.signals[idx] = { ...this.data.signals[idx], ...update, updatedAt: new Date() };
          this.persist();
          return this.data.signals[idx];
        } else {
          const item = {
            id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            status: 'active',
            detectedAt: new Date(),
            createdAt: new Date(),
            ...create,
          };
          this.data.signals.push(item);
          this.persist();
          return item;
        }
      },
      delete: async ({ where }: any) => {
        const idx = this.data.signals.findIndex((s) => s.id === where.id);
        if (idx === -1) throw new Error('Signal introuvable');
        const [removed] = this.data.signals.splice(idx, 1);
        this.persist();
        return removed;
      },
      deleteMany: async ({ where }: any = {}) => {
        const initialLen = this.data.signals.length;
        this.data.signals = this.data.signals.filter((s) => {
          if (where?.restaurantId && s.restaurantId === where.restaurantId) return false;
          return true;
        });
        this.persist();
        return { count: initialLen - this.data.signals.length };
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
      findMany: async ({ where }: any = {}) => {
        let list = [...this.data.opportunities];
        if (where?.restaurantId) list = list.filter((o) => o.restaurantId === where.restaurantId);
        if (where?.status) list = list.filter((o) => o.status === where.status);
        return list;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          suggestedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'pending',
          ...data,
        };
        this.data.opportunities.push(item);
        this.persist();
        return item;
      },
      count: async ({ where }: any = {}) => {
        let list = [...this.data.opportunities];
        if (where?.restaurantId) list = list.filter((o) => o.restaurantId === where.restaurantId);
        if (where?.status) list = list.filter((o) => o.status === where.status);
        if (where?.suggestedAt?.gte) {
          const gteDate = new Date(where.suggestedAt.gte).getTime();
          list = list.filter((o) => new Date(o.suggestedAt || o.createdAt).getTime() >= gteDate);
        }
        return list.length;
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
      findUnique: async ({ where, include }: any) => {
        const post = this.data.posts.find((p) => p.id === where.id);
        if (!post) return null;
        const rest = this.data.restaurants.find((r) => r.id === post.restaurantId);
        const opp = post.opportunityId ? this.data.opportunities.find((o) => o.id === post.opportunityId) : null;
        return {
          ...post,
          opportunity: include?.opportunity ? (opp || null) : undefined,
          restaurant: rest ? this.hydrateRestaurant(rest, { socialAccounts: true, profile: true }) : null,
        };
      },
      findFirst: async ({ where, orderBy }: any = {}) => {
        let list = [...this.data.posts];
        if (where?.id) list = list.filter((p) => p.id === where.id);
        if (where?.restaurantId) list = list.filter((p) => p.restaurantId === where.restaurantId);
        if (where?.opportunityId) list = list.filter((p) => p.opportunityId === where.opportunityId);
        if (where?.status) list = list.filter((p) => p.status === where.status);
        if (where?.origin) list = list.filter((p) => p.origin === where.origin);
        if (orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        const post = list[0] || null;
        if (!post) return null;
        const rest = this.data.restaurants.find((r) => r.id === post.restaurantId);
        return {
          ...post,
          restaurant: rest ? this.hydrateRestaurant(rest, { socialAccounts: true, profile: true }) : null,
        };
      },
      findMany: async ({ where, orderBy, take }: any = {}) => {
        let list = [...this.data.posts];
        if (where?.restaurantId) list = list.filter((p) => p.restaurantId === where.restaurantId);
        if (where?.status) list = list.filter((p) => p.status === where.status);
        if (where?.origin) list = list.filter((p) => p.origin === where.origin);
        if (orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (take) {
          list = list.slice(0, take);
        }
        return list;
      },
      create: async ({ data }: any) => {
        const item = {
          id: data.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'pending_approval',
          origin: 'generated',
          aspectRatio: '4:5',
          hashtags: [],
          mediaUrls: [],
          mediaType: 'image',
          referenceImages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        this.data.posts.push(item);
        this.persist();
        return item;
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
      count: async ({ where }: any = {}) => {
        let list = [...this.data.publications];
        if (where?.restaurantId) list = list.filter((p) => p.restaurantId === where.restaurantId);
        if (where?.status) list = list.filter((p) => p.status === where.status);
        if (where?.publishedAt?.gte) {
          const gte = new Date(where.publishedAt.gte).getTime();
          list = list.filter((p) => p.publishedAt && new Date(p.publishedAt).getTime() >= gte);
        }
        return list.length;
      },
      findMany: async ({ where }: any = {}) => {
        let list = [...this.data.publications];
        if (where?.restaurantId) list = list.filter((p) => p.restaurantId === where.restaurantId);
        return list;
      },
      findUnique: async ({ where }: any) => {
        return this.data.publications.find((p) => p.id === where.id) || null;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `pub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'pending',
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
          id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          status: 'active',
          ...data,
        };
        this.data.feedbackEvents.push(item);
        this.persist();
        return item;
      },
      findFirst: async ({ where }: any = {}) => {
        let list = [...this.data.feedbackEvents];
        if (where?.restaurantId) list = list.filter((f) => f.restaurantId === where.restaurantId);
        if (where?.type) {
          if (typeof where.type === 'object' && where.type.in) {
            list = list.filter((f) => where.type.in.includes(f.type));
          } else {
            list = list.filter((f) => f.type === where.type);
          }
        }
        if (where?.reason) list = list.filter((f) => f.reason === where.reason);
        if (where?.status) list = list.filter((f) => f.status === where.status);
        if (where?.createdAt?.gte) {
          list = list.filter((f) => new Date(f.createdAt) >= new Date(where.createdAt.gte));
        }
        return list[0] || null;
      },
      findMany: async ({ where, orderBy, take }: any = {}) => {
        let list = [...this.data.feedbackEvents];
        if (where?.restaurantId) list = list.filter((f) => f.restaurantId === where.restaurantId);
        if (where?.type) {
          if (typeof where.type === 'object' && where.type.in) {
            list = list.filter((f) => where.type.in.includes(f.type));
          } else {
            list = list.filter((f) => f.type === where.type);
          }
        }
        if (where?.status) list = list.filter((f) => f.status === where.status);
        if (where?.createdAt?.gte) {
          list = list.filter((f) => new Date(f.createdAt) >= new Date(where.createdAt.gte));
        }
        if (orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (take) {
          list = list.slice(0, take);
        }
        return list;
      },
      count: async ({ where }: any = {}) => {
        let list = [...this.data.feedbackEvents];
        if (where?.restaurantId) list = list.filter((f) => f.restaurantId === where.restaurantId);
        if (where?.type) {
          if (typeof where.type === 'object' && where.type.in) {
            list = list.filter((f) => where.type.in.includes(f.type));
          } else {
            list = list.filter((f) => f.type === where.type);
          }
        }
        if (where?.status) list = list.filter((f) => f.status === where.status);
        if (where?.createdAt?.gte) {
          list = list.filter((f) => new Date(f.createdAt) >= new Date(where.createdAt.gte));
        }
        return list.length;
      },
      updateMany: async ({ where, data }: any) => {
        let updatedCount = 0;
        this.data.feedbackEvents = this.data.feedbackEvents.map((f) => {
          if (where?.id && f.id === where.id) {
            updatedCount++;
            return { ...f, ...data, updatedAt: new Date() };
          }
          if (where?.restaurantId && f.restaurantId === where.restaurantId) {
            updatedCount++;
            return { ...f, ...data, updatedAt: new Date() };
          }
          return f;
        });
        this.persist();
        return { count: updatedCount };
      },
    };
  }

  get auditLog() {
    return {
      create: async ({ data }: any) => {
        const item = {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
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
      copy.offers = this.data.offers.filter((o) => o.restaurantId === rest.id && o.status === 'active');
    }
    if (include?.socialAccounts) {
      copy.socialAccounts = this.data.socialAccounts.filter((a) => a.restaurantId === rest.id);
    }
    if (include?.signals) {
      let sigs = this.data.signals.filter((s) => s.restaurantId === rest.id);
      if (typeof include.signals === 'object' && include.signals.where?.status) {
        sigs = sigs.filter((s) => (s.status || 'active') === include.signals.where.status);
      }
      if (typeof include.signals === 'object' && include.signals.orderBy?.detectedAt === 'desc') {
        sigs.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
      }
      if (typeof include.signals === 'object' && typeof include.signals.take === 'number') {
        sigs = sigs.slice(0, include.signals.take);
      }
      copy.signals = sigs;
    }
    if (include?.opportunities) {
      copy.opportunities = this.data.opportunities.filter((o) => o.restaurantId === rest.id);
    }
    return copy;
  }
}

export const fallbackStore = new LocalFallbackStore();
