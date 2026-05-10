import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Building2, MapPin } from 'lucide-react'
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
import { fetchDeveloper } from '@/lib/api/directory'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const developer = await fetchDeveloper(id).catch(() => null)
  if (!developer) {
    return { title: 'Developer | LandShoppers' }
  }
  return {
    title: `${developer.companyName} | Developers | LandShoppers`,
    description: developer.description ?? undefined,
  }
}

export default async function DeveloperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const developer = await fetchDeveloper(id)

  if (!developer) notFound()

  const hq = [developer.companyCity, developer.companyState].filter(Boolean).join(', ')

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
            <Button variant="ghost" size="sm" className="-ml-2 mb-4" asChild>
              <Link href="/developers" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                All developers
              </Link>
            </Button>

            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-muted md:h-28 md:w-28">
                <Image
                  src={developer.companyLogo}
                  alt={developer.companyName}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">{developer.companyName}</h1>
                  {developer.isVerified && (
                    <Badge variant="secondary">Verified</Badge>
                  )}
                </div>
                {hq ? (
                  <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {hq}
                  </p>
                ) : null}
                <p className="mt-4 max-w-3xl text-muted-foreground">
                  {developer.description ??
                    'Project details, brochures, and inventory are published as they are connected to this profile.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>{developer.totalProjects} projects</span>
                  <span>{developer.totalUnitsSold} units sold</span>
                  <span>
                    ★ {developer.rating.toFixed(1)} ({developer.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="mb-6 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Projects</h2>
          </div>

          {developer.projects.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No linked projects yet</CardTitle>
                <CardDescription>
                  This developer profile has no active projects exposed in the directory.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="outline">
                  <Link href="/listings">Browse listings</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {developer.projects.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="relative aspect-[16/10] w-full border-b bg-muted">
                    <Image
                      src={p.thumbnail}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <CardDescription>
                      {p.city}, {p.state} · {p.propertyType}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">{p.status}</Badge>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/projects/${p.id}`}>View project</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
