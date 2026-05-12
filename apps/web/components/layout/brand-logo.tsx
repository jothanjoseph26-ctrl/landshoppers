import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  priority?: boolean
}

export function BrandLogo({
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center", className)}>
      <Image
        src="/landshoppers-logo.png"
        alt="LandShoppers"
        width={180}
        height={40}
        className={cn("h-8 w-auto", imageClassName)}
        priority={priority}
      />
    </Link>
  )
}
