'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  Menu,
  X,
  ChevronDown,
  Home,
  Building2,
  Users,
  Briefcase,
  FileText,
  Phone,
  Map,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Buy', href: '/listings?type=sale', icon: Home },
  { name: 'Rent', href: '/listings?type=rent', icon: Building2 },
  { name: 'Map', href: '/map-search', icon: Map },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Developers', href: '/developers', icon: Briefcase },
  { name: 'Services', href: '/services', icon: Briefcase },
]

const moreLinks = [
  { name: 'Blog', href: '/blog', icon: FileText },
  { name: 'About Us', href: '/about', icon: Users },
  { name: 'Contact', href: '/contact', icon: Phone },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#1A1A1A]">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <Image
              src="/landshoppers-logo.png"
              alt="LandShoppers"
              width={180}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              {item.name}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-white/80 transition-colors hover:text-white outline-none">
              More
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {moreLinks.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-3">
          <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button className="bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'lg:hidden',
          mobileMenuOpen ? 'fixed inset-0 z-50' : 'hidden'
        )}
      >
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-[#1A1A1A] px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <Image
                src="/landshoppers-logo.png"
                alt="LandShoppers"
                width={180}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-white/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-white hover:bg-white/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 text-white/70" />
                    {item.name}
                  </Link>
                ))}
                {moreLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-white hover:bg-white/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 text-white/70" />
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6 space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button className="w-full bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
