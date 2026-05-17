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
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPush: boolean;
  preferences: Json | null;
};

type AgentRow = {
  id: string;
  userId: string;
  agencyName: string | null;
  licenseNumber: string | null;
  isVerified: boolean;
  kycStatus: string;
  bvnHash: string | null;
  verificationBadge: boolean;
  specializations: string[];
  rating: number;
  reviewCount: number;
  totalListings: number;
  totalSales: number;
  yearsOfExperience: number | null;
  commissionEarned: bigint;
  socialLinks: Json | null;
  deletedAt: Date | null;
  createdAt: Date;
};

type DeveloperRow = {
  id: string;
  userId: string;
  companyName: string;
  rcNumber: string | null;
  companyAddress: string | null;
  companyCity: string | null;
  companyState: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  description: string | null;
  isVerified: boolean;
  kycStatus: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type ServiceProviderRow = {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  category: string;
  description: string | null;
  /** Prisma JSON — spec §2.2; tests often use string[] */
  servicesOffered: Json;
  address: string | null;
  city: string;
  state: string;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  galleryImages: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  verificationLevel: string;
  subscriptionTier: string;
  viewCount: number;
  leadCount: number;
  subCategories: string[];
  serviceAreas: string[];
  completedJobCount: number;
  responseRatePercent: number;
  aiMatchScore: number;
  isFeatured: boolean;
  featuredUntil: Date | null;
  whatsappPhone: string | null;
  whatsappConnected: boolean;
  licenseNumber: string | null;
  licenseBody: string | null;
  kycDocuments: Json | null;
  portfolioItems: Json;
  socialLinks: Json | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** WGS84 from PostGIS geom — used by directory map coord tests. */
  geomLatitude: number | null;
  geomLongitude: number | null;
};

type ProviderWhatsAppConnectionRow = {
  id: string;
  serviceProviderId: string;
  phoneNumber: string;
  evolutionInstanceName: string;
  status: string;
  monitoredGroups: Json;
  extractedLeadsCount: number;
  connectedAt: Date;
  lastActiveAt: Date | null;
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

type TourRequestRow = {
  id: string;
  listingId: string;
  buyerId: string;
  agentId: string | null;
  tourType: string;
  status: string;
  preferredDate: Date;
  preferredTime: string | null;
  confirmedDate: Date | null;
  notes: string | null;
  buyerPhone: string | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
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

type MessageRow = {
  id: string;
  threadId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
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
  description: string | null;
  shortDescription: string | null;
  status: string;
  propertyType: string;
  address: string | null;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  priceRangeMin: bigint | null;
  priceRangeMax: bigint | null;
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
  amenities: string[];
  features: string[];
  images: string[];
  floorPlans: string[];
  brochureUrl: string | null;
  virtualTourUrl: string | null;
  completionDate: Date | null;
  launchDate: Date | null;
  isFeatured: boolean;
  viewCount: number;
  inquiryCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type BulkUploadJobRow = {
  id: string;
  developerId: string;
  projectId: string;
  filename: string;
  status: string;
  errorMessage: string | null;
  headers: Json;
  parsedGrid: Json;
  columnMap: Json | null;
  commitMode: string | null;
  committedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BulkUploadStagingRow = {
  id: string;
  uploadId: string;
  rowIndex: number;
  payload: Json;
  errors: string[];
  warnings: string[];
};

type ProjectUnitRow = {
  id: string;
  projectId: string;
  unitName: string;
  unitType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  squareMeters: number | null;
  price: bigint;
  status: string;
  floorPlan: string | null;
  features: string[];
  reservedAt: Date | null;
  soldAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type DeveloperKycDocumentRow = {
  id: string;
  developerId: string;
  projectId: string | null;
  documentType: string;
  status: string;
  title: string | null;
  fileName: string;
  mimeType: string;
  byteSize: number;
  storageKey: string | null;
  externalUrl: string;
  rejectionReason: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type DeveloperMembershipRow = {
  id: string;
  developerId: string;
  userId: string;
  role: string;
  isDisabled: boolean;
  projectIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

type DeveloperInviteRow = {
  id: string;
  developerId: string;
  email: string;
  role: string;
  projectIds: string[];
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type SubscriptionRow = {
  id: string;
  agentId: string | null;
  developerId: string | null;
  plan: string;
  status: string;
  paystackSubCode: string | null;
  paystackCustomerId: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentRow = {
  id: string;
  agentId: string | null;
  type: string;
  gateway: string;
  status: string;
  amount: bigint;
  currency: string;
  reference: string;
  gatewayResponse: Json | null;
  metadata: Json | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AuditLogRow = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  changes: Json | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Json | null;
  createdAt: Date;
};

type PlatformSettingsRow = {
  id: string;
  maintenanceMode: boolean;
  whatsappAutoApproveMinScore: number | null;
  updatedAt: Date;
  updatedBy: string | null;
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

type ServiceLeadRow = {
  id: string;
  serviceProviderId: string;
  clientUserId: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  source: string;
  listingId: string | null;
  projectId: string | null;
  bundleId: string | null;
  serviceRequested: string;
  message: string;
  budget: bigint | null;
  timeline: string | null;
  location: string;
  status: string;
  aiScore: number | null;
  aiSummary: string | null;
  quotedAmountKobo: bigint | null;
  finalAmountKobo: bigint | null;
  respondedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

type ServiceReviewRow = {
  id: string;
  serviceLeadId: string;
  serviceProviderId: string;
  reviewerId: string;
  overallRating: number;
  qualityRating: number;
  communicationRating: number;
  timelinessRating: number;
  valueRating: number;
  title: string;
  body: string;
  isJobVerified: boolean;
  providerResponse: string | null;
  createdAt: Date;
};

type NotificationRow = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Json | null;
  readAt: Date | null;
  createdAt: Date;
};

type ProviderAvailabilityRow = {
  id: string;
  serviceProviderId: string;
  date: Date;
  isAvailable: boolean;
  slots: Json | null;
  note: string | null;
};

type ServiceBundleRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categories: string[];
  priceFromKobo: bigint;
  priceToKobo: bigint;
  triggerContext: string;
  isActive: boolean;
  activationCount: number;
};

type BundleActivationRow = {
  id: string;
  bundleId: string;
  clientUserId: string;
  listingId: string | null;
  status: string;
  matchedProviders: Json;
  totalAmountKobo: bigint | null;
  platformFeeKobo: bigint | null;
  createdAt: Date;
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
  tourRequests: TourRequestRow[];
  savedSearches: SavedSearchRow[];
  inquiries: InquiryRow[];
  messages: MessageRow[];
  listingPriceHistory: ListingPriceHistoryRow[];
  developerProjects: DeveloperProjectRow[];
  developerBulkUploads: BulkUploadJobRow[];
  developerBulkUploadRows: BulkUploadStagingRow[];
  projectUnits: ProjectUnitRow[];
  developerKycDocuments: DeveloperKycDocumentRow[];
  developerMemberships: DeveloperMembershipRow[];
  developerInvites: DeveloperInviteRow[];
  subscriptions: SubscriptionRow[];
  payments: PaymentRow[];
  auditLogs: AuditLogRow[];
  rawWhatsAppMessages: RawWhatsAppMessageRow[];
  listingSeoVariants: ListingSeoVariantRow[];
  serviceLeads: ServiceLeadRow[];
  serviceReviews: ServiceReviewRow[];
  providerWhatsAppConnections: ProviderWhatsAppConnectionRow[];
  notifications: NotificationRow[];
  providerAvailability: ProviderAvailabilityRow[];
  serviceBundles: ServiceBundleRow[];
  bundleActivations: BundleActivationRow[];
  platformSettings: PlatformSettingsRow[];
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
    tourRequests: [],
    savedSearches: [],
    inquiries: [],
    messages: [],
    listingPriceHistory: [],
    developerProjects: [],
    developerBulkUploads: [],
    developerBulkUploadRows: [],
    projectUnits: [],
    developerKycDocuments: [],
    developerMemberships: [],
    developerInvites: [],
    subscriptions: [],
    auditLogs: [],
    rawWhatsAppMessages: [],
    listingSeoVariants: [],
    serviceLeads: [],
    serviceReviews: [],
    providerWhatsAppConnections: [],
    notifications: [],
    providerAvailability: [],
    serviceBundles: [],
    bundleActivations: [],
    platformSettings: [
      {
        id: "default",
        maintenanceMode: false,
        whatsappAutoApproveMinScore: null,
        updatedAt: new Date(),
        updatedBy: null,
      },
    ],
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
        if (Array.isArray(field) && Array.isArray(val)) {
          if (field.length !== val.length) return false;
          for (let i = 0; i < field.length; i++) {
            if (field[i] !== val[i]) return false;
          }
          break;
        }
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
        if (field instanceof Date && val instanceof Date) {
          if (!(field.getTime() >= val.getTime())) return false;
          break;
        }
        if (
          typeof field === "bigint" || typeof val === "bigint"
            ? !(BigInt(field as bigint) >= BigInt(val as bigint))
            : !((field as number) >= (val as number))
        )
          return false;
        break;
      case "lte":
        if (field instanceof Date && val instanceof Date) {
          if (!(field.getTime() <= val.getTime())) return false;
          break;
        }
        if (
          typeof field === "bigint" || typeof val === "bigint"
            ? !(BigInt(field as bigint) <= BigInt(val as bigint))
            : !((field as number) <= (val as number))
        )
          return false;
        break;
      case "gt":
        if (field instanceof Date && val instanceof Date) {
          if (!(field.getTime() > val.getTime())) return false;
          break;
        }
        if (
          typeof field === "bigint" || typeof val === "bigint"
            ? !(BigInt(field as bigint) > BigInt(val as bigint))
            : !((field as number) > (val as number))
        )
          return false;
        break;
      case "lt":
        if (field instanceof Date && val instanceof Date) {
          if (!(field.getTime() < val.getTime())) return false;
          break;
        }
        if (
          typeof field === "bigint" || typeof val === "bigint"
            ? !(BigInt(field as bigint) < BigInt(val as bigint))
            : !((field as number) < (val as number))
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
        "gt",
        "lt",
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
  if (table === "tourRequests") {
    if (include.listing) {
      const l = tables.listings.find((r) => r.id === out["listingId"]);
      const sub =
        include.listing === true ? undefined : (include.listing as { include?: IncludeSpec }).include;
      out.listing = l ? attachIncludes(l, "listings", sub) : null;
    }
    if (include.buyer) {
      const u = tables.users.find((r) => r.id === out["buyerId"]);
      const sub =
        include.buyer === true
          ? ({ profile: true } as IncludeSpec)
          : ((include.buyer as { include?: IncludeSpec }).include ?? { profile: true });
      out.buyer = u ? attachIncludes(u, "users", sub) : null;
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
    if (include.project) {
      const proj = tables.developerProjects.find((r) => r.id === out["projectId"]);
      out.project = proj ? clone(proj) : null;
    }
  }
  if (table === "developerKycDocuments") {
    if (include.project) {
      const proj = tables.developerProjects.find((r) => r.id === out["projectId"]);
      out.project = proj ? { id: proj.id, name: proj.name, slug: proj.slug } : null;
    }
  }
  if (table === "developerMemberships") {
    if (include.user) {
      const u = tables.users.find((r) => r.id === out["userId"]);
      const sub =
        include.user === true ? ({ profile: true } as IncludeSpec) : (include.user as { include?: IncludeSpec }).include;
      out.user = u ? (attachIncludes(u, "users", sub) as unknown) : null;
    }
  }
  if (table === "developers") {
    if (include.user) {
      const u = tables.users.find((r) => r.id === out["userId"]);
      out.user = u ? clone(u) : null;
    }
  }
  if (table === "serviceProviders") {
    if (include.user) {
      const u = tables.users.find((r) => r.id === out["userId"]);
      const sub =
        include.user === true ? ({ profile: true } as IncludeSpec) : (include.user as { include?: IncludeSpec }).include;
      out.user = u ? (attachIncludes(u, "users", sub) as unknown) : null;
    }
  }
  if (table === "serviceReviews") {
    if (include.reviewer) {
      const u = tables.users.find((r) => r.id === out["reviewerId"]);
      const sub =
        include.reviewer === true
          ? ({ profile: true } as IncludeSpec)
          : (include.reviewer as { include?: IncludeSpec }).include;
      out.reviewer = u ? (attachIncludes(u, "users", sub) as unknown) : null;
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
    findFirst: async (args?: {
      where?: Where;
      include?: IncludeSpec;
      orderBy?: Parameters<typeof orderBy>[1];
    }) => {
      let rows = (tables[table] as unknown as TRow[]).filter((r) =>
        rowMatches(r, args?.where),
      );
      if (rows.length === 0) return null;
      const ordered = (
        args?.orderBy ? orderBy(rows as Record<string, unknown>[], args.orderBy) : rows
      ) as TRow[];
      const row = ordered[0]!;
      return attachIncludes(row, table, args?.include);
    },
    findFirstOrThrow: async (args?: {
      where?: Where;
      include?: IncludeSpec;
      orderBy?: Parameters<typeof orderBy>[1];
    }) => {
      let rows = (tables[table] as unknown as TRow[]).filter((r) =>
        rowMatches(r, args?.where),
      );
      if (rows.length === 0) throw new Error(`Record not found in ${String(table)}`);
      const ordered = (
        args?.orderBy ? orderBy(rows as Record<string, unknown>[], args.orderBy) : rows
      ) as TRow[];
      const row = ordered[0]!;
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
      notifyEmail: (p.notifyEmail as boolean | undefined) ?? true,
      notifySms: (p.notifySms as boolean | undefined) ?? true,
      notifyPush: (p.notifyPush as boolean | undefined) ?? false,
      preferences: (p.preferences as Json | null) ?? null,
    });
  }
  if (agent && typeof agent === "object") {
    const a = (agent as { create?: Record<string, unknown> }).create ?? {};
    tables.agents.push({
      id: randomUUID(),
      userId: user.id,
      agencyName: (a.agencyName as string | null) ?? null,
      licenseNumber: (a.licenseNumber as string | null) ?? null,
      isVerified: Boolean(a.isVerified),
      kycStatus: (a.kycStatus as string) ?? "pending",
      bvnHash: (a.bvnHash as string | null) ?? null,
      verificationBadge: Boolean(a.verificationBadge),
      specializations: (a.specializations as string[] | undefined) ?? [],
      rating: 0,
      reviewCount: 0,
      totalListings: 0,
      totalSales: 0,
      yearsOfExperience: null,
      commissionEarned: (a.commissionEarned as bigint | undefined) ?? 0n,
      socialLinks: null,
      deletedAt: null,
      createdAt: new Date(),
    });
  }
  if (developer && typeof developer === "object") {
    const d = (developer as { create?: Record<string, unknown> }).create ?? {};
    const now = new Date();
    tables.developers.push({
      id: randomUUID(),
      userId: user.id,
      companyName: (d.companyName as string) ?? "",
      rcNumber: null,
      companyAddress: null,
      companyCity: null,
      companyState: null,
      companyPhone: null,
      companyEmail: null,
      companyWebsite: null,
      description: null,
      isVerified: false,
      kycStatus: "pending",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }
  if (serviceProvider && typeof serviceProvider === "object") {
    const s = (serviceProvider as { create?: Record<string, unknown> }).create ?? {};
    const now = new Date();
    tables.serviceProviders.push({
      id: randomUUID(),
      userId: user.id,
      businessName: (s.businessName as string) ?? "",
      slug: (s.slug as string) ?? randomUUID(),
      category: (s.category as string) ?? "legal",
      description: (s.description as string | null) ?? null,
      servicesOffered: (s.servicesOffered as Json | undefined) ?? [],
      address: (s.address as string | null) ?? null,
      city: (s.city as string) ?? "Lagos",
      state: (s.state as string) ?? "Lagos",
      country: (s.country as string) ?? "Nigeria",
      phone: (s.phone as string | null) ?? null,
      email: (s.email as string | null) ?? null,
      website: (s.website as string | null) ?? null,
      logoUrl: (s.logoUrl as string | null) ?? null,
      galleryImages: (s.galleryImages as string[] | undefined) ?? [],
      rating: (s.rating as number | undefined) ?? 0,
      reviewCount: (s.reviewCount as number | undefined) ?? 0,
      isVerified: Boolean(s.isVerified),
      verificationLevel: (s.verificationLevel as string) ?? "basic",
      subscriptionTier: (s.subscriptionTier as string) ?? "free",
      viewCount: (s.viewCount as number | undefined) ?? 0,
      leadCount: (s.leadCount as number | undefined) ?? 0,
      subCategories: (s.subCategories as string[] | undefined) ?? [],
      serviceAreas: (s.serviceAreas as string[] | undefined) ?? [],
      completedJobCount: (s.completedJobCount as number | undefined) ?? 0,
      responseRatePercent: (s.responseRatePercent as number | undefined) ?? 0,
      aiMatchScore: (s.aiMatchScore as number | undefined) ?? 0,
      isFeatured: Boolean(s.isFeatured),
      featuredUntil: (s.featuredUntil as Date | null) ?? null,
      whatsappPhone: (s.whatsappPhone as string | null) ?? null,
      whatsappConnected: Boolean(s.whatsappConnected),
      licenseNumber: (s.licenseNumber as string | null) ?? null,
      licenseBody: (s.licenseBody as string | null) ?? null,
      kycDocuments: (s.kycDocuments as Json | null) ?? null,
      portfolioItems: (s.portfolioItems as Json | undefined) ?? [],
      socialLinks: (s.socialLinks as Json | null) ?? null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
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

const tourRequestModel = buildModel<TourRequestRow>(
  "tourRequests",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      listingId: data["listingId"] as string,
      buyerId: data["buyerId"] as string,
      agentId: (data["agentId"] as string | null) ?? null,
      tourType: (data["tourType"] as string) ?? "in_person",
      status: (data["status"] as string) ?? "pending",
      preferredDate: (data["preferredDate"] as Date | undefined) ?? now,
      preferredTime: (data["preferredTime"] as string | null) ?? null,
      confirmedDate: (data["confirmedDate"] as Date | null) ?? null,
      notes: (data["notes"] as string | null) ?? null,
      buyerPhone: (data["buyerPhone"] as string | null) ?? null,
      completedAt: (data["completedAt"] as Date | null) ?? null,
      cancelledAt: (data["cancelledAt"] as Date | null) ?? null,
      cancelReason: (data["cancelReason"] as string | null) ?? null,
      ...nowDates(),
    };
  },
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

const messageModel = buildModel<MessageRow>(
  "messages",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      threadId: data["threadId"] as string,
      senderId: data["senderId"] as string,
      receiverId: data["receiverId"] as string,
      content: (data["content"] as string) ?? "",
      isRead: Boolean(data["isRead"]),
      readAt: (data["readAt"] as Date | null) ?? null,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
    };
  },
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
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      developerId: data["developerId"] as string,
      name: data["name"] as string,
      slug: (data["slug"] as string) ?? randomUUID(),
      description: (data["description"] as string | null) ?? null,
      shortDescription: (data["shortDescription"] as string | null) ?? null,
      status: (data["status"] as string) ?? "UPCOMING",
      propertyType: (data["propertyType"] as string) ?? "estate_unit",
      address: (data["address"] as string | null) ?? null,
      city: data["city"] as string,
      state: data["state"] as string,
      country: (data["country"] as string) ?? "Nigeria",
      latitude: (data["latitude"] as number | null) ?? null,
      longitude: (data["longitude"] as number | null) ?? null,
      priceRangeMin: (data["priceRangeMin"] as bigint | null) ?? null,
      priceRangeMax: (data["priceRangeMax"] as bigint | null) ?? null,
      totalUnits: (data["totalUnits"] as number) ?? 0,
      availableUnits: (data["availableUnits"] as number) ?? 0,
      soldUnits: (data["soldUnits"] as number) ?? 0,
      amenities: (data["amenities"] as string[]) ?? [],
      features: (data["features"] as string[]) ?? [],
      images: (data["images"] as string[]) ?? [],
      floorPlans: (data["floorPlans"] as string[]) ?? [],
      brochureUrl: (data["brochureUrl"] as string | null) ?? null,
      virtualTourUrl: (data["virtualTourUrl"] as string | null) ?? null,
      completionDate: (data["completionDate"] as Date | null) ?? null,
      launchDate: (data["launchDate"] as Date | null) ?? null,
      isFeatured: Boolean(data["isFeatured"]),
      viewCount: (data["viewCount"] as number) ?? 0,
      inquiryCount: (data["inquiryCount"] as number) ?? 0,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
      updatedAt: (data["updatedAt"] as Date | undefined) ?? now,
      deletedAt: (data["deletedAt"] as Date | null) ?? null,
    };
  },
);

const developerBulkUploadModel = buildModel<BulkUploadJobRow>(
  "developerBulkUploads",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      developerId: data["developerId"] as string,
      projectId: data["projectId"] as string,
      filename: (data["filename"] as string) ?? "upload.csv",
      status: (data["status"] as string) ?? "mapping",
      errorMessage: (data["errorMessage"] as string | null) ?? null,
      headers: (data["headers"] as Json) ?? [],
      parsedGrid: (data["parsedGrid"] as Json) ?? [],
      columnMap: (data["columnMap"] as Json | null) ?? null,
      commitMode: (data["commitMode"] as string | null) ?? null,
      committedAt: (data["committedAt"] as Date | null) ?? null,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
      updatedAt: (data["updatedAt"] as Date | undefined) ?? now,
    };
  },
);

const developerBulkUploadRowModel = buildModel<BulkUploadStagingRow>(
  "developerBulkUploadRows",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    uploadId: data["uploadId"] as string,
    rowIndex: data["rowIndex"] as number,
    payload: (data["payload"] as Json) ?? {},
    errors: (data["errors"] as string[]) ?? [],
    warnings: (data["warnings"] as string[]) ?? [],
  }),
  [["uploadId", "rowIndex"]],
);

const projectUnitModel = buildModel<ProjectUnitRow>(
  "projectUnits",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      projectId: data["projectId"] as string,
      unitName: data["unitName"] as string,
      unitType: (data["unitType"] as string) ?? "Plot",
      bedrooms: (data["bedrooms"] as number | null) ?? null,
      bathrooms: (data["bathrooms"] as number | null) ?? null,
      toilets: (data["toilets"] as number | null) ?? null,
      squareMeters: (data["squareMeters"] as number | null) ?? null,
      price: data["price"] as bigint,
      status: (data["status"] as string) ?? "available",
      floorPlan: (data["floorPlan"] as string | null) ?? null,
      features: (data["features"] as string[]) ?? [],
      reservedAt: (data["reservedAt"] as Date | null) ?? null,
      soldAt: (data["soldAt"] as Date | null) ?? null,
      createdAt: now,
      updatedAt: now,
    };
  },
);

const developerKycDocumentModel = buildModel<DeveloperKycDocumentRow>(
  "developerKycDocuments",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      developerId: data["developerId"] as string,
      projectId: (data["projectId"] as string | null) ?? null,
      documentType: (data["documentType"] as string) ?? "other",
      status: (data["status"] as string) ?? "pending",
      title: (data["title"] as string | null) ?? null,
      fileName: (data["fileName"] as string) ?? "document.pdf",
      mimeType: (data["mimeType"] as string) ?? "application/pdf",
      byteSize: (data["byteSize"] as number) ?? 0,
      storageKey: (data["storageKey"] as string | null) ?? null,
      externalUrl: (data["externalUrl"] as string) ?? "https://example.com/doc.pdf",
      rejectionReason: (data["rejectionReason"] as string | null) ?? null,
      expiresAt: (data["expiresAt"] as Date | null) ?? null,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
      updatedAt: (data["updatedAt"] as Date | undefined) ?? now,
    };
  },
);

const developerMembershipModel = buildModel<DeveloperMembershipRow>(
  "developerMemberships",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      developerId: data["developerId"] as string,
      userId: data["userId"] as string,
      role: (data["role"] as string) ?? "viewer",
      isDisabled: Boolean(data["isDisabled"]),
      projectIds: (data["projectIds"] as string[] | undefined) ?? [],
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
      updatedAt: (data["updatedAt"] as Date | undefined) ?? now,
    };
  },
  [["developerId", "userId"]],
);

const developerInviteModel = buildModel<DeveloperInviteRow>(
  "developerInvites",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      developerId: data["developerId"] as string,
      email: (data["email"] as string).toLowerCase(),
      role: (data["role"] as string) ?? "viewer",
      projectIds: (data["projectIds"] as string[] | undefined) ?? [],
      tokenHash: data["tokenHash"] as string,
      expiresAt: data["expiresAt"] as Date,
      revokedAt: (data["revokedAt"] as Date | null) ?? null,
      createdByUserId: (data["createdByUserId"] as string | null) ?? null,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
      updatedAt: (data["updatedAt"] as Date | undefined) ?? now,
    };
  },
);

const subscriptionModel = buildModel<SubscriptionRow>(
  "subscriptions",
  (data) => {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      id: (data["id"] as string) ?? randomUUID(),
      agentId: (data["agentId"] as string | null) ?? null,
      developerId: (data["developerId"] as string | null) ?? null,
      plan: (data["plan"] as string) ?? "developer_basic",
      status: (data["status"] as string) ?? "active",
      paystackSubCode: (data["paystackSubCode"] as string | null) ?? null,
      paystackCustomerId: (data["paystackCustomerId"] as string | null) ?? null,
      currentPeriodStart: (data["currentPeriodStart"] as Date | undefined) ?? now,
      currentPeriodEnd: (data["currentPeriodEnd"] as Date | undefined) ?? end,
      cancelledAt: (data["cancelledAt"] as Date | null) ?? null,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
      updatedAt: (data["updatedAt"] as Date | undefined) ?? now,
    };
  },
  [["developerId"], ["agentId"]],
);

