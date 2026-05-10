'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Home, Building2, LandPlot, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const propertyTypes = [
  { value: 'all', label: 'All Types', icon: Home },
  { value: 'apartment', label: 'Apartment', icon: Building2 },
  { value: 'house', label: 'House', icon: Home },
  { value: 'land', label: 'Land', icon: LandPlot },
  { value: 'commercial', label: 'Commercial', icon: Building2 },
]

const popularCities = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Ibadan',
  'Kano',
  'Enugu',
]

export function HeroSection() {
  const router = useRouter()
  const [searchType, setSearchType] = useState<'buy' | 'rent'>('buy')
  const [location, setLocation] = useState('')
  const [propertyType, setPropertyType] = useState('all')

  const handleSearch = () => {
    const params = new URLSearchParams()
    params.set('type', searchType === 'buy' ? 'sale' : 'rent')
    if (location) params.set('location', location)
    if (propertyType !== 'all') params.set('propertyType', propertyType)
    router.push(`/listings?${params.toString()}`)
  }

  const selectedType = propertyTypes.find((t) => t.value === propertyType)

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDQ1LDEwNiw3OSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Over 10,000 verified properties
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Find Your Dream Property in{' '}
            <span className="text-primary">Nigeria</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty">
            Discover thousands of verified listings from trusted agents and developers.
            Whether you&apos;re buying, renting, or investing, we&apos;ve got you covered.
          </p>

          {/* Search Box */}
          <div className="mt-10">
            <div className="mx-auto max-w-2xl">
              {/* Tabs */}
              <div className="mb-4 inline-flex rounded-lg bg-muted p-1">
                <button
                  onClick={() => setSearchType('buy')}
                  className={cn(
                    'rounded-md px-6 py-2 text-sm font-medium transition-all',
                    searchType === 'buy'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Buy
                </button>
                <button
                  onClick={() => setSearchType('rent')}
                  className={cn(
                    'rounded-md px-6 py-2 text-sm font-medium transition-all',
                    searchType === 'rent'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Rent
                </button>
              </div>

              {/* Search Form */}
              <div className="flex flex-col gap-3 rounded-xl bg-background p-4 shadow-lg ring-1 ring-border sm:flex-row sm:items-center">
                {/* Location Input */}
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter city, area, or address"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-12 border-0 bg-muted/50 pl-10 text-base shadow-none focus-visible:ring-0"
                  />
                </div>

                {/* Property Type Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 min-w-[160px] justify-between border-0 bg-muted/50 shadow-none"
                    >
                      <span className="flex items-center gap-2">
                        {selectedType && <selectedType.icon className="h-4 w-4" />}
                        {selectedType?.label || 'Property Type'}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    {propertyTypes.map((type) => (
                      <DropdownMenuItem
                        key={type.value}
                        onClick={() => setPropertyType(type.value)}
                        className="flex items-center gap-2"
                      >
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Search Button */}
                <Button onClick={handleSearch} size="lg" className="h-12 px-8">
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </Button>
              </div>

              {/* Popular Cities */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Popular:</span>
                {popularCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setLocation(city)}
                    className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: '10K+', label: 'Properties' },
              { value: '2.5K+', label: 'Verified Agents' },
              { value: '500+', label: 'Developers' },
              { value: '50K+', label: 'Happy Clients' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
