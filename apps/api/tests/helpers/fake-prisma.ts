/**
 * Minimal in-memory Prisma fake covering the subset of methods used by
 * `apps/api` route handlers. Tests interact with the same operations
 * (`findFirst`, `update`, `$transaction`, …) so the fake mirrors Prisma's
 * `data` shapes but skips deep relational filtering. New surface area should
 * be added here as routes pick up additional queries.
 */
import { randomUUID } from "node:crypto";

type Role = "buyer" | "agent" | "developer" | "admin" | "super_admin" | "service_provider";

type Json = unknown;

type UserRow = {
  id: string;
  email: string;
  passwordHash: string | null;
  role: Role;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  phone: string | null;
  googleId: string | null;
  lastLoginAt: Date | null;
  failedLoginCount: number;
  lockedUntil: Date | null;
  refreshTokenHash: string | null;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type ProfileRow = {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  avatarUrl: string | null;
};

type AgentRow = {
  id: string;
  userId: string;
  agencyName: string | null;
  isVerified: boolean;
  specializations: string[];
  rating: number;
  reviewCount: number;
  totalListings: number;
  totalSales: number;
  yearsOfExperience: number | null;
  socialLinks: Json | null;
  deletedAt: Date | null;
  createdAt: Date;
};

type DeveloperRow = {
  id: string;
  userId: string;
  companyName: string;
  isVerified: boolean;
  deletedAt: Date | null;
};

type ServiceProviderRow = {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
};

type PropertyRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  propertyType: string;
  address: string | null;
  street: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  squareMeters: number | null;
  yearBuilt: number | null;
  parkingSpaces: number | null;
  isFurnished: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type ListingRow = {
  id: string;
  propertyId: string;
  agentId: string | null;
  userId: string;
  price: bigint;
  priceNegotiable: boolean;
  status: string;
  isForSale: boolean;
  isForRent: boolean;
  rentPeriod: string | null;
  isFeatured: boolean;
  featuredUntil: Date | null;
  viewCount: number;
  inquiryCount: number;
  virtualTourUrl: string | null;
  videoUrl: string | null;
  publishedAt: Date | null;
  expiresAt: Date | null;
  sourceType: string | null;
  sourceMessageId: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type SavedListingRow = {
  id: string;
  userId: string;
  listingId: string;
  createdAt: Date;
};

type RecentViewRow = {
  id: string;
  userId: string;
  listingId: string;
  lastViewedAt: Date;
};

type SavedSearchRow = {
  id: string;
  userId: string;
  name: string | null;
  filters: Json;
  emailAlerts: boolean;
  alertFrequency: string;
  lastAlertSent: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type InquiryRow = {
  id: string;
  listingId: string | null;
  projectId: string | null;
  buyerId: string;
  agentId: string | null;
  source: string;
  status: string;
  message: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  respondedAt: Date | null;
  closedAt: Date | null;
  closedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ListingPriceHistoryRow = {
  id: string;
  listingId: string;
  price: bigint;
  changedAt: Date;
};

type DeveloperProjectRow = {
  id: string;
  developerId: string;
  name: string;
  slug: string;
  status: string;
  city: string;
  state: string;
  inquiryCount: number;
  deletedAt: Date | null;
};

type RawWhatsAppMessageRow = {
  id: string;
  messageId: string;
  groupId: string | null;
  groupName: string | null;
  senderPhone: string;
  senderName: string | null;
  messageType: string;
  textContent: string | null;
  mediaUrls: string[];
  status: string;
  extractedData: Json | null;
  confidenceScore: number | null;
  extractionError: string | null;
  processedAt: Date | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  createdListingId: string | null;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type ListingSeoVariantRow = {
  id: string;
  listingId: string;
  variantType: string;
  seoTitle: string | null;
  metaDescription: string | null;
  hashtags: string[];
  fullCopy: string | null;
  socialCaption: string | null;
  tone: string | null;
  targetAudience: string | null;
  status: string;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  scheduledAt: Date | null;
  postedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type Tables = {
  users: UserRow[];
  profiles: ProfileRow[];
  agents: AgentRow[];
  developers: DeveloperRow[];
  serviceProviders: ServiceProviderRow[];
  properties: PropertyRow[];
  listings: ListingRow[];
  savedListings: SavedListingRow[];
  recentViews: RecentViewRow[];
  savedSearches: SavedSearchRow[];
  inquiries: InquiryRow[];
  listingPriceHistory: ListingPriceHistoryRow[];
  developerProjects: DeveloperProjectRow[];
  rawWhatsAppMessages: RawWhatsAppMessageRow[];
  listingSeoVariants: ListingSeoVariantRow[];
};

const tables: Tables = createEmptyTables();

function createEmptyTables(): Tables {
  return {
    users: [],
    profiles: [],
    agents: [],
    developers: [],
    serviceProviders: [],
    properties: [],
    listings: [],
    savedListings: [],
    recentViews: [],
    savedSearches: [],
    inquiries: [],
    listingPriceHistory: [],
    developerProjects: [],
    rawWhatsAppMessages: [],
    listingSeoVariants: [],
  };
}

export function resetFakePrisma() {
  const empty = createEmptyTables();
  for (const k of Object.keys(tables) as (keyof Tables)[]) {
    (tables[k] as unknown[]).length = 0;
    (tables[k] as unknown[]).push(...(empty[k] as unknown[]));
  }
}

function clone<T>(v: T): T {
  if (v === null || typeof v !== "object") return v;
  if (v instanceof Date) return new Date(v.getTime()) as unknown as T;
  if (Array.isArray(v)) return v.map(clone) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    out[k] = clone(val);
  }
  return out as T;
}

type Where = Record<string, unknown> | undefined;

function valueMatches(field: unknown, predicate: unknown): boolean {
  if (predicate === undefined) return true;
  if (predicate === null) return field === null || field === undefined;
  if (predicate instanceof Date) {
    return field instanceof Date && field.getTime() === predicate.getTime();
  }
  if (typeof predicate !== "object") {
    return field === predicate;
  }
  // operator object
  const ops = predicate as Record<string, unknown>;
  for (const [op, val] of Object.entries(ops)) {
    switch (op) {
      case "equals":
        if (field !== val) return false;
        break;
      case "not":
        if (field === val) return false;
        break;
      case "in":
        if (!(Array.isArray(val) && val.includes(field as never))) return false;
        break;
      case "notIn":
        if (Array.isArray(val) && val.includes(field as never)) return false;
        break;
      case "contains":
        if (
          typeof field !== "string" ||
          !field.toLowerCase().includes(String(val).toLowerCase())
        )
          return false;
        break;
      case "gte":
        if (
          typeof field === "bigint" || typeof val === "bigint"
            ? !(BigInt(field as bigint) >= BigInt(val as bigint))
            : !((field as number) >= (val as number))
        )
          return false;
        break;
      case "lte":
        if (
          typeof field === "bigint" || typeof val === "bigint"
            ? !(BigInt(field as bigint) <= BigInt(val as bigint))
            : !((field as number) <= (val as number))
        )
          return false;
        break;
      case "mode":
        // ignore (case sensitivity); contains already lowercases
        break;
      default:
        break;
    }
  }
  return true;
}

function rowMatches(row: Record<string, unknown>, where: Where): boolean {
  if (!where) return true;
  for (const [key, val] of Object.entries(where)) {
    if (key === "AND") {
      const arr = Array.isArray(val) ? val : [val];
      if (!arr.every((w) => rowMatches(row, w as Where))) return false;
      continue;
    }
    if (key === "OR") {
      const arr = Array.isArray(val) ? val : [val];
      if (!arr.some((w) => rowMatches(row, w as Where))) return false;
      continue;
    }
    if (key === "NOT") {
      const arr = Array.isArray(val) ? val : [val];
      if (arr.some((w) => rowMatches(row, w as Where))) return false;
      continue;
    }
    // Skip relational nested filters except for explicit { is/equals/null }
    const fieldVal = (row as Record<string, unknown>)[key];
    if (val !== null && typeof val === "object" && !(val instanceof Date) && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>;
      const operatorKeys = new Set([
        "equals",
        "not",
        "in",
        "notIn",
        "contains",
        "gte",
        "lte",
        "mode",
      ]);
      const isOperator = Object.keys(obj).every((k) => operatorKeys.has(k));
      if (isOperator) {
        if (!valueMatches(fieldVal, val)) return false;
        continue;
      }
      // Treat nested objects as "skip" for relations not modeled here.
      continue;
    }
    if (!valueMatches(fieldVal, val)) return false;
  }
  return true;
}

function paginate<T>(rows: T[], skip?: number, take?: number): T[] {
  const start = skip ?? 0;
  const end = take !== undefined ? start + take : undefined;
  return rows.slice(start, end);
}

function orderBy<T extends Record<string, unknown>>(
  rows: T[],
  order: Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[] | undefined,
): T[] {
  if (!order) return rows;
  const list = Array.isArray(order) ? order : [order];
  return [...rows].sort((a, b) => {
    for (const o of list) {
      for (const [k, dir] of Object.entries(o)) {
        const av = a[k];
        const bv = b[k];
        if (av === bv) continue;
        if (av === null || av === undefined) return dir === "asc" ? -1 : 1;
        if (bv === null || bv === undefined) return dir === "asc" ? 1 : -1;
        if (av instanceof Date && bv instanceof Date) {
          return dir === "asc" ? av.getTime() - bv.getTime() : bv.getTime() - av.getTime();
        }
        if (typeof av === "bigint" && typeof bv === "bigint") {
          if (av === bv) continue;
          return dir === "asc" ? (av < bv ? -1 : 1) : (av < bv ? 1 : -1);
        }
        if (typeof av === "string" && typeof bv === "string") {
          return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return dir === "asc" ? (Number(av) - Number(bv)) : (Number(bv) - Number(av));
      }
    }
    return 0;
  });
}

type IncludeSpec = Record<string, true | { where?: Where; include?: IncludeSpec }>;

function attachIncludes<T extends Record<string, unknown>>(
  row: T,
  table: keyof Tables,
  include: IncludeSpec | undefined,
): unknown {
  if (!include) return clone(row);
  const out: Record<string, unknown> = clone(row) as Record<string, unknown>;

  if (table === "listings") {
    if (include.property) {
      const prop = tables.properties.find((p) => p.id === out["propertyId"]);
      out.property = prop ? clone(prop) : null;
    }
  }
  if (table === "users") {
    if (include.profile) {
      const p = tables.profiles.find((r) => r.userId === out["id"]);
      out.profile = p ? clone(p) : null;
    }
    if (include.agent) {
      const a = tables.agents.find((r) => r.userId === out["id"]);
      out.agent = a ? clone(a) : null;
    }
    if (include.developer) {
      const d = tables.developers.find((r) => r.userId === out["id"]);
      out.developer = d ? clone(d) : null;
    }
    if (include.serviceProvider) {
      const s = tables.serviceProviders.find((r) => r.userId === out["id"]);
      out.serviceProvider = s ? clone(s) : null;
    }
  }
  if (table === "savedListings" || table === "recentViews") {
    if (include.listing) {
      const l = tables.listings.find((r) => r.id === out["listingId"]);
      const sub = include.listing === true ? undefined : (include.listing.include as IncludeSpec | undefined);
      out.listing = l ? attachIncludes(l, "listings", sub) : null;
    }
  }
  if (table === "inquiries") {
    if (include.listing) {
      const l = tables.listings.find((r) => r.id === out["listingId"]);
      const sub = include.listing === true ? undefined : (include.listing.include as IncludeSpec | undefined);
      out.listing = l ? attachIncludes(l, "listings", sub) : null;
    }
    if (include.agent) {
      const a = tables.agents.find((r) => r.id === out["agentId"]);
      out.agent = a ? clone(a) : null;
    }
  }
  return out;
}

function applyUpdate<T extends Record<string, unknown>>(row: T, data: Record<string, unknown>) {
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>;
      if ("set" in obj) {
        (row as Record<string, unknown>)[k] = obj.set;
        continue;
      }
      if ("increment" in obj) {
        (row as Record<string, unknown>)[k] = (row[k] as number) + (obj.increment as number);
        continue;
      }
      if ("decrement" in obj) {
        (row as Record<string, unknown>)[k] = (row[k] as number) - (obj.decrement as number);
        continue;
      }
    }
    (row as Record<string, unknown>)[k] = v;
  }
  if ("updatedAt" in row) {
    (row as Record<string, unknown>).updatedAt = new Date();
  }
}

function buildModel<TRow extends Record<string, unknown>>(
  table: keyof Tables,
  defaultsFor: (data: Record<string, unknown>) => TRow,
  uniqueKeys?: string[][],
) {
  return {
    findFirst: async (args?: { where?: Where; include?: IncludeSpec }) => {
      const rows = (tables[table] as unknown as TRow[]).filter((r) =>
        rowMatches(r, args?.where),
      );
      if (rows.length === 0) return null;
      const row = rows[0]!;
      return attachIncludes(row, table, args?.include);
    },
    findUnique: async (args: { where: Record<string, unknown>; include?: IncludeSpec }) => {
      const where = normalizeUniqueWhere(args.where, uniqueKeys);
      const rows = (tables[table] as unknown as TRow[]).filter((r) =>
        rowMatches(r, where),
      );
      if (rows.length === 0) return null;
      return attachIncludes(rows[0]!, table, args.include);
    },
    findUniqueOrThrow: async (args: { where: Record<string, unknown>; include?: IncludeSpec }) => {
      const where = normalizeUniqueWhere(args.where, uniqueKeys);
      const rows = (tables[table] as unknown as TRow[]).filter((r) =>
        rowMatches(r, where),
      );
      if (rows.length === 0) throw new Error(`Record not found in ${String(table)}`);
      return attachIncludes(rows[0]!, table, args.include);
    },
    findMany: async (args?: {
      where?: Where;
      include?: IncludeSpec;
      orderBy?: Parameters<typeof orderBy>[1];
      skip?: number;
      take?: number;
    }) => {
      let rows = (tables[table] as unknown as TRow[]).filter((r) =>
        rowMatches(r, args?.where),
      );
      rows = orderBy(rows, args?.orderBy);
      rows = paginate(rows, args?.skip, args?.take);
      return rows.map((r) => attachIncludes(r, table, args?.include));
    },
    count: async (args?: { where?: Where }) => {
      return (tables[table] as unknown as TRow[]).filter((r) =>
        rowMatches(r, args?.where),
      ).length;
    },
    create: async (args: { data: Record<string, unknown>; include?: IncludeSpec }) => {
      const created = defaultsFor(args.data) as unknown as Record<string, unknown>;
      (tables[table] as unknown as TRow[]).push(created as TRow);
      return attachIncludes(created as TRow, table, args.include);
    },
    update: async (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
      include?: IncludeSpec;
    }) => {
      const where = normalizeUniqueWhere(args.where, uniqueKeys);
      const list = tables[table] as unknown as TRow[];
      const row = list.find((r) => rowMatches(r, where));
      if (!row) throw new Error(`Record not found in ${String(table)}`);
      applyUpdate(row, args.data);
      return attachIncludes(row, table, args.include);
    },
    upsert: async (args: {
      where: Record<string, unknown>;
      create: Record<string, unknown>;
      update: Record<string, unknown>;
      include?: IncludeSpec;
    }) => {
      const where = normalizeUniqueWhere(args.where, uniqueKeys);
      const list = tables[table] as unknown as TRow[];
      const row = list.find((r) => rowMatches(r, where));
      if (row) {
        applyUpdate(row, args.update);
        return attachIncludes(row, table, args.include);
      }
      const created = defaultsFor({ ...where, ...args.create }) as unknown as Record<
        string,
        unknown
      >;
      list.push(created as TRow);
      return attachIncludes(created as TRow, table, args.include);
    },
    delete: async (args: { where: Record<string, unknown> }) => {
      const where = normalizeUniqueWhere(args.where, uniqueKeys);
      const list = tables[table] as unknown as TRow[];
      const idx = list.findIndex((r) => rowMatches(r, where));
      if (idx === -1) throw new Error(`Record not found in ${String(table)}`);
      const [removed] = list.splice(idx, 1);
      return clone(removed);
    },
    deleteMany: async (args: { where?: Where }) => {
      const list = tables[table] as unknown as TRow[];
      let count = 0;
      for (let i = list.length - 1; i >= 0; i--) {
        if (rowMatches(list[i]!, args?.where)) {
          list.splice(i, 1);
          count += 1;
        }
      }
      return { count };
    },
    createMany: async (args: { data: Record<string, unknown>[] }) => {
      for (const d of args.data) {
        const created = defaultsFor(d);
        (tables[table] as unknown as TRow[]).push(created as TRow);
      }
      return { count: args.data.length };
    },
  };
}

/**
 * Compound unique-where shortcuts (e.g. `{ userId_listingId: { … } }`) are
 * flattened back into per-field equality predicates the row matcher understands.
 */
function normalizeUniqueWhere(
  where: Record<string, unknown>,
  uniqueKeys?: string[][],
): Record<string, unknown> {
  if (!uniqueKeys) return where;
  for (const combo of uniqueKeys) {
    const key = combo.join("_");
    if (where[key] && typeof where[key] === "object") {
      const flat: Record<string, unknown> = { ...where };
      for (const [k, v] of Object.entries(where[key] as Record<string, unknown>)) {
        flat[k] = v;
      }
      delete flat[key];
      return flat;
    }
  }
  return where;
}

function nowDates() {
  const now = new Date();
  return { createdAt: now, updatedAt: now };
}

const userModel = buildModel<UserRow>(
  "users",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    email: data["email"] as string,
    passwordHash: (data["passwordHash"] as string | null) ?? null,
    role: (data["role"] as Role) ?? "buyer",
    isEmailVerified: Boolean(data["isEmailVerified"]),
    isPhoneVerified: Boolean(data["isPhoneVerified"]),
    phone: (data["phone"] as string | null) ?? null,
    googleId: (data["googleId"] as string | null) ?? null,
    lastLoginAt: (data["lastLoginAt"] as Date | null) ?? null,
    failedLoginCount: (data["failedLoginCount"] as number) ?? 0,
    lockedUntil: (data["lockedUntil"] as Date | null) ?? null,
    refreshTokenHash: (data["refreshTokenHash"] as string | null) ?? null,
    passwordResetTokenHash: (data["passwordResetTokenHash"] as string | null) ?? null,
    passwordResetExpiresAt: (data["passwordResetExpiresAt"] as Date | null) ?? null,
    deletedAt: (data["deletedAt"] as Date | null) ?? null,
    ...nowDates(),
  }),
);

// `prisma.user.create` may include nested writes for profile/agent/developer.
const originalUserCreate = userModel.create;
userModel.create = async ({ data, include }: { data: Record<string, unknown>; include?: IncludeSpec }) => {
  const { profile, agent, developer, serviceProvider, ...rest } = data;
  const user = (await originalUserCreate({ data: rest })) as UserRow;
  if (profile && typeof profile === "object") {
    const p = (profile as { create?: Record<string, unknown> }).create ?? {};
    tables.profiles.push({
      id: randomUUID(),
      userId: user.id,
      firstName: (p.firstName as string | null) ?? null,
      lastName: (p.lastName as string | null) ?? null,
      city: (p.city as string | null) ?? null,
      state: (p.state as string | null) ?? null,
      country: (p.country as string | null) ?? "Nigeria",
      avatarUrl: (p.avatarUrl as string | null) ?? null,
    });
  }
  if (agent && typeof agent === "object") {
    const a = (agent as { create?: Record<string, unknown> }).create ?? {};
    tables.agents.push({
      id: randomUUID(),
      userId: user.id,
      agencyName: (a.agencyName as string | null) ?? null,
      isVerified: Boolean(a.isVerified),
      specializations: (a.specializations as string[] | undefined) ?? [],
      rating: 0,
      reviewCount: 0,
      totalListings: 0,
      totalSales: 0,
      yearsOfExperience: null,
      socialLinks: null,
      deletedAt: null,
      createdAt: new Date(),
    });
  }
  if (developer && typeof developer === "object") {
    const d = (developer as { create?: Record<string, unknown> }).create ?? {};
    tables.developers.push({
      id: randomUUID(),
      userId: user.id,
      companyName: (d.companyName as string) ?? "",
      isVerified: false,
      deletedAt: null,
    });
  }
  if (serviceProvider && typeof serviceProvider === "object") {
    const s = (serviceProvider as { create?: Record<string, unknown> }).create ?? {};
    tables.serviceProviders.push({
      id: randomUUID(),
      userId: user.id,
      businessName: (s.businessName as string) ?? "",
      slug: (s.slug as string) ?? randomUUID(),
    });
  }
  return attachIncludes(user, "users", include);
};

const propertyModel = buildModel<PropertyRow>(
  "properties",
  (data) => ({
    id: randomUUID(),
    title: data["title"] as string,
    slug: data["slug"] as string,
    description: (data["description"] as string | null) ?? null,
    propertyType: data["propertyType"] as string,
    address: (data["address"] as string | null) ?? null,
    street: (data["street"] as string | null) ?? null,
    city: data["city"] as string,
    state: data["state"] as string,
    country: ((data["country"] as string | undefined) ?? "Nigeria") as string,
    postalCode: (data["postalCode"] as string | null) ?? null,
    latitude: (data["latitude"] as number | null) ?? null,
    longitude: (data["longitude"] as number | null) ?? null,
    bedrooms: (data["bedrooms"] as number | null) ?? null,
    bathrooms: (data["bathrooms"] as number | null) ?? null,
    toilets: (data["toilets"] as number | null) ?? null,
    squareMeters: (data["squareMeters"] as number | null) ?? null,
    yearBuilt: (data["yearBuilt"] as number | null) ?? null,
    parkingSpaces: (data["parkingSpaces"] as number | null) ?? null,
    isFurnished: Boolean(data["isFurnished"]),
    deletedAt: (data["deletedAt"] as Date | null) ?? null,
    ...nowDates(),
  }),
);

const listingModel = buildModel<ListingRow>(
  "listings",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    propertyId: data["propertyId"] as string,
    agentId: (data["agentId"] as string | null) ?? null,
    userId: data["userId"] as string,
    price: (data["price"] as bigint) ?? 0n,
    priceNegotiable: Boolean(data["priceNegotiable"]),
    status: (data["status"] as string) ?? "draft",
    isForSale: data["isForSale"] !== false,
    isForRent: Boolean(data["isForRent"]),
    rentPeriod: (data["rentPeriod"] as string | null) ?? null,
    isFeatured: Boolean(data["isFeatured"]),
    featuredUntil: (data["featuredUntil"] as Date | null) ?? null,
    viewCount: 0,
    inquiryCount: 0,
    virtualTourUrl: null,
    videoUrl: null,
    publishedAt: (data["publishedAt"] as Date | null) ?? null,
    expiresAt: (data["expiresAt"] as Date | null) ?? null,
    sourceType: (data["sourceType"] as string | null) ?? null,
    sourceMessageId: (data["sourceMessageId"] as string | null) ?? null,
    submittedAt: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    deletedAt: null,
    ...nowDates(),
  }),
);

