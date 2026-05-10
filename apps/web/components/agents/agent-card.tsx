import Link from 'next/link'
import { Star, MapPin, Home, CheckCircle2, MessageSquare, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface AgentCardProps {
  id: string
  slug: string
  name: string
  company?: string
  image?: string
  phone: string
  whatsapp?: string
  city: string
  specializations: string[]
  isVerified: boolean
  rating: number
  reviewCount: number
  totalListings: number
  totalSales: number
  yearsOfExperience?: number
}

export function AgentCard({
  slug,
  name,
  company,
  image,
  phone,
  whatsapp,
  city,
  specializations,
  isVerified,
  rating,
  reviewCount,
  totalListings,
  totalSales,
  yearsOfExperience,
}: AgentCardProps) {
  const whatsappMessage = encodeURIComponent(
    `Hi ${name}, I found you on LandShoppers and would like to discuss property options.`
  )
  const whatsappLink = `https://wa.me/${whatsapp || phone.replace(/\D/g, '')}?text=${whatsappMessage}`

  return (
    <Card className="group overflow-hidden border shadow-md transition-shadow hover:shadow-xl">
      <CardContent className="p-6">
        {/* Agent Info */}
        <div className="flex items-start gap-4">
          <Link href={`/agents/${slug}`}>
            <Avatar className="h-16 w-16 border-2 border-background shadow-md">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/agents/${slug}`}
                className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {name}
              </Link>
              {isVerified && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              )}
            </div>
            {company && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {company}
              </p>
            )}
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{city}</span>
            </div>
          </div>
        </div>

        {/* Rating & Stats */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-secondary text-secondary" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({reviewCount} reviews)
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-3">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{totalListings}</p>
            <p className="text-xs text-muted-foreground">Listings</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-lg font-bold text-foreground">{totalSales}</p>
            <p className="text-xs text-muted-foreground">Sold</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {yearsOfExperience || '5+'}
            </p>
            <p className="text-xs text-muted-foreground">Years</p>
          </div>
        </div>

        {/* Specializations */}
        {specializations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {specializations.slice(0, 3).map((spec) => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
            {specializations.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{specializations.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={`tel:${phone}`}>
              <Phone className="h-4 w-4" />
              Call
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
        </div>

        {/* View Profile */}
        <Button className="mt-3 w-full" asChild>
          <Link href={`/agents/${slug}`}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
