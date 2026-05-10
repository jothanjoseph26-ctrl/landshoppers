import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function AdminWhatsappPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">WhatsApp</h1>
        <p className="text-muted-foreground">Configure routing, broadcast templates, and bot rules.</p>
      </div>
      <PortalEmpty
        title="WhatsApp admin pending"
        description="Hooks land once the workers package exposes the WhatsApp inbound webhook."
        primaryHref="/admin"
        primaryLabel="Back to admin"
      />
    </div>
  )
}
