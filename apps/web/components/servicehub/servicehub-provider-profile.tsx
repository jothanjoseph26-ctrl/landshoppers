import Image from "next/image"
import Link from "next/link"
import {
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Clock,
  CheckCircle,
  MessageSquare,
  Share2,
  Heart,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ServiceHubQuoteForm } from "@/components/servicehub/servicehub-quote-form"
import type {
  ApiServiceProviderListItem,
  ApiServiceReviewItem,
  ServiceQuotePayload,
} from "@/lib/api/services-marketplace"
import { DEMO_SERVICE_PROVIDERS } from "@/lib/api/services-marketplace"
import { SITE_SALES_PHONE_DISPLAY } from "@/lib/site-contact"
import type { ServiceHubCategorySlug } from "@/lib/servicehub/categories"
import { getServiceHubCategoryMeta } from "@/lib/servicehub/categories"

export type RichProviderProfile = ApiServiceProviderListItem & {
  longDescription: string
  gallery: string[]
  email: string
  website?: string | null
  yearEstablished: number
  responseTime: string
  businessHours: { day: string; hours: string }[]
  servicesDetailed: { name: string; description: string }[]
}

type ReviewRow = {
  id: string
  author: string
  avatar?: string
  rating: number
  date: string
  comment: string
}

const mockReviews: ReviewRow[] = [
  {
    id: "1",
    author: "Chioma Okafor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    date: "March 2026",
    comment:
      "Excellent service! They handled our property purchase from start to finish. Highly recommend.",
  },
  {
    id: "2",
    author: "Emmanuel Adeyemi",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 5,
    date: "February 2026",
    comment: "Thorough title work — caught issues others missed.",
  },
]

function formatReviewDate(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-NG", { month: "short", year: "numeric", day: "numeric" })
}

function mapApiReviews(rows: ApiServiceReviewItem[]): ReviewRow[] {
  return rows.map((r) => ({
    id: r.id,
    author: r.authorName,
    rating: r.rating,
    date: formatReviewDate(r.createdAt),
    comment: r.body,
  }))
}

function buildRichProfile(p: ApiServiceProviderListItem): RichProviderProfile {
  const heuristicEmail =
    p.slug.includes("mortgage")
      ? "hello@firstmortgage.test"
      : "contact@" + p.slug.replace(/-/g, "") + ".test"

  return {
    ...p,
    longDescription:
      p.description ??
      "This team supports LandShoppers buyers and agents with end-to-end service delivery.",
    gallery: p.galleryImages?.length
      ? p.galleryImages
      : [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop",
        ],
    email: (p.email && p.email.trim()) || heuristicEmail,
    website: p.slug.includes("mortgage") ? "firstmortgage.test" : undefined,
    yearEstablished: 2012,
    responseTime:
      typeof p.responseRatePercent === "number" && p.responseRatePercent >= 90
        ? "Usually within 1 hour"
        : "Within 2 hours",
    businessHours: [
      { day: "Monday - Friday", hours: "8:00 AM - 5:00 PM" },
      { day: "Saturday", hours: "9:00 AM - 2:00 PM" },
      { day: "Sunday", hours: "Closed" },
    ],
    servicesDetailed: (p.services ?? ["Consultation", "Project support", "Documentation"]).map(
      (name) => ({
        name,
        description:
          "Structured delivery tailored to Nigerian property timelines and documentation.",
      }),
    ),
  }
}

type Props = {
  categorySlug: ServiceHubCategorySlug
  provider: ApiServiceProviderListItem
  listingId?: string
  quoteSource?: ServiceQuotePayload["source"]
  reviewsApi?: ApiServiceReviewItem[] | null
}

