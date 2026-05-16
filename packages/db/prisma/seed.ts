import {
  InquirySource,
  InquiryStatus,
  KycStatus,
  ListingStatus,
  ProjectStatus,
  PropertyType,
  ServiceBundleTrigger,
  ServiceCategory,
  UnitStatus,
  UserRole,
  WhatsAppMessageStatus,
  createPrismaClient,
} from "@landshoppers/db";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __seedDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__seedDir, "../../../.env") });

const prisma = createPrismaClient();

/** Demo login for seeded accounts (`buyer@example.test`, agents, etc.). */
const SEED_LOGIN_PASSWORD = "Password123!";
const SEED_PASSWORD_HASH = bcrypt.hashSync(SEED_LOGIN_PASSWORD, 10);

/** Who owns the 8 demo `DeveloperProject` rows + inquiries (`SEED_DEVELOPER_*` in repo root `.env`). */
const SEED_DEVELOPER_EMAIL =
  process.env.SEED_DEVELOPER_EMAIL?.trim().toLowerCase() || "developer@example.test";
const SEED_DEVELOPER_COMPANY_NAME =
  process.env.SEED_DEVELOPER_COMPANY_NAME?.trim() || "Demo Estates Ltd";

function isSeedDemoMailbox(email: string): boolean {
  return email.endsWith("@example.test");
}

async function ensureSeedDeveloperPrincipal() {
  const email = SEED_DEVELOPER_EMAIL;
  const isDemo = isSeedDemoMailbox(email);

  let user = await prisma.user.findUnique({
    where: { email },
    include: { developer: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: SEED_PASSWORD_HASH,
        role: UserRole.developer,
        isEmailVerified: true,
        developer: {
          create: {
            companyName: SEED_DEVELOPER_COMPANY_NAME,
            kycStatus: KycStatus.verified,
            isVerified: true,
            companyCity: "Lagos",
            companyState: "Lagos",
          },
        },
        profile: {
          create: {
            firstName: "Ngozi",
            lastName: "PM",
            city: "Lagos",
            state: "Lagos",
          },
        },
      },
      include: { developer: true },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: UserRole.developer,
        isEmailVerified: true,
        ...(isDemo ? { passwordHash: SEED_PASSWORD_HASH } : {}),
      },
    });
    if (!user.developer) {
      await prisma.developer.create({
        data: {
          userId: user.id,
          companyName: SEED_DEVELOPER_COMPANY_NAME,
          kycStatus: KycStatus.verified,
          isVerified: true,
          companyCity: "Lagos",
          companyState: "Lagos",
        },
      });
    }
    user = await prisma.user.findUniqueOrThrow({
      where: { email },
      include: { developer: true },
    });
  }

  if (!user.developer) throw new Error(`seed: developer record missing for ${email}`);
  return user;
}

/** Framework Week 2 Agent 1: seed targets — 8 properties, 6 agents, 6 service providers (+ demo users). */

const AGENT_SEEDS = [
  {
    email: "agent@example.test",
    firstName: "Chidi",
    lastName: "Okonkwo",
    agencyName: "Demo Realty Lagos",
    city: "Lagos",
    state: "Lagos",
    specs: ["residential", "land"],
  },
  {
    email: "agent2@example.test",
    firstName: "Amara",
    lastName: "Nwosu",
    agencyName: "Victoria Island Homes",
    city: "Lagos",
    state: "Lagos",
    specs: ["luxury", "commercial"],
  },
  {
    email: "agent3@example.test",
    firstName: "Emeka",
    lastName: "Adeyemi",
    agencyName: "Abuja Prime Estates",
    city: "Abuja",
    state: "FCT",
    specs: ["residential"],
  },
  {
    email: "agent4@example.test",
    firstName: "Fatima",
    lastName: "Al-Hassan",
    agencyName: "Northern Realty Co",
    city: "Kano",
    state: "Kano",
    specs: ["land", "commercial"],
  },
  {
    email: "agent5@example.test",
    firstName: "Kelechi",
    lastName: "Eze",
    agencyName: "PH Waterfront Agency",
    city: "Port Harcourt",
    state: "Rivers",
    specs: ["residential", "waterfront"],
  },
  {
    email: "agent6@example.test",
    firstName: "Temi",
    lastName: "Lawson",
    agencyName: "Diaspora Connect Realty",
    city: "Lagos",
    state: "Lagos",
    specs: ["diaspora", "investment"],
  },
] as const;