const paymentModel = buildModel<PaymentRow>(
  "payments",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      agentId: (data["agentId"] as string | null) ?? null,
      type: (data["type"] as string) ?? "subscription",
      gateway: (data["gateway"] as string) ?? "paystack",
      status: (data["status"] as string) ?? "pending",
      amount: (data["amount"] as bigint | undefined) ?? 0n,
      currency: (data["currency"] as string) ?? "NGN",
      reference: (data["reference"] as string) ?? `pay_${randomUUID().slice(0, 8)}`,
      gatewayResponse: (data["gatewayResponse"] as Json | null) ?? null,
      metadata: (data["metadata"] as Json | null) ?? null,
      paidAt: (data["paidAt"] as Date | null) ?? null,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
      updatedAt: (data["updatedAt"] as Date | undefined) ?? now,
    };
  },
  [["agentId"], ["reference"]],
);

const auditLogModel = buildModel<AuditLogRow>(
  "auditLogs",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    actorId: (data["actorId"] as string | null) ?? null,
    actorEmail: (data["actorEmail"] as string | null) ?? null,
    actorRole: (data["actorRole"] as string | null) ?? null,
    action: data["action"] as string,
    targetType: (data["targetType"] as string | null) ?? null,
    targetId: (data["targetId"] as string | null) ?? null,
    changes: (data["changes"] as Json | null) ?? null,
    ipAddress: (data["ipAddress"] as string | null) ?? null,
    userAgent: (data["userAgent"] as string | null) ?? null,
    metadata: (data["metadata"] as Json | null) ?? null,
    createdAt: (data["createdAt"] as Date | undefined) ?? new Date(),
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
    licenseNumber: (data["licenseNumber"] as string | null) ?? null,
    isVerified: Boolean(data["isVerified"]),
    kycStatus: (data["kycStatus"] as string) ?? "pending",
    bvnHash: (data["bvnHash"] as string | null) ?? null,
    verificationBadge: Boolean(data["verificationBadge"]),
    specializations: (data["specializations"] as string[] | undefined) ?? [],
    rating: 0,
    reviewCount: 0,
    totalListings: 0,
    totalSales: 0,
    yearsOfExperience: null,
    commissionEarned: (data["commissionEarned"] as bigint | undefined) ?? 0n,
    socialLinks: null,
    deletedAt: null,
    createdAt: new Date(),
  }),
);

