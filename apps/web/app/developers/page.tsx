import Link from 'next/link'
import Image from 'next/image'
import { Building2, MapPin } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { fetchDevelopersCatalog } from '@/lib/api/directory'

export default async function DevelopersPage() {
  const { data: developers } = await fetchDevelopersCatalog({ pageSize: 48 })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="border-b bg-muted/30">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-12 lg:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Developers</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Browse verified property developers and jump into projects.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <p className="text-sm text-muted-foreground">
              {developers.length === 0
                ? 'No developers in the catalogue yet.'
                : `${developers.length} developer${developers.length === 1 ? '' : 's'} listed`}
            </p>
            <Button asChild variant="outline">
              <Link href="/developer">Developer dashboard</Link>
            </Button>
          </div>

          {developers.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Catalogue is empty</CardTitle>
                <CardDescription>
                  Once verified developers are published in the API, they will appear here.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/listings">Browse listings</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {developers.map((d) => {
                const location = [d.companyCity, d.companyState].filter(Boolean).join(', ')
                return (
                  <Card key={d.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                          <Image
                            src={d.companyLogo}
                            alt={d.companyName}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-lg leading-tight">{d.companyName}</CardTitle>
                            {d.isVerified && (
                              <Badge variant="secondary" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          {location ? (
                            <CardDescription className="mt-1 flex items-center gap-2">
                              <MapPin className="h-4 w-4 shrink-0" />
                              {location}
                            </CardDescription>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>{d.description ?? 'New developments and inventory on LandShoppers.'}</p>
                      <div className="flex flex-wrap gap-3 pt-1 text-xs uppercase tracking-wide text-muted-foreground/90">
                        <span>{d.totalProjects} projects</span>
                        <span>{d.totalUnitsSold} units sold</span>
                        <span>
                          ★ {d.rating.toFixed(1)} ({d.reviewCount})
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link href={`/developers/${d.id}`}>View developer</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/listings">Listings</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
