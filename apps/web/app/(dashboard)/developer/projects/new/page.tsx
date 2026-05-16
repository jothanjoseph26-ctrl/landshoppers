"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createDeveloperProject } from "@/lib/api/developer-portal"
import { ApiRequestError } from "@/lib/api/client"

const PROPERTY_TYPES = [
  { value: "estate_unit", label: "Estate / phased development" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
]

export default function NewDeveloperProjectPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [propertyType, setPropertyType] = useState("estate_unit")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [totalUnits, setTotalUnits] = useState("0")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await createDeveloperProject({
        name: name.trim(),
        propertyType,
        city: city.trim(),
        state: state.trim(),
        totalUnits: Number.parseInt(totalUnits, 10) || 0,
        ...(description.trim() ? { description: description.trim() } : {}),
      })
      router.push(`/developer/projects/${res.data.id}`)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const b = err.body as { error?: { message?: string } } | null
        setError(b?.error?.message ?? `Request failed (${err.status})`)
      } else {
        setError("Something went wrong")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/developer/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to projects
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New project</h1>
        <p className="text-muted-foreground text-sm">
          Create a development project. You can add media and pricing details later.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="name">Project name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={200}
            placeholder="e.g. Lekki Gardens Phase 4"
          />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              placeholder="Lekki"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              placeholder="Lagos"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="units">Total units (inventory)</Label>
          <Input
            id="units"
            type="number"
            min={0}
            value={totalUnits}
            onChange={(e) => setTotalUnits(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Description (optional)</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={20000}
            placeholder="Highlights, amenities, payment plan…"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create project"
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/developer/projects">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