const developerModel = buildModel<DeveloperRow>(
  "developers",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      userId: data["userId"] as string,
      companyName: data["companyName"] as string,
      rcNumber: (data["rcNumber"] as string | null) ?? null,
      companyAddress: (data["companyAddress"] as string | null) ?? null,
      companyCity: (data["companyCity"] as string | null) ?? null,
      companyState: (data["companyState"] as string | null) ?? null,
      companyPhone: (data["companyPhone"] as string | null) ?? null,
      companyEmail: (data["companyEmail"] as string | null) ?? null,
      companyWebsite: (data["companyWebsite"] as string | null) ?? null,
      description: (data["description"] as string | null) ?? null,
      isVerified: Boolean(data["isVerified"]),
      kycStatus: (data["kycStatus"] as string) ?? "pending",
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
      updatedAt: (data["updatedAt"] as Date | undefined) ?? now,
      deletedAt: (data["deletedAt"] as Date | null) ?? null,
    };
  },
);

const serviceProviderModel = buildModel<ServiceProviderRow>(
  "serviceProviders",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      userId: data["userId"] as string,
      businessName: data["businessName"] as string,
      slug: (data["slug"] as string) ?? randomUUID(),
      category: (data["category"] as string) ?? "legal",
      description: (data["description"] as string | null) ?? null,
      servicesOffered: (data["servicesOffered"] as Json | undefined) ?? [],
      address: (data["address"] as string | null) ?? null,
      city: (data["city"] as string) ?? "Lagos",
      state: (data["state"] as string) ?? "Lagos",
      country: (data["country"] as string) ?? "Nigeria",
      phone: (data["phone"] as string | null) ?? null,
      email: (data["email"] as string | null) ?? null,
      website: (data["website"] as string | null) ?? null,
      logoUrl: (data["logoUrl"] as string | null) ?? null,
      galleryImages: (data["galleryImages"] as string[] | undefined) ?? [],
      rating: (data["rating"] as number | undefined) ?? 0,
      reviewCount: (data["reviewCount"] as number | undefined) ?? 0,
      isVerified: Boolean(data["isVerified"]),
      verificationLevel: (data["verificationLevel"] as string) ?? "basic",
      subscriptionTier: (data["subscriptionTier"] as string) ?? "free",
      viewCount: (data["viewCount"] as number | undefined) ?? 0,
      leadCount: (data["leadCount"] as number | undefined) ?? 0,
      subCategories: (data["subCategories"] as string[] | undefined) ?? [],
      serviceAreas: (data["serviceAreas"] as string[] | undefined) ?? [],
      completedJobCount: (data["completedJobCount"] as number | undefined) ?? 0,
      responseRatePercent: (data["responseRatePercent"] as number | undefined) ?? 0,
      aiMatchScore: (data["aiMatchScore"] as number | undefined) ?? 0,
      isFeatured: Boolean(data["isFeatured"]),
      featuredUntil: (data["featuredUntil"] as Date | null) ?? null,
      whatsappPhone: (data["whatsappPhone"] as string | null) ?? null,
      whatsappConnected: Boolean(data["whatsappConnected"]),
      licenseNumber: (data["licenseNumber"] as string | null) ?? null,
      licenseBody: (data["licenseBody"] as string | null) ?? null,
      kycDocuments: (data["kycDocuments"] as Json | null) ?? null,
      portfolioItems: (data["portfolioItems"] as Json | undefined) ?? [],
      socialLinks: (data["socialLinks"] as Json | null) ?? null,
      deletedAt: (data["deletedAt"] as Date | null) ?? null,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
      updatedAt: (data["updatedAt"] as Date | undefined) ?? now,
      geomLatitude: (data["geomLatitude"] as number | null | undefined) ?? null,
      geomLongitude: (data["geomLongitude"] as number | null | undefined) ?? null,
    };
  },
  [["userId"], ["slug"]],
);