const savedListingModel = buildModel<SavedListingRow>(
  "savedListings",
  (data) => ({
    id: randomUUID(),
    userId: data["userId"] as string,
    listingId: data["listingId"] as string,
    createdAt: new Date(),
  }),
  [["userId", "listingId"]],
);

const recentViewModel = buildModel<RecentViewRow>(
  "recentViews",
  (data) => ({
    id: randomUUID(),
    userId: data["userId"] as string,
    listingId: data["listingId"] as string,
    lastViewedAt: (data["lastViewedAt"] as Date | undefined) ?? new Date(),
  }),
  [["userId", "listingId"]],
);

const savedSearchModel = buildModel<SavedSearchRow>(
  "savedSearches",
  (data) => ({
    id: randomUUID(),
    userId: data["userId"] as string,
    name: (data["name"] as string | null) ?? null,
    filters: data["filters"] ?? {},
    emailAlerts: data["emailAlerts"] !== false,
    alertFrequency: (data["alertFrequency"] as string) ?? "daily",
    lastAlertSent: null,
    ...nowDates(),
  }),
);

const inquiryModel = buildModel<InquiryRow>(
  "inquiries",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    listingId: (data["listingId"] as string | null) ?? null,
    projectId: (data["projectId"] as string | null) ?? null,
    buyerId: data["buyerId"] as string,
    agentId: (data["agentId"] as string | null) ?? null,
    source: (data["source"] as string) ?? "web",
    status: (data["status"] as string) ?? "new",
    message: (data["message"] as string | null) ?? null,
    buyerName: (data["buyerName"] as string | null) ?? null,
    buyerEmail: (data["buyerEmail"] as string | null) ?? null,
    buyerPhone: (data["buyerPhone"] as string | null) ?? null,
    respondedAt: (data["respondedAt"] as Date | null) ?? null,
    closedAt: (data["closedAt"] as Date | null) ?? null,
    closedReason: (data["closedReason"] as string | null) ?? null,
    ...nowDates(),
  }),
);

