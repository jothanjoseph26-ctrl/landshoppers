import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const agentBenefits = [
  'Reach thousands of verified buyers',
  'Powerful listing management tools',
  'Real-time lead notifications',
  'Analytics and insights dashboard',
]

const buyerBenefits = [
  'Browse 10,000+ verified listings',
  'Connect with trusted agents',
  'Save and compare properties',
  'Get instant price drop alerts',
]

export function CTASection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Agent CTA */}
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 lg:p-12">
            {/* Background Pattern */}
            <div className="absolute right-0 top-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-72 w-72 rounded-full bg-white/5" />

            <div className="relative">
              <h3 className="text-2xl font-bold text-primary-foreground lg:text-3xl">
                Are You a Real Estate Agent?
              </h3>
              <p className="mt-4 text-primary-foreground/80 leading-relaxed">
                Join Nigeria&apos;s fastest-growing property platform and connect
                with qualified buyers looking for their next home.
              </p>

              <ul className="mt-6 space-y-3">
                {agentBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
                    <span className="text-sm text-primary-foreground/90">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                variant="secondary"
                className="mt-8"
                asChild
              >
                <Link href="/for-agents" className="gap-2">
                  Join as Agent
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Buyer CTA */}
          <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 lg:p-12">
            {/* Background Pattern */}
            <div className="absolute right-0 top-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary/20" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-72 w-72 rounded-full bg-primary/10" />

            <div className="relative">
              <h3 className="text-2xl font-bold text-background lg:text-3xl">
                Looking for Your Dream Home?
              </h3>
              <p className="mt-4 text-background/80 leading-relaxed">
                Create a free account to save properties, set up alerts, and
                connect directly with verified agents.
              </p>

              <ul className="mt-6 space-y-3">
                {buyerBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm text-background/90">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90"
                asChild
              >
                <Link href="/register" className="gap-2">
                  Start Searching
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
