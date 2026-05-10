"use client"

import Link from "next/link"
import { Home } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 border border-primary-foreground/20 rounded-full" />
          <div className="absolute bottom-40 right-20 w-96 h-96 border border-primary-foreground/20 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 border border-primary-foreground/20 rounded-full" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-8 w-8" />
            <span className="text-2xl font-bold">LandShoppers</span>
          </Link>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-balance">
              Find Your Perfect Property in Nigeria
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              Join thousands of buyers, sellers, and agents on Nigeria&apos;s most trusted real estate marketplace.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold">50K+</p>
                <p className="text-sm text-primary-foreground/70">Properties Listed</p>
              </div>
              <div>
                <p className="text-3xl font-bold">10K+</p>
                <p className="text-sm text-primary-foreground/70">Verified Agents</p>
              </div>
              <div>
                <p className="text-3xl font-bold">25K+</p>
                <p className="text-sm text-primary-foreground/70">Happy Customers</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-primary-foreground/60">
            Trusted by leading real estate developers across Nigeria
          </p>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <Home className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">LandShoppers</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
