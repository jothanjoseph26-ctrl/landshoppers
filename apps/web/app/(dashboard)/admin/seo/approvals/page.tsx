import { redirect } from "next/navigation"

export default function AdminSeoApprovalsPage() {
  redirect("/admin/seo?status=draft")
}