const listingPriceHistoryModel = buildModel<ListingPriceHistoryRow>(
  "listingPriceHistory",
  (data) => ({
    id: randomUUID(),
    listingId: data["listingId"] as string,
    price: data["price"] as bigint,
    changedAt: new Date(),
  }),
);

const developerProjectModel = buildModel<DeveloperProjectRow>(
  "developerProjects",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    developerId: data["developerId"] as string,
    name: data["name"] as string,
    slug: data["slug"] as string,
    status: (data["status"] as string) ?? "ONGOING",
    city: data["city"] as string,
    state: data["state"] as string,
    inquiryCount: 0,
    deletedAt: null,
  }),
);

const rawWhatsAppMessageModel = buildModel<RawWhatsAppMessageRow>(
  "rawWhatsAppMessages",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    messageId: data["messageId"] as string,
    groupId: (data["groupId"] as string | null) ?? null,
    groupName: (data["groupName"] as string | null) ?? null,
    senderPhone: data["senderPhone"] as string,
    senderName: (data["senderName"] as string | null) ?? null,
    messageType: data["messageType"] as string,
    textContent: (data["textContent"] as string | null) ?? null,
    mediaUrls: (data["mediaUrls"] as string[]) ?? [],
    status: (data["status"] as string) ?? "PENDING",
    extractedData: (data["extractedData"] as Json | null) ?? null,
    confidenceScore: (data["confidenceScore"] as number | null) ?? null,
    extractionError: (data["extractionError"] as string | null) ?? null,
    processedAt: (data["processedAt"] as Date | null) ?? null,
    approvedAt: (data["approvedAt"] as Date | null) ?? null,
    approvedBy: (data["approvedBy"] as string | null) ?? null,
    rejectedAt: (data["rejectedAt"] as Date | null) ?? null,
    rejectedBy: (data["rejectedBy"] as string | null) ?? null,
    rejectionReason: (data["rejectionReason"] as string | null) ?? null,
    createdListingId: (data["createdListingId"] as string | null) ?? null,
    receivedAt: (data["receivedAt"] as Date | undefined) ?? new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  [["messageId"]],
);

