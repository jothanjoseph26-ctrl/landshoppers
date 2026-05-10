import Link from "next/link"
import { Building2, MapPin, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const developers = [
  {
    name: "Prime Realty Ltd",
    location: "Lekki, Lagos",
    projects: "3 active projects",
  },
  {
    name: "Victoria Courts Development",
    location: "Victoria Island, Lagos",
    projects: "2 active projects",
  },
  {
    name: "Ikoyi Urban Homes",
    location: "Ikoyi, Lagos",
    projects: "1 active project",
  },
]

export default function DevelopersPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-12 lg:px-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Developers</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Browse verified property developers and their active projects.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <p className="text-sm text-muted-foreground">{developers.length} developers available</p>
          <Button asChild>
            <Link href="/developer">Open developer dashboard</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {developers.map((developer) => (
            <Card key={developer.name}>
              <CardHeader>
                <CardTitle>{developer.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {developer.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{developer.projects}</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/listings">
                    <Search className="mr-2 h-4 w-4" />
                    View inventory
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
