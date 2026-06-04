import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clean up existing data (order matters due to foreign keys)
  console.log("🧹 Cleaning existing data...");
  await prisma.paystackWebhook.deleteMany();
  await prisma.stripeWebhook.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingTraveler.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sectionItem.deleteMany();
  await prisma.section.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.navigationLink.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.pricingTier.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.adminIpWhitelist.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.adminUser.deleteMany();
  console.log("✅ Existing data cleaned.\n");

  // ============================================================
  // 1. ADMIN USER
  // ============================================================
  console.log("👤 Creating admin users...");
  const hashedPassword = await hash("admin123", 12);
  const superAdmin = await prisma.adminUser.create({
    data: {
      email: "super_admin@journeytoafrica.com",
      name: "Super Admin",
      hashedPassword,
      role: "super_admin",
      isActive: true,
    },
  });
  const admin = await prisma.adminUser.create({
    data: {
      email: "admin@journeytoafrica.com",
      name: "Standard Admin",
      hashedPassword,
      role: "admin",
      isActive: true,
    },
  });
  console.log(`  ✅ Super Admin user: ${superAdmin.email}`);
  console.log(`  ✅ Standard Admin user: ${admin.email}\n`);

  // ============================================================
  // 2. SITE SETTINGS
  // ============================================================
  console.log("⚙️  Creating site settings...");
  const siteSettings = [
    // General group
    { group: "general", key: "site_name", value: "Journey to Africa", type: "string", label: "Site Name", description: "The name of the website", sortOrder: 1 },
    { group: "general", key: "site_description", value: "Journey to Africa is a premium Ghana-based legacy experience reconnecting the diaspora through history, reflection, culture, and future-facing engagement.", type: "text", label: "Site Description", description: "Brief description of the site", sortOrder: 2 },
    { group: "general", key: "site_keywords", value: "Ghana, diaspora, heritage travel, Africa experience, Juneteenth, legacy journey, Cape Coast, cultural immersion", type: "string", label: "Site Keywords", description: "Comma-separated keywords for the site", sortOrder: 3 },
    { group: "general", key: "brand_positioning", value: "A premium diaspora experience designed for those who want more than tourism.", type: "text", label: "Brand Positioning", description: "Brand positioning statement", sortOrder: 4 },
    { group: "general", key: "copyright_text", value: "2026 Journey to Africa. All rights reserved.", type: "string", label: "Copyright Text", description: "Copyright notice displayed in the footer", sortOrder: 5 },
    { group: "general", key: "logo_text", value: "JOURNEY TO AFRICA", type: "string", label: "Logo Text", description: "Text displayed in the header logo", sortOrder: 6 },
    // SEO group
    { group: "seo", key: "meta_title", value: "Journey to Africa — Return to Ghana with Purpose", type: "string", label: "Meta Title", description: "Default meta title for SEO", sortOrder: 1 },
    { group: "seo", key: "meta_description", value: "A 10-day curated diaspora journey through Ghana centered on history, reflection, culture, and meaningful connection to Africa's future. Juneteenth Legacy & Investment Experience.", type: "text", label: "Meta Description", description: "Default meta description for SEO", sortOrder: 2 },
    { group: "seo", key: "meta_keywords", value: "Ghana, diaspora journey, heritage travel, Juneteenth, Cape Coast, Elmina, Assin Manso, cultural experience, Africa investment", type: "string", label: "Meta Keywords", description: "Default meta keywords for SEO", sortOrder: 3 },
    // Appearance group
    { group: "appearance", key: "favicon_light", value: "/icon-light-32x32.png", type: "file", label: "Favicon (Light)", description: "Favicon for light mode", sortOrder: 1 },
    { group: "appearance", key: "favicon_dark", value: "/icon-dark-32x32.png", type: "file", label: "Favicon (Dark)", description: "Favicon for dark mode", sortOrder: 2 },
    { group: "appearance", key: "favicon_svg", value: "/icon.svg", type: "file", label: "Favicon (SVG)", description: "SVG favicon", sortOrder: 3 },
    { group: "appearance", key: "apple_icon", value: "/apple-icon.png", type: "file", label: "Apple Touch Icon", description: "Apple touch icon", sortOrder: 4 },
  ];

  for (const setting of siteSettings) {
    await prisma.siteSetting.create({ data: setting });
  }
  console.log(`  ✅ Created ${siteSettings.length} site settings\n`);

  // ============================================================
  // 3. NAVIGATION LINKS
  // ============================================================
  console.log("🔗 Creating navigation links...");

  // Header navigation
  const headerLinks = [
    { location: "header", label: "Experience", url: "#experience", sortOrder: 1 },
    { location: "header", label: "Legacy", url: "#legacy", sortOrder: 2 },
    { location: "header", label: "Gallery", url: "#gallery", sortOrder: 3 },
    { location: "header", label: "Reserve", url: "#reserve", sortOrder: 4 },
    { location: "header", label: "Apply Now", url: "#reserve", sortOrder: 5 },
  ];

  // Footer navigation with groups
  const footerLinks = [
    { location: "footer", groupName: "Experience", label: "Overview", url: "#experience", sortOrder: 1 },
    { location: "footer", groupName: "Experience", label: "Included", url: "#inclusions", sortOrder: 2 },
    { location: "footer", groupName: "Experience", label: "Pricing", url: "#pricing", sortOrder: 3 },
    { location: "footer", groupName: "Experience", label: "Reserve", url: "#reserve", sortOrder: 4 },
    { location: "footer", groupName: "About", label: "Our Mission", url: "#", sortOrder: 5 },
    { location: "footer", groupName: "About", label: "Hosts", url: "#host", sortOrder: 6 },
    { location: "footer", groupName: "About", label: "Ghana 2026", url: "#stats", sortOrder: 7 },
    { location: "footer", groupName: "About", label: "Contact", url: "#", sortOrder: 8 },
    { location: "footer", groupName: "Support", label: "FAQ", url: "#", sortOrder: 9 },
    { location: "footer", groupName: "Support", label: "Payments", url: "#", sortOrder: 10 },
    { location: "footer", groupName: "Support", label: "Terms", url: "#", sortOrder: 11 },
    { location: "footer", groupName: "Support", label: "Travel Notes", url: "#", sortOrder: 12 },
  ];

  const allNavLinks = [...headerLinks, ...footerLinks];
  for (const link of allNavLinks) {
    await prisma.navigationLink.create({ data: link });
  }
  console.log(`  ✅ Created ${allNavLinks.length} navigation links\n`);

  // ============================================================
  // 4. SECTIONS WITH ITEMS
  // ============================================================
  console.log("📄 Creating sections and items...");

  // --- hero_section ---
  const heroSection = await prisma.section.create({
    data: {
      slug: "hero_section",
      name: "Hero Section",
      heading: "JOURNEY TO AFRICA",
      subheading: "Return to Ghana with purpose.",
      description: "A 10-day curated diaspora journey through Ghana centered on history, reflection, culture, and meaningful connection to Africa's future.",
      label: "Juneteenth Legacy & Investment Experience",
      ctaPrimaryText: "Reserve Your Place",
      ctaPrimaryLink: "#reserve",
      ctaSecondaryText: "View Experience",
      ctaSecondaryLink: "#experience",
      sortOrder: 1,
      isActive: true,
    },
  });

  const heroItems = [
    { itemType: "image", title: "Main Hero Image", image: "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&cs=tinysrgb&w=2000", imageAlt: "Mountain landscape with camping tent at sunset", sortOrder: 0 },
    { itemType: "image", title: "Side Image Left 1", image: "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1000", imageAlt: "Mountain hiking adventure", sortOrder: 1 },
    { itemType: "image", title: "Side Image Left 2", image: "https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=1000", imageAlt: "Camping under stars", sortOrder: 2 },
    { itemType: "image", title: "Side Image Right 1", image: "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1000", imageAlt: "Forest exploration", sortOrder: 3 },
    { itemType: "image", title: "Side Image Right 2", image: "https://images.pexels.com/photos/1687093/pexels-photo-1687093.jpeg?auto=compress&cs=tinysrgb&w=1000", imageAlt: "Lake camping view", sortOrder: 4 },
    { itemType: "tagline", description: "Lightweight, durable\nand adventure-ready.", sortOrder: 5 },
  ];

  for (const item of heroItems) {
    await prisma.sectionItem.create({ data: { sectionId: heroSection.id, ...item } });
  }
  console.log("  ✅ hero_section with 6 items");

  // --- philosophy_section ---
  const philosophySection = await prisma.section.create({
    data: {
      slug: "philosophy_section",
      name: "Philosophy Section",
      heading: "More Than a Journey—A Homecoming",
      description: "Journey to Africa is a premium diaspora experience designed for those who want more than tourism. It brings together historical remembrance, spiritual reflection, cultural immersion, and structured exposure to business and investment pathways in Ghana.",
      label: "Flagship Experience",
      backgroundImage: "https://images.pexels.com/photos/167964/pexels-photo-167964.jpeg?auto=compress&fit=crop&w=1200&q=80",
      sortOrder: 2,
      isActive: true,
    },
  });
  console.log("  ✅ philosophy_section with 0 items");

  // --- pillars_section ---
  const pillarsSection = await prisma.section.create({
    data: {
      slug: "pillars_section",
      name: "Pillars Section",
      heading: "Journey Pillars",
      subheading: "Two core pillars of the Journey to Africa experience.",
      sortOrder: 3,
      isActive: true,
    },
  });

  const pillarItems = [
    {
      itemType: "pillar",
      title: "Legacy",
      subtitle: "Cape Coast, Elmina & Assin Manso",
      image: "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800",
      imageAlt: "Legacy pillar",
      sortOrder: 0,
    },
    {
      itemType: "pillar",
      title: "Opportunity",
      subtitle: "Networking, Dialogue & Future Pathways",
      image: "https://images.pexels.com/photos/917510/pexels-photo-917510.jpeg?auto=compress&cs=tinysrgb&w=800",
      imageAlt: "Opportunity pillar",
      sortOrder: 1,
    },
  ];

  for (const item of pillarItems) {
    await prisma.sectionItem.create({ data: { sectionId: pillarsSection.id, ...item } });
  }
  console.log("  ✅ pillars_section with 2 items");

  // --- experience_section ---
  const experienceSection = await prisma.section.create({
    data: {
      slug: "experience_section",
      name: "Experience Section",
      heading: "Built for Legacy. Designed for Return.",
      label: "The Experience",
      sortOrder: 4,
      isActive: true,
    },
  });

  const experienceItems = [
    { itemType: "feature", title: "History", subtitle: "Cape Coast & Elmina Experience", description: "Walk through the historic sites that anchor the journey in truth, memory, and global Black history.", sortOrder: 0 },
    { itemType: "feature", title: "Reflection", subtitle: "Assin Manso Ceremony", description: "A powerful moment of remembrance, reconnection, and personal reflection.", sortOrder: 1 },
    { itemType: "feature", title: "Culture", subtitle: "Juneteenth in Ghana", description: "Celebrate freedom, heritage, and contemporary African identity in community.", sortOrder: 2 },
    { itemType: "feature", title: "Connection", subtitle: "Business Networking Event", description: "Meet founders, professionals, and ecosystem builders shaping Ghana's future.", sortOrder: 3 },
    { itemType: "feature", title: "Spirituality", subtitle: "Mosque & Dialogue Visit", description: "Engage faith, culture, and African spiritual life in a grounded and respectful setting.", sortOrder: 4 },
    { itemType: "feature", title: "Community", subtitle: "Welcome & Farewell Legacy Dinners", description: "Begin and end the experience in fellowship, conversation, and intentional connection.", sortOrder: 5 },
  ];

  for (const item of experienceItems) {
    await prisma.sectionItem.create({ data: { sectionId: experienceSection.id, ...item } });
  }
  console.log("  ✅ experience_section with 6 items");

  // --- gallery_section ---
  const gallerySection = await prisma.section.create({
    data: {
      slug: "gallery_section",
      name: "Gallery Section",
      heading: "Moments of Return",
      subheading: "History. Celebration. Reflection. Connection.",
      sortOrder: 5,
      isActive: true,
    },
  });

  const galleryItems = [
    { itemType: "image", image: "https://images.pexels.com/photos/1208777/pexels-photo-1208777.jpeg?auto=compress&cs=tinysrgb&w=1200", imageAlt: "Adventure cycling", sortOrder: 0 },
    { itemType: "image", image: "https://images.pexels.com/photos/1659437/pexels-photo-1659437.jpeg?auto=compress&cs=tinysrgb&w=1200", imageAlt: "Lake reflection", sortOrder: 1 },
    { itemType: "image", image: "https://images.pexels.com/photos/2450296/pexels-photo-2450296.jpeg?auto=compress&cs=tinysrgb&w=1200", imageAlt: "Kayaking adventure", sortOrder: 2 },
    { itemType: "image", image: "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1200", imageAlt: "Stream crossing", sortOrder: 3 },
    { itemType: "image", image: "https://images.pexels.com/photos/1309584/pexels-photo-1309584.jpeg?auto=compress&cs=tinysrgb&w=1200", imageAlt: "Campfire warmth", sortOrder: 4 },
    { itemType: "image", image: "https://images.pexels.com/photos/869258/pexels-photo-869258.jpeg?auto=compress&cs=tinysrgb&w=1200", imageAlt: "Snow adventure", sortOrder: 5 },
    { itemType: "image", image: "https://images.pexels.com/photos/1578750/pexels-photo-1578750.jpeg?auto=compress&cs=tinysrgb&w=1200", imageAlt: "Mountain summit", sortOrder: 6 },
    { itemType: "image", image: "https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=1200", imageAlt: "Canyon views", sortOrder: 7 },
  ];

  for (const item of galleryItems) {
    await prisma.sectionItem.create({ data: { sectionId: gallerySection.id, ...item } });
  }
  console.log("  ✅ gallery_section with 8 items");

  // --- inclusions_section ---
  const inclusionsSection = await prisma.section.create({
    data: {
      slug: "inclusions_section",
      name: "Inclusions Section",
      heading: "What's Included",
      sortOrder: 6,
      isActive: true,
    },
  });

  const inclusionItems = [
    { itemType: "feature", title: "9 Nights Accommodation", description: "Premium stay in Ghana based on double occupancy.", image: "https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&w=800", imageAlt: "9 Nights Accommodation", sortOrder: 0 },
    { itemType: "feature", title: "Daily Breakfast", description: "A smooth and reliable start to each day.", image: "https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?auto=compress&cs=tinysrgb&w=800", imageAlt: "Daily Breakfast", sortOrder: 1 },
    { itemType: "feature", title: "Ground Transportation", description: "Private coordinated transport throughout the journey.", image: "https://images.pexels.com/photos/5807587/pexels-photo-5807587.jpeg?auto=compress&cs=tinysrgb&w=800", imageAlt: "Ground Transportation", sortOrder: 2 },
    { itemType: "feature", title: "Airport Transfers", description: "Arrival and departure support included.", image: "https://images.pexels.com/photos/7260250/pexels-photo-7260250.jpeg?auto=compress&cs=tinysrgb&w=800", imageAlt: "Airport Transfers", sortOrder: 3 },
    { itemType: "feature", title: "Historic Site Access", description: "Cape Coast, Elmina, and Assin Manso experiences included.", image: "https://images.pexels.com/photos/3077882/pexels-photo-3077882.jpeg?auto=compress&cs=tinysrgb&w=800", imageAlt: "Historic Site Access", sortOrder: 4 },
    { itemType: "feature", title: "Signature Events", description: "Juneteenth access, networking event, welcome dinner, farewell dinner, and professional group photos.", image: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=800", imageAlt: "Signature Events", sortOrder: 5 },
    { itemType: "feature", title: "Mosque Visit & Dialogue", description: "Meaningful cultural and spiritual engagement.", image: "https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?auto=compress&cs=tinysrgb&w=800", imageAlt: "Mosque Visit & Dialogue", sortOrder: 6 },
    { itemType: "feature", title: "Professional Group Photos", description: "High-quality visual keepsakes from the experience.", image: "https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&w=800", imageAlt: "Professional Group Photos", sortOrder: 7 },
    { itemType: "feature", title: "Curated Group Experience", description: "Designed for purposeful travelers, not mass tourism.", image: "https://images.pexels.com/photos/5807587/pexels-photo-5807587.jpeg?auto=compress&cs=tinysrgb&w=800", imageAlt: "Curated Group Experience", sortOrder: 8 },
  ];

  for (const item of inclusionItems) {
    await prisma.sectionItem.create({ data: { sectionId: inclusionsSection.id, ...item } });
  }
  console.log("  ✅ inclusions_section with 9 items");

  // --- pricing_section ---
  const pricingSection = await prisma.section.create({
    data: {
      slug: "pricing_section",
      name: "Pricing Section",
      heading: "Reserve Your Tier",
      disclaimer: "Land package only. International flights, visa fees, travel insurance, and personal spending are not included.",
      sortOrder: 7,
      isActive: true,
    },
  });

  const pricingItems = [
    { itemType: "tier", title: "Early Bird", subtitle: "First 10 Spots", price: 3200, priceLabel: "$3,200", sortOrder: 0 },
    { itemType: "tier", title: "Standard Rate", subtitle: "Regular Admission", price: 3500, priceLabel: "$3,500", sortOrder: 1 },
    { itemType: "tier", title: "VIP Legacy Tier", subtitle: "Premium Access", price: 4200, priceLabel: "$4,200", sortOrder: 2 },
  ];

  for (const item of pricingItems) {
    await prisma.sectionItem.create({ data: { sectionId: pricingSection.id, ...item } });
  }
  console.log("  ✅ pricing_section with 3 items");

  // --- stats_section ---
  const statsSection = await prisma.section.create({
    data: {
      slug: "stats_section",
      name: "Stats Section",
      description: "Journey to Africa is created for travelers who want substance, beauty, and direction in one experience—grounded in Ghana's history and open to its future.",
      sortOrder: 8,
      isActive: true,
    },
  });

  const statItems = [
    { itemType: "stat", title: "Duration", subtitle: "10 Days", sortOrder: 0 },
    { itemType: "stat", title: "Dates", subtitle: "June 15–24, 2026", sortOrder: 1 },
    { itemType: "stat", title: "Location", subtitle: "Accra, Cape Coast & Elmina", sortOrder: 2 },
    { itemType: "stat", title: "Format", subtitle: "Land Package Only", sortOrder: 3 },
  ];

  for (const item of statItems) {
    await prisma.sectionItem.create({ data: { sectionId: statsSection.id, ...item } });
  }
  console.log("  ✅ stats_section with 4 items");

  // --- reserve_section ---
  const reserveSection = await prisma.section.create({
    data: {
      slug: "reserve_section",
      name: "Reserve Section",
      heading: "Apply for the 2026 Cohort",
      description: "Spaces are intentionally limited to preserve the quality of the experience and the strength of the group. Submit your interest to receive full itinerary details, next steps, and reservation guidance.",
      ctaPrimaryText: "Apply Now",
      ctaPrimaryLink: "#reserve",
      note: "Early Bird pricing is limited to the first 10 confirmed participants.",
      sortOrder: 9,
      isActive: true,
    },
  });
  console.log("  ✅ reserve_section with 0 items");

  // --- not_included_section ---
  const notIncludedSection = await prisma.section.create({
    data: {
      slug: "not_included_section",
      name: "Not Included Section",
      heading: "Not Included",
      description: "International flights, visa fees, travel insurance, and personal spending.",
      sortOrder: 10,
      isActive: true,
    },
  });
  console.log("  ✅ not_included_section with 0 items");

  // --- who_section ---
  const whoSection = await prisma.section.create({
    data: {
      slug: "who_section",
      name: "Who Section",
      heading: "Who This Is For",
      description: "Journey to Africa is designed for members of the diaspora, professionals, founders, faith-conscious travelers, and culturally serious explorers who want a deeper relationship with Ghana and the continent.",
      sortOrder: 11,
      isActive: true,
    },
  });
  console.log("  ✅ who_section with 0 items");

  // --- host_section ---
  const hostSection = await prisma.section.create({
    data: {
      slug: "host_section",
      name: "Host Section",
      heading: "Hosted By",
      sortOrder: 12,
      isActive: true,
    },
  });

  const hostItems = [
    { itemType: "host", title: "Hassan \"Shoot With Haz\"", description: "Visual storyteller and cultural curator helping shape a powerful return experience through media, memory, and community.", sortOrder: 0 },
    { itemType: "host", title: "Ajib Abdus-Salaam", description: "Co-host and experience architect focused on meaningful diaspora engagement, structure, and on-ground coordination.", sortOrder: 1 },
  ];

  for (const item of hostItems) {
    await prisma.sectionItem.create({ data: { sectionId: hostSection.id, ...item } });
  }
  console.log("  ✅ host_section with 2 items");

  // --- editorial_section ---
  const editorialSection = await prisma.section.create({
    data: {
      slug: "editorial_section",
      name: "Editorial Section",
      heading: "Where Heritage Meets Future.",
      description: "This is not a standard group trip. Journey to Africa is a carefully curated return experience for members of the diaspora who want to engage Ghana with depth and direction. Over ten days, guests move from places of historical significance into spaces of celebration, dialogue, and opportunity—building not only memories, but meaningful pathways for long-term connection with Africa.",
      backgroundImage: "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&fit=crop&w=1200&q=80",
      sortOrder: 13,
      isActive: true,
    },
  });
  console.log("  ✅ editorial_section with 0 items");

  // --- testimonials_section ---
  const testimonialsSection = await prisma.section.create({
    data: {
      slug: "testimonials_section",
      name: "Testimonials Section",
      description: "Alpine & Forest accessories combine aerospace-grade materials with cutting-edge technology — designed for explorers who refuse to compromise on quality or performance in the wild.",
      sortOrder: 14,
      isActive: true,
    },
  });

  // Testimonial image
  await prisma.sectionItem.create({
    data: {
      sectionId: testimonialsSection.id,
      itemType: "image",
      image: "https://images.pexels.com/photos/1366909/pexels-photo-1366909.jpeg?auto=compress&cs=tinysrgb&w=2000",
      imageAlt: "Mountain peaks at sunrise",
      sortOrder: 0,
    },
  });
  console.log("  ✅ testimonials_section with 1 item");

  // --- footer_section ---
  const footerSection = await prisma.section.create({
    data: {
      slug: "footer_section",
      name: "Footer Section",
      heading: "JOURNEY TO AFRICA",
      description: "Journey to Africa is a premium Ghana-based legacy experience reconnecting the diaspora through history, reflection, culture, and future-facing engagement.",
      note: "2026 Journey to Africa. All rights reserved.",
      sortOrder: 15,
      isActive: true,
    },
  });
  console.log("  ✅ footer_section with 0 items");

  console.log("");

  // ============================================================
  // 5. PRICING TIERS
  // ============================================================
  console.log("💰 Creating pricing tiers...");

  const earlyBirdFeatures = JSON.stringify([
    "9 Nights Accommodation",
    "Daily Breakfast",
    "Ground Transportation",
    "Airport Transfers",
    "Historic Site Access",
    "Signature Events",
    "Mosque Visit & Dialogue",
    "Professional Group Photos",
    "Curated Group Experience",
    "Early Bird Priority Access",
  ]);

  const standardFeatures = JSON.stringify([
    "9 Nights Accommodation",
    "Daily Breakfast",
    "Ground Transportation",
    "Airport Transfers",
    "Historic Site Access",
    "Signature Events",
    "Mosque Visit & Dialogue",
    "Professional Group Photos",
    "Curated Group Experience",
  ]);

  const vipFeatures = JSON.stringify([
    "9 Nights Accommodation (Premium)",
    "Daily Breakfast",
    "Ground Transportation (Private)",
    "Airport Transfers (VIP)",
    "Historic Site Access (Private Guide)",
    "Signature Events (Priority Seating)",
    "Mosque Visit & Dialogue",
    "Professional Group Photos",
    "Curated Group Experience",
    "VIP Welcome Package",
    "Private Networking Sessions",
  ]);

  const pricingTiers = [
    {
      name: "Early Bird",
      subtitle: "First 10 Spots",
      price: 3200,
      currency: "USD",
      maxCapacity: 10,
      currentBookings: 0,
      isEarlyBird: true,
      earlyBirdEndsAt: new Date("2026-03-15T00:00:00Z"),
      features: earlyBirdFeatures,
      sortOrder: 0,
      isActive: true,
    },
    {
      name: "Standard Rate",
      subtitle: "Regular Admission",
      price: 3500,
      currency: "USD",
      maxCapacity: 20,
      currentBookings: 0,
      isEarlyBird: false,
      features: standardFeatures,
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "VIP Legacy Tier",
      subtitle: "Premium Access",
      price: 4200,
      currency: "USD",
      maxCapacity: 10,
      currentBookings: 0,
      isEarlyBird: false,
      features: vipFeatures,
      sortOrder: 2,
      isActive: true,
    },
  ];

  for (const tier of pricingTiers) {
    await prisma.pricingTier.create({ data: tier });
  }
  console.log(`  ✅ Created ${pricingTiers.length} pricing tiers\n`);

  // ============================================================
  // 6. EMAIL TEMPLATES
  // ============================================================
  console.log("📧 Creating email templates...");

  // Common header/footer for all email templates
  const emailHeader = `
  <tr>
    <td style="background-color: #1a1a2e; padding: 32px 40px; text-align: center;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="text-align: center;">
            <h1 style="margin: 0; font-family: 'Georgia', 'Times New Roman', serif; font-size: 22px; font-weight: 700; color: #d4a843; letter-spacing: 3px;">JOURNEY TO AFRICA</h1>
            <p style="margin: 6px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #8b8b9e; letter-spacing: 1.5px; text-transform: uppercase;">Return to Ghana with Purpose</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
  const emailFooter = `
  <tr>
    <td style="background-color: #1a1a2e; padding: 24px 40px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #8b8b9e;">&copy; 2026 Journey to Africa. All rights reserved.</p>
      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #5a5a6e;">Accra, Cape Coast &amp; Elmina, Ghana &bull; June 15&ndash;24, 2026</p>
    </td>
  </tr>`;

  const emailTemplates = [
    {
      slug: "booking_received",
      name: "Booking Received",
      subject: "Your Journey to Africa Booking Has Been Received - {{bookingReference}}",
      bodyHtml: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your Journey to Africa Booking Has Been Received</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f0f5;">
    <tr>
      <td style="padding: 40px 16px;" align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
${emailHeader}
          <tr>
            <td style="padding: 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <p style="margin: 0; font-size: 26px; font-weight: 700; color: #1a1a2e; font-family: 'Georgia', 'Times New Roman', serif;">Your Booking Has Been Received</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div style="width: 60px; height: 3px; background-color: #d4a843; border-radius: 2px;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Dear {{name}},</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Thank you for applying for the <strong>Journey to Africa 2026 Cohort</strong>. We have received your booking and are reviewing it carefully. Spaces are intentionally limited to preserve the quality of the experience.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #faf8f2; border-radius: 10px; border: 1px solid #e8e0c8;">
                      <tr>
                        <td style="padding: 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-bottom: 14px; border-bottom: 1px solid #e8e0c8;">
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #d4a843; text-transform: uppercase; letter-spacing: 1px;">Booking Reference</p>
                                <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #1a1a2e;">{{bookingReference}}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 14px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="padding-bottom: 10px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Tier</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 600; color: #1a1a2e;">{{tierName}}</p>
                                    </td>
                                    <td style="padding-bottom: 10px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Travelers</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 600; color: #1a1a2e;">{{numberOfTravelers}}</p>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colspan="2" style="padding-top: 14px; border-top: 1px solid #e8e0c8;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</p>
                                      <p style="margin: 3px 0 0 0; font-size: 22px; font-weight: 700; color: #d4a843;">{{currency}} {{totalAmount}}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border-radius: 10px; border-left: 4px solid #22c55e;">
                      <tr>
                        <td style="padding: 18px 20px;">
                          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #166534;">What Happens Next?</p>
                          <p style="margin: 6px 0 0 0; font-size: 14px; color: #374151; line-height: 1.5;">Our team will review your application. Once confirmed, you will receive a payment link to secure your spot. Please complete payment within 48 hours of confirmation.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Warm regards,</p>
                    <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">The Journey to Africa Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      bodyText: `Dear {{name}},\n\nThank you for applying for the Journey to Africa 2026 Cohort! We have received your booking.\n\nBooking Reference: {{bookingReference}}\nTier: {{tierName}}\nTravelers: {{numberOfTravelers}}\nTotal: {{currency}} {{totalAmount}}\n\nOur team will review your application. Once confirmed, you will receive a payment link to secure your spot.\n\nWarm regards,\nThe Journey to Africa Team`,
      availableVariables: JSON.stringify(["name", "bookingReference", "tierName", "totalAmount", "currency", "numberOfTravelers"]),
    },
    {
      slug: "booking_confirmed",
      name: "Booking Confirmed",
      subject: "Your Journey to Africa Booking Is Confirmed - {{bookingReference}}",
      bodyHtml: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your Journey to Africa Booking Is Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f0f5;">
    <tr>
      <td style="padding: 40px 16px;" align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
${emailHeader}
          <tr>
            <td style="padding: 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom: 8px; text-align: center;">
                    <p style="margin: 0 0 12px 0; font-size: 40px;">&#127881;</p>
                    <p style="margin: 0; font-size: 26px; font-weight: 700; color: #1a1a2e; font-family: 'Georgia', 'Times New Roman', serif;">You're In!</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px; text-align: center;">
                    <div style="width: 60px; height: 3px; background-color: #d4a843; border-radius: 2px; margin: 0 auto;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Dear {{name}},</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Great news! Your booking for <strong>Journey to Africa</strong> has been confirmed. We're excited to welcome you to the 2026 Cohort for an unforgettable 10-day experience through Ghana.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0;">
                      <tr>
                        <td style="padding: 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-bottom: 14px; border-bottom: 1px solid #bbf7d0;">
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #16a34a; text-transform: uppercase; letter-spacing: 1px;">Confirmed Booking</p>
                                <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #166534;">{{bookingReference}}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 14px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="padding-bottom: 10px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Tier</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 600; color: #166534;">{{tierName}}</p>
                                    </td>
                                    <td style="padding-bottom: 10px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Dates</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 600; color: #166534;">June 15&ndash;24, 2026</p>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colspan="2" style="padding-top: 14px; border-top: 1px solid #bbf7d0;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</p>
                                      <p style="margin: 3px 0 0 0; font-size: 22px; font-weight: 700; color: #166534;">{{currency}} {{totalAmount}}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border-radius: 10px; border-left: 4px solid #f59e0b;">
                      <tr>
                        <td style="padding: 18px 20px;">
                          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #92400e;">Payment Required Within 48 Hours</p>
                          <p style="margin: 6px 0 0 0; font-size: 14px; color: #374151; line-height: 1.5;">You will receive a payment link shortly. Please complete your payment within <strong>48 hours</strong> to secure your spot. Unpaid bookings may be released.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Warm regards,</p>
                    <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">The Journey to Africa Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      bodyText: `Dear {{name}},\n\nGreat news! Your booking for Journey to Africa has been confirmed!\n\nBooking Reference: {{bookingReference}}\nTier: {{tierName}}\nDates: June 15-24, 2026\nTotal: {{currency}} {{totalAmount}}\n\nIMPORTANT: You will receive a payment link shortly. Please complete payment within 48 hours to secure your spot.\n\nWarm regards,\nThe Journey to Africa Team`,
      availableVariables: JSON.stringify(["name", "bookingReference", "tierName", "totalAmount", "currency"]),
    },
    {
      slug: "payment_successful",
      name: "Payment Successful",
      subject: "Payment Received - Journey to Africa {{bookingReference}}",
      bodyHtml: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Payment Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f0f5;">
    <tr>
      <td style="padding: 40px 16px;" align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
${emailHeader}
          <tr>
            <td style="padding: 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom: 8px; text-align: center;">
                    <p style="margin: 0 0 12px 0; font-size: 40px;">&#9989;</p>
                    <p style="margin: 0; font-size: 26px; font-weight: 700; color: #1a1a2e; font-family: 'Georgia', 'Times New Roman', serif;">Payment Confirmed</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px; text-align: center;">
                    <div style="width: 60px; height: 3px; background-color: #d4a843; border-radius: 2px; margin: 0 auto;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Dear {{name}},</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">We've received your payment for <strong>Journey to Africa</strong>. Your spot is now fully secured! Get ready for an incredible 10-day journey through Ghana.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0;">
                      <tr>
                        <td style="padding: 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-bottom: 14px; border-bottom: 1px solid #bbf7d0;">
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #16a34a; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</p>
                                <p style="margin: 4px 0 0 0; font-size: 26px; font-weight: 700; color: #166534;">{{currency}} {{amountPaid}}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 14px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="padding-bottom: 10px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Booking Reference</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 600; color: #166534;">{{bookingReference}}</p>
                                    </td>
                                    <td style="padding-bottom: 10px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Payment Date</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 600; color: #166534;">{{paymentDate}}</p>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colspan="2" style="padding-top: 14px; border-top: 1px solid #bbf7d0;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Payment Reference</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 600; color: #166534;">{{paymentReference}}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #faf8f2; border-radius: 10px; border-left: 4px solid #d4a843;">
                      <tr>
                        <td style="padding: 18px 20px;">
                          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #92400e;">What's Next?</p>
                          <p style="margin: 6px 0 0 0; font-size: 14px; color: #374151; line-height: 1.5;">Your invoice will be sent shortly. In the meantime, start preparing for your journey &mdash; check visa requirements, book flights, and pack for an adventure of a lifetime!</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Warm regards,</p>
                    <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">The Journey to Africa Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      bodyText: `Dear {{name}},\n\nWe've received your payment for Journey to Africa. Your spot is now fully secured!\n\nAmount Paid: {{currency}} {{amountPaid}}\nBooking Reference: {{bookingReference}}\nPayment Reference: {{paymentReference}}\nPayment Date: {{paymentDate}}\n\nYour invoice will be sent shortly.\n\nWarm regards,\nThe Journey to Africa Team`,
      availableVariables: JSON.stringify(["name", "bookingReference", "amountPaid", "currency", "paymentReference", "paymentDate"]),
    },
    {
      slug: "booking_status_changed",
      name: "Booking Status Changed",
      subject: "Booking Update - {{bookingReference}}",
      bodyHtml: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Booking Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f0f5;">
    <tr>
      <td style="padding: 40px 16px;" align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
${emailHeader}
          <tr>
            <td style="padding: 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <p style="margin: 0; font-size: 26px; font-weight: 700; color: #1a1a2e; font-family: 'Georgia', 'Times New Roman', serif;">Booking Update</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div style="width: 60px; height: 3px; background-color: #d4a843; border-radius: 2px;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Dear {{name}},</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">There's been an update to your <strong>Journey to Africa</strong> booking. Please review the details below.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #faf8f2; border-radius: 10px; border: 1px solid #e8e0c8;">
                      <tr>
                        <td style="padding: 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-bottom: 14px; border-bottom: 1px solid #e8e0c8;">
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #d4a843; text-transform: uppercase; letter-spacing: 1px;">Booking Reference</p>
                                <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #1a1a2e;">{{bookingReference}}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 14px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="padding-bottom: 12px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Previous Status</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 600; color: #6b7280; text-decoration: line-through;">{{previousStatus}}</p>
                                    </td>
                                    <td style="padding-bottom: 12px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #d4a843; text-transform: uppercase; letter-spacing: 0.5px;">New Status</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 700; color: #1a1a2e;">{{currentStatus}}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #6366f1;">
                      <tr>
                        <td style="padding: 18px 20px;">
                          <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">{{statusMessage}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">If you have any questions about this update, please don't hesitate to reach out to our team.</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Warm regards,</p>
                    <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">The Journey to Africa Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      bodyText: `Dear {{name}},\n\nThere's been an update to your Journey to Africa booking.\n\nBooking Reference: {{bookingReference}}\nPrevious Status: {{previousStatus}}\nNew Status: {{currentStatus}}\n\n{{statusMessage}}\n\nIf you have any questions, please don't hesitate to reach out.\n\nWarm regards,\nThe Journey to Africa Team`,
      availableVariables: JSON.stringify(["name", "bookingReference", "previousStatus", "currentStatus", "statusMessage"]),
    },
    {
      slug: "booking_completed_with_invoice",
      name: "Booking Completed with Invoice",
      subject: "Your Journey to Africa Is Complete - Invoice Attached",
      bodyHtml: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your Journey to Africa Is Complete</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f0f5;">
    <tr>
      <td style="padding: 40px 16px;" align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
${emailHeader}
          <tr>
            <td style="padding: 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom: 8px; text-align: center;">
                    <p style="margin: 0 0 12px 0; font-size: 40px;">&#127775;</p>
                    <p style="margin: 0; font-size: 26px; font-weight: 700; color: #1a1a2e; font-family: 'Georgia', 'Times New Roman', serif;">Your Journey Is Complete</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px; text-align: center;">
                    <div style="width: 60px; height: 3px; background-color: #d4a843; border-radius: 2px; margin: 0 auto;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Dear {{name}},</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Thank you for being part of <strong>Journey to Africa</strong>. We hope this experience was transformative and that the connections you made will last a lifetime. Your invoice is ready for your records.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #faf8f2; border-radius: 10px; border: 1px solid #e8e0c8;">
                      <tr>
                        <td style="padding: 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-bottom: 14px; border-bottom: 1px solid #e8e0c8;">
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #d4a843; text-transform: uppercase; letter-spacing: 1px;">Invoice Number</p>
                                <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #1a1a2e;">{{invoiceNumber}}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 14px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="padding-bottom: 10px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Booking Reference</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 600; color: #1a1a2e;">{{bookingReference}}</p>
                                    </td>
                                    <td style="padding-bottom: 10px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</p>
                                      <p style="margin: 3px 0 0 0; font-size: 18px; font-weight: 700; color: #d4a843;">{{currency}} {{totalAmount}}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 28px; text-align: center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background-color: #1a1a2e; border-radius: 8px;">
                          <a href="{{invoiceUrl}}" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 600; color: #d4a843; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Download Invoice</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #faf8f2; border-radius: 10px; border-left: 4px solid #d4a843;">
                      <tr>
                        <td style="padding: 18px 20px;">
                          <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6; font-style: italic;">&ldquo;The journey of a thousand miles begins with a single step, and yours led you home.&rdquo;</p>
                          <p style="margin: 10px 0 0 0; font-size: 13px; color: #9ca3af;">We hope to welcome you back again. Africa will always be here for you.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">With gratitude,</p>
                    <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">The Journey to Africa Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      bodyText: `Dear {{name}},\n\nThank you for being part of Journey to Africa. We hope this experience was transformative.\n\nInvoice Number: {{invoiceNumber}}\nBooking Reference: {{bookingReference}}\nTotal: {{currency}} {{totalAmount}}\n\nDownload your invoice at: {{invoiceUrl}}\n\nWith gratitude,\nThe Journey to Africa Team`,
      availableVariables: JSON.stringify(["name", "invoiceNumber", "bookingReference", "totalAmount", "currency", "invoiceUrl"]),
    },
    {
      slug: "booking_cancelled",
      name: "Booking Cancelled",
      subject: "Booking Cancelled - {{bookingReference}}",
      bodyHtml: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Booking Cancelled</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f0f5;">
    <tr>
      <td style="padding: 40px 16px;" align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
${emailHeader}
          <tr>
            <td style="padding: 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <p style="margin: 0; font-size: 26px; font-weight: 700; color: #1a1a2e; font-family: 'Georgia', 'Times New Roman', serif;">Booking Cancelled</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div style="width: 60px; height: 3px; background-color: #ef4444; border-radius: 2px;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Dear {{name}},</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">We're sorry to see you go. Your <strong>Journey to Africa</strong> booking has been cancelled as requested. Below are the details of this cancellation.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef2f2; border-radius: 10px; border: 1px solid #fecaca;">
                      <tr>
                        <td style="padding: 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-bottom: 14px; border-bottom: 1px solid #fecaca;">
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #dc2626; text-transform: uppercase; letter-spacing: 1px;">Cancelled Booking</p>
                                <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #991b1b;">{{bookingReference}}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 14px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="padding-bottom: 10px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Cancelled On</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 600; color: #991b1b;">{{cancellationDate}}</p>
                                    </td>
                                    <td style="padding-bottom: 10px; width: 50%; vertical-align: top;">
                                      <p style="margin: 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Reason</p>
                                      <p style="margin: 3px 0 0 0; font-size: 15px; font-weight: 600; color: #991b1b;">{{cancellationReason}}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border-radius: 10px; border-left: 4px solid #f59e0b;">
                      <tr>
                        <td style="padding: 18px 20px;">
                          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #92400e;">Refund Information</p>
                          <p style="margin: 6px 0 0 0; font-size: 14px; color: #374151; line-height: 1.5;">{{refundInfo}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">If you did not request this cancellation or have any questions, please contact our team immediately.</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">We hope to welcome you on a future journey.</p>
                    <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">The Journey to Africa Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      bodyText: `Dear {{name}},\n\nWe're sorry to see you go. Your Journey to Africa booking has been cancelled.\n\nBooking Reference: {{bookingReference}}\nCancelled On: {{cancellationDate}}\nReason: {{cancellationReason}}\n\nRefund Info: {{refundInfo}}\n\nIf you did not request this cancellation, please contact us immediately.\n\nWe hope to welcome you on a future journey.\nThe Journey to Africa Team`,
      availableVariables: JSON.stringify(["name", "bookingReference", "cancellationDate", "cancellationReason", "refundInfo"]),
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.create({ data: template });
  }
  console.log(`  ✅ Created ${emailTemplates.length} email templates\n`);

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("📊 Record counts:");
  const counts = {
    adminUsers: await prisma.adminUser.count(),
    users: await prisma.user.count(),
    siteSettings: await prisma.siteSetting.count(),
    sections: await prisma.section.count(),
    sectionItems: await prisma.sectionItem.count(),
    navigationLinks: await prisma.navigationLink.count(),
    pricingTiers: await prisma.pricingTier.count(),
    emailTemplates: await prisma.emailTemplate.count(),
    mediaFiles: await prisma.mediaFile.count(),
    bookings: await prisma.booking.count(),
    payments: await prisma.payment.count(),
    invoices: await prisma.invoice.count(),
    emailLogs: await prisma.emailLog.count(),
    activityLogs: await prisma.activityLog.count(),
    paystackWebhooks: await prisma.paystackWebhook.count(),
    bookingTravelers: await prisma.bookingTraveler.count(),
  };

  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`);
  }

  console.log("\n🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
