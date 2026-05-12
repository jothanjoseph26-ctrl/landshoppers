"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Building2, 
  Plus, 
  Users, 
  BarChart3, 
  FileText, 
  Settings, 
  CreditCard,
  Upload,
  CheckCircle,
  Bell,
  LogOut,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { logoutAccount } from "@/lib/api/auth"
import { clearAuthSession } from "@/lib/api/auth-session"
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
  { title: "Team", href: "/developer/team", icon: Users },
  { title: "Settings", href: "/developer/settings", icon: Settings },
]

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <BrandLogo />
        <div className="flex-1" />
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
          <AvatarFallback>DV</AvatarFallback>
        </Avatar>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-background border-r transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b px-6">
              <BrandLogo />
            </div>

            {/* Company Badge */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop" />
                  <AvatarFallback>PR</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">Prime Realty Ltd</p>
                  <Badge variant="secondary" className="text-xs">Developer</Badge>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {sidebarNavItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/developer" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
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

        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black/50 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          {/* Desktop header */}
          <header className="hidden lg:flex h-16 items-center gap-4 border-b bg-background px-6">
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Developer Portal</h1>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
                <AvatarFallback>DV</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">David Okonkwo</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </header>

          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
