import { AlertTriangle } from "lucide-react"

export function PortalPendingApiBanner({
  title = "Showing sample data",
  description = "This page renders mock data while the API contract for this surface is finalized.",
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs">{description}</p>
      </div>
    </div>
  )
}
