'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createBuyerTour } from '@/lib/api/buyer-portal'
import { ApiRequestError } from '@/lib/api/client'
import { getAccessToken } from '@/lib/api/auth-session'

type TourRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  listingId: string
  listingTitle: string
  defaultPhone?: string
  onSuccess?: () => void
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

export function TourRequestDialog({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  defaultPhone = '',
  onSuccess,
}: TourRequestDialogProps) {
  const [tourType, setTourType] = useState<'in_person' | 'virtual'>('in_person')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [buyerPhone, setBuyerPhone] = useState(defaultPhone)
  const [notes, setNotes] = useState('')
  const [pending, setPending] = useState(false)

  const signedIn = Boolean(getAccessToken())
  const minDate = new Date().toISOString().slice(0, 10)

  const submit = async () => {
    if (!signedIn) {
      toast.error('Sign in to request a tour')
      return
    }
    if (!preferredDate) {
      toast.error('Choose a preferred date')
      return
    }
    setPending(true)
    try {
      await createBuyerTour({
        listingId,
        tourType,
        preferredDate,
        preferredTime: preferredTime.trim() || undefined,
        buyerPhone: buyerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      toast.success('Tour request sent', {
        description: 'Track status in your buyer dashboard.',
        action: {
          label: 'View tours',
          onClick: () => {
            window.location.href = '/buyer/tours'
          },
        },
      })
      onOpenChange(false)
      setNotes('')
      onSuccess?.()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule a tour</DialogTitle>
          <DialogDescription>
            Request an {tourType === 'virtual' ? 'virtual' : 'in-person'} visit for{' '}
            <span className="font-medium text-foreground">{listingTitle}</span>.
          </DialogDescription>
        </DialogHeader>

        {!signedIn ? (
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p>You need an account to schedule tours with the listing agent.</p>
            <Button asChild className="mt-3 w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tour type</Label>
              <Select value={tourType} onValueChange={(v) => setTourType(v as 'in_person' | 'virtual')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In person</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tour-date">Preferred date</Label>
                <Input
                  id="tour-date"
                  type="date"
                  min={minDate}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tour-time">Preferred time (optional)</Label>
                <Input
                  id="tour-time"
                  placeholder="e.g. 10:00 AM"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tour-phone">Phone (optional)</Label>
              <Input
                id="tour-phone"
                type="tel"
                placeholder="+234"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tour-notes">Notes (optional)</Label>
              <Textarea
                id="tour-notes"
                rows={3}
                placeholder="Any access instructions or questions…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {signedIn && (
            <Button type="button" onClick={submit} disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Request tour
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
