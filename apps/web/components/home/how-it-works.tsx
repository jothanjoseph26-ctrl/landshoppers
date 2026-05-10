import { Search, UserCheck, Key, ArrowRight } from 'lucide-react'

const steps = [
  {
    step: 1,
    title: 'Search Properties',
    description:
      'Browse thousands of verified listings using our powerful search. Filter by location, price, property type, and more.',
    icon: Search,
  },
  {
    step: 2,
    title: 'Connect with Agents',
    description:
      'Contact verified agents directly through our platform. Schedule viewings, ask questions, and get expert guidance.',
    icon: UserCheck,
  },
  {
    step: 3,
    title: 'Own Your Property',
    description:
      'Complete your transaction with confidence. Our trusted partners handle legal documentation and secure payments.',
    icon: Key,
  },
]

export function HowItWorks() {
  return (
    <section className="bg-muted/50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Finding your perfect property is easy with LandShoppers
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16">
          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                {/* Connector Line (hidden on last item and mobile) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full -translate-x-1/2 bg-border lg:block">
                    <ArrowRight className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 translate-x-1/2 text-primary" />
                  </div>
                )}

                <div className="relative flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <item.icon className="h-8 w-8" />
                  </div>

                  {/* Step Number */}
                  <div className="absolute -right-2 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                    {item.step}
                  </div>

                  {/* Content */}
                  <h3 className="mt-6 text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
