'use client'

import { useState } from 'react'
import {
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface FilterState {
  location: string
  type: 'sale' | 'rent' | 'all'
  propertyType: string
  minPrice: string
  maxPrice: string
  bedrooms: string
  /** Minimum baths (UI filter; API uses minBaths when wired). */
  bathrooms: string
  amenities: string[]
  sortBy: string
}

interface ListingFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  totalResults: number
}

const propertyTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
]

const priceRanges = {
  sale: [
    { value: '', label: 'Any' },
    { value: '10000000', label: '₦10M' },
    { value: '25000000', label: '₦25M' },
    { value: '50000000', label: '₦50M' },
    { value: '100000000', label: '₦100M' },
    { value: '250000000', label: '₦250M' },
    { value: '500000000', label: '₦500M' },
    { value: '1000000000', label: '₦1B' },
  ],
  rent: [
    { value: '', label: 'Any' },
    { value: '500000', label: '₦500K' },
    { value: '1000000', label: '₦1M' },
    { value: '2000000', label: '₦2M' },
    { value: '5000000', label: '₦5M' },
    { value: '10000000', label: '₦10M' },
    { value: '20000000', label: '₦20M' },
  ],
}

const bedroomOptions = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
]

const bathroomOptions = bedroomOptions

const amenityOptions = [
  { value: 'pool', label: 'Swimming Pool' },
  { value: 'gym', label: 'Gym' },
  { value: 'generator', label: 'Generator' },
  { value: 'security', label: '24/7 Security' },
  { value: 'borehole', label: 'Borehole' },
  { value: 'solar', label: 'Solar Power' },
  { value: 'parking', label: 'Parking' },
  { value: 'elevator', label: 'Elevator' },
]

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
]

