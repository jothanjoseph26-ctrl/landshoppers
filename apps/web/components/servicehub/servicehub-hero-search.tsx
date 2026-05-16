"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SERVICE_HUB_CATEGORIES } from "@/lib/servicehub/categories"

export function ServiceHubHeroSearch() {
  const router = useRouter()
  const [keyword, setKeyword] = useState("")
  const [where, setWhere] = useState("")
  const [category, setCategory] = useState<string>(SERVICE_HUB_CATEGORIES[0]?.slug ?? "legal")

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sp = new URLSearchParams()
    if (keyword.trim()) sp.set("keyword", keyword.trim())
    if (where.trim()) sp.set("location", where.trim())
    const q = sp.toString()
    router.push(`/services/${category}${q ? `?${q}` : ""}`)
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-stretch">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 pl-10"
            placeholder="What service do you need?"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="relative min-w-0 flex-1 sm:max-w-[200px]">
          <MapPin className="absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 pl-10"
            placeholder="Where?"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="h-12 w-full sm:w-[220px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {SERVICE_HUB_CATEGORIES.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="lg" className="h-12 shrink-0 px-8">
        Find providers
      </Button>
    </form>
  )
}
