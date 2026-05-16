import Image from "next/image"
import Link from "next/link"
import { CheckCircle, MapPin, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ApiServiceProviderListItem } from "@/lib/api/services-marketplace"
import { cn } from "@/lib/utils"

type Props = {
  provider: ApiServiceProviderListItem
  className?: string
}

export function ServiceHubProviderCard({ provider, className }: Props) {
  const href = `/services/${provider.category}/${provider.slug}`
  const cover =
    provider.coverImageUrl ||
    provider.galleryImages?.[0] ||
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop"

  return (
    <Link href={href} className={cn("block h-full", className)}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative h-48">
          <Image
            src={cover}
            alt={provider.businessName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {provider.isPremium && (
            <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">Premium</Badge>
          )}
          <Badge variant="secondary" className="absolute right-3 top-3 capitalize">
            {provider.category.replace(/_/g, " ")}
          </Badge>
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold transition-colors group-hover:text-primary">
              {provider.businessName}
            </h3>
            {provider.isVerified && (
              <CheckCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            )}
          </div>

          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {provider.description ?? "Verified real estate services professional."}
          </p>

          <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-medium text-foreground">{provider.rating}</span>
              <span>({provider.reviewCount})</span>
            </div>
            <div className="flex min-w-0 items-center gap-1">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {provider.city}, {provider.state}
              </span>
            </div>
          </div>

          {provider.services && provider.services.length > 0 && (
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
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
