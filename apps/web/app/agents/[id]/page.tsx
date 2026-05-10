import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ChevronRight,
  MapPin,
  Phone,
  MessageSquare,
  Mail,
  Star,
  CheckCircle2,
  Calendar,
  Building2,
  Award,
  Users,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PropertyCard } from '@/components/listings/property-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Metadata } from 'next'
import { fetchAgentDetail } from '@/lib/api/agents'
import { mapApiListingToCardProps } from '@/lib/listings/map-api-listing'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatMemberSince(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    month: 'short',
    year: 'numeric',
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const res = await fetchAgentDetail(id)
    if (!res) {
      return { title: 'Agent | LandShoppers' }
    }
    const agent = res.data
    const titleSuffix = agent.company?.trim() ? agent.company : 'LandShoppers'
    return {
      title: `${agent.name} - ${titleSuffix}`,
      description: `${agent.name} is a verified real estate agent${agent.company?.trim() ? ` at ${agent.company}` : ''} in ${agent.city}.`,
      openGraph: {
        title: `${agent.name} | LandShoppers Agent`,
        description: `Verified real estate agent in ${agent.city}.`,
        images: [agent.image],
      },
    }
  } catch {
    return { title: 'Agent | LandShoppers' }
  }
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const res = await fetchAgentDetail(id)
  if (!res) {
    notFound()
  }
  const agent = res.data

  const listingCards = agent.listings.map(mapApiListingToCardProps)

  const whatsappDigits =
    agent.whatsapp?.replace(/\D/g, '') ||
    agent.phone.replace(/\D/g, '') ||
    ''
  const whatsappMessage = encodeURIComponent(
    `Hi ${agent.name}, I found your profile on LandShoppers and would like to discuss property options.`,
  )
  const whatsappLink = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${whatsappMessage}`
    : undefined

  const bioParagraphs = agent.bio
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-3 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/agents" className="hover:text-foreground">
                Agents
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{agent.name}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Avatar className="mx-auto h-32 w-32 border-4 border-background shadow-lg">
                      <AvatarImage src={agent.image} alt={agent.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                        {agent.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mt-4">
                      <div className="flex items-center justify-center gap-2">
                        <h1 className="text-xl font-bold text-foreground">
                          {agent.name}
                        </h1>
                        {agent.isVerified && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      {agent.company?.trim() ? (
                        <p className="text-muted-foreground">{agent.company}</p>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(agent.rating)
                                ? 'fill-secondary text-secondary'
                                : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{agent.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({agent.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {agent.totalListings}
                      </p>
                      <p className="text-xs text-muted-foreground">Listings</p>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-2xl font-bold text-foreground">
                        {agent.totalSales}
                      </p>
                      <p className="text-xs text-muted-foreground">Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {agent.yearsOfExperience ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">Years</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Button className="w-full gap-2" asChild>
                      <a href={`tel:${agent.phone.replace(/\s/g, '')}`}>
                        <Phone className="h-4 w-4" />
                        {agent.phone}
                      </a>
                    </Button>
                    {whatsappLink ? (
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageSquare className="h-4 w-4" />
                          WhatsApp
                        </a>
                      </Button>
                    ) : null}
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <a href={`mailto:${agent.email}`}>
                        <Mail className="h-4 w-4" />
                        Email
                      </a>
                    </Button>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{agent.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>
                        {agent.city}
                        {agent.state ? `, ${agent.state}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>Member since {formatMemberSince(agent.joinedAt)}</span>
                    </div>
                    {agent.languages.length > 0 ? (
                      <div className="flex items-center gap-3 text-sm">
                        <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>Speaks {agent.languages.join(', ')}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 flex justify-center gap-3">
                    {agent.socialLinks.facebook ? (
                      <a
                        href={agent.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-muted p-2.5 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    ) : null}
                    {agent.socialLinks.twitter ? (
                      <a
                        href={agent.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-muted p-2.5 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    ) : null}
                    {agent.socialLinks.instagram ? (
                      <a
                        href={agent.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-muted p-2.5 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    ) : null}
                    {agent.socialLinks.linkedin ? (
                      <a
                        href={agent.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-muted p-2.5 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="about" className="w-full">
                <TabsList>
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="listings">
                    Listings ({listingCards.length})
                  </TabsTrigger>
                  <TabsTrigger value="reviews">
                    Reviews ({agent.reviewCount})
                  </TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About {agent.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        {bioParagraphs.map((paragraph, index) => (
                          <p key={index} className="mb-4 leading-relaxed last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {agent.specializations.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Specializations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {agent.specializations.map((spec) => (
                            <Badge
                              key={spec}
                              variant="secondary"
                              className="text-sm"
                            >
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}

                  {agent.certifications.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          Certifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {agent.certifications.map((cert) => (
                            <li
                              key={cert}
                              className="flex items-center gap-3 text-sm"
                            >
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                              <span>{cert}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ) : null}
                </TabsContent>

                <TabsContent value="listings" className="mt-6">
                      {listingCards.length > 0 ? (
                    <>
                      <div className="grid gap-6 sm:grid-cols-2">
                        {listingCards.map((listing) => (
                          <PropertyCard key={listing.id} {...listing} />
                        ))}
                      </div>
                      {agent.totalListings > 0 ? (
                        <div className="mt-6 text-center">
                          <Button variant="outline" asChild>
                            <Link href={`/listings?agent=${agent.id}`}>
                              {agent.totalListings > listingCards.length
                                ? `View all ${agent.totalListings} listings`
                                : 'See listings'}
                            </Link>
                          </Button>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed bg-muted/30 py-12 text-center text-sm text-muted-foreground">
                      No active listings right now.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="mt-6 space-y-6">
                  {agent.reviews.length > 0 ? (
                    agent.reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage
                                src={review.avatar}
                                alt={review.author}
                              />
                              <AvatarFallback>
                                {review.author
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="font-semibold">{review.author}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(review.date)}
                                  </p>
                                </div>
                                <div className="flex shrink-0">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? 'fill-secondary text-secondary'
                                          : 'text-muted'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                {review.content}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed bg-muted/30 py-12 text-center text-sm text-muted-foreground">
                      No reviews yet.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="contact" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Send a Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="contact-name">Your Name</Label>
                            <Input
                              id="contact-name"
                              placeholder="Enter your name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact-email">Email</Label>
                            <Input
                              id="contact-email"
                              type="email"
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-phone">Phone</Label>
                          <Input
                            id="contact-phone"
                            type="tel"
                            placeholder="+234"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-message">Message</Label>
                          <Textarea
                            id="contact-message"
                            placeholder="I'm interested in..."
                            rows={5}
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Send Message
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