const providerWhatsAppConnectionModel = buildModel<ProviderWhatsAppConnectionRow>(
  "providerWhatsAppConnections",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    serviceProviderId: data["serviceProviderId"] as string,
    phoneNumber: (data["phoneNumber"] as string) ?? "",
    evolutionInstanceName: (data["evolutionInstanceName"] as string) ?? "stub",
    status: (data["status"] as string) ?? "connected",
    monitoredGroups: (data["monitoredGroups"] as Json | undefined) ?? [],
    extractedLeadsCount: (data["extractedLeadsCount"] as number | undefined) ?? 0,
    connectedAt: (data["connectedAt"] as Date | undefined) ?? new Date(),
    lastActiveAt: (data["lastActiveAt"] as Date | null) ?? null,
  }),
  [["id"]],
);

const serviceProviderModelWithGroupBy = {
  ...serviceProviderModel,
  groupBy: async (args: {
    by: ["category"];
    where?: Where;
    _count: { _all: true };
  }) => {
    const where = args.where ?? {};
    const list = tables.serviceProviders.filter((r) => rowMatches(r as Record<string, unknown>, where));
    const map = new Map<string, number>();
    for (const r of list) {
      map.set(r.category, (map.get(r.category) ?? 0) + 1);
    }
    return [...map.entries()].map(([category, count]) => ({
      category,
      _count: { _all: count },
    }));
  },
};

