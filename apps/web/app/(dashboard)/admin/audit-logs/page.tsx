import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Audit logs</h1>
        <p className="text-muted-foreground">Operational evidence for compliance and incident review.</p>
      </div>
      <PortalEmpty
        title="Audit log viewer pending"
        description="Audit trail rendering will hook into the audit log table once the read API ships."
        primaryHref="/admin"
        primaryLabel="Back to admin"
      />
    </div>
  )
}
