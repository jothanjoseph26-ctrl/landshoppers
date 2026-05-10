import Link from 'next/link'
import { Home, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  properties: [
    { name: 'Buy Property', href: '/listings?type=sale' },
    { name: 'Rent Property', href: '/listings?type=rent' },
    { name: 'New Developments', href: '/developers' },
    { name: 'Commercial', href: '/listings?propertyType=commercial' },
    { name: 'Land for Sale', href: '/listings?propertyType=land' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Blog', href: '/blog' },
    { name: 'Press', href: '/press' },
    { name: 'Contact', href: '/contact' },
  ],
  services: [
    { name: 'For Agents', href: '/for-agents' },
    { name: 'For Developers', href: '/for-developers' },
    { name: 'Service Directory', href: '/services' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Partner With Us', href: '/partners' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Accessibility', href: '/accessibility' },
  ],
}

const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com/landshopper', icon: Facebook },
  { name: 'Twitter', href: 'https://twitter.com/landshopper', icon: Twitter },
  { name: 'Instagram', href: 'https://instagram.com/landshopper', icon: Instagram },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/landshopper', icon: Linkedin },
]

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Home className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">
                Land<span className="text-secondary">Shoppers</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-background/70 leading-relaxed">
              Nigeria&apos;s premier real estate marketplace. Find your dream property with verified agents and developers.
            </p>
            <div className="mt-6 space-y-2">
              <a href="tel:+2349012345678" className="flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors">
                <Phone className="h-4 w-4" />
                +234 901 234 5678
              </a>
              <a href="mailto:hello@landshopper.com" className="flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors">
                <Mail className="h-4 w-4" />
                hello@landshopper.com
              </a>
              <p className="flex items-center gap-2 text-sm text-background/70">
                <MapPin className="h-4 w-4" />
                Lagos, Nigeria
              </p>
            </div>
          </div>

          {/* Properties */}
          <div>
            <h3 className="text-sm font-semibold">Properties</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.properties.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold">Services</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold">Support</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-background/10 pt-8 md:flex-row">
          <p className="text-sm text-background/60">
            &copy; {new Date().getFullYear()} LandShoppers. All rights reserved.
          </p>
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/60 hover:text-background transition-colors"
              >
                <span className="sr-only">{link.name}</span>
                <link.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
