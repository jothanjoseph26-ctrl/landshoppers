import { redirect } from "next/navigation"
export default function AdminWhatsappRejectedPage() {
  redirect("/admin/whatsapp?status=REJECTED")
}
