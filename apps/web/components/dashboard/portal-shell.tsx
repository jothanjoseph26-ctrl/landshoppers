"use client"

import Link from "next/link"

import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { Bell, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"

import { BrandLogo } from "@/components/layout/brand-logo"
import { logoutAccount } from "@/lib/api/auth"
import { clearAuthSession } from "@/lib/api/auth-session"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/** Portal billing tier shared by Agent OS and Provider OS shells. */
export type PortalTier = "free" | "pro" | "elite"

export type PortalNavItem = {
  title: string
  href: string
  icon: LucideIcon
}

function tierLabel(tier: PortalTier): string {
  switch (tier) {
    case "free":
      return "Free"
    case "pro":
      return "Pro"
    case "elite":
      return "Elite"
    default: {
      const _x: never = tier
      return _x
    }
  }
}

export function PortalShell({
  children,
  navItems,
  portalTitle,
  persona,
  initials,
  personaSubline,
  avatarUrl,
  tier,
  subscriptionHref = "/agent/subscription",
}: {
  children: React.ReactNode
  navItems: PortalNavItem[]
  portalTitle: string
  persona: string
  initials: string
  /** Second line under the primary name (e.g. display name · city). */
  personaSubline?: string | null
  avatarUrl?: string | null
  tier?: PortalTier | null
  /** Destination for the tier badge link (agent subscription by default). */
  subscriptionHref?: string
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="lg:hidden sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <BrandLogo />
        <div className="flex-1" />
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8 border border-border">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </header>

      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-2 border-b px-6">
              <BrandLogo />
            </div>

            <div className="border-b p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{persona}</p>
                  {personaSubline ? (
                    <p className="truncate text-xs text-muted-foreground">{personaSubline}</p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {portalTitle}
                    </Badge>
                    {tier != null ? (
                      <Link href={subscriptionHref} className="inline-flex">
                        <Badge
                          variant={tier === "free" ? "outline" : tier === "pro" ? "secondary" : "default"}
                          className={
                            tier === "elite"
                              ? "border-amber-500/40 bg-amber-500/15 text-amber-950 hover:bg-amber-500/25 dark:text-amber-50"
                              : "cursor-pointer"
                          }
                        >
                          {tierLabel(tier)}
                        </Badge>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== navItems[0]?.href && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t p-4">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={async () => {
                  await logoutAccount()
                  clearAuthSession()
                  window.location.href = "/login"
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="min-h-screen flex-1">
          <header className="hidden h-16 items-center gap-4 border-b bg-background px-6 lg:flex">
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{portalTitle}</h1>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar>
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{persona}</p>
                <p className="text-xs text-muted-foreground">{personaSubline?.trim() || "Account"}</p>
              </div>
            </div>
          </header>

          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
