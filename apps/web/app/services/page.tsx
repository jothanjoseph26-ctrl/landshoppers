"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Scale, 
  Calculator, 
  HardHat, 
  Ruler, 
  Shield, 
  Wrench, 
  Camera, 
  Building2,
  Filter,
  SlidersHorizontal,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const categories = [
  { id: "all", name: "All Services", icon: Building2 },
  { id: "legal", name: "Legal Services", icon: Scale },
  { id: "mortgage", name: "Mortgage & Finance", icon: Calculator },
  { id: "architecture", name: "Architecture", icon: HardHat },
  { id: "survey", name: "Land Survey", icon: Ruler },
  { id: "insurance", name: "Insurance", icon: Shield },
  { id: "renovation", name: "Renovation", icon: Wrench },
  { id: "photography", name: "Photography", icon: Camera },
  { id: "property_management", name: "Property Management", icon: Building2 },
]

const mockProviders = [
  {
    id: "1",
    name: "Adekunle & Partners Legal",
    slug: "adekunle-partners-legal",
    category: "legal",
    description: "Expert property law firm specializing in real estate transactions, title verification, and property documentation across Nigeria.",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=300&fit=crop",
    rating: 4.9,
    reviewCount: 128,
    location: "Victoria Island, Lagos",
    phone: "+234 801 234 5678",
    isVerified: true,
    isPremium: true,
    services: ["Title Search", "Property Documentation", "Contract Review", "Land Registration"],
  },
  {
    id: "2",
    name: "First Mortgage Bank",
    slug: "first-mortgage-bank",
    category: "mortgage",
    description: "Leading mortgage provider offering competitive rates and flexible payment plans for Nigerian homebuyers.",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop",
    rating: 4.7,
    reviewCount: 256,
    location: "Ikoyi, Lagos",
    phone: "+234 802 345 6789",
    isVerified: true,
    isPremium: true,
    services: ["Home Loans", "Construction Finance", "Refinancing", "Mortgage Advisory"],
  },
  {
    id: "3",
    name: "BuildRight Architects",
    slug: "buildright-architects",
    category: "architecture",
    description: "Award-winning architectural firm creating modern, sustainable designs for residential and commercial properties.",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=300&fit=crop",
    rating: 4.8,
    reviewCount: 89,
    location: "Lekki, Lagos",
    phone: "+234 803 456 7890",
    isVerified: true,
    isPremium: false,
    services: ["Residential Design", "Commercial Design", "Interior Design", "Project Management"],
  },
  {
    id: "4",
    name: "GeoPoint Survey Ltd",
    slug: "geopoint-survey",
    category: "survey",
    description: "Professional land surveying services with state-of-the-art equipment and licensed surveyors.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop",
    rating: 4.6,
    reviewCount: 67,
    location: "Ikeja, Lagos",
    phone: "+234 804 567 8901",
    isVerified: true,
    isPremium: false,
    services: ["Boundary Survey", "Topographic Survey", "As-Built Survey", "Survey Plan"],
  },
  {
    id: "5",
    name: "Shield Property Insurance",
    slug: "shield-property-insurance",
    category: "insurance",
    description: "Comprehensive property insurance coverage protecting your real estate investments.",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop",
    rating: 4.5,
    reviewCount: 143,
    location: "Victoria Island, Lagos",
    phone: "+234 805 678 9012",
    isVerified: true,
    isPremium: true,
    services: ["Home Insurance", "Landlord Insurance", "Building Insurance", "Contents Insurance"],
  },
  {
    id: "6",
    name: "Elite Home Renovations",
    slug: "elite-home-renovations",
    category: "renovation",
    description: "Quality renovation and remodeling services transforming properties across Lagos.",
    image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&h=300&fit=crop",
    rating: 4.7,
    reviewCount: 92,
    location: "Ajah, Lagos",
    phone: "+234 806 789 0123",
    isVerified: true,
    isPremium: false,
    services: ["Kitchen Remodel", "Bathroom Renovation", "Full Home Renovation", "Painting"],
  },
  {
    id: "7",
    name: "ProShot Real Estate Photography",
    slug: "proshot-photography",
    category: "photography",
    description: "Professional real estate photography and videography services that make properties shine.",
    image: "https://images.unsplash.com/photo-1554080353-a576cf803bda?w=400&h=300&fit=crop",
    rating: 4.9,
    reviewCount: 78,
    location: "Surulere, Lagos",
    phone: "+234 807 890 1234",
    isVerified: true,
    isPremium: false,
    services: ["Property Photos", "Drone Photography", "Virtual Tours", "Video Walkthroughs"],
  },
  {
    id: "8",
    name: "Prime Property Managers",
    slug: "prime-property-managers",
    category: "property_management",
    description: "Full-service property management for landlords seeking hassle-free rental income.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
    rating: 4.6,
    reviewCount: 112,
    location: "Ikoyi, Lagos",
    phone: "+234 808 901 2345",
    isVerified: true,
    isPremium: true,
    services: ["Tenant Screening", "Rent Collection", "Property Maintenance", "Financial Reporting"],
  },
]

export default function ServiceDirectoryPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("rating")

  const filteredProviders = mockProviders
    .filter(provider => 
      (selectedCategory === "all" || provider.category === selectedCategory) &&
      (searchQuery === "" || 
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating
      if (sortBy === "reviews") return b.reviewCount - a.reviewCount
      return 0
    })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary/5 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              Find Trusted Real Estate Service Providers
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Connect with verified legal, mortgage, architecture, and other real estate professionals across Nigeria
            </p>
            
            {/* Search Bar */}
            <div className="flex gap-2 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for services or providers..."
                  className="pl-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="lg" className="h-12">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="border-b bg-background sticky top-16 z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <category.icon className="h-4 w-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredProviders.length}</span> service providers found
            </p>
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Provider Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <Link key={provider.id} href={`/services/${provider.slug}`}>
                <Card className="group overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="relative h-48">
                    <Image
                      src={provider.image}
                      alt={provider.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {provider.isPremium && (
                      <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                        Premium
                      </Badge>
                    )}
                    <Badge 
                      variant="secondary" 
                      className="absolute top-3 right-3 capitalize"
                    >
                      {provider.category.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {provider.name}
                      </h3>
                      {provider.isVerified && (
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {provider.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="font-medium text-foreground">{provider.rating}</span>
                        <span>({provider.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{provider.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {provider.services.slice(0, 3).map((service) => (
                        <Badge key={service} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {provider.services.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{provider.services.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filteredProviders.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No providers found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or category filters
              </p>
              <Button onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5 border-t">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Are You a Service Provider?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join LandShoppers to connect with thousands of property buyers, sellers, and agents looking for your services.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">List Your Business</Button>
            <Button size="lg" variant="outline">Learn More</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
