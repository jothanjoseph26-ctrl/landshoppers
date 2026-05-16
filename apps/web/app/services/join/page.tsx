"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiRequestError } from "@/lib/api/client"
import { registerServiceProvider } from "@/lib/api/services-marketplace"
import { SERVICE_HUB_CATEGORIES } from "@/lib/servicehub/categories"

const STEPS = ["Business", "Account", "Services", "Portfolio"] as const

const STATES = [
  "Lagos",
  "Federal Capital Territory",
  "Rivers",
  "Oyo",
  "Kano",
  "Enugu",
  "Delta",
  "Anambra",
]

export default function ServiceProviderJoinPage() {
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    businessName: "",
    category: "",
    city: "",
    state: "",
    email: "",
    password: "",
    phone: "",
    servicesOffered: "",
    serviceAreas: "",
    portfolioNote: "",
  })

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const submit = async () => {
    setMessage(null)
    setIsLoading(true)
    try {
      await registerServiceProvider({
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
        category: form.category,
        city: form.city.trim(),
        state: form.state,
        servicesOffered: form.servicesOffered
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        serviceAreas: form.serviceAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        portfolioNote: form.portfolioNote.trim() || undefined,
      })
      setMessage(null)
      setDone(true)
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.status === 404 || e.status === 501) {
          setMessage(
            "Provider registration API is not live yet (Stream 1). Your details were not submitted — check back after the services sprint lands.",
          )
        } else {
          const body = e.body as { error?: { message?: string } } | null
          setMessage(body?.error?.message ?? `Request failed (${e.status}).`)
        }
      } else {
        setMessage("Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Application received</h1>
          <p className="mt-3 text-muted-foreground">
            {message
              ? message
              : "Welcome to ServiceHub — complete email verification, then finish KYC inside the provider portal when it opens."}
          </p>
          <Button asChild className="mt-8">
            <Link href="/services">Back to directory</Link>
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="border-b bg-primary/5 py-12">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">
            Grow your real estate services practice on LandShoppers
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Get discovered by buyers, agents, and developers who are already transacting — with
            verification tiers that unlock stronger placement over time.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex justify-between gap-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex flex-1 items-center justify-center rounded-md border py-2 text-center text-xs font-medium sm:text-sm ${
                i === step
                  ? "border-primary bg-primary/5 text-primary"
                  : i < step
                    ? "border-muted bg-muted/40 text-muted-foreground"
                    : "border-border text-muted-foreground"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step]}</CardTitle>
            <CardDescription>
              {step === 0 && "Tell us how you show up on the public directory."}
              {step === 1 && "Secure your LandShoppers account."}
              {step === 2 && "Outline what you deliver and where you work."}
              {step === 3 && "Optional — add a recent win buyers can recognise."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="biz">Business name</Label>
                  <Input
                    id="biz"
                    value={form.businessName}
                    onChange={update("businessName")}
                    required
                    minLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_HUB_CATEGORIES.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.city} onChange={update("city")} required />
                  </div>
                  <div className="space-y-2">
                    <Label>State / region</Label>
                    <Select
                      value={form.state}
                      onValueChange={(v) => setForm((f) => ({ ...f, state: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update("email")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (WhatsApp-capable)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={update("phone")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw">Password</Label>
                  <Input
                    id="pw"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={update("password")}
                    required
                    minLength={8}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="svc">Services offered (one per line)</Label>
                  <Textarea
                    id="svc"
                    rows={5}
                    placeholder="e.g. Title perfection&#10;Deed drafting"
                    value={form.servicesOffered}
                    onChange={update("servicesOffered")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="areas">Service areas (comma-separated LGAs or cities)</Label>
                  <Textarea
                    id="areas"
                    rows={3}
                    placeholder="Lekki Phase 1, VI, Ikoyi"
                    value={form.serviceAreas}
                    onChange={update("serviceAreas")}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label htmlFor="pf">Portfolio highlight</Label>
                <Textarea
                  id="pf"
                  rows={4}
                  placeholder="Describe a recent project (optional)."
                  value={form.portfolioNote}
                  onChange={update("portfolioNote")}
                />
              </div>
            )}

            {message && (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                {message}
              </p>
            )}

            <div className="flex items-center justify-between gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={back} disabled={step === 0 || isLoading}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next} disabled={isLoading}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={submit}
                  disabled={
                    isLoading ||
                    !form.businessName ||
                    !form.category ||
                    !form.email ||
                    !form.password ||
                    !form.phone
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting
                    </>
                  ) : (
                    "Submit application"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </div>
      <Footer />
    </div>
  )
}
