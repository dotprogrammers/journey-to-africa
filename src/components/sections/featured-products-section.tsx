"use client";

import { useEffect, useState } from "react";
import { FadeImage } from "@/components/fade-image";

export function FeaturedProductsSection() {
  const [features, setFeatures] = useState<any[]>([]);
  const [contentBlock, setContentBlock] = useState<any>(null);

  useEffect(() => {
    // Fetch items
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/features`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data && json.data.pillars) {
          setFeatures(json.data.pillars);
        }
      })
      .catch(err => console.error("Error fetching pillars:", err));

    // Fetch section info
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/blocks`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data?.pillars) {
          setContentBlock(json.data.pillars[0]);
        }
      })
      .catch(err => console.error("Error fetching pillar blocks:", err));
  }, []);

  const displayTitle = contentBlock?.title || "Journey Pillars";
  const displaySubtitle = contentBlock?.subtitle || "Two core pillars of the Journey to Africa experience.";

  const displayFeatures = features.length > 0 ? features : [
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
  return (
    <section id="pillars" className="bg-background">
      {/* Section Title */}
      <div className="px-6 py-20 text-center md:px-12 md:py-28 lg:px-20 lg:py-32 lg:pb-20">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          {displayTitle}
        </h2>
        <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
          {displaySubtitle}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-6 px-6 pb-20 md:grid-cols-2 md:px-12 lg:px-20">
        {displayFeatures.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-1 bg-white"
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)' }}
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <FadeImage
                src={feature.image_url || feature.image || "/placeholder.svg"}
                alt={feature.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            {/* Content */}
            <div className="py-6 px-6">
              <h3 className="text-foreground text-xl font-extrabold mb-2 font-serif tracking-tight group-hover:text-primary transition-colors duration-300">
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
