import Link from 'next/link'
import { Bed, Bath, Square, MapPin, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface PropertyCardProps {
  id: string
  title: string
  slug: string
  price: number
  location: string
  city: string
  bedrooms?: number
  bathrooms?: number
  sqm?: number
  image: string
  images?: string[]
  type: 'sale' | 'rent'
  propertyType: string
  isNew?: boolean
  isFeatured?: boolean
  isVerified?: boolean
  priceLabel?: string
  className?: string
}

function formatPrice(price: number): string {
  if (price >= 1000000000) {
    return `₦${(price / 1000000000).toFixed(price % 1000000000 === 0 ? 0 : 1)}B`
  }
  if (price >= 1000000) {
    return `₦${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
  }
  return `₦${price.toLocaleString()}`
}

export function PropertyCard({
  title,
  slug,
  price,
  location,
  bedrooms,
  bathrooms,
  sqm,
  image,
  type,
  propertyType,
  isNew,
  isFeatured,
  isVerified,
  priceLabel,
  className,
}: PropertyCardProps) {
  return (
    <Card
      className={cn(
        'group overflow-hidden border-0 shadow-md transition-shadow hover:shadow-xl',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant={type === 'sale' ? 'default' : 'secondary'}>
            {type === 'sale' ? 'For Sale' : 'For Rent'}
          </Badge>
          {isNew && (
            <Badge className="bg-secondary text-secondary-foreground">New</Badge>
          )}
          {isFeatured && (
            <Badge className="bg-primary text-primary-foreground">Featured</Badge>
          )}
          {isVerified && (
            <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
              Verified
            </Badge>
          )}
        </div>
        {/* Favorite Button */}
        <button className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-primary">
          <Heart className="h-5 w-5" />
          <span className="sr-only">Save property</span>
        </button>
        {/* Price */}
        <div className="absolute bottom-3 left-3 rounded-lg bg-background/90 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(price)}
          </span>
          {priceLabel && (
            <span className="text-sm text-muted-foreground">{priceLabel}</span>
          )}
        </div>
        {/* Property Type */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-background/90 px-2 py-1 backdrop-blur-sm">
          <span className="text-xs font-medium capitalize text-muted-foreground">
            {propertyType}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <Link
          href={`/listings/${slug}`}
          className="line-clamp-1 text-lg font-semibold text-foreground transition-colors hover:text-primary"
        >
          {title}
        </Link>

        {/* Location */}
        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {/* Features */}
        {(bedrooms || bathrooms || sqm) && (
          <div className="mt-4 flex items-center gap-4 border-t pt-4">
            {bedrooms && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Bed className="h-4 w-4" />
                <span>{bedrooms} Beds</span>
              </div>
            )}
            {bathrooms && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Bath className="h-4 w-4" />
                <span>{bathrooms} Baths</span>
              </div>
            )}
            {sqm && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Square className="h-4 w-4" />
                <span>{sqm} m²</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