const PROVIDER_SEEDS = [
  {
    email: "provider@example.test",
    businessName: "Demo Survey Works",
    slug: "demo-survey-works",
    category: ServiceCategory.survey,
    city: "Port Harcourt",
    state: "Rivers",
    firstName: "Emeka",
    lastName: "Surveyor",
  },
  {
    email: "provider2@example.test",
    businessName: "Lekki Legal Partners",
    slug: "lekki-legal-partners",
    category: ServiceCategory.legal,
    city: "Lagos",
    state: "Lagos",
    firstName: "Ifeoma",
    lastName: "Okoro",
  },
  {
    email: "provider3@example.test",
    businessName: "Mortgage Hub NG",
    slug: "mortgage-hub-ng",
    category: ServiceCategory.mortgage,
    city: "Abuja",
    state: "FCT",
    firstName: "Yusuf",
    lastName: "Bello",
  },
  {
    email: "provider4@example.test",
    businessName: "ArcDesign Studios",
    slug: "arcdesign-studios",
    category: ServiceCategory.architecture,
    city: "Lagos",
    state: "Lagos",
    firstName: "Zainab",
    lastName: "Ibrahim",
  },
  {
    email: "provider5@example.test",
    businessName: "Shield Property Insurance",
    slug: "shield-property-insurance",
    category: ServiceCategory.insurance,
    city: "Lagos",
    state: "Lagos",
    firstName: "David",
    lastName: "Okafor",
  },
  {
    email: "provider6@example.test",
    businessName: "RenovateRight Ltd",
    slug: "renovateright-ltd",
    category: ServiceCategory.renovation,
    city: "Ibadan",
    state: "Oyo",
    firstName: "Funke",
    lastName: "Ajayi",
  },
] as const;

/** §1.5 — named bundles (kobo). Activation flow is Sprint D; data is Phase A seed. */
const SERVICE_BUNDLE_SEEDS = [
  {
    slug: "lagos-title-perfection",
    name: "Lagos Title Perfection Package",
    description:
      "Legal (title) + Survey + Valuation + Governor's Consent filing for a typical Lagos property closing.",
    categories: [ServiceCategory.legal, ServiceCategory.survey, ServiceCategory.valuation],
    priceFromKobo: BigInt(350_000_00),
    priceToKobo: BigInt(800_000_00),
    triggerContext: ServiceBundleTrigger.post_purchase,
  },
  {
    slug: "new-home-ready",
    name: "New Home Ready Package",
    description: "Inspection + Cleaning + Smart Home basic install + CCTV after you move in.",
    categories: [ServiceCategory.inspection, ServiceCategory.cleaning_moving, ServiceCategory.home_technology],
    priceFromKobo: BigInt(180_000_00),
    priceToKobo: BigInt(450_000_00),
    triggerContext: ServiceBundleTrigger.post_purchase,
  },
  {
    slug: "off-plan-investor",
    name: "Off-Plan Investor Package",
    description: "Legal review + Mortgage advisory + NHF processing + Insurance for off-plan buyers.",
    categories: [ServiceCategory.legal, ServiceCategory.mortgage, ServiceCategory.insurance],
    priceFromKobo: BigInt(250_000_00),
    priceToKobo: BigInt(600_000_00),
    triggerContext: ServiceBundleTrigger.off_plan,
  },
  {
    slug: "listing-launch",
    name: "Listing Launch Package",
    description: "Photography + Virtual tour + Floor plan + Drone for agents launching a listing.",
    categories: [ServiceCategory.photography],
    priceFromKobo: BigInt(120_000_00),
    priceToKobo: BigInt(280_000_00),
    triggerContext: ServiceBundleTrigger.listing_create,
  },
  {
    slug: "developer-project",
    name: "Developer Project Package",
    description: "Architecture + Quantity survey + Legal (company) + Insurance for developer projects.",
    categories: [ServiceCategory.architecture, ServiceCategory.legal, ServiceCategory.insurance],
    priceFromKobo: BigInt(2_000_000_00),
    priceToKobo: BigInt(15_000_000_00),
    triggerContext: ServiceBundleTrigger.developer_project,
  },
  {
    slug: "diaspora-remote-purchase",
    name: "Diaspora Remote Purchase Package",
    description:
      "Legal + Survey + Valuation + Property management setup for remote / diaspora buyers.",
    categories: [
      ServiceCategory.legal,
      ServiceCategory.survey,
      ServiceCategory.valuation,
      ServiceCategory.property_management,
    ],
    priceFromKobo: BigInt(500_000_00),
    priceToKobo: BigInt(1_200_000_00),
    triggerContext: ServiceBundleTrigger.diaspora,
  },
] as const;

/** Demo images for developer projects (Unsplash, stable URLs). */
const DEV_IMG = {
  lekki: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  vi: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  towers: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
  ajah: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  abuja: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  ph: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  enugu: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  kano: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
} as const;

/**
 * Eight verified-style developer projects (≥6) so the developer portal shows a full portfolio:
 * mixed status, Nigerian cities, price bands in kobo, views, and amenities.
 */