const serviceLeadModel = buildModel<ServiceLeadRow>(
  "serviceLeads",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      serviceProviderId: data["serviceProviderId"] as string,
      clientUserId: (data["clientUserId"] as string | null) ?? null,
      clientName: (data["clientName"] as string) ?? "Client",
      clientPhone: (data["clientPhone"] as string) ?? "",
      clientEmail: (data["clientEmail"] as string | null) ?? null,
      source: (data["source"] as string) ?? "directory",
      listingId: (data["listingId"] as string | null) ?? null,
      projectId: (data["projectId"] as string | null) ?? null,
      bundleId: (data["bundleId"] as string | null) ?? null,
      serviceRequested: (data["serviceRequested"] as string) ?? "",
      message: (data["message"] as string) ?? "",
      budget: (data["budget"] as bigint | null) ?? null,
      timeline: (data["timeline"] as string | null) ?? null,
      location: (data["location"] as string) ?? "",
      status: (data["status"] as string) ?? "pending",
      aiScore: (data["aiScore"] as number | null) ?? null,
      aiSummary: (data["aiSummary"] as string | null) ?? null,
      quotedAmountKobo: (data["quotedAmountKobo"] as bigint | null) ?? null,
      finalAmountKobo: (data["finalAmountKobo"] as bigint | null) ?? null,
      respondedAt: (data["respondedAt"] as Date | null) ?? null,
      completedAt: (data["completedAt"] as Date | null) ?? null,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
    };
  },
  [["id"]],
);

