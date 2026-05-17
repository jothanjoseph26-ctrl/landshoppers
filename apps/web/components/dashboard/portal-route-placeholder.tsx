import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  title: string
  description: string
  specId?: string
  parentHref?: string
  parentLabel?: string
  children?: React.ReactNode
}

/** Standard shell for routes that exist per gap closure but depend on a future integration slice. */
export function PortalRoutePlaceholder({
  title,
  description,
  specId,
  parentHref,
  parentLabel = "Back",
  children,
}: Props) {
  return (
    <div className="space-y-6">
      {parentHref ? (
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={parentHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {parentLabel}
          </Link>
        </Button>
      ) : null}
      <div>
        {specId ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{specId}</p>
        ) : null}
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>Route is live; production integration may still be stubbed.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{children ?? description}</CardContent>
      </Card>
    </div>
  )
}
