"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import useSWR from "swr"
import {
  Home,
  Building2,
  Plus,
  Users,
  UserCog,
  BarChart3,
  Settings,
  CreditCard,
  Upload,
  CheckCircle,
  Bell,
  LogOut,
  Menu,
  X,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { logoutAccount } from "@/lib/api/auth"
import { clearAuthSession, getAccessToken } from "@/lib/api/auth-session"
import { fetchDeveloperDashboard } from "@/lib/api/developer-portal"
import { BrandLogo } from "@/components/layout/brand-logo"

const sidebarNavItems = [
  { title: "Dashboard", href: "/developer", icon: Home },
  { title: "My Projects", href: "/developer/projects", icon: Building2 },
  { title: "Create Project", href: "/developer/projects/new", icon: Plus },
  { title: "Bulk Upload", href: "/developer/bulk-upload", icon: Upload },
  { title: "Lead Management", href: "/developer/leads", icon: Users },
  { title: "Analytics", href: "/developer/analytics", icon: BarChart3 },
  { title: "KYC & Verification", href: "/developer/kyc", icon: CheckCircle },
  { title: "Subscription", href: "/developer/subscription", icon: CreditCard },
  { title: "Team", href: "/developer/team", icon: UserCog },
  { title: "Settings", href: "/developer/settings", icon: Settings },
]

function initialsFrom(text: string): string {
  const t = text.trim()
  if (!t) return "?"
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
}

function accountTitle(displayName: string | null | undefined, email: string | undefined): string {
  if (displayName?.trim()) return displayName.trim()
  if (email) return email.split("@")[0] ?? email
  return "Account"
}

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const token = mounted ? getAccessToken() : null

  const { data: dash, error: dashError, isLoading: dashLoading } = useSWR(
    token ? (["developer-portal-layout", "dashboard"] as const) : null,
    () => fetchDeveloperDashboard().then((r) => r.data),
    { shouldRetryOnError: false },
  )

  const companyLabel = !token
    ? "Developer Portal"
    : dashLoading
      ? "Loading…"
      : dashError
        ? "Developer Portal"
        : (dash?.companyName ?? "Developer Portal")

  const userLine = !token ? null : dashLoading ? null : dashError ? null : dash
  const headerName = userLine ? accountTitle(userLine.displayName, userLine.userEmail) : null
  const headerEmail = userLine?.userEmail ?? null
  const companyInitials = initialsFrom(dash?.companyName ?? companyLabel)
  const userInitials = userLine ? initialsFrom(userLine.displayName || userLine.userEmail) : "?"

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <BrandLogo />
        <div className="flex-1" />
        <Button variant="ghost" size="icon" type="button" aria-label="Notifications (coming soon)">
          <Bell className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback className="text-xs">{token ? userInitials : "?"}</AvatarFallback>
        </Avatar>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform bg-background border-r transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-2 border-b px-6">
              <BrandLogo />
            </div>

            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback>{companyInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm">{companyLabel}</p>
                  <Badge variant="secondary" className="text-xs mt-0.5">
                    Developer
                  </Badge>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {sidebarNavItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/developer" && pathname.startsWith(item.href))
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
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 min-h-screen">
          <header className="hidden lg:flex h-16 items-center gap-4 border-b bg-background px-6">
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Developer Portal</h1>
            </div>
            <Button variant="ghost" size="icon" type="button" aria-label="Notifications (coming soon)">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              {token && dashLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" aria-label="Loading profile" />
              ) : null}
              <Avatar className="h-9 w-9 border border-border shrink-0">
                <AvatarFallback className="text-xs">{token ? userInitials : "?"}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block min-w-0">
                <p className="text-sm font-medium truncate">{headerName ?? (token ? "…" : "Guest")}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {headerEmail ?? (token ? "" : "Sign in to load your organisation")}
                </p>
              </div>
            </div>
          </header>

          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
