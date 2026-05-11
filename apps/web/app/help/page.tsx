import { SimpleInfoPage } from "@/components/static/simple-info-page"

export default function HelpPage() {
  return (
    <SimpleInfoPage
      title="Help Center"
      description="Find support for browsing listings, contacting agents, saving properties, and managing your account."
      ctaHref="/contact"
      ctaLabel="Get support"
    />
  )
}
