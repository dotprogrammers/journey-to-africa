import { Header } from "@/components/header";
import { HeroSection } from "@/components/sections/hero-section";
import { PhilosophySection } from "@/components/sections/philosophy-section";
import { FeaturedProductsSection } from "@/components/sections/featured-products-section";
import { TechnologySection } from "@/components/sections/technology-section";
import { GallerySection } from "@/components/sections/gallery-section";
import { CollectionSection } from "@/components/sections/collection-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { StatsSection } from "@/components/sections/stats-section";
import { ReserveSection } from "@/components/sections/reserve-section";
import { NotIncludedSection } from "@/components/sections/not-included-section";
import { WhoSection } from "@/components/sections/who-section";
import { HostSection } from "@/components/sections/host-section";
import { EditorialSection } from "@/components/sections/editorial-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { FooterSection } from "@/components/sections/footer-section";
import { db } from "@/lib/db";

const sectionComponents: Record<string, React.ComponentType> = {
  hero_section: HeroSection,
  philosophy_section: PhilosophySection,
  featured_products_section: FeaturedProductsSection,
  technology_section: TechnologySection,
  gallery_section: GallerySection,
  collection_section: CollectionSection,
  pricing_section: PricingSection,
  stats_section: StatsSection,
  reserve_section: ReserveSection,
  not_included_section: NotIncludedSection,
  who_section: WhoSection,
  host_section: HostSection,
  editorial_section: EditorialSection,
  testimonials_section: TestimonialsSection,
  footer_section: FooterSection,
};

async function getActiveSections() {
  try {
    const sections = await db.section.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true },
    });
    return sections.map((s) => s.slug);
  } catch {
    return Object.keys(sectionComponents);
  }
}

export default async function Home() {
  const activeSlugs = await getActiveSections();

  const orderedSections = Object.keys(sectionComponents).filter((slug) =>
    activeSlugs.includes(slug)
  );

  return (
    <main className="min-h-screen bg-background">
      <Header />
      {orderedSections.map((slug) => {
        const Component = sectionComponents[slug];
        return Component ? <Component key={slug} /> : null;
      })}
    </main>
  );
}
