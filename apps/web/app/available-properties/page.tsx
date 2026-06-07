import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { salesWhatsAppHref } from "@/lib/site-contact"

export const metadata: Metadata = {
  title: "Available Properties",
  description:
    "Ready-to-sell LandShoppers properties for qualified buyer enquiries.",
}

function enquiryHref(propertyTitle?: string) {
  const text = propertyTitle
    ? `Hello LandShoppers, I am interested in ${propertyTitle}. Please send details and inspection options.`
    : "Hello LandShoppers, I want to see available properties and speak with sales."

  return salesWhatsAppHref(text)
}

const properties = [
  {
    title: "500 sqm Residential Plot",
    location: "Ibeju-Lekki, Lagos",
    price: "NGN 45M",
    type: "Land",
    market: "Entry investment",
    image: "/hero.jpg",
    imagePosition: "object-[65%_50%]",
    highlights: ["Corner plot", "Drainage channel", "Growth corridor"],
    slug: "demo-plot-ibeju",
  },
  {
    title: "4 Bed Penthouse",
    location: "Ikoyi, Lagos",
    price: "NGN 950M",
    type: "Apartment",
    market: "Premium buyer",
    image: "/hero.jpg",
    imagePosition: "object-[75%_50%]",
    highlights: ["Marina views", "Duplex layout", "Luxury finishes"],
    slug: "seed-ikoyi-penthouse",
  },
  {
    title: "3 Bedroom Flat",
    location: "Lekki Phase 1, Lagos",
    price: "NGN 850M",
    type: "Apartment",
    market: "Move-in buyer",
    image: "/hero.jpg",
    imagePosition: "object-[70%_45%]",
    highlights: ["Serviced block", "Pool", "Generator"],
    slug: "seed-lekki-phase1-flat",
  },
  {
    title: "Commercial Loft",
    location: "Victoria Island, Lagos",
    price: "NGN 3.2B",
    type: "Commercial",
    market: "Business investor",
    image: "/hero.jpg",
    imagePosition: "object-[80%_55%]",
    highlights: ["Open plan", "Raised flooring", "Prime address"],
    slug: "seed-vi-office-loft",
  },
  {
    title: "5 Bedroom Detached House",
    location: "Mabushi, Abuja",
    price: "NGN 2.8B",
    type: "House",
    market: "Family home",
    image: "/hero.jpg",
    imagePosition: "object-[62%_45%]",
    highlights: ["BQ", "Solar inverter", "Detached layout"],
    slug: "seed-abuja-mabushi-house",
  },
  {
    title: "Semi-Detached Duplex",
    location: "Ajah, Lagos",
    price: "NGN 720M",
    type: "House",
    market: "Estate buyer",
    image: "/hero.jpg",
    imagePosition: "object-[72%_60%]",
    highlights: ["Estate road", "Uniform security", "Family layout"],
    slug: "seed-ajah-duplex",
  },
  {
    title: "Terrace House",
    location: "Yaba, Lagos",
    price: "NGN 480M",
    type: "House",
    market: "Rental yield",
    image: "/hero.jpg",
    imagePosition: "object-[68%_58%]",
    highlights: ["Near tech hub", "Compact plot", "Urban demand"],
    slug: "seed-yaba-terrace",
  },
  {
    title: "2 Bedroom Block of Flats",
    location: "Gbagada, Lagos",
    price: "NGN 380M",
    type: "Apartment",
    market: "Local buyer",
    image: "/hero.jpg",
    imagePosition: "object-[78%_48%]",
    highlights: ["Elevator building", "Low service charge", "Central Lagos"],
    slug: "seed-gbagada-block",
  },
]

export default function AvailablePropertiesPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-zinc-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <Building2 className="h-5 w-5 text-emerald-400" />
            LandShoppers
          </Link>
          <Button asChild variant="secondary" size="sm">
            <a href={enquiryHref()} target="_blank" rel="noreferrer">
              <Phone className="h-4 w-4" />
              Talk to sales
            </a>
          </Button>
        </div>
      </section>

      <section className="bg-zinc-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-14 lg:px-8">
          <div className="flex flex-col justify-center">
            <Badge className="mb-4 w-fit bg-emerald-500 text-white hover:bg-emerald-500">
              Ready-to-sell inventory
            </Badge>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              Available Nigerian properties for qualified buyers
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
              A focused sales catalogue for the first lead-generation sprint.
              Pick a property, request details, and the sales team will confirm
              availability, payment terms, and inspection options.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600">
                <a href="#properties">
                  View properties
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
                <a href={enquiryHref()} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp enquiry
                </a>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <img
              src="/hero.jpg"
              alt="Modern waterfront apartment building"
              className="h-full min-h-[320px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            "Local campaign-ready inventory",
            "Sales handoff through WhatsApp or Privyr",
            "Property details can be replaced with final live assets",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="properties" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Initial available properties</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Use this link for campaign testing while final photos, prices, and
              Privyr form fields are confirmed.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {properties.length} listings
          </Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {properties.map((property) => (
            <Card key={property.slug} className="overflow-hidden rounded-lg">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={property.image}
                  alt={property.title}
                  className={`h-full w-full object-cover ${property.imagePosition}`}
                />
              </div>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold leading-tight">{property.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {property.location}
                    </p>
                  </div>
                  <Badge variant="secondary">{property.type}</Badge>
                </div>

                <div>
                  <p className="text-2xl font-bold">{property.price}</p>
                  <p className="text-sm text-muted-foreground">{property.market}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {property.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <a href={enquiryHref(property.title)} target="_blank" rel="noreferrer">
                      Enquire
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/listings/${property.slug}`}>Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-zinc-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 className="text-xl font-semibold">Need the full list or inspection schedule?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send an enquiry and the sales team will share current availability.
            </p>
          </div>
          <Button asChild size="lg">
            <a href={enquiryHref()} target="_blank" rel="noreferrer">
              Start enquiry on WhatsApp
              <MessageCircle className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </main>
  )
}
