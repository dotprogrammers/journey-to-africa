import { db } from "@/lib/db";

export interface SiteData {
  settings: Record<string, Record<string, string>>;
  sections: Record<string, any>;
  navLinks: { header: any[]; footer: any[] };
  pricingTiers: any[];
}

export async function getSiteData(): Promise<SiteData> {
  // Fetch all data in parallel directly from the database
  const [settings, sections, headerNav, footerNav, tiers] = await Promise.all([
    db.siteSetting.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }] }).catch(() => []),
    db.section.findMany({
      where: { isActive: true },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }).catch(() => []),
    db.navigationLink.findMany({
      where: { location: "header", isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }).catch(() => []),
    db.navigationLink.findMany({
      where: { location: "footer", isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }).catch(() => []),
    db.pricingTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }).catch(() => []),
  ]);

  // Index sections by slug for easy lookup
  const sectionsMap: Record<string, any> = {};
  for (const section of sections) {
    sectionsMap[section.slug] = section;
  }

  // Flatten settings to key-value pairs per group
  const settingsMap: Record<string, Record<string, string>> = {};
  for (const setting of settings) {
    if (!settingsMap[setting.group]) {
      settingsMap[setting.group] = {};
    }
    settingsMap[setting.group][setting.key] = setting.value;
  }

  // Calculate availability for pricing tiers
  const tiersWithAvailability = tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    subtitle: tier.subtitle,
    price: tier.price,
    currency: tier.currency,
    maxCapacity: tier.maxCapacity,
    currentBookings: tier.currentBookings,
    availableSlots: tier.maxCapacity - tier.currentBookings,
    isEarlyBird: tier.isEarlyBird,
    earlyBirdEndsAt: tier.earlyBirdEndsAt?.toISOString() || null,
    features: tier.features,
    sortOrder: tier.sortOrder,
    isActive: tier.isActive,
  }));

  return {
    settings: settingsMap,
    sections: sectionsMap,
    navLinks: {
      header: JSON.parse(JSON.stringify(headerNav)),
      footer: JSON.parse(JSON.stringify(footerNav)),
    },
    pricingTiers: tiersWithAvailability,
  };
}
