/** Subset of `@landshoppers/api` listing JSON (BigInt price serialized as string). */
export type ApiListingProperty = {
  id: string
  title: string
  slug: string
  description: string | null
  propertyType: string
  address: string | null
  street: string | null
  city: string
  state: string
  country: string
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  bedrooms: number | null
  bathrooms: number | null
  toilets: number | null
  squareMeters: number | null
  yearBuilt: number | null
  parkingSpaces: number | null
  isFurnished: boolean
  createdAt: string
  updatedAt: string
}

export type ApiListingPricePoint = {
  changedAt: string
  price: string
}

export type ApiListing = {
  id: string
  propertyId: string
  agentId: string | null
  userId: string
  price: string
  priceNegotiable: boolean
  status: string
  isForSale: boolean
  isForRent: boolean
  rentPeriod: string | null
  isFeatured: boolean
  featuredUntil: string | null
  viewCount: number
  inquiryCount: number
  virtualTourUrl: string | null
  videoUrl: string | null
  publishedAt: string | null
  expiresAt: string | null
  sourceType: string | null
  sourceMessageId: string | null
  createdAt: string
  updatedAt: string
  /** Lifecycle fields exposed by the listing serializer (Agent 2). */
  submittedAt?: string | null
  approvedAt?: string | null
  approvedBy?: string | null
  rejectedAt?: string | null
  rejectedBy?: string | null
  rejectionReason?: string | null
  priceHistory?: ApiListingPricePoint[]
  property: ApiListingProperty
}

/** GET /v1/developers catalogue row */
export type ApiDeveloperDirectory = {
  id: string
  companyName: string
  companyCity: string | null
  companyState: string | null
  companyAddress: string | null
  companyPhone: string | null
  companyEmail: string | null
  companyWebsite: string | null
  companyLogo: string
  description: string | null
  isVerified: boolean
  totalProjects: number
  totalUnitsSold: number
  rating: number
  reviewCount: number
}

/** GET /v1/projects/:id */
export type ApiProjectDetail = {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  status: string
  propertyType: string
  address: string | null
  city: string
  state: string
  country: string
  latitude: number | null
  longitude: number | null
  amenities: string[]
  features: string[]
  images: string[]
  totalUnits: number
  availableUnits: number
  soldUnits: number
  priceRangeMin: string | null
  priceRangeMax: string | null
  completionDate: string | null
  virtualTourUrl: string | null
  brochureUrl: string | null
  developer: {
    id: string
    companyName: string
    isVerified: boolean
    companyLogo: string
  }
  sampleUnits: Array<{
    id: string
    unitName: string
    unitType: string
    bedrooms: number | null
    bathrooms: number | null
    squareMeters: number | null
    price: string
    status: string
  }>
}

export type ApiListResponse<T> = {
  data: T
  meta?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    mode?: string
    note?: string
  }
}

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiAgentSummary = {
  id: string
  slug: string
  name: string
  company: string
  image: string
  phone: string
  whatsapp: string
  city: string
  specializations: string[]
  isVerified: boolean
  rating: number
  reviewCount: number
  totalListings: number
  totalSales: number
  yearsOfExperience: number | null
}

/** GET /v1/me, GET /v1/auth/me */
export type ApiMeUser = {
  id: string
  email: string
  role: "buyer" | "agent" | "developer" | "admin" | "super_admin" | "service_provider"
  isEmailVerified: boolean
  isPhoneVerified: boolean
  phone: string | null
  lastLoginAt: string | null
  createdAt: string
  profile: {
    firstName: string | null
    lastName: string | null
    city: string | null
    state: string | null
    country: string | null
    avatarUrl: string | null
  } | null
  agent: {
    id: string
    agencyName: string | null
    isVerified: boolean
  } | null
  developer: {
    id: string
    companyName: string
    isVerified: boolean
  } | null
  serviceProvider: {
    id: string
    businessName: string
    slug: string
  } | null
}

/** GET /v1/me/saved-listings row */
export type ApiSavedListing = {
  id: string
  savedAt: string
  listing: ApiListing
}

/** GET /v1/me/recent-listings row */
export type ApiRecentListing = {
  id: string
  lastViewedAt: string
  listing: ApiListing
}

/** GET /v1/me/saved-searches row */
export type ApiSavedSearch = {
  id: string
  name: string | null
  filters: Record<string, unknown>
  emailAlerts: boolean
  alertFrequency: string
  lastAlertSent: string | null
  createdAt: string
  updatedAt: string
}

export type ApiInquiryStatus = "new" | "responded" | "touring" | "closed" | "lost"

export type ApiInquiry = {
  id: string
  listingId: string | null
  projectId: string | null
  buyerId: string
  agentId: string | null
  source: string
  status: ApiInquiryStatus
  message: string | null
  buyerName: string | null
  buyerEmail: string | null
  buyerPhone: string | null
  respondedAt: string | null
  closedAt: string | null
  closedReason: string | null
  createdAt: string
  updatedAt: string
  listing?: ApiListing | null
}

export type ApiListingStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "paused"
  | "rejected"
  | "sold"
  | "expired"

export type ApiAgentDetail = ApiAgentSummary & {
  email: string
  state: string
  address: string
  bio: string
  joinedAt: string
  languages: string[]
  certifications: string[]
  socialLinks: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
  listings: ApiListing[]
  reviews: {
    id: string
    author: string
    avatar: string
    rating: number
    date: string
    content: string
  }[]
}
