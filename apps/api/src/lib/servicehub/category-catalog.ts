import type { ServiceCategory } from "@landshoppers/db";

export type ServicehubSubCategory = { code: string; label: string };

export type ServicehubCategoryEntry = {
  id: ServiceCategory;
  name: string;
  iconTag: string;
  subCategories: ServicehubSubCategory[];
};

/** §1.4 — canonical public copy + stable sub-category codes for filters and onboarding. */
export const SERVICEHUB_CATEGORY_CATALOG: ServicehubCategoryEntry[] = [
  {
    id: "legal",
    name: "Legal & Title",
    iconTag: "legal",
    subCategories: [
      { code: "title_perfection", label: "Title perfection" },
      { code: "deed_assignment", label: "Deed of assignment" },
      { code: "sro", label: "Statutory right of occupancy" },
      { code: "governors_consent", label: "Governor's consent" },
      { code: "probate", label: "Probate" },
      { code: "contract_review", label: "Contract review" },
      { code: "dispute_resolution", label: "Dispute resolution" },
    ],
  },
  {
    id: "survey",
    name: "Survey & Mapping",
    iconTag: "survey",
    subCategories: [
      { code: "land_survey", label: "Land survey" },
      { code: "topographic", label: "Topographic survey" },
      { code: "building_survey", label: "Building survey" },
      { code: "boundary", label: "Boundary demarcation" },
      { code: "gis", label: "GIS mapping" },
      { code: "survey_plan", label: "Survey plan preparation" },
    ],
  },
  {
    id: "valuation",
    name: "Valuation & Appraisal",
    iconTag: "valuation",
    subCategories: [
      { code: "property_valuation", label: "Property valuation" },
      { code: "plant_machinery", label: "Plant & machinery" },
      { code: "business_valuation", label: "Business valuation" },
      { code: "insurance_valuation", label: "Insurance valuation" },
      { code: "mortgage_valuation", label: "Mortgage valuation" },
      { code: "portfolio_valuation", label: "Portfolio valuation" },
    ],
  },
  {
    id: "architecture",
    name: "Architecture & Design",
    iconTag: "architecture",
    subCategories: [
      { code: "architectural_design", label: "Architectural design" },
      { code: "interior_design", label: "Interior design" },
      { code: "structural_engineering", label: "Structural engineering" },
      { code: "mep", label: "MEP engineering" },
      { code: "quantity_surveying", label: "Quantity surveying" },
      { code: "space_planning", label: "Space planning" },
    ],
  },
  {
    id: "photography",
    name: "Photography & Media",
    iconTag: "photography",
    subCategories: [
      { code: "property_photography", label: "Property photography" },
      { code: "drone", label: "Drone aerial" },
      { code: "videography", label: "Videography" },
      { code: "virtual_tour", label: "Virtual tour" },
      { code: "render_3d", label: "3D render" },
      { code: "floor_plan", label: "Floor plan drawing" },
      { code: "virtual_staging", label: "Virtual staging" },
    ],
  },
  {
    id: "mortgage",
    name: "Mortgage & Finance",
    iconTag: "mortgage",
    subCategories: [
      { code: "mortgage_origination", label: "Mortgage origination" },
      { code: "mortgage_advisory", label: "Mortgage advisory" },
      { code: "refinancing", label: "Refinancing" },
      { code: "nhf", label: "NHF processing" },
      { code: "infrastructure_bond", label: "Infrastructure bond" },
      { code: "investment_advisory", label: "Investment advisory" },
    ],
  },
  {
    id: "renovation",
    name: "Construction & Renovation",
    iconTag: "renovation",
    subCategories: [
      { code: "general_contractor", label: "General contractor" },
      { code: "building_materials", label: "Building materials" },
      { code: "roofing", label: "Roofing" },
      { code: "plumbing", label: "Plumbing" },
      { code: "electrical", label: "Electrical" },
      { code: "tiling", label: "Tiling" },
      { code: "painting", label: "Painting" },
      { code: "landscaping", label: "Landscaping" },
    ],
  },
  {
    id: "property_management",
    name: "Property Management",
    iconTag: "property_management",
    subCategories: [
      { code: "facility_management", label: "Facility management" },
      { code: "tenant_screening", label: "Tenant screening" },
      { code: "rent_collection", label: "Rent collection" },
      { code: "maintenance_management", label: "Maintenance management" },
      { code: "concierge", label: "Concierge services" },
    ],
  },
  {
    id: "insurance",
    name: "Insurance",
    iconTag: "insurance",
    subCategories: [
      { code: "homeowners", label: "Homeowner's insurance" },
      { code: "fire_perils", label: "Fire & special perils" },
      { code: "landlord", label: "Landlord insurance" },
      { code: "mortgage_protection", label: "Mortgage protection" },
      { code: "title_insurance", label: "Title insurance" },
    ],
  },
  {
    id: "cleaning_moving",
    name: "Cleaning & Moving",
    iconTag: "cleaning_moving",
    subCategories: [
      { code: "pre_purchase_cleaning", label: "Pre-purchase inspection cleaning" },
      { code: "move_in_cleaning", label: "Move-in cleaning" },
      { code: "moving_packing", label: "Moving & packing" },
      { code: "storage", label: "Storage" },
      { code: "fumigation", label: "Fumigation" },
      { code: "waste_disposal", label: "Waste disposal" },
    ],
  },
  {
    id: "home_technology",
    name: "Home Technology",
    iconTag: "home_technology",
    subCategories: [
      { code: "smart_home", label: "Smart home installation" },
      { code: "cctv_security", label: "CCTV & security systems" },
      { code: "solar_backup", label: "Solar & backup power" },
      { code: "internet_infra", label: "Internet infrastructure" },
      { code: "home_automation", label: "Home automation" },
    ],
  },
  {
    id: "inspection",
    name: "Inspection & Certification",
    iconTag: "inspection",
    subCategories: [
      { code: "pre_purchase_inspection", label: "Pre-purchase inspection" },
      { code: "building_compliance", label: "Building compliance" },
      { code: "fire_safety", label: "Fire safety" },
      { code: "environmental", label: "Environmental assessment" },
      { code: "soil_test", label: "Soil test" },
      { code: "structural_integrity", label: "Structural integrity" },
    ],
  },
];

const CATALOG_BY_ID = new Map(
  SERVICEHUB_CATEGORY_CATALOG.map((c) => [c.id, c] as const),
);

export function servicehubCategoryEntry(category: ServiceCategory): ServicehubCategoryEntry | undefined {
  return CATALOG_BY_ID.get(category);
}
