"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { PortalAuthRequired, PortalError, PortalLoading } from "@/components/dashboard/portal-feedback"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError } from "@/lib/api/client"
import { fetchListingById, updateListing } from "@/lib/api/portal"
import { getAccessToken } from "@/lib/api/auth-session"

export default function AgentEditListingPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : ""

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [priceKobo, setPriceKobo] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !getAccessToken()) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetchListingById(id)
      .then((listing) => {
        setTitle(listing.property.title)
        setDescription(listing.property.description ?? "")
        setCity(listing.property.city)
        setState(listing.property.state)
        setPriceKobo(listing.price)
      })
      .catch(() => setError("Could not load listing"))
      .finally(() => setLoading(false))
  }, [id])

  if (!getAccessToken()) return <PortalAuthRequired />
  if (loading) return <PortalLoading label="Loading listing…" />
  if (error) return <PortalError description={error} />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateListing(id, {
        title: title.trim(),
        description: description.trim() || null,
        city: city.trim(),
        state: state.trim(),
        priceKobo: priceKobo.replace(/\D/g, "") || "0",
      })
      toast.success("Listing updated")
      router.push("/agent/listings")
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const b = err.body as { error?: { message?: string } } | null
        toast.error(b?.error?.message ?? "Update failed")
      } else {
        toast.error("Update failed")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/agent/listings">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Listings
        </Link>
      </Button>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AGT-04</p>
        <h1 className="text-2xl font-bold">Edit listing</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price (kobo)</Label>
              <Input id="price" value={priceKobo} onChange={(e) => setPriceKobo(e.target.value)} required />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
