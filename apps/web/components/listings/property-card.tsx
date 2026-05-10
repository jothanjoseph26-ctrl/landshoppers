'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bed, Bath, Square, MapPin, Heart, GitCompare, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  readCompareIds,
  readSavedListingIds,
  toggleCompareListing,
  toggleSavedListing,
} from '@/lib/listings/compare-and-save'

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
  id,
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
  const [saved, setSaved] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])

  useEffect(() => {
    setSaved(readSavedListingIds().includes(id))
    setCompareIds(readCompareIds())
  }, [id])

  const inCompare = compareIds.includes(id)

  return (
    <Card
      className={cn(
        'group h-full overflow-hidden border-0 shadow-md transition-shadow hover:shadow-xl',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link href={`/listings/${slug}`} className="block h-full w-full">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
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
        <button
          type="button"
          className={cn(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background',
            saved ? 'text-primary' : 'text-muted-foreground',
          )}
          onClick={(e) => {
            e.stopPropagation()
            const next = !saved
            setSaved(next)
            toggleSavedListing(id, next)
            toast[next ? 'success' : 'message'](
              next ? 'Saved locally for this browser' : 'Removed from saved',
              { description: 'Sign in to sync saves to your account.' },
            )
          }}
        >
          <Heart className={cn('h-5 w-5', saved && 'fill-current')} />
          <span className="sr-only">Save property</span>
        </button>
        <div className="absolute bottom-3 left-3 rounded-lg bg-background/90 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(price)}
          </span>
          {priceLabel && (
            <span className="text-sm text-muted-foreground">{priceLabel}</span>
          )}
        </div>
        <div className="absolute bottom-3 right-3 rounded-lg bg-background/90 px-2 py-1 backdrop-blur-sm">
          <span className="text-xs font-medium capitalize text-muted-foreground">
            {propertyType}
          </span>
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        <Link
          href={`/listings/${slug}`}
          className="line-clamp-1 text-lg font-semibold text-foreground transition-colors hover:text-primary"
        >
          {title}
        </Link>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {(bedrooms || bathrooms || sqm) && (
          <div className="flex items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
            {bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{bedrooms} Beds</span>
              </div>
            )}
            {bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{bathrooms} Baths</span>
              </div>
            )}
            {sqm && (
              <div className="flex items-center gap-1">
                <Square className="h-4 w-4" />
                <span>{sqm} m²</span>
              </div>
            )}
          </div>
        )}

        <div
          className="flex flex-wrap items-center gap-2 border-t pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="secondary" size="sm" className="gap-1" asChild>
            <Link href={`/listings/${slug}#contact`}>
              <MessageCircle className="h-4 w-4" />
              Inquire
            </Link>
          </Button>
          <label className="flex flex-1 min-w-[120px] cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={inCompare}
              onCheckedChange={(v) => {
                const on = v === true
                const next = toggleCompareListing(id, on)
                setCompareIds(next)
                toast.message(on ? 'Added to compare' : 'Removed from compare', {
                  description: `Up to 4 listings · ${next.length} selected`,
                })
              }}
            />
            <GitCompare className="h-3.5 w-3.5" />
            Compare
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
