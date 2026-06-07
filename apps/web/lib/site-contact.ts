/** LandShoppers sales / support line shown across marketing pages. */
export const SITE_SALES_PHONE_DISPLAY = "+234 912 517 2692"
export const SITE_SALES_PHONE_E164 = "+2349125172692"
export const SITE_SALES_WHATSAPP_DIGITS = "2349125172692"

/** WhatsApp digits for wa.me links — env override for deploy pipelines. */
export function salesWhatsAppDigits(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SALES_WHATSAPP?.replace(/\D/g, "")
  return fromEnv && fromEnv.length > 0 ? fromEnv : SITE_SALES_WHATSAPP_DIGITS
}

export function salesWhatsAppHref(text?: string): string {
  const base = `https://wa.me/${salesWhatsAppDigits()}`
  if (!text) return base
  return `${base}?text=${encodeURIComponent(text)}`
}

export function salesTelHref(): string {
  return `tel:${SITE_SALES_PHONE_E164}`
}
