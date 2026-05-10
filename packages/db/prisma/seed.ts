import {
  InquirySource,
  InquiryStatus,
  KycStatus,
  ListingStatus,
  ProjectStatus,
  PropertyType,
  ServiceCategory,
  UserRole,
  WhatsAppMessageStatus,
  createPrismaClient,
} from "@landshoppers/db";
import bcrypt from "bcryptjs";

const prisma = createPrismaClient();

/** Demo login for seeded accounts (`buyer@example.test`, agents, etc.). */
const SEED_LOGIN_PASSWORD = "Password123!";
const SEED_PASSWORD_HASH = bcrypt.hashSync(SEED_LOGIN_PASSWORD, 10);

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

/** Eight listings with coordinates across Lagos / Abuja (framework seed counts). */
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

  const developerUser = await prisma.user.upsert({
    where: { email: "developer@example.test" },
    update: { passwordHash: SEED_PASSWORD_HASH },
    create: {
      email: "developer@example.test",
      passwordHash: SEED_PASSWORD_HASH,
      role: UserRole.developer,
      isEmailVerified: true,
      developer: {
        create: {
          companyName: "Demo Estates Ltd",
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

  if (!developerUser.developer) throw new Error("seed: developer missing");

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

  const project = await prisma.developerProject.upsert({
    where: { slug: "demo-pipeline-residence" },
    update: {},
    create: {
      developerId: developerUser.developer.id,
      name: "Pipeline Residence",
      slug: "demo-pipeline-residence",
      shortDescription: "Waterfront-inspired seed project.",
      status: ProjectStatus.ONGOING,
      propertyType: PropertyType.estate_unit,
      city: "Lagos",
      state: "Lagos",
      latitude: 6.455,
      longitude: 3.3941,
      totalUnits: 48,
      availableUnits: 12,
      soldUnits: 4,
      amenities: ["generator", "security"],
      features: [],
      images: [],
      floorPlans: [],
    },
  });

  await prisma.$executeRaw`
    UPDATE developer_projects
    SET geom = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography
    WHERE id = ${project.id}
      AND latitude IS NOT NULL AND longitude IS NOT NULL
  `;

  await prisma.projectUnit.deleteMany({ where: { projectId: project.id } });

  await prisma.projectUnit.createMany({
    data: [
      {
        projectId: project.id,
        unitName: "Tower A · 3 Bed",
        unitType: "3 Bedroom",
        bedrooms: 3,
        bathrooms: 3,
        price: BigInt("8500000000"),
      },
      {
        projectId: project.id,
        unitName: "Tower B · 2 Bed",
        unitType: "2 Bedroom",
        bedrooms: 2,
        bathrooms: 2,
        price: BigInt("6200000000"),
      },
    ],
  });

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

  await prisma.inquiry.upsert({
    where: { id: "33333333-3333-3333-3333-333333333332" },
    update: {},
    create: {
      id: "33333333-3333-3333-3333-333333333332",
      projectId: project.id,
      buyerId: buyer.id,
      source: InquirySource.direct,
      status: InquiryStatus.responded,
      message: "Do you still have penthouse inventory?",
      respondedAt: new Date(),
    },
  });

  console.log(
    `Seed OK: ${PROPERTY_LISTING_SEEDS.length} properties/listings, ${AGENT_SEEDS.length} agents, ${PROVIDER_SEEDS.length} service providers.`,
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