const DEVELOPER_PROJECT_SEEDS = [
  {
    slug: "demo-pipeline-residence",
    name: "Pipeline Residence",
    shortDescription: "Flagship waterfront-inspired estate — Lekki corridor.",
    description:
      "Mixed-density blocks with retail podium, 24/7 power, and dedicated kids’ play zones. Strong pre-sales from diaspora buyers.",
    status: ProjectStatus.ONGOING,
    propertyType: PropertyType.estate_unit,
    city: "Lagos",
    state: "Lagos",
    address: "Off Freedom Way, Lekki Phase 1",
    latitude: 6.455,
    longitude: 3.3941,
    totalUnits: 48,
    soldUnits: 12,
    availableUnits: 36,
    priceRangeMin: BigInt("6200000000"),
    priceRangeMax: BigInt("120000000000"),
    images: [DEV_IMG.lekki],
    viewCount: 1840,
    amenities: ["generator", "security", "pool", "gym"],
    features: ["waterfront", "smart-home-ready"],
  },
  {
    slug: "seed-horizon-estates-lekki",
    name: "Horizon Estates Lekki",
    shortDescription: "Low-density plots + terrace clusters near Eleko.",
    description:
      "Phased land release with infrastructure-first delivery. Ideal for families upgrading from apartments.",
    status: ProjectStatus.ONGOING,
    propertyType: PropertyType.land,
    city: "Ibeju-Lekki",
    state: "Lagos",
    address: "Eleko Beach Road axis",
    latitude: 6.4698,
    longitude: 3.5852,
    totalUnits: 120,
    soldUnits: 44,
    availableUnits: 76,
    priceRangeMin: BigInt("3500000000"),
    priceRangeMax: BigInt("18000000000"),
    images: [DEV_IMG.ajah],
    viewCount: 3200,
    amenities: ["perimeter-fence", "access-road", "drainage"],
    features: ["corner-plots", "corner-shop-options"],
  },
  {
    slug: "seed-apex-gardens-abuja",
    name: "Apex Gardens Abuja",
    shortDescription: "Maitama-adjacent terraces targeting civil-service & expat demand.",
    description:
      "Quiet cul-de-sac layout, solar-ready rooftops, and underground parking in select blocks.",
    status: ProjectStatus.UPCOMING,
    propertyType: PropertyType.house,
    city: "Abuja",
    state: "FCT",
    address: "Jabi–Airport link corridor",
    latitude: 9.0765,
    longitude: 7.3986,
    totalUnits: 64,
    soldUnits: 0,
    availableUnits: 64,
    priceRangeMin: BigInt("95000000000"),
    priceRangeMax: BigInt("280000000000"),
    images: [DEV_IMG.abuja],
    viewCount: 890,
    amenities: ["solar-ready", "cctv", "borehole"],
    features: ["expat-friendly", "quiet-zone"],
  },
  {
    slug: "seed-marina-towers-ph",
    name: "Marina Towers PH",
    shortDescription: "High-rise apartments overlooking the Bonny River breeze path.",
    description:
      "Two towers with shared sky lounge. Strong interest from oil & gas professionals based in Trans Amadi.",
    status: ProjectStatus.ONGOING,
    propertyType: PropertyType.apartment,
    city: "Port Harcourt",
    state: "Rivers",
    address: "GRA Phase 3",
    latitude: 4.8156,
    longitude: 7.0498,
    totalUnits: 200,
    soldUnits: 78,
    availableUnits: 122,
    priceRangeMin: BigInt("45000000000"),
    priceRangeMax: BigInt("150000000000"),
    images: [DEV_IMG.ph],
    viewCount: 2650,
    amenities: ["generator", "elevator", "concierge"],
    features: ["river-view", "sky-lounge"],
  },
  {
    slug: "seed-greenfield-enugu",
    name: "Greenfield Enugu",
    shortDescription: "Affordable 2–3 bed bungalows for South-East diaspora returns.",
    description:
      "Community title consolidation in progress; sample show-homes open Q4. Partner bank pre-approval desk on site.",
    status: ProjectStatus.UPCOMING,
    propertyType: PropertyType.house,
    city: "Enugu",
    state: "Enugu",
    address: "Independence Layout extension",
    latitude: 6.4584,
    longitude: 7.5464,
    totalUnits: 96,
    soldUnits: 6,
    availableUnits: 90,
    priceRangeMin: BigInt("28000000000"),
    priceRangeMax: BigInt("72000000000"),
    images: [DEV_IMG.enugu],
    viewCount: 1120,
    amenities: ["security", "playground", "shopping-strip"],
    features: ["diaspora-campaign", "title-tracking"],
  },
  {
    slug: "seed-riverside-banana",
    name: "Riverside Banana Island",
    shortDescription: "Ultra-luxury duplex plots — limited release.",
    description:
      "Fully serviced plots with marine piling specs. Sales by invitation; KYC required before site tour.",
    status: ProjectStatus.ONGOING,
    propertyType: PropertyType.land,
    city: "Lagos",
    state: "Lagos",
    address: "Banana Island",
    latitude: 6.4331,
    longitude: 3.4217,
    totalUnits: 18,
    soldUnits: 11,
    availableUnits: 7,
    priceRangeMin: BigInt("450000000000"),
    priceRangeMax: BigInt("1200000000000"),
    images: [DEV_IMG.vi],
    viewCount: 980,
    amenities: ["marine-piling", "24-7-security", "jetty-access"],
    features: ["invitation-only", "kyc-gated-tours"],
  },
  {
    slug: "seed-ikoyi-completed-midrise",
    name: "Ikoyi Midrise (Completed)",
    shortDescription: "Delivered mid-rise — residual inventory only.",
    description:
      "Handed over 18 months ago; remaining stock is penthouse level and commercial podium slots.",
    status: ProjectStatus.COMPLETED,
    propertyType: PropertyType.apartment,
    city: "Ikoyi",
    state: "Lagos",
    address: "Alexander Avenue",
    latitude: 6.4531,
    longitude: 3.4225,
    totalUnits: 36,
    soldUnits: 36,
    availableUnits: 0,
    priceRangeMin: BigInt("85000000000"),
    priceRangeMax: BigInt("450000000000"),
    images: [DEV_IMG.towers],
    viewCount: 4100,
    amenities: ["pool", "gym", "concierge"],
    features: ["handover-complete", "residual-penthouse"],
  },
  {
    slug: "seed-kano-commerce-park",
    name: "Kano Commerce Park",
    shortDescription: "Sold-out logistics-adjacent commercial terraces (demo archive).",
    description:
      "Archive seed project to exercise SOLD_OUT state in dashboards and filters.",
    status: ProjectStatus.SOLD_OUT,
    propertyType: PropertyType.commercial,
    city: "Kano",
    state: "Kano",
    address: "Zaria Road industrial belt",
    latitude: 12.0022,
    longitude: 8.592,
    totalUnits: 40,
    soldUnits: 40,
    availableUnits: 0,
    priceRangeMin: BigInt("120000000000"),
    priceRangeMax: BigInt("320000000000"),
    images: [DEV_IMG.kano],
    viewCount: 5600,
    amenities: ["loading-bays", "three-phase", "cctv"],
    features: ["logistics-adjacent", "sold-out-archive"],
  },
] as const;

