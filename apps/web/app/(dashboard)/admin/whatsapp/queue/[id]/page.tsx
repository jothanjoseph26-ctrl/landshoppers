import { redirect } from "next/navigation"

type Props = { params: Promise<{ id: string }> }

export default async function AdminWhatsappMessageDetailPage({ params }: Props) {
  const { id } = await params
  redirect(`/admin/whatsapp?id=${encodeURIComponent(id)}`)
}
