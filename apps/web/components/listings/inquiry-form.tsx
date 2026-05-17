'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Send, Phone, MessageSquare, Calendar } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TourRequestDialog } from '@/components/listings/tour-request-dialog'
import { createInquiry } from '@/lib/api/portal'
import { ApiRequestError } from '@/lib/api/client'
import { getAccessToken } from '@/lib/api/auth-session'

interface Agent {
  id: string
  name: string
  company?: string
  phone: string
  whatsapp?: string
  image?: string
  isVerified: boolean
  rating: number
  reviewCount: number
}

interface InquiryFormProps {
  listingId: string
  listingTitle: string
  agent: Agent
}

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) {
    const body = err.body
    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error?: { message?: string } }).error?.message === 'string'
    ) {
      return (body as { error: { message: string } }).error.message
    }
  }
  if (err instanceof Error) return err.message
  return 'Request failed'
}

export function InquiryForm({ listingId, listingTitle, agent }: InquiryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Hi, I'm interested in "${listingTitle}". Please contact me with more information.`,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  const signedIn = Boolean(getAccessToken())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signedIn) {
      toast.error('Sign in to send an inquiry')
      return
    }
    setIsSubmitting(true)
    try {
      await createInquiry({
        listingId,
        message: formData.message,
        buyerName: formData.name.trim() || undefined,
        buyerEmail: formData.email.trim() || undefined,
        buyerPhone: formData.phone.trim() || undefined,
      })
      setSubmitted(true)
      toast.success('Inquiry sent')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in "${listingTitle}" on LandShoppers. Can you provide more information?`,
  )
  const whatsappLink = `https://wa.me/${agent.whatsapp || agent.phone}?text=${whatsappMessage}`

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Contact Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 rounded-lg bg-muted/50 p-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={agent.image} alt={agent.name} />
              <AvatarFallback>
                {agent.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{agent.name}</h3>
                {agent.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              {agent.company && (
                <p className="text-sm text-muted-foreground">{agent.company}</p>
              )}
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-secondary">★ {agent.rating.toFixed(1)}</span>
                <span>({agent.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="gap-2" asChild>
              <a href={`tel:${agent.phone}`}>
                <Phone className="h-4 w-4" />
                Call
              </a>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>

          {!signedIn && (
            <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
                Sign in
              </Link>{' '}
              to send inquiries and schedule tours on-platform.
            </div>
          )}

          {submitted ? (
            <div className="rounded-lg bg-primary/10 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Send className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Inquiry sent</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {agent.name} will contact you shortly. Track status in{' '}
                <Link href="/buyer/inquiries" className="font-medium text-foreground underline">
                  My inquiries
                </Link>
                .
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Send another
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/buyer/tours">View tours</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="I'm interested in this property…"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting || !signedIn}>
                {isSubmitting ? (
                  <>Sending…</>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send inquiry
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => setTourOpen(true)}
              >
                <Calendar className="h-4 w-4" />
                Schedule a tour
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground">
            By contacting, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>

      <TourRequestDialog
        open={tourOpen}
        onOpenChange={setTourOpen}
        listingId={listingId}
        listingTitle={listingTitle}
        defaultPhone={formData.phone}
        onSuccess={() => setTourOpen(false)}
      />
    </>
  )
}