export function ListingFilters({
  filters,
  onFiltersChange,
  totalResults,
}: ListingFiltersProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity]
    updateFilter('amenities', newAmenities)
  }

  const clearFilters = () => {
    onFiltersChange({
      location: '',
      type: 'all',
      propertyType: 'all',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      amenities: [],
      sortBy: 'newest',
    })
  }

  const activeFilterCount =
    (filters.location ? 1 : 0) +
    (filters.type !== 'all' ? 1 : 0) +
    (filters.propertyType !== 'all' ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.bedrooms ? 1 : 0) +
    (filters.bathrooms ? 1 : 0) +
    filters.amenities.length

  const currentPriceRanges =
    filters.type === 'rent' ? priceRanges.rent : priceRanges.sale

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 lg:max-w-md">
          <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by location..."
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="h-11 pl-10"
          />
        </div>

        {/* Quick Filters - Desktop */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* Type Toggle */}
          <div className="inline-flex rounded-lg bg-muted p-1">
            {(['all', 'sale', 'rent'] as const).map((type) => (
              <button
                key={type}
                onClick={() => updateFilter('type', type)}
                className={cn(
                  'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
                  filters.type === type
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {type === 'all' ? 'All' : type === 'sale' ? 'Buy' : 'Rent'}
              </button>
            ))}
          </div>

          {/* Property Type */}
          <Select
            value={filters.propertyType}
            onValueChange={(value) => updateFilter('propertyType', value)}
          >
            <SelectTrigger className="h-10 w-[140px]">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Price Range */}
          <Select
            value={filters.minPrice}
            onValueChange={(value) => updateFilter('minPrice', value)}
          >
            <SelectTrigger className="h-10 w-[120px]">
              <SelectValue placeholder="Min Price" />
            </SelectTrigger>
            <SelectContent>
              {currentPriceRanges.map((price) => (
                <SelectItem key={price.value} value={price.value || 'any'}>
                  {price.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground">-</span>

          <Select
            value={filters.maxPrice}
            onValueChange={(value) => updateFilter('maxPrice', value)}
          >
            <SelectTrigger className="h-10 w-[120px]">
              <SelectValue placeholder="Max Price" />
            </SelectTrigger>
            <SelectContent>
              {currentPriceRanges.map((price) => (
                <SelectItem key={price.value} value={price.value || 'any'}>
                  {price.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bedrooms */}
          <Select
            value={filters.bedrooms}
            onValueChange={(value) => updateFilter('bedrooms', value)}
          >
            <SelectTrigger className="h-10 w-[100px]">
              <SelectValue placeholder="Beds" />
            </SelectTrigger>
            <SelectContent>
              {bedroomOptions.map((option) => (
                <SelectItem key={option.value} value={option.value || 'any'}>
                  {option.label} Beds
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.bathrooms}
            onValueChange={(value) => updateFilter('bathrooms', value)}
          >
            <SelectTrigger className="h-10 w-[100px]">
              <SelectValue placeholder="Baths" />
            </SelectTrigger>
            <SelectContent>
              {bathroomOptions.map((option) => (
                <SelectItem key={option.value} value={option.value || 'any-bath'}>
                  {option.label} Baths
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* More Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                More
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine your property search
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Amenities */}
                <div>
                  <Label className="text-base font-medium">Amenities</Label>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {amenityOptions.map((amenity) => (
                      <label
                        key={amenity.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={filters.amenities.includes(amenity.value)}
                          onCheckedChange={() => toggleAmenity(amenity.value)}
                        />
                        <span className="text-sm">{amenity.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <SheetFooter className="mt-8">
                <SheetClose asChild>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button>Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Filter Button */}
        <div className="flex items-center gap-3 lg:hidden">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Results Count & Sort */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{totalResults}</span>{' '}
          properties found
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.location && (
            <Badge variant="secondary" className="gap-1">
              {filters.location}
              <button onClick={() => updateFilter('location', '')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filters.type === 'sale' ? 'For Sale' : 'For Rent'}
              <button onClick={() => updateFilter('type', 'all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.propertyType !== 'all' && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {filters.propertyType}
              <button onClick={() => updateFilter('propertyType', 'all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.bathrooms && (
            <Badge variant="secondary" className="gap-1">
              {filters.bathrooms}+ baths
              <button type="button" onClick={() => updateFilter('bathrooms', '')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.amenities.map((amenity) => (
            <Badge key={amenity} variant="secondary" className="gap-1 capitalize">
              {amenity}
              <button onClick={() => toggleAmenity(amenity)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm text-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile Filters Sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6 overflow-y-auto pb-20">
            {/* Type */}
            <div>
              <Label className="text-base font-medium">Listing Type</Label>
              <div className="mt-3 flex gap-2">
                {(['all', 'sale', 'rent'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={filters.type === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('type', type)}
                  >
                    {type === 'all' ? 'All' : type === 'sale' ? 'Buy' : 'Rent'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Property Type */}
            <div>
              <Label className="text-base font-medium">Property Type</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {propertyTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={
                      filters.propertyType === type.value ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => updateFilter('propertyType', type.value)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <Label className="text-base font-medium">Price Range</Label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Select
                  value={filters.minPrice}
                  onValueChange={(value) => updateFilter('minPrice', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Min Price" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentPriceRanges.map((price) => (
                      <SelectItem
                        key={price.value}
                        value={price.value || 'any'}
                      >
                        {price.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.maxPrice}
                  onValueChange={(value) => updateFilter('maxPrice', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Max Price" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentPriceRanges.map((price) => (
                      <SelectItem
                        key={price.value}
                        value={price.value || 'any'}
                      >
                        {price.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <Label className="text-base font-medium">Bedrooms</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {bedroomOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      filters.bedrooms === option.value ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => updateFilter('bedrooms', option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <Label className="text-base font-medium">Bathrooms</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {bathroomOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      filters.bathrooms === option.value ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => updateFilter('bathrooms', option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <Label className="text-base font-medium">Amenities</Label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {amenityOptions.map((amenity) => (
                  <label
                    key={amenity.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.amenities.includes(amenity.value)}
                      onCheckedChange={() => toggleAmenity(amenity.value)}
                    />
                    <span className="text-sm">{amenity.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex gap-3 border-t bg-background p-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                clearFilters()
                setMobileFiltersOpen(false)
              }}
            >
              Clear All
            </Button>
            <Button
              className="flex-1"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Show {totalResults} Results
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
