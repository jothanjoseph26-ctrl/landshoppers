'use client'

import { useState } from 'react'
import { Send, Phone, MessageSquare, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

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

export function InquiryForm({ listingId, listingTitle, agent }: InquiryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Hi, I'm interested in "${listingTitle}". Please contact me with more information.`,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitting(false)
    setSubmitted(true)
  }

  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in "${listingTitle}" on LandShoppers. Can you provide more information?`
  )
  const whatsappLink = `https://wa.me/${agent.whatsapp || agent.phone}?text=${whatsappMessage}`

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Contact Agent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agent Card */}
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

        {/* Quick Actions */}
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

        {/* Inquiry Form */}
        {submitted ? (
          <div className="rounded-lg bg-primary/10 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Send className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              Inquiry Sent!
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {agent.name} will contact you shortly.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSubmitted(false)}
            >
              Send Another Inquiry
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="I'm interested in this property..."
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Inquiry
                </>
              )}
            </Button>

            <Button type="button" variant="outline" className="w-full gap-2">
              <Calendar className="h-4 w-4" />
              Schedule a Tour
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          By contacting, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardContent>
    </Card>
  )
}