type DeveloperProjectInquirySeed = {
  id: string;
  projectSlug: string;
  status: InquiryStatus;
  source: InquirySource;
  message: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  respondedAt?: boolean;
  closedAt?: boolean;
  closedReason?: string;
};

/** Sixteen project-scoped inquiries across the portfolio (fixed UUIDs for idempotent re-seed). */
const DEVELOPER_PROJECT_INQUIRY_SEEDS: DeveloperProjectInquirySeed[] = [
  {
    id: "33333333-3333-3333-3333-333333333332",
    projectSlug: "demo-pipeline-residence",
    status: InquiryStatus.responded,
    source: InquirySource.direct,
    message: "Do you still have 3-bed inventory facing the lagoon?",
    buyerName: "Ada Buyer",
    buyerEmail: "buyer@example.test",
    respondedAt: true,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    projectSlug: "demo-pipeline-residence",
    status: InquiryStatus.new,
    source: InquirySource.web,
    message: "What is the payment plan for Tower B?",
    buyerName: "Chioma Eze",
    buyerEmail: "chioma.eze@seed.test",
  },
  {
    id: "33333333-3333-3333-3333-333333333334",
    projectSlug: "seed-horizon-estates-lekki",
    status: InquiryStatus.touring,
    source: InquirySource.whatsapp,
    message: "Site visit Saturday 10am — please confirm gate pass.",
    buyerName: "Emmanuel Adeyemi",
    buyerPhone: "+2348023456789",
    respondedAt: true,
  },
  {
    id: "33333333-3333-3333-3333-333333333335",
    projectSlug: "seed-horizon-estates-lekki",
    status: InquiryStatus.new,
    source: InquirySource.web,
    message: "Corner plot availability for 500sqm?",
    buyerName: "Ngozi Okafor",
    buyerEmail: "ngozi.okafor@seed.test",
  },
  {
    id: "33333333-3333-3333-3333-333333333336",
    projectSlug: "seed-apex-gardens-abuja",
    status: InquiryStatus.new,
    source: InquirySource.web,
    message: "Pre-launch pricing for 4-bed terrace?",
    buyerName: "Yusuf Bello",
    buyerEmail: "yusuf.bello@seed.test",
  },
  {
    id: "33333333-3333-3333-3333-333333333337",
    projectSlug: "seed-apex-gardens-abuja",
    status: InquiryStatus.responded,
    source: InquirySource.direct,
    message: "CAC-backed company purchase — need bulk discount policy.",
    buyerName: "Ifeoma Okoro",
    buyerEmail: "ifeoma.okoro@seed.test",
    respondedAt: true,
  },
  {
    id: "33333333-3333-3333-3333-333333333338",
    projectSlug: "seed-marina-towers-ph",
    status: InquiryStatus.new,
    source: InquirySource.whatsapp,
    message: "River-view 3 bed — service charge estimate?",
    buyerName: "Kelechi Eze",
    buyerPhone: "+2348056789012",
  },
  {
    id: "33333333-3333-3333-3333-333333333339",
    projectSlug: "seed-marina-towers-ph",
    status: InquiryStatus.closed,
    source: InquirySource.web,
    message: "Reserved two units for staff relocation — thank you.",
    buyerName: "Demo Corp Liaison",
    buyerEmail: "corp.liaison@seed.test",
    respondedAt: true,
    closedAt: true,
  },
  {
    id: "33333333-3333-3333-3333-33333333333a",
    projectSlug: "seed-greenfield-enugu",
    status: InquiryStatus.new,
    source: InquirySource.web,
    message: "Diaspora buyer — need virtual walkthrough link.",
    buyerName: "Oluwaseun Bakare",
    buyerEmail: "seun.bakare@seed.test",
  },
  {
    id: "33333333-3333-3333-3333-33333333333b",
    projectSlug: "seed-greenfield-enugu",
    status: InquiryStatus.lost,
    source: InquirySource.direct,
    message: "Budget no longer fits after FX move.",
    buyerName: "Chukwudi Eze",
    buyerEmail: "chukwudi.e@seed.test",
    respondedAt: true,
    closedAt: true,
    closedReason: "Budget",
  },
  {
    id: "33333333-3333-3333-3333-33333333333c",
    projectSlug: "seed-riverside-banana",
    status: InquiryStatus.touring,
    source: InquirySource.whatsapp,
    message: "Invitation slot for Tuesday 4pm — confirm KYC pack.",
    buyerName: "Adaeze Nwosu",
    buyerEmail: "ada.nwosu@seed.test",
    respondedAt: true,
  },
  {
    id: "33333333-3333-3333-3333-33333333333d",
    projectSlug: "seed-riverside-banana",
    status: InquiryStatus.new,
    source: InquirySource.web,
    message: "Joint venture for two contiguous plots possible?",
    buyerName: "Fatima Al-Hassan",
    buyerEmail: "fatima.alhassan@seed.test",
  },
  {
    id: "33333333-3333-3333-3333-33333333333e",
    projectSlug: "seed-ikoyi-completed-midrise",
    status: InquiryStatus.responded,
    source: InquirySource.web,
    message: "Residual penthouse — parking allocation sheet?",
    buyerName: "Amara Nwosu",
    buyerEmail: "amara.nwosu@seed.test",
    respondedAt: true,
  },
  {
    id: "33333333-3333-3333-3333-33333333333f",
    projectSlug: "seed-kano-commerce-park",
    status: InquiryStatus.closed,
    source: InquirySource.direct,
    message: "Archive inquiry — all units allocated.",
    buyerName: "Temi Lawson",
    buyerEmail: "temi.lawson@seed.test",
    respondedAt: true,
    closedAt: true,
  },
  {
    id: "44444444-4444-4444-4444-444444444441",
    projectSlug: "demo-pipeline-residence",
    status: InquiryStatus.new,
    source: InquirySource.whatsapp,
    message: "Voice note follow-up: need NHF eligibility letter template.",
    buyerName: "Chidi Okonkwo",
    buyerEmail: "agent@example.test",
  },
  {
    id: "44444444-4444-4444-4444-444444444442",
    projectSlug: "seed-marina-towers-ph",
    status: InquiryStatus.touring,
    source: InquirySource.web,
    message: "Relocating from Lagos — compare service charge vs Ikoyi.",
    buyerName: "Zainab Ibrahim",
    buyerEmail: "zainab.ibrahim@seed.test",
    respondedAt: true,
  },
  {
    id: "44444444-4444-4444-4444-444444444443",
    projectSlug: "seed-horizon-estates-lekki",
    status: InquiryStatus.responded,
    source: InquirySource.whatsapp,
    message: "Bulk purchase for staff housing — 6 plots.",
    buyerName: "David Okafor",
    buyerEmail: "david.okafor@seed.test",
    respondedAt: true,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    projectSlug: "seed-apex-gardens-abuja",
    status: InquiryStatus.new,
    source: InquirySource.web,
    message: "Embassy proximity — noise buffer details?",
    buyerName: "Funke Ajayi",
    buyerEmail: "funke.ajayi@seed.test",
  },
];

