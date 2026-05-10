"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authUserRole, dashboardPathForRole, formatAuthError, resendOtp, verifyOtp } from "@/lib/api/auth"
import { ApiRequestError } from "@/lib/api/client"

const OTP_NOT_IMPLEMENTED =
  "OTP API returns 501 until Termii/SES and JWT are wired (Agent 2). The request reached the server."

function VerifyOTPInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")?.trim() ?? ""

  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.slice(0, 6).split("")
      const newOtp = [...otp]
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit
        }
      })
      setOtp(newOtp)
      const nextIndex = Math.min(index + digits.length, 5)
      inputRefs.current[nextIndex]?.focus()
    } else {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join("")
    if (code.length !== 6) return
    if (!email) {
      setStatusMessage("Add your email: open this page from registration or add ?email= to the URL.")
      return
    }

    setIsLoading(true)
    setStatusMessage(null)
    try {
      const result = await verifyOtp({ email, code })
      setIsLoading(false)
      setIsVerified(true)
      setTimeout(() => {
        router.push(dashboardPathForRole(authUserRole(result)))
      }, 2000)
    } catch (err) {
      setIsLoading(false)
      if (err instanceof ApiRequestError) {
        setStatusMessage(formatAuthError(err, OTP_NOT_IMPLEMENTED))
      } else {
        setStatusMessage(
          "Could not reach the API. Set NEXT_PUBLIC_API_URL and run @landshoppers/api.",
        )
      }
    }
  }

  const handleResend = async () => {
    if (!email) {
      setStatusMessage("We need your email to resend the code. Use the link from registration.")
      return
    }
    setStatusMessage(null)
    try {
      await resendOtp({ email })
      setResendTimer(60)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setStatusMessage(formatAuthError(err, OTP_NOT_IMPLEMENTED))
      } else {
        setStatusMessage(
          "Could not reach the API. Set NEXT_PUBLIC_API_URL and run @landshoppers/api.",
        )
      }
    }
  }

  if (isVerified) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Verified!</CardTitle>
          <CardDescription className="text-base">
            Your account has been verified successfully. Redirecting you home…
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Verify your account</CardTitle>
        <CardDescription>
          {email ? (
            <>
              We&apos;ve sent a code to <strong className="text-foreground">{email}</strong>. Enter
              the 6-digit code below.
            </>
          ) : (
            <>
              Enter the 6-digit code we sent. If you opened this page directly,{" "}
              <Button variant="link" className="h-auto p-0" asChild>
                <a href="/register">start registration</a>
              </Button>{" "}
              first.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statusMessage && (
          <p
            role="status"
            className="mb-4 rounded-md border border-border bg-muted/50 px-3 py-2 text-center text-sm text-muted-foreground"
          >
            {statusMessage}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-14 w-12 rounded-lg border bg-background text-center text-2xl font-bold focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ))}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || otp.join("").length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify account"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {resendTimer > 0 ? (
              <p>Resend code in {resendTimer}s</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-medium text-primary hover:underline"
              >
                Resend code
              </button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function VerifyFallback() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Verify your account</CardTitle>
        <CardDescription>Loading…</CardDescription>
      </CardHeader>
    </Card>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyOTPInner />
    </Suspense>
  )
}
