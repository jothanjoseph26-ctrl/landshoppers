import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const testimonials = [
  {
    id: 1,
    name: 'Adaeze Okonkwo',
    role: 'Home Buyer',
    location: 'Lagos',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80',
    rating: 5,
    content:
      'LandShoppers made finding our family home so easy! The verified agents were professional, and we found our dream 4-bedroom in Lekki within two weeks. Highly recommend!',
  },
  {
    id: 2,
    name: 'Emeka Nwosu',
    role: 'Property Investor',
    location: 'UK (Diaspora)',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    rating: 5,
    content:
      'As a Nigerian in the diaspora, I was worried about buying property remotely. LandShoppers connected me with a verified agent who handled everything. I now own two properties in Abuja!',
  },
  {
    id: 3,
    name: 'Chidinma Eze',
    role: 'First-time Buyer',
    location: 'Port Harcourt',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    rating: 5,
    content:
      'The mortgage calculator helped me understand exactly what I could afford. The whole process was transparent, and my agent kept me informed every step of the way.',
  },
  {
    id: 4,
    name: 'Olumide Adeyemi',
    role: 'Real Estate Agent',
    location: 'Lagos',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    rating: 5,
    content:
      'Joining LandShoppers as an agent transformed my business. The platform brings quality leads directly to me, and the KYC verification gives my clients confidence.',
  },
]

export function Testimonials() {
  return (
    <section className="bg-muted/50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Trusted by Thousands
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See what our clients and agents have to say about LandShoppers
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="relative border-0 bg-background shadow-md"
            >
              <CardContent className="p-6">
                {/* Quote Icon */}
                <Quote className="h-8 w-8 text-primary/20" />

                {/* Rating */}
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-secondary text-secondary"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={testimonial.image}
                      alt={testimonial.name}
                    />
                    <AvatarFallback>
                      {testimonial.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role} · {testimonial.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
