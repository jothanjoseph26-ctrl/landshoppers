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
  property: ApiListingProperty
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