const serviceBundleModel = buildModel<ServiceBundleRow>(
  "serviceBundles",
  (data) => {
    return {
      id: (data["id"] as string) ?? randomUUID(),
      name: (data["name"] as string) ?? "Bundle",
      slug: (data["slug"] as string) ?? randomUUID(),
      description: (data["description"] as string) ?? "",
      categories: Array.isArray(data["categories"]) ? (data["categories"] as string[]) : [],
      priceFromKobo: (data["priceFromKobo"] as bigint | undefined) ?? 0n,
      priceToKobo: (data["priceToKobo"] as bigint | undefined) ?? 0n,
      triggerContext: (data["triggerContext"] as string) ?? "post_purchase",
      isActive: data["isActive"] !== false,
      activationCount: (data["activationCount"] as number | undefined) ?? 0,
    };
  },
  [["id"], ["slug"]],
);

const bundleActivationModel = buildModel<BundleActivationRow>(
  "bundleActivations",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      bundleId: data["bundleId"] as string,
      clientUserId: data["clientUserId"] as string,
      listingId: (data["listingId"] as string | null) ?? null,
      status: (data["status"] as string) ?? "initiated",
      matchedProviders: (data["matchedProviders"] as Json | undefined) ?? [],
      totalAmountKobo: (data["totalAmountKobo"] as bigint | null) ?? null,
      platformFeeKobo: (data["platformFeeKobo"] as bigint | null) ?? null,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
    };
  },
  [["id"]],
);

