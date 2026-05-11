import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

type SimpleInfoPageProps = {
  title: string
  description: string
  ctaHref?: string
  ctaLabel?: string
}

export function SimpleInfoPage({
  title,
  description,
  ctaHref = "/contact",
  ctaLabel = "Contact us",
}: SimpleInfoPageProps) {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-16 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
        <p className="mt-4 text-muted-foreground">{description}</p>
        <Button asChild className="mt-8">
          <Link href={ctaHref} className="gap-2">
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </main>
  )
}
