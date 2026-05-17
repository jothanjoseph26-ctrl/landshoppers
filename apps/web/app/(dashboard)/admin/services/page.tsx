"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PortalAuthRequired,
  PortalEmpty,
  PortalError,
  PortalLoading,
} from "@/components/dashboard/portal-feedback"
import {
  fetchAdminServiceProviders,
  patchAdminServiceProvider,
  type AdminServiceProvider,
} from "@/lib/api/admin-portal"
import { usePortalData } from "@/lib/api/use-portal-data"

export default function AdminServicesPage() {
  const [city, setCity] = useState("")
  const [category, setCategory] = useState("all")
  const [pending, setPending] = useState<string | null>(null)

  const providers = usePortalData(`admin:services:${city}:${category}`, () =>
    fetchAdminServiceProviders({
      pageSize: 50,
      city: city.trim() || undefined,
      category: category === "all" ? undefined : category,
    }),
  )

  if (providers.isUnauthenticated) return <PortalAuthRequired />

  const toggleVerified = async (row: AdminServiceProvider) => {
    setPending(row.id)
    try {
      await patchAdminServiceProvider(row.id, { isVerified: !row.isVerified })
      toast.success(row.isVerified ? "Verification removed" : "Provider verified")
      providers.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ADM-08</p>
        <h1 className="text-2xl font-bold md:text-3xl">Service directory</h1>
        <p className="text-muted-foreground">Manage ServiceHub providers, verification, and tiers.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Filter by city…"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="max-w-xs"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="survey">Survey</SelectItem>
            <SelectItem value="construction">Construction</SelectItem>
            <SelectItem value="mortgage">Mortgage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {providers.isLoading && <PortalLoading label="Loading providers…" />}
      {providers.error && (
        <PortalError description="Could not load service providers." onRetry={providers.refresh} />
      )}
      {providers.data && providers.data.data.length === 0 && (
        <PortalEmpty title="No providers" description="Adjust filters or seed ServiceHub data." />
      )}

      {providers.data && providers.data.data.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.data.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.businessName}</div>
                      <Link
                        href={`/services/${row.category}/${row.slug}`}
                        className="text-xs text-primary underline"
                        target="_blank"
                      >
                        Public profile
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize">{row.category.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      {row.city}, {row.state}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.subscriptionTier}</Badge>
                    </TableCell>
                    <TableCell>
                      {row.isVerified ? (
                        <Badge className="bg-primary/10 text-primary">Verified</Badge>
                      ) : (
                        <Badge variant="outline">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending === row.id}
                        onClick={() => void toggleVerified(row)}
                      >
                        {pending === row.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : row.isVerified ? (
                          "Unverify"
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