const serviceReviewModel = buildModel<ServiceReviewRow>(
  "serviceReviews",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      serviceLeadId: data["serviceLeadId"] as string,
      serviceProviderId: data["serviceProviderId"] as string,
      reviewerId: data["reviewerId"] as string,
      overallRating: Number(data["overallRating"]),
      qualityRating: Number(data["qualityRating"]),
      communicationRating: Number(data["communicationRating"]),
      timelinessRating: Number(data["timelinessRating"]),
      valueRating: Number(data["valueRating"]),
      title: (data["title"] as string) ?? "",
      body: (data["body"] as string) ?? "",
      isJobVerified: Boolean(data["isJobVerified"]),
      providerResponse: (data["providerResponse"] as string | null) ?? null,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
    };
  },
  [["id"], ["serviceLeadId"]],
);

const notificationModel = buildModel<NotificationRow>(
  "notifications",
  (data) => {
    const now = new Date();
    return {
      id: (data["id"] as string) ?? randomUUID(),
      userId: data["userId"] as string,
      type: (data["type"] as string) ?? "system",
      title: data["title"] as string,
      body: (data["body"] as string | null) ?? null,
      metadata: (data["metadata"] as Json | null) ?? null,
      readAt: (data["readAt"] as Date | null) ?? null,
      createdAt: (data["createdAt"] as Date | undefined) ?? now,
    };
  },
  [["id"]],
);

const providerAvailabilityModel = buildModel<ProviderAvailabilityRow>(
  "providerAvailability",
  (data) => ({
    id: (data["id"] as string) ?? randomUUID(),
    serviceProviderId: data["serviceProviderId"] as string,
    date: (data["date"] as Date) ?? new Date(),
    isAvailable: data["isAvailable"] !== false,
    slots: (data["slots"] as Json | null) ?? null,
    note: (data["note"] as string | null) ?? null,
  }),
  [["id"]],
);

/** Values embedded in contextual match `$queryRaw` (PostGIS prod / fake heuristic in tests). */
const SERVICE_CATEGORY_LITERALS = new Set([
  "legal",
  "mortgage",
  "architecture",
  "survey",
  "insurance",
  "renovation",
  "photography",
  "property_management",
  "valuation",
  "cleaning_moving",
  "home_technology",
  "inspection",
]);

function uuidLike(s: unknown): s is string {
  return (
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  );
}

function extractTaggedTemplateSqlValues(parts: unknown, rest: unknown[]): unknown[] {
  if (
    typeof parts === "object" &&
    parts !== null &&
    "values" in parts &&
    Array.isArray((parts as { values: unknown }).values)
  ) {
    const embedded = (parts as { values: unknown[] }).values;
    return [...embedded, ...rest];
  }
  // Tagged template: `...${x}` → (strings, ...exprValues)
  if (Array.isArray(parts) && parts !== null && "raw" in parts) {
    return rest;
  }
  return rest;
}

function querySqlText(parts: unknown): string {
  if (Array.isArray(parts) && parts !== null && "raw" in parts) {
    return (parts as TemplateStringsArray).raw.join("?");
  }
  if (typeof parts === "object" && parts !== null) {
    const maybe = parts as { strings?: string[]; sql?: string; text?: string };
    if (Array.isArray(maybe.strings)) return maybe.strings.join("?");
    if (typeof maybe.sql === "string") return maybe.sql;
    if (typeof maybe.text === "string") return maybe.text;
  }
  return String(parts ?? "");
}

function isProviderCoordQuery(parts: unknown, flat: unknown[]): boolean {
  const sql = querySqlText(parts);
  if (sql.includes("ST_Y") || sql.includes("ST_X")) return true;
  return flat.some((v) => String(v).includes("ST_Y") || String(v).includes("ST_X"));
}

function uuidsFromSqlText(parts: unknown): string[] {
  const text = querySqlText(parts);
  const matches = text.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
  );
  return matches ? matches.filter(uuidLike) : [];
}

function uuidValuesFromQueryArgs(values: unknown[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    if (uuidLike(v)) out.push(v);
    else if (Array.isArray(v)) {
      for (const x of v) {
        if (uuidLike(x)) out.push(x);
      }
    }
  }
  return out;
}

