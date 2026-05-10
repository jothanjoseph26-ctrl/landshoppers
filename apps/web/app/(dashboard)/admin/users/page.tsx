import { PortalEmpty } from "@/components/dashboard/portal-feedback"

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">User management</h1>
        <p className="text-muted-foreground">View users, roles, KYC, and account states.</p>
      </div>
      <PortalEmpty
        title="User admin pending"
        description="The user-management endpoints (list/search/role) ship in the next admin slice."
        primaryHref="/admin"
        primaryLabel="Back to admin"
      />
    </div>
  )
}
