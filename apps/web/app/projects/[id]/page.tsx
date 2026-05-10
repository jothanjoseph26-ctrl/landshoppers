import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ListingMiniMap } from '@/components/listings/listing-mini-map'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchProject } from '@/lib/api/directory'
import { koboToNairaNumber } from '@/lib/listings/map-api-listing'

function formatNaira(price: number): string {
  if (price >= 1000000000) {
    return `₦${(price / 1000000000).toFixed(price % 1000000000 === 0 ? 0 : 1)}B`
  }
  if (price >= 1000000) {
    return `₦${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
  }
  return `₦${price.toLocaleString()}`
}

function formatKobo(k: string | null): string | null {
  if (!k || !/^\d+$/.test(k)) return null
  return formatNaira(koboToNairaNumber(k))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const project = await fetchProject(id).catch(() => null)
  if (!project) {
    return { title: 'Project | LandShoppers' }
  }
  return {
    title: `${project.name} | Projects | LandShoppers`,
    description: project.shortDescription ?? project.description ?? undefined,
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await fetchProject(id)

  if (!project) notFound()

  const lat = project.latitude ?? undefined
  const lng = project.longitude ?? undefined

  const minP = formatKobo(project.priceRangeMin)
  const maxP = formatKobo(project.priceRangeMax)
  let priceBand = '—'
  if (minP && maxP) priceBand = `${minP} – ${maxP}`
  else if (minP) priceBand = `From ${minP}`
  else if (maxP) priceBand = `Up to ${maxP}`

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
            <Button variant="ghost" size="sm" className="-ml-2 mb-4" asChild>
              <Link href={`/developers/${project.developer.id}`} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {project.developer.companyName}
              </Link>
            </Button>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="mt-2 text-muted-foreground">
                  {project.city}, {project.state} · {project.propertyType}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{project.status}</Badge>
                  {project.developer.isVerified && (
                    <Badge variant="secondary">Verified developer</Badge>
                  )}
                </div>
              </div>
              <Card className="w-full max-w-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Indicative range</CardDescription>
                  <CardTitle className="text-xl">{priceBand}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    {project.availableUnits} available · {project.totalUnits} total units
                  </p>
                  {project.completionDate && (
                    <p>Completion: {new Date(project.completionDate).toLocaleDateString()}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-8">
          {project.images[0] && (
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border bg-muted">
              <Image
                src={project.images[0]}
                alt={project.name}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>{project.description ?? project.shortDescription ?? 'Details coming soon.'}</p>
                  {project.amenities.length > 0 && (
                    <div>
                      <p className="mb-2 font-medium text-foreground">Amenities</p>
                      <ul className="flex flex-wrap gap-2">
                        {project.amenities.map((a) => (
                          <Badge key={a} variant="outline">
                            {a}
                          </Badge>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.features.length > 0 && (
                    <div>
                      <p className="mb-2 font-medium text-foreground">Features</p>
                      <ul className="flex flex-wrap gap-2">
                        {project.features.map((f) => (
                          <Badge key={f} variant="secondary">
                            {f}
                          </Badge>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sample units</CardTitle>
                  <CardDescription>
                    Representative inventory rows from the project catalogue.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {project.sampleUnits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sample units yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Unit</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Beds</TableHead>
                          <TableHead>Baths</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {project.sampleUnits.map((u) => {
                          const price =
                            u.price && /^\d+$/.test(u.price)
                              ? formatNaira(koboToNairaNumber(u.price))
                              : '—'
                          return (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium">{u.unitName}</TableCell>
                              <TableCell>{u.unitType}</TableCell>
                              <TableCell>{u.bedrooms ?? '—'}</TableCell>
                              <TableCell>{u.bathrooms ?? '—'}</TableCell>
                              <TableCell>
                                {u.squareMeters != null ? `${u.squareMeters} m²` : '—'}
                              </TableCell>
                              <TableCell>{price}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{u.status}</Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
              <Card>
                <CardHeader>
                  <CardTitle>Developer</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                    <Image
                      src={project.developer.companyLogo}
                      alt={project.developer.companyName}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{project.developer.companyName}</p>
                    <Button asChild variant="link" className="h-auto px-0">
                      <Link href={`/developers/${project.developer.id}`}>View profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {(lat != null && lng != null) || project.address ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                    {project.address && (
                      <CardDescription>{project.address}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {lat != null && lng != null && (
                      <ListingMiniMap
                        latitude={lat}
                        longitude={lng}
                        title={project.name}
                      />
                    )}
                    {(project.virtualTourUrl || project.brochureUrl) && (
                      <div className="flex flex-wrap gap-2">
                        {project.virtualTourUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={project.virtualTourUrl} target="_blank" rel="noreferrer">
                              Virtual tour
                              <ExternalLink className="ml-2 h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        {project.brochureUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={project.brochureUrl} target="_blank" rel="noreferrer">
                              Brochure
                              <ExternalLink className="ml-2 h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Inquiries</CardTitle>
                  <CardDescription>
                    Interested buyers can reach agents through marketplace listings tied to this
                    project once they are linked.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/listings">Explore listings</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
