import { SimpleInfoPage } from "@/components/static/simple-info-page"

export default function CookiesPage() {
  return (
    <SimpleInfoPage
      title="Cookie Policy"
      description="This page explains how LandShoppers uses cookies and similar technologies for site functionality and analytics."
      ctaHref="/privacy"
      ctaLabel="View privacy policy"
    />
  )
}
