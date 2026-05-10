import { Building2, ShieldCheck, Users } from "lucide-react"

const values = [
  { title: "Verified supply", description: "Listings, developers, and agents are being wired to review workflows.", icon: ShieldCheck },
  { title: "Marketplace depth", description: "Buyers can browse properties, agents, developers, and services in one place.", icon: Building2 },
  { title: "Local operations", description: "The platform is shaped around Nigerian property buying workflows.", icon: Users },
]

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-12 lg:px-8">
      <div className="mb-10 max-w-3xl">
        <h1 className="text-3xl font-bold md:text-4xl">About LandShoppers</h1>
        <p className="mt-3 text-muted-foreground">
          LandShoppers is a property marketplace for buyers, agents, developers, and service providers.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {values.map((value) => (
          <div key={value.title} className="rounded-lg border p-6">
            <value.icon className="mb-4 h-6 w-6 text-primary" />
            <h2 className="font-semibold">{value.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
