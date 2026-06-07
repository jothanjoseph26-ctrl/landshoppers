import { Mail, MapPin, Phone } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SITE_SALES_PHONE_DISPLAY, salesTelHref } from "@/lib/site-contact"

export default function ContactPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="mt-2 text-muted-foreground">Reach the LandShoppers team.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5 text-primary" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">hello@landshoppers.local</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-5 w-5 text-primary" />
              Phone
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <a href={salesTelHref()} className="hover:text-foreground">
              {SITE_SALES_PHONE_DISPLAY}
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-primary" />
              Office
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Lagos, Nigeria</CardContent>
        </Card>
      </div>
    </main>
  )
}
