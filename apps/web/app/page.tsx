import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { FeaturedListings } from '@/components/home/featured-listings'
import { FeaturedListingsSkeleton } from '@/components/home/featured-listings-skeleton'
import { HowItWorks } from '@/components/home/how-it-works'
import { PopularCities } from '@/components/home/popular-cities'
import { Testimonials } from '@/components/home/testimonials'
import { CTASection } from '@/components/home/cta-section'
import { BlogPreview } from '@/components/home/blog-preview'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <Suspense fallback={<FeaturedListingsSkeleton />}>
          <FeaturedListings />
        </Suspense>
        <HowItWorks />
        <PopularCities />
        <Testimonials />
        <CTASection />
        <BlogPreview />
      </main>
      <Footer />
    </>
  )
}