function syntheticProviderCoordinates(
  parts: unknown,
  values: unknown[],
): { id: string; latitude: number; longitude: number }[] {
  let ids = [...new Set([...uuidValuesFromQueryArgs(values), ...uuidsFromSqlText(parts)])];
  // Prisma.join embeds ids in Sql text — when not flattened, return all geocoded rows.
  if (ids.length === 0) {
    ids = tables.serviceProviders.filter((p) => !p.deletedAt).map((p) => p.id);
  }
  const out: { id: string; latitude: number; longitude: number }[] = [];
  for (const id of ids) {
    const sp = tables.serviceProviders.find((p) => p.id === id && !p.deletedAt);
    if (
      sp &&
      sp.geomLatitude !== null &&
      sp.geomLongitude !== null &&
      sp.geomLatitude !== undefined &&
      sp.geomLongitude !== undefined
    ) {
      out.push({ id, latitude: sp.geomLatitude, longitude: sp.geomLongitude });
    }
  }
  return out;
}

function syntheticServicehubCandidates(values: unknown[]): { id: string; distance_m: number }[] {
  let listingId: string | undefined;
  for (const v of values) {
    if (uuidLike(v) && tables.listings.some((l) => l.id === v && !l.deletedAt)) listingId = v;
  }
  let category: string | undefined;
  for (const v of values) {
    if (typeof v === "string" && SERVICE_CATEGORY_LITERALS.has(v)) category = v;
  }
  if (!listingId || !category) return [];

  return tables.serviceProviders
    .filter((sp) => !sp.deletedAt && sp.category === category)
    .slice(0, 120)
    .map((sp, idx) => ({ id: sp.id, distance_m: 2100 + idx * 37 }));
}

export const fakePrisma = {
  user: userModel,
  userProfile: {
    findFirst: async (args?: { where?: { userId?: string } }) => {
      const uid = args?.where?.userId;
      if (!uid) return null;
      const row = tables.profiles.find((p) => p.userId === uid);
      return row ? clone(row) : null;
    },
    findUnique: async (args: { where: { userId: string } }) => {
      const row = tables.profiles.find((p) => p.userId === args.where.userId);
      return row ? clone(row) : null;
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const row: ProfileRow = {
        id: randomUUID(),
        userId: data.userId as string,
        firstName: (data.firstName as string | null) ?? null,
        lastName: (data.lastName as string | null) ?? null,
        city: (data.city as string | null) ?? null,
        state: (data.state as string | null) ?? null,
        country: (data.country as string | null) ?? "Nigeria",
        avatarUrl: (data.avatarUrl as string | null) ?? null,
        notifyEmail: (data.notifyEmail as boolean | undefined) ?? true,
        notifySms: (data.notifySms as boolean | undefined) ?? true,
        notifyPush: (data.notifyPush as boolean | undefined) ?? false,
        preferences: (data.preferences as Json | null) ?? null,
      };
      tables.profiles.push(row);
      return clone(row);
    },
    update: async ({
      where,
      data,
    }: {
      where: { userId: string };
      data: Record<string, unknown>;
    }) => {
      const row = tables.profiles.find((p) => p.userId === where.userId);
      if (!row) throw new Error("Profile not found");
      applyUpdate(row, data);
      return clone(row);
    },
  },
  property: propertyModel,
  listing: listingModel,
  agent: agentModel,
  developer: developerModel,
  serviceProvider: serviceProviderModelWithGroupBy,
  savedListing: savedListingModel,
  listingRecentView: recentViewModel,
  tourRequest: tourRequestModel,
  savedSearch: savedSearchModel,
  inquiry: inquiryModel,
  message: messageModel,
  listingPriceHistory: listingPriceHistoryModel,
  developerProject: developerProjectModel,
  developerBulkUpload: developerBulkUploadModel,
  developerBulkUploadRow: developerBulkUploadRowModel,
  projectUnit: projectUnitModel,
  developerKycDocument: developerKycDocumentModel,
  developerMembership: developerMembershipModel,
  developerInvite: developerInviteModel,
  subscription: subscriptionModel,
  payment: paymentModel,
  auditLog: auditLogModel,
  platformSettings: {
    findUnique: async ({ where }: { where: { id: string } }) => {
      const row = tables.platformSettings.find((r) => r.id === where.id);
      return row ? clone(row) : null;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { id: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => {
      let row = tables.platformSettings.find((r) => r.id === where.id);
      if (!row) {
        row = {
          id: (create.id as string) ?? where.id,
          maintenanceMode: Boolean(create.maintenanceMode),
          whatsappAutoApproveMinScore:
            (create.whatsappAutoApproveMinScore as number | null) ?? null,
          updatedAt: new Date(),
          updatedBy: (create.updatedBy as string | null) ?? null,
        };
        tables.platformSettings.push(row);
        return clone(row);
      }
      applyUpdate(row, { ...update, ...create });
      row.updatedAt = new Date();
      return clone(row);
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => {
      const row = tables.platformSettings.find((r) => r.id === where.id);
      if (!row) throw new Error("PlatformSettings not found");
      applyUpdate(row, data);
      row.updatedAt = new Date();
      return clone(row);
    },
  },
  rawWhatsAppMessage: rawWhatsAppMessageModel,
  listingSeoVariant: listingSeoVariantModel,
  serviceLead: serviceLeadModel,
  serviceBundle: serviceBundleModel,
  bundleActivation: bundleActivationModel,
  serviceReview: serviceReviewModel,
  providerWhatsAppConnection: providerWhatsAppConnectionModel,
  notification: notificationModel,
  providerAvailability: providerAvailabilityModel,
  review: {
    findMany: async () => [],
  },
  $transaction: async <T>(fn: (tx: typeof fakePrisma) => Promise<T>) => fn(fakePrisma),
  $queryRaw: async (parts?: unknown, ...values: unknown[]) => {
    const flat = extractTaggedTemplateSqlValues(parts, values);
    if (isProviderCoordQuery(parts, flat)) {
      return syntheticProviderCoordinates(parts, flat);
    }
    const rows = syntheticServicehubCandidates(flat);
    if (rows.length > 0) return rows;
    return [];
  },
  $executeRaw: async () => 0,
};

export const fakeTables = tables;
