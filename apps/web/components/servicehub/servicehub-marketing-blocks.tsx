import Link from "next/link"
import { ClipboardList, ShieldCheck, ListChecks } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const steps = [
  {
    title: "Describe your need",
    body: "Tell us what service you need and where the property is.",
    icon: ClipboardList,
  },
  {
    title: "Get matched",
    body: "We surface verified professionals ranked for your location and job type.",
    icon: ShieldCheck,
  },
  {
    title: "Hire & track",
    body: "Request quotes, compare responses, and complete the job with confidence.",
    icon: ListChecks,
  },
]

export function ServiceHubHowItWorks() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {steps.map((s) => (
        <Card key={s.title} className="border bg-card/50">
          <CardContent className="space-y-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <s.icon className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <h3 className="font-semibold">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ServiceHubJoinCta() {
  return (
    <div className="rounded-xl border bg-primary/5 p-8 text-center">
      <h2 className="text-2xl font-bold md:text-3xl">Are you a service provider?</h2>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
        Join LandShoppers ServiceHub to get matched with buyers, agents, and developers who already
        intend to transact.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/services/join"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          List your business
        </Link>
        <Link
          href="/services/legal"
          className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-muted"
        >
          Browse directory
        </Link>
      </div>
    </div>
  )
}