const listingSeoVariantModel = buildModel<ListingSeoVariantRow>(
  "listingSeoVariants",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    listingId: data["listingId"] as string,
    variantType: data["variantType"] as string,
    seoTitle: (data["seoTitle"] as string | null) ?? null,
    metaDescription: (data["metaDescription"] as string | null) ?? null,
    hashtags: (data["hashtags"] as string[]) ?? [],
    fullCopy: (data["fullCopy"] as string | null) ?? null,
    socialCaption: (data["socialCaption"] as string | null) ?? null,
    tone: (data["tone"] as string | null) ?? null,
    targetAudience: (data["targetAudience"] as string | null) ?? null,
    status: (data["status"] as string) ?? "draft",
    approvedAt: (data["approvedAt"] as Date | null) ?? null,
    approvedBy: (data["approvedBy"] as string | null) ?? null,
    rejectedAt: (data["rejectedAt"] as Date | null) ?? null,
    rejectedBy: (data["rejectedBy"] as string | null) ?? null,
    rejectionReason: (data["rejectionReason"] as string | null) ?? null,
    scheduledAt: (data["scheduledAt"] as Date | null) ?? null,
    postedAt: (data["postedAt"] as Date | null) ?? null,
    ...nowDates(),
  }),
);

const agentModel = buildModel<AgentRow>(
  "agents",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    userId: data["userId"] as string,
    agencyName: (data["agencyName"] as string | null) ?? null,
    isVerified: Boolean(data["isVerified"]),
    specializations: (data["specializations"] as string[] | undefined) ?? [],
    rating: 0,
    reviewCount: 0,
    totalListings: 0,
    totalSales: 0,
    yearsOfExperience: null,
    socialLinks: null,
    deletedAt: null,
    createdAt: new Date(),
  }),
);

