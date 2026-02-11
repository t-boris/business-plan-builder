import type { BusinessType } from "@/types";

export interface BusinessTypeTemplate {
  type: BusinessType;
  name: string;
  icon: string;
  description: string;
  defaultSections: string[];
}

export const BUSINESS_TYPE_TEMPLATES: BusinessTypeTemplate[] = [
  {
    type: "saas",
    name: "SaaS / Software",
    icon: "Cloud",
    description:
      "Software-as-a-service, subscription-based products, digital platforms",
    defaultSections: [
      "executive-summary",
      "market-analysis",
      "product-service",
      "marketing-strategy",
      "operations",
      "financial-projections",
      "risks-due-diligence",
      "kpis-metrics",
      "launch-plan",
    ],
  },
  {
    type: "service",
    name: "Service / Consulting",
    icon: "Users",
    description:
      "Professional services, consulting, freelance, agency businesses",
    defaultSections: [
      "executive-summary",
      "market-analysis",
      "product-service",
      "marketing-strategy",
      "operations",
      "financial-projections",
      "risks-due-diligence",
    ],
  },
  {
    type: "retail",
    name: "Retail / E-commerce",
    icon: "ShoppingBag",
    description: "Physical or online stores, product-based businesses",
    defaultSections: [
      "executive-summary",
      "market-analysis",
      "product-service",
      "marketing-strategy",
      "operations",
      "financial-projections",
      "risks-due-diligence",
      "kpis-metrics",
    ],
  },
  {
    type: "restaurant",
    name: "Restaurant / Food",
    icon: "UtensilsCrossed",
    description:
      "Restaurants, cafes, food trucks, catering, food delivery",
    defaultSections: [
      "executive-summary",
      "market-analysis",
      "product-service",
      "marketing-strategy",
      "operations",
      "financial-projections",
      "risks-due-diligence",
    ],
  },
  {
    type: "event",
    name: "Event / Entertainment",
    icon: "PartyPopper",
    description:
      "Events, entertainment venues, experiences, recreation",
    defaultSections: [
      "executive-summary",
      "market-analysis",
      "product-service",
      "marketing-strategy",
      "operations",
      "financial-projections",
      "risks-due-diligence",
      "launch-plan",
    ],
  },
  {
    type: "manufacturing",
    name: "Manufacturing",
    icon: "Factory",
    description:
      "Production, manufacturing, hardware, physical products at scale",
    defaultSections: [
      "executive-summary",
      "market-analysis",
      "product-service",
      "marketing-strategy",
      "operations",
      "financial-projections",
      "risks-due-diligence",
      "kpis-metrics",
    ],
  },
  {
    type: "custom",
    name: "Custom",
    icon: "Sparkles",
    description: "Start from scratch with a blank business plan",
    defaultSections: [
      "executive-summary",
      "market-analysis",
      "product-service",
      "marketing-strategy",
      "operations",
      "financial-projections",
    ],
  },
];
