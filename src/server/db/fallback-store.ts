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

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'getspecial_store.json');

const INITIAL_DATA: DataStore = {
  users: [
    {
      id: 'usr_demo_1',
      email: 'chef.pelican@brasspelican.com',
      name: 'Chef Julien',
      passwordHash: '$2a$12$eX8mPz0i/0KjC5sLqV9aYe1234567890abcdefghijklm',
      createdAt: new Date('2026-09-01T10:00:00Z'),
      updatedAt: new Date('2026-09-01T10:00:00Z'),
    },
  ],
  restaurants: [
    {
      id: 'rest_demo_austin_1',
      userId: 'usr_demo_1',
      name: 'The Brass Pelican',
      type: 'restaurant',
      address: '412 Congress Ave, Austin, TX 78701',
      latitude: 30.2672,
      longitude: -97.7431,
      timezone: 'America/Chicago',
      openingHours: {
        mon: '11:30 AM - 10:00 PM',
        tue: '11:30 AM - 10:00 PM',
        wed: '11:30 AM - 10:00 PM',
        thu: '11:30 AM - 11:00 PM',
        fri: '11:30 AM - 11:30 PM',
        sat: '11:00 AM - 11:30 PM',
        sun: '11:00 AM - 9:00 PM',
      },
      specialties: ['Seafood', 'American Bistro', 'Craft Cocktails'],
      status: 'active',
      isPaused: false,
      createdAt: new Date('2026-09-01T10:00:00Z'),
      updatedAt: new Date('2026-09-01T10:00:00Z'),
    },
  ],
  restaurantProfiles: [
    {
      id: 'prof_demo_1',
      restaurantId: 'rest_demo_austin_1',
      tone: 'friendly',
      hasTerrace: true,
      offPeakDays: ['tuesday', 'wednesday'],
      constraints: ['happy hour until 6:30 PM'],
      customRules: {},
      status: 'active',
      createdAt: new Date('2026-09-01T10:00:00Z'),
      updatedAt: new Date('2026-09-01T10:00:00Z'),
    },
  ],
  offers: [
    {
      id: 'offer_wings_1',
      restaurantId: 'rest_demo_austin_1',
      title: 'Happy Hour Wings 50% Off',
      description: 'Half-price smoked wings with any craft beer or signature cocktail purchase.',
      discountValue: '50%',
      recurrence: 'daily',
      recurrenceDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      lastPromotedAt: null,
      status: 'active',
      createdAt: new Date('2026-09-15T12:00:00Z'),
      updatedAt: new Date('2026-09-15T12:00:00Z'),
    },
  ],
  socialAccounts: [
    {
      id: 'soc_tiktok_1',
      restaurantId: 'rest_demo_austin_1',
      platform: 'tiktok',
      outstandAccountId: '6aae09998d284ffb21196a36',
      username: '@getspecial_app',
      status: 'connected',
      lastSyncAt: new Date('2026-09-30T09:00:00Z'),
      createdAt: new Date('2026-09-19T04:00:00Z'),
      updatedAt: new Date('2026-09-30T09:00:00Z'),
    },
    {
      id: 'soc_instagram_1',
      restaurantId: 'rest_demo_austin_1',
      platform: 'instagram',
      outstandAccountId: 'ig_brass_pelican_atx',
      username: '@brasspelicanatx',
      status: 'connected',
      lastSyncAt: new Date('2026-09-30T09:00:00Z'),
      createdAt: new Date('2026-09-20T04:00:00Z'),
      updatedAt: new Date('2026-09-30T09:00:00Z'),
    },
  ],
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
        if (where.id) return this.data.users.find((u) => u.id === where.id) || null;
        if (where.email) return this.data.users.find((u) => u.email.toLowerCase() === where.email.toLowerCase()) || null;
        return null;
      },
      findFirst: async ({ where }: any = {}) => {
        if (!where) return this.data.users[0] || null;
        if (where.id) return this.data.users.find((u) => u.id === where.id) || null;
        if (where.email) return this.data.users.find((u) => u.email.toLowerCase() === where.email.toLowerCase()) || null;
        return this.data.users[0] || null;
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
        const idx = this.data.users.findIndex((u) => u.id === where.id || u.email === where.email);
        if (idx === -1) throw new Error('Utilisateur non trouvé');
        this.data.users[idx] = { ...this.data.users[idx], ...data, updatedAt: new Date() };
        this.persist();
        return this.data.users[idx];
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
        this.data.restaurants.push(rest);

        if (profileData) {
          const prof = {
            id: `prof_${id}`,
            restaurantId: id,
            tone: profileData.tone || 'friendly',
            hasTerrace: !!profileData.hasTerrace,
            offPeakDays: profileData.offPeakDays || [],
            constraints: profileData.constraints || [],
            customRules: profileData.customRules || {},
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.data.restaurantProfiles.push(prof);
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
      findMany: async ({ where }: any = {}) => {
        let list = [...this.data.offers];
        if (where?.restaurantId) list = list.filter((o) => o.restaurantId === where.restaurantId);
        if (where?.status) list = list.filter((o) => o.status === where.status);
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
      create: async ({ data }: any) => {
        const item = {
          id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
        if (where?.restaurantId) list = list.filter((s) => s.restaurantId === where.restaurantId);
        if (where?.type) list = list.filter((s) => s.type === where.type);
        if (where?.source) list = list.filter((s) => s.source === where.source);
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
      findMany: async ({ where }: any = {}) => {
        let list = [...this.data.posts];
        if (where?.restaurantId) list = list.filter((p) => p.restaurantId === where.restaurantId);
        return list;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'pending_approval',
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
          ...data,
        };
        this.data.feedbackEvents.push(item);
        this.persist();
        return item;
      },
      findMany: async ({ where }: any = {}) => {
        let list = [...this.data.feedbackEvents];
        if (where?.restaurantId) list = list.filter((f) => f.restaurantId === where.restaurantId);
        return list;
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
      copy.signals = this.data.signals.filter((s) => s.restaurantId === rest.id);
    }
    if (include?.opportunities) {
      copy.opportunities = this.data.opportunities.filter((o) => o.restaurantId === rest.id);
    }
    return copy;
  }
}

export const fallbackStore = new LocalFallbackStore();
