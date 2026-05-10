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
  Quote
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

// This would come from your database
const mockProvider = {
  id: "1",
  name: "Adekunle & Partners Legal",
  slug: "adekunle-partners-legal",
  category: "legal",
  description: "Expert property law firm specializing in real estate transactions, title verification, and property documentation across Nigeria. With over 15 years of experience, we have helped thousands of clients navigate the complexities of property law.",
  longDescription: `Adekunle & Partners Legal is one of Nigeria's leading property law firms, established in 2009. We specialize in all aspects of real estate law, from simple title searches to complex commercial property transactions.

Our team of experienced lawyers understands the unique challenges of the Nigerian property market, including issues around land title verification, family land disputes, and government land acquisitions. We work closely with clients to ensure their property investments are secure and properly documented.

Whether you're buying your first home, investing in commercial property, or developing a real estate project, our team provides comprehensive legal support at every step of the process.`,
  image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop",
  gallery: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=300&fit=crop",
  ],
  rating: 4.9,
  reviewCount: 128,
  location: "15 Adeola Odeku Street, Victoria Island, Lagos",
  city: "Lagos",
  phone: "+234 801 234 5678",
  email: "info@adekunlepartners.com",
  website: "www.adekunlepartners.com",
  isVerified: true,
  isPremium: true,
  yearEstablished: 2009,
  teamSize: "15-25",
  responseTime: "Within 2 hours",
  services: [
    { name: "Title Search & Verification", description: "Comprehensive investigation of property ownership history and legal status" },
    { name: "Property Documentation", description: "Preparation and review of all property-related legal documents" },
    { name: "Contract Review", description: "Expert review of sale agreements, lease contracts, and other property documents" },
    { name: "Land Registration", description: "Assistance with registering property with relevant government agencies" },
    { name: "Due Diligence", description: "Thorough investigation of property and seller before purchase" },
    { name: "Dispute Resolution", description: "Mediation and litigation for property disputes" },
  ],
  businessHours: [
    { day: "Monday - Friday", hours: "8:00 AM - 5:00 PM" },
    { day: "Saturday", hours: "9:00 AM - 2:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ],
  socialLinks: {
    linkedin: "https://linkedin.com/company/adekunle-partners",
    twitter: "https://twitter.com/adekunlepartners",
    facebook: "https://facebook.com/adekunlepartners",
  },
}

const mockReviews = [
  {
    id: "1",
    author: "Chioma Okafor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    date: "March 2026",
    comment: "Excellent service! They handled our property purchase from start to finish. The team was professional, responsive, and ensured all documentation was properly done. Highly recommend!",
  },
  {
    id: "2",
    author: "Emmanuel Adeyemi",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 5,
    date: "February 2026",
    comment: "They discovered a title issue that other lawyers missed. Saved us from making a costly mistake. Very thorough and professional.",
  },
  {
    id: "3",
    author: "Ngozi Eze",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    rating: 4,
    date: "January 2026",
    comment: "Good experience overall. Communication could be slightly better, but the quality of work was excellent. They successfully helped us register our family land.",
  },
]

export default async function ServiceProviderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // In production, fetch provider data based on slug
  const provider = mockProvider

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link href="/services" className="text-muted-foreground hover:text-foreground">Services</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{provider.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-64 md:h-80">
        <Image
          src={provider.image}
          alt={provider.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Provider Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold">{provider.name}</h1>
                      {provider.isVerified && (
                        <CheckCircle className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                      <Badge variant="secondary" className="capitalize">
                        {provider.category} Services
                      </Badge>
                      {provider.isPremium && (
                        <Badge className="bg-accent text-accent-foreground">Premium Partner</Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="font-semibold text-foreground">{provider.rating}</span>
                        <span>({provider.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">{provider.description}</p>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{provider.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Est. {provider.yearEstablished}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>Responds {provider.responseTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                  {provider.longDescription}
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {provider.services.map((service) => (
                    <div key={service.name} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-1">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gallery */}
            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {provider.gallery.map((image, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`${provider.name} gallery ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reviews ({provider.reviewCount})</CardTitle>
                <Button variant="outline">Write a Review</Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {mockReviews.map((review) => (
                  <div key={review.id} className="pb-6 border-b last:border-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={review.avatar} alt={review.author} />
                        <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
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
                  View All Reviews
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${provider.phone}`} className="font-medium hover:text-primary">
                      {provider.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${provider.email}`} className="font-medium hover:text-primary">
                      {provider.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a href={`https://${provider.website}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary">
                      {provider.website}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{provider.location}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="font-semibold mb-3">Business Hours</p>
                  <div className="space-y-2 text-sm">
                    {provider.businessHours.map((item) => (
                      <div key={item.day} className="flex justify-between">
                        <span className="text-muted-foreground">{item.day}</span>
                        <span className="font-medium">{item.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button className="w-full" size="lg">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