/** Eight properties/listings across Lagos / Abuja (framework seed counts). */
const PROPERTY_LISTING_SEEDS = [
  {
    slug: "demo-plot-ibeju",
    title: "500 sqm Residential Plot · Ibeju-Lekki",
    description: "Corner plot with drainage channel — seed listing.",
    propertyType: PropertyType.land,
    city: "Ibeju-Lekki",
    state: "Lagos",
    latitude: 6.4698,
    longitude: 3.5852,
    listingId: "22222222-2222-2222-2222-222222222222",
    priceKobo: "4500000000",
    isFeatured: true,
    agentIndex: 0,
  },
  {
    slug: "seed-ikoyi-penthouse",
    title: "4 Bed Penthouse · Ikoyi",
    description: "Duplex-level finishes, marina views.",
    propertyType: PropertyType.apartment,
    city: "Ikoyi",
    state: "Lagos",
    latitude: 6.4531,
    longitude: 3.4225,
    listingId: "22222222-2222-2222-2222-222222222223",
    priceKobo: "95000000000",
    isFeatured: true,
    agentIndex: 1,
  },
  {
    slug: "seed-lekki-phase1-flat",
    title: "3 Bedroom Flat · Lekki Phase 1",
    description: "Serviced block with Gen + pool.",
    propertyType: PropertyType.apartment,
    city: "Lekki",
    state: "Lagos",
    latitude: 6.4474,
    longitude: 3.4739,
    listingId: "22222222-2222-2222-2222-222222222224",
    priceKobo: "85000000000",
    isFeatured: false,
    agentIndex: 2,
  },
  {
    slug: "seed-vi-office-loft",
    title: "Commercial Loft · Victoria Island",
    description: "Open-plan workspace, raised flooring.",
    propertyType: PropertyType.commercial,
    city: "Victoria Island",
    state: "Lagos",
    latitude: 6.4281,
    longitude: 3.4219,
    listingId: "22222222-2222-2222-2222-222222222225",
    priceKobo: "320000000000",
    isFeatured: false,
    agentIndex: 3,
  },
  {
    slug: "seed-abuja-mabushi-house",
    title: "5 Bedroom Detached · Mabushi",
    description: "BQ + solar inverter.",
    propertyType: PropertyType.house,
    city: "Abuja",
    state: "FCT",
    latitude: 9.082,
    longitude: 7.3986,
    listingId: "22222222-2222-2222-2222-222222222226",
    priceKobo: "280000000000",
    isFeatured: false,
    agentIndex: 4,
  },
  {
    slug: "seed-ajah-duplex",
    title: "Semi-Detached Duplex · Ajah",
    description: "Estate road, uniform security.",
    propertyType: PropertyType.house,
    city: "Ajah",
    state: "Lagos",
    latitude: 6.4683,
    longitude: 3.6012,
    listingId: "22222222-2222-2222-2222-222222222227",
    priceKobo: "72000000000",
    isFeatured: false,
    agentIndex: 5,
  },
  {
    slug: "seed-yaba-terrace",
    title: "Terrace House · Yaba",
    description: "Near tech hub, compact plot.",
    propertyType: PropertyType.house,
    city: "Yaba",
    state: "Lagos",
    latitude: 6.5095,
    longitude: 3.3711,
    listingId: "22222222-2222-2222-2222-222222222228",
    priceKobo: "48000000000",
    isFeatured: false,
    agentIndex: 0,
  },
  {
    slug: "seed-gbagada-block",
    title: "2 Bedroom Block of Flats · Gbagada",
    description: "Elevator building, low service charge.",
    propertyType: PropertyType.apartment,
    city: "Gbagada",
    state: "Lagos",
    latitude: 6.5445,
    longitude: 3.3842,
    listingId: "22222222-2222-2222-2222-222222222229",
    priceKobo: "38000000000",
    isFeatured: false,
    agentIndex: 3,
  },
] as const;

