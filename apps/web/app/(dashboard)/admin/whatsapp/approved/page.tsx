import { redirect } from "next/navigation"
export default function AdminWhatsappApprovedPage() {
  redirect("/admin/whatsapp?status=APPROVED")
}
