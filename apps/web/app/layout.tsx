import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'

import { SonnerToaster } from '@/components/ui/sonner-toaster'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'LandShoppers - Nigeria\'s Premier Real Estate Marketplace',
    template: '%s | LandShoppers',
  },
  description:
    'Find your dream property in Nigeria. Browse thousands of verified listings from trusted agents. Apartments, houses, land, and commercial properties across Lagos, Abuja, and all major cities.',
  keywords: [
    'Nigeria real estate',
    'property for sale Lagos',
    'houses for rent Abuja',
    'land for sale Nigeria',
    'apartments Lagos',
    'real estate agents Nigeria',
    'property investment Africa',
    'diaspora property investment',
  ],
  authors: [{ name: 'LandShoppers' }],
  creator: 'LandShoppers',
  publisher: 'LandShoppers',
  metadataBase: new URL('https://landshopper.com'),
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://landshopper.com',
    siteName: 'LandShoppers',
    title: 'LandShoppers - Nigeria\'s Premier Real Estate Marketplace',
    description:
      'Find your dream property in Nigeria. Browse thousands of verified listings from trusted agents.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LandShoppers - Find Your Dream Property',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LandShoppers - Nigeria\'s Premier Real Estate Marketplace',
    description:
      'Find your dream property in Nigeria. Browse thousands of verified listings from trusted agents.',
    images: ['/og-image.jpg'],
    creator: '@landshopper',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2d6a4f' },
    { media: '(prefers-color-scheme: dark)', color: '#1b4332' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased min-h-screen">
        {children}
        <SonnerToaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
