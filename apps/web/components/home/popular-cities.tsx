import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const cities = [
  {
    name: 'Lagos',
    state: 'Lagos State',
    listings: 4500,
    image: 'https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=800&q=80',
    featured: true,
  },
  {
    name: 'Abuja',
    state: 'FCT',
    listings: 2800,
    image: 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=800&q=80',
    featured: true,
  },
  {
    name: 'Port Harcourt',
    state: 'Rivers State',
    listings: 1200,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
    featured: false,
  },
  {
    name: 'Ibadan',
    state: 'Oyo State',
    listings: 850,
    image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80',
    featured: false,
  },
  {
    name: 'Kano',
    state: 'Kano State',
    listings: 620,
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
    featured: false,
  },
  {
    name: 'Enugu',
    state: 'Enugu State',
    listings: 480,
    image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80',
    featured: false,
  },
]

export function PopularCities() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Explore Properties by City
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover properties in Nigeria&apos;s most sought-after locations
          </p>
        </div>

        {/* Cities Grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Featured Cities (Large) */}
          {cities
            .filter((c) => c.featured)
            .map((city) => (
              <Link
                key={city.name}
                href={`/listings?location=${city.name}`}
                className="group relative col-span-1 row-span-2 overflow-hidden rounded-2xl sm:col-span-1 lg:col-span-2"
              >
                <div className="aspect-[4/3] lg:aspect-auto lg:h-full">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white">{city.name}</h3>
                  <p className="mt-1 text-white/80">{city.state}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium text-white">
                    <span>{city.listings.toLocaleString()} properties</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}

          {/* Regular Cities */}
          {cities
            .filter((c) => !c.featured)
            .map((city) => (
              <Link
                key={city.name}
                href={`/listings?location=${city.name}`}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="aspect-[4/3]">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-white">{city.name}</h3>
                  <p className="mt-0.5 text-sm text-white/80">{city.state}</p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {city.listings.toLocaleString()} properties
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  )
}
