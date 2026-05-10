"use client"

import Link from "next/link"
import { AlertCircle, Inbox, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PortalLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  )
}

export function PortalError({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertCircle className="h-6 w-6 text-destructive" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function PortalEmpty({
  title,
  description,
  primaryHref,
  primaryLabel,
}: {
  title: string
  description: string
  primaryHref?: string
  primaryLabel?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {primaryHref && primaryLabel && (
        <Button asChild size="sm">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
      )}
    </div>
  )
}

export function PortalAuthRequired({ portalHref = "/login" }: { portalHref?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-background p-10 text-center">
      <p className="font-medium">Sign in to continue</p>
      <p className="max-w-md text-sm text-muted-foreground">
        This portal page reads from the authenticated API. Sign in to load your data.
      </p>
      <Button asChild size="sm">
        <Link href={portalHref}>Sign in</Link>
      </Button>
    </div>
  )
}
