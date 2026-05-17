import { redirect } from "next/navigation"

export default function AdminSeoVariantsPage() {
  redirect("/admin/seo?status=draft")
}
