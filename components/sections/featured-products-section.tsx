"use client";

import { FadeImage } from "@/components/fade-image";

const features = [
  {
    title: "Legacy",
    description: "Cape Coast, Elmina & Assin Manso",
    image: "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    title: "Opportunity",
    description: "Networking, Dialogue & Future Pathways",
    image: "https://images.pexels.com/photos/917510/pexels-photo-917510.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

export function FeaturedProductsSection() {
  return (
    <section id="pillars" className="bg-background">
      {/* Section Title */}
      <div className="px-6 py-20 text-center md:px-12 md:py-28 lg:px-20 lg:py-32 lg:pb-20">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          Journey Pillars
        </h2>
        <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
          Two core pillars of the Journey to Africa experience.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-6 px-6 pb-20 md:grid-cols-2 md:px-12 lg:px-20">
        {features.map((feature) => (
          <div key={feature.title} className="group">
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <FadeImage
                src={feature.image || "/placeholder.svg"}
                alt={feature.title}
                fill
                className="object-cover group-hover:scale-105"
              />
            </div>
            {/* Content */}
            <div className="py-6">
              <h3 className="text-foreground text-xl font-bold mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Link */}
      <div className="flex justify-center px-6 pb-28 md:px-12 lg:px-20">
        
      </div>
    </section>
  );
}
