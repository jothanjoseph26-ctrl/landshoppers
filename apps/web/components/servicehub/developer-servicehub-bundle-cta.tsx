import Link from "next/link"
import { Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  projectId?: string
  city?: string
  state?: string
}

export function buildDeveloperBundleHref({ projectId, city, state }: Props): string {
  const params = new URLSearchParams()
  params.set("highlight", "developer-project")
  if (projectId?.trim()) params.set("projectId", projectId.trim())
  if (city?.trim()) params.set("city", city.trim())
  if (state?.trim()) params.set("state", state.trim())
  const qs = params.toString()
  return qs ? `/services/bundles?${qs}` : "/services/bundles"
}

export function DeveloperServiceHubBundleCta({ projectId, city, state }: Props) {
  const href = buildDeveloperBundleHref({ projectId, city, state })
  const hasLocation = Boolean(city?.trim() && state?.trim())

  return (
    <Card className="border-dashed bg-muted/20">
      <CardHeader className="flex flex-row items-start gap-3 pb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Layers className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <div>
          <CardTitle className="text-base">Project service package</CardTitle>
          <CardDescription>
            Activate a ServiceHub bundle for legal, survey, media, and construction — scoped to this
            development.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={href}>Request project bundle</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/services/bundles/build">Custom categories</Link>
        </Button>
        {!hasLocation && !projectId ? (
          <p className="w-full text-xs text-muted-foreground">
            Add city and state (or save the project) to pre-fill location on the bundle form.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