export function ServiceHubProviderProfile({
  categorySlug,
  provider,
  listingId,
  quoteSource = "directory",
  reviewsApi,
}: Props) {
  const cat = getServiceHubCategoryMeta(categorySlug)
  const p = buildRichProfile(provider)
  const cover =
    p.coverImageUrl ||
    p.gallery[0] ||
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop"

  const reviewRows = reviewsApi?.length ? mapApiReviews(reviewsApi) : mockReviews
  const reviewHeadlineCount = reviewsApi?.length ?? p.reviewCount

  const similar = DEMO_SERVICE_PROVIDERS.filter(
    (x) => x.category === p.category && x.slug !== p.slug,
  ).slice(0, 3)

  const quoteServices =
    p.services && p.services.length > 0 ? p.services : ["General enquiry"]

  return (
    <div className="bg-background pb-8">
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link href="/services" className="text-muted-foreground hover:text-foreground">
              Services
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link
              href={`/services/${categorySlug}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {cat?.label ?? categorySlug}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{p.businessName}</span>
          </nav>
        </div>
      </div>

      <div className="relative h-64 md:h-80">
        <Image src={cover} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto -mt-16 px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl font-bold md:text-3xl">{p.businessName}</h1>
                      {p.isVerified && <CheckCircle className="h-7 w-7 text-primary" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                      <Badge variant="secondary" className="capitalize">
                        {p.category.replace(/_/g, " ")}
                      </Badge>
                      {p.verificationLevel && (
                        <Badge variant="outline" className="capitalize">
                          {p.verificationLevel.replace(/_/g, " ")}
                        </Badge>
                      )}
                      {p.isPremium && (
                        <Badge className="bg-accent text-accent-foreground">Premium partner</Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="font-semibold text-foreground">{p.rating}</span>
                        <span>({p.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" type="button" aria-label="Save">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" type="button" aria-label="Share">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="mb-6 text-muted-foreground">
                  {p.description ?? "Verified LandShoppers service partner."}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {p.city}, {p.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Est. {p.yearEstablished}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Responds {p.responseTime}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button asChild size="lg">
                    <a href="#servicehub-quote">Request quote</a>
                  </Button>
                  <Button variant="outline" size="lg" type="button">
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground">
                  {p.longDescription}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Services offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {p.servicesDetailed.map((service) => (
                    <div key={service.name} className="rounded-lg border p-4">
                      <h4 className="mb-1 font-semibold">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {p.gallery.map((image, index) => (
                    <div key={image} className="relative aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={image}
                        alt={`${p.businessName} gallery ${index + 1}`}
                        fill
                        className="cursor-pointer object-cover transition hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {similar.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Similar providers</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  {similar.map((s) => (
                    <Button key={s.slug} variant="secondary" size="sm" asChild>
                      <Link href={`/services/${s.category}/${s.slug}`}>{s.businessName}</Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reviews ({reviewHeadlineCount})</CardTitle>
                <Button variant="outline">Write a review</Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviewRows.map((review) => (
                  <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                    <div className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={review.avatar} alt="" />
                        <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{review.author}</p>
                            <p className="text-sm text-muted-foreground">{review.date}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "fill-accent text-accent" : "text-muted"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View all reviews
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${p.phone ?? ""}`} className="font-medium hover:text-primary">
                      {p.phone ?? SITE_SALES_PHONE_DISPLAY}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${p.email}`} className="font-medium hover:text-primary">
                      {p.email}
                    </a>
                  </div>
                </div>

                {p.website && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a
                        href={`https://${p.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary"
                      >
                        {p.website}
                      </a>
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="mb-3 font-semibold">Business hours</p>
                  <div className="space-y-2 text-sm">
                    {p.businessHours.map((item) => (
                      <div key={item.day} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{item.day}</span>
                        <span className="font-medium">{item.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div id="servicehub-quote" className="scroll-mt-28 space-y-3">
                  <p className="font-semibold">Request a quote</p>
                  <p className="text-xs text-muted-foreground">
                    Submits a structured lead to this provider. Works for guests when the quote
                    endpoint is enabled on the API.
                  </p>
                  <ServiceHubQuoteForm
                    providerSlug={p.slug}
                    providerName={p.businessName}
                    services={quoteServices}
                    listingId={listingId}
                    quoteSource={quoteSource}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