const developerModel = buildModel<DeveloperRow>(
  "developers",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    userId: data["userId"] as string,
    companyName: data["companyName"] as string,
    isVerified: Boolean(data["isVerified"]),
    deletedAt: null,
  }),
);

const serviceProviderModel = buildModel<ServiceProviderRow>(
  "serviceProviders",
  (data) => ({
    id: randomUUID(),
    userId: data["userId"] as string,
    businessName: data["businessName"] as string,
    slug: (data["slug"] as string) ?? randomUUID(),
  }),
);

export const fakePrisma = {
  user: userModel,
  userProfile: { findFirst: async () => null },
  property: propertyModel,
  listing: listingModel,
  agent: agentModel,
  developer: developerModel,
  serviceProvider: serviceProviderModel,
  savedListing: savedListingModel,
  listingRecentView: recentViewModel,
  savedSearch: savedSearchModel,
  inquiry: inquiryModel,
  listingPriceHistory: listingPriceHistoryModel,
  developerProject: developerProjectModel,
  rawWhatsAppMessage: rawWhatsAppMessageModel,
  listingSeoVariant: listingSeoVariantModel,
  review: {
    findMany: async () => [],
  },
  $transaction: async <T>(fn: (tx: typeof fakePrisma) => Promise<T>) => fn(fakePrisma),
  $queryRaw: async () => [],
  $executeRaw: async () => 0,
};

export const fakeTables = tables;
