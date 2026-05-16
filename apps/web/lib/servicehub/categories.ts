import type { LucideIcon } from "lucide-react"
import {
  Building2,
  Camera,
  HardHat,
  Landmark,
  Lightbulb,
  Ruler,
  Scale,
  Search as SearchIcon,
  Shield,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react"

/** §1.4 — 12 public categories (URLs + copy). Some enum values land in Phase B on the API. */
export type ServiceHubCategorySlug =
  | "legal"
  | "survey"
  | "valuation"
  | "architecture"
  | "photography"
  | "mortgage"
  | "renovation"
  | "property_management"
  | "insurance"
  | "cleaning"
  | "home_technology"
  | "inspection"

export type ServiceHubCategoryMeta = {
  slug: ServiceHubCategorySlug
  label: string
  shortLabel: string
  icon: LucideIcon
  /** Present in current Prisma `ServiceCategory` enum — Stream 1 extends enum for the rest. */
  inPrismaEnum: boolean
}

export const SERVICE_HUB_CATEGORIES: ServiceHubCategoryMeta[] = [
  { slug: "legal", label: "Legal & Title", shortLabel: "Legal", icon: Scale, inPrismaEnum: true },
  { slug: "survey", label: "Survey & Mapping", shortLabel: "Survey", icon: Ruler, inPrismaEnum: true },
  {
    slug: "valuation",
    label: "Valuation & Appraisal",
    shortLabel: "Valuation",
    icon: TrendingUp,
    inPrismaEnum: false,
  },
  { slug: "architecture", label: "Architecture & Design", shortLabel: "Architecture", icon: HardHat, inPrismaEnum: true },
  { slug: "photography", label: "Photography & Media", shortLabel: "Photo & Media", icon: Camera, inPrismaEnum: true },
  {
    slug: "mortgage",
    label: "Mortgage & Finance",
    shortLabel: "Mortgage",
    icon: Landmark,
    inPrismaEnum: true,
  },
  {
    slug: "renovation",
    label: "Construction & Renovation",
    shortLabel: "Construction",
    icon: Wrench,
    inPrismaEnum: true,
  },
  {
    slug: "property_management",
    label: "Property Management",
    shortLabel: "Mgmt",
    icon: Building2,
    inPrismaEnum: true,
  },
  { slug: "insurance", label: "Insurance", shortLabel: "Insurance", icon: Shield, inPrismaEnum: true },
  {
    slug: "cleaning",
    label: "Cleaning & Moving",
    shortLabel: "Cleaning",
    icon: Sparkles,
    inPrismaEnum: false,
  },
  {
    slug: "home_technology",
    label: "Home Technology",
    shortLabel: "Home Tech",
    icon: Lightbulb,
    inPrismaEnum: false,
  },
  {
    slug: "inspection",
    label: "Inspection & Certification",
    shortLabel: "Inspection",
    icon: SearchIcon,
    inPrismaEnum: false,
  },
]

const SLUG_SET = new Set(SERVICE_HUB_CATEGORIES.map((c) => c.slug))

export function isServiceHubCategorySlug(s: string): s is ServiceHubCategorySlug {
  return SLUG_SET.has(s as ServiceHubCategorySlug)
}

export function getServiceHubCategoryMeta(
  slug: string,
): ServiceHubCategoryMeta | undefined {
  return SERVICE_HUB_CATEGORIES.find((c) => c.slug === slug)
}
