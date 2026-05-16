import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ProviderRoadmapStub({
  title,
  specId,
  summary,
}: {
  title: string
  specId: string
  summary?: string
}) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          <span className="font-medium text-foreground">{specId}</span>
          {summary ? ` — ${summary}` : " — Ships in the next ServiceHub sprint once APIs and workers land."}
        </p>
      </div>
      <Card className="border-dashed shadow-none bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Roadmap placeholder</CardTitle>
          <CardDescription>
            Provider OS mirrors Agent/Developer portal patterns; this route is wired in the shell so Stream 3 stays
            merge-safe while Streams 1 and 4 deliver data.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