async function main() {
  await prisma.whatsAppGroup.upsert({
    where: { groupId: "demo-group-whatsapp-1" },
    update: {},
    create: {
      groupId: "demo-group-whatsapp-1",
      groupName: "LandShoppers Demo Alerts",
      isMonitored: true,
      messageCount: 12,
      lastActivityAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.test" },
    update: { passwordHash: SEED_PASSWORD_HASH },
    create: {
      email: "admin@example.test",
      passwordHash: SEED_PASSWORD_HASH,
      role: UserRole.admin,
      isEmailVerified: true,
      profile: {
        create: {
          firstName: "Site",
          lastName: "Admin",
          city: "Lagos",
          state: "Lagos",
        },
      },
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@example.test" },
    update: { passwordHash: SEED_PASSWORD_HASH },
    create: {
      email: "buyer@example.test",
      passwordHash: SEED_PASSWORD_HASH,
      role: UserRole.buyer,
      isEmailVerified: true,
      profile: {
        create: {
          firstName: "Ada",
          lastName: "Buyer",
          city: "Lagos",
          state: "Lagos",
        },
      },
    },
    include: { profile: true },
  });

  const agents: { userId: string; agentId: string }[] = [];

  for (const a of AGENT_SEEDS) {
    const u = await prisma.user.upsert({
      where: { email: a.email },
      update: { passwordHash: SEED_PASSWORD_HASH },
      create: {
        email: a.email,
        passwordHash: SEED_PASSWORD_HASH,
        role: UserRole.agent,
        isEmailVerified: true,
        agent: {
          create: {
            agencyName: a.agencyName,
            kycStatus: KycStatus.verified,
            isVerified: true,
            specializations: [...a.specs],
          },
        },
        profile: {
          create: {
            firstName: a.firstName,
            lastName: a.lastName,
            city: a.city,
            state: a.state,
          },
        },
      },
      include: { agent: true },
    });
    if (!u.agent) throw new Error(`seed: agent missing for ${a.email}`);
    agents.push({ userId: u.id, agentId: u.agent.id });
  }

  const developerUser = await ensureSeedDeveloperPrincipal();

  for (const p of PROVIDER_SEEDS) {
    await prisma.user.upsert({
      where: { email: p.email },
      update: { passwordHash: SEED_PASSWORD_HASH },
      create: {
        email: p.email,
        passwordHash: SEED_PASSWORD_HASH,
        role: UserRole.service_provider,
        isEmailVerified: true,
        serviceProvider: {
          create: {
            businessName: p.businessName,
            slug: p.slug,
            category: p.category,
            city: p.city,
            state: p.state,
          },
        },
        profile: {
          create: {
            firstName: p.firstName,
            lastName: p.lastName,
          },
        },
      },
    });
  }

  await prisma.$executeRaw`
    UPDATE service_providers
    SET geom = ST_SetSRID(ST_MakePoint(3.3792, 6.5244), 4326)::geography
    WHERE ("city" ILIKE 'Lagos%' OR "state" ILIKE 'Lagos') AND geom IS NULL
  `;
  await prisma.$executeRaw`
    UPDATE service_providers
    SET geom = ST_SetSRID(ST_MakePoint(7.3986, 9.0765), 4326)::geography
    WHERE ("city" ILIKE 'Abuja%' OR "state" ILIKE 'FCT') AND geom IS NULL
  `;
  await prisma.$executeRaw`
    UPDATE service_providers
    SET geom = ST_SetSRID(ST_MakePoint(7.0498, 4.8156), 4326)::geography
    WHERE ("city" ILIKE 'Port Harcourt%' OR "state" ILIKE 'Rivers') AND geom IS NULL
  `;
  await prisma.$executeRaw`
    UPDATE service_providers
    SET geom = ST_SetSRID(ST_MakePoint(3.947, 7.3775), 4326)::geography
    WHERE ("city" ILIKE 'Ibadan%' OR "state" ILIKE 'Oyo') AND geom IS NULL
  `;

  for (const b of SERVICE_BUNDLE_SEEDS) {
    await prisma.serviceBundle.upsert({
      where: { slug: b.slug },
      update: {
        name: b.name,
        description: b.description,
        categories: [...b.categories],
        priceFromKobo: b.priceFromKobo,
        priceToKobo: b.priceToKobo,
        triggerContext: b.triggerContext,
        isActive: true,
      },
      create: {
        name: b.name,
        slug: b.slug,
        description: b.description,
        categories: [...b.categories],
        priceFromKobo: b.priceFromKobo,
        priceToKobo: b.priceToKobo,
        triggerContext: b.triggerContext,
      },
    });
  }

  for (const row of PROPERTY_LISTING_SEEDS) {
    const property = await prisma.property.upsert({
      where: { slug: row.slug },
      update: {
        title: row.title,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
      },
      create: {
        title: row.title,
        slug: row.slug,
        description: row.description,
        propertyType: row.propertyType,
        city: row.city,
        state: row.state,
        latitude: row.latitude,
        longitude: row.longitude,
      },
    });

    const agent = agents[row.agentIndex];
    if (!agent) throw new Error(`seed: bad agentIndex for ${row.slug}`);

    await prisma.listing.upsert({
      where: { id: row.listingId },
      update: {
        propertyId: property.id,
        agentId: agent.agentId,
        userId: agent.userId,
        price: BigInt(row.priceKobo),
        status: ListingStatus.active,
        isFeatured: row.isFeatured,
        publishedAt: new Date(),
      },
      create: {
        id: row.listingId,
        propertyId: property.id,
        agentId: agent.agentId,
        userId: agent.userId,
        price: BigInt(row.priceKobo),
        status: ListingStatus.active,
        isFeatured: row.isFeatured,
        publishedAt: new Date(),
      },
    });
  }

  await prisma.$executeRaw`
    UPDATE properties
    SET geom = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `;

  for (const a of agents) {
    const n = await prisma.listing.count({ where: { agentId: a.agentId } });
    await prisma.agent.update({
      where: { id: a.agentId },
      data: { totalListings: n },
    });
  }

  const slugToId = new Map<string, string>();
  const projectRows: { id: string; slug: string }[] = [];

  for (const row of DEVELOPER_PROJECT_SEEDS) {
    const unitPriceA =
      row.priceRangeMax > BigInt(0)
        ? row.priceRangeMax / BigInt(2)
        : BigInt("5000000000");
    const unitPriceB =
      row.priceRangeMin > BigInt(0) ? row.priceRangeMin : BigInt("4500000000");

    const p = await prisma.developerProject.upsert({
      where: { slug: row.slug },
      update: {
        developerId: developerUser.developer.id,
        name: row.name,
        shortDescription: row.shortDescription,
        description: row.description,
        status: row.status,
        propertyType: row.propertyType,
        city: row.city,
        state: row.state,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        totalUnits: row.totalUnits,
        soldUnits: row.soldUnits,
        availableUnits: row.availableUnits,
        priceRangeMin: row.priceRangeMin,
        priceRangeMax: row.priceRangeMax,
        images: [...row.images],
        amenities: [...row.amenities],
        features: [...row.features],
        viewCount: row.viewCount,
      },
      create: {
        developerId: developerUser.developer.id,
        name: row.name,
        slug: row.slug,
        shortDescription: row.shortDescription,
        description: row.description,
        status: row.status,
        propertyType: row.propertyType,
        city: row.city,
        state: row.state,
        country: "Nigeria",
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        totalUnits: row.totalUnits,
        soldUnits: row.soldUnits,
        availableUnits: row.availableUnits,
        priceRangeMin: row.priceRangeMin,
        priceRangeMax: row.priceRangeMax,
        images: [...row.images],
        amenities: [...row.amenities],
        features: [...row.features],
        viewCount: row.viewCount,
        floorPlans: [],
      },
    });
    slugToId.set(row.slug, p.id);
    projectRows.push({ id: p.id, slug: row.slug });

    await prisma.projectUnit.deleteMany({ where: { projectId: p.id } });
    await prisma.projectUnit.createMany({
      data: [
        {
          projectId: p.id,
          unitName: "Block A · Type 1",
          unitType: "3 Bedroom",
          bedrooms: 3,
          bathrooms: 3,
          squareMeters: 145,
          price: unitPriceA,
          status: UnitStatus.available,
          features: [],
        },
        {
          projectId: p.id,
          unitName: "Block B · Type 2",
          unitType: "2 Bedroom",
          bedrooms: 2,
          bathrooms: 2,
          squareMeters: 98,
          price: unitPriceB,
          status: UnitStatus.available,
          features: [],
        },
      ],
    });
  }

  await prisma.$executeRaw`
    UPDATE developer_projects
    SET geom = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography
    WHERE "developerId" = ${developerUser.developer.id}::uuid
      AND latitude IS NOT NULL AND longitude IS NOT NULL
  `;

  for (const q of DEVELOPER_PROJECT_INQUIRY_SEEDS) {
    const projectId = slugToId.get(q.projectSlug);
    if (!projectId) throw new Error(`seed: unknown project slug ${q.projectSlug}`);
    const respondedAt = "respondedAt" in q && q.respondedAt ? new Date() : null;
    const closedAt = "closedAt" in q && q.closedAt ? new Date() : null;
    const closedReason = "closedReason" in q ? q.closedReason : null;
    await prisma.inquiry.upsert({
      where: { id: q.id },
      update: {
        projectId,
        status: q.status,
        message: q.message,
        buyerName: q.buyerName ?? null,
        buyerEmail: q.buyerEmail ?? null,
        buyerPhone: q.buyerPhone ?? null,
        source: q.source,
        respondedAt,
        closedAt,
        closedReason: closedReason ?? null,
      },
      create: {
        id: q.id,
        projectId,
        buyerId: buyer.id,
        listingId: null,
        agentId: null,
        source: q.source,
        status: q.status,
        message: q.message,
        buyerName: q.buyerName ?? null,
        buyerEmail: q.buyerEmail ?? null,
        buyerPhone: q.buyerPhone ?? null,
        respondedAt,
        closedAt,
        closedReason: closedReason ?? null,
      },
    });
  }

  for (const pr of projectRows) {
    const inquiryCount = await prisma.inquiry.count({ where: { projectId: pr.id } });
    await prisma.developerProject.update({
      where: { id: pr.id },
      data: { inquiryCount },
    });
  }

  const devStats = await prisma.developerProject.aggregate({
    where: { developerId: developerUser.developer.id, deletedAt: null },
    _count: { id: true },
    _sum: { soldUnits: true },
  });
  await prisma.developer.update({
    where: { id: developerUser.developer.id },
    data: {
      totalProjects: devStats._count.id,
      totalUnitsSold: devStats._sum.soldUnits ?? 0,
    },
  });

  if (SEED_DEVELOPER_EMAIL !== "developer@example.test") {
    const legacyDemo = await prisma.user.findUnique({
      where: { email: "developer@example.test" },
      include: { developer: true },
    });
    if (legacyDemo?.developer && legacyDemo.developer.id !== developerUser.developer.id) {
      const legacyStats = await prisma.developerProject.aggregate({
        where: { developerId: legacyDemo.developer.id, deletedAt: null },
        _count: { id: true },
        _sum: { soldUnits: true },
      });
      await prisma.developer.update({
        where: { id: legacyDemo.developer.id },
        data: {
          totalProjects: legacyStats._count.id,
          totalUnitsSold: legacyStats._sum.soldUnits ?? 0,
        },
      });
    }
  }

  await prisma.rawWhatsAppMessage.upsert({
    where: { messageId: "wamid.demo.seed.001" },
    update: {},
    create: {
      messageId: "wamid.demo.seed.001",
      groupId: "demo-group-whatsapp-1",
      senderPhone: "+2348000000001",
      senderName: "Listings Bot",
      messageType: "text",
      textContent: "Fresh 4 bed duplex in Ikoyi, ₦950m negotiable.",
      mediaUrls: [],
      status: WhatsAppMessageStatus.PENDING,
      confidenceScore: 0.42,
    },
  });

  await prisma.rawWhatsAppMessage.upsert({
    where: { messageId: "wamid.demo.seed.002" },
    update: {},
    create: {
      messageId: "wamid.demo.seed.002",
      groupId: "demo-group-whatsapp-1",
      senderPhone: "+2348000000002",
      senderName: "Field Scout",
      messageType: "text",
      textContent: "50x100 fenced land beside express, Asaba.",
      mediaUrls: [],
      status: WhatsAppMessageStatus.PROCESSED,
      confidenceScore: 0.88,
      extractedData: {
        inferredCity: "Asaba",
        inferredType: "land",
      },
    },
  });

  const primaryAgentId = agents[0]?.agentId;
  if (!primaryAgentId) throw new Error("seed: no agents");

  await prisma.inquiry.upsert({
    where: { id: "33333333-3333-3333-3333-333333333331" },
    update: {},
    create: {
      id: "33333333-3333-3333-3333-333333333331",
      listingId: "22222222-2222-2222-2222-222222222222",
      buyerId: buyer.id,
      agentId: primaryAgentId,
      source: InquirySource.web,
      status: InquiryStatus.new,
      message: "Is the title C of O verified?",
    },
  });

  console.log(
    `Seed OK: ${PROPERTY_LISTING_SEEDS.length} properties/listings, ${DEVELOPER_PROJECT_SEEDS.length} developer projects (owner ${SEED_DEVELOPER_EMAIL}), ${AGENT_SEEDS.length} agents, ${PROVIDER_SEEDS.length} service providers, ${SERVICE_BUNDLE_SEEDS.length} service bundles.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
