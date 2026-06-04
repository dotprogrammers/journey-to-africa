"use client";

import { useEffect, useState } from "react";

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface TripData {
  id: string;
  name: string;
  pricing: PricingTier[];
  stats: Record<string, string>[];
}

interface ContentBlockData {
  title?: string;
  items?: Array<{ description?: string }>;
}

export function PricingSection() {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [contentBlock, setContentBlock] = useState<ContentBlockData | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/trips`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setTrips(json.data);
        }
      })
      .catch(err => console.error("Error fetching trips:", err));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/blocks`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data?.pricing) {
          setContentBlock(json.data.pricing[0]);
        }
      })
      .catch(err => console.error("Error fetching pricing blocks:", err));
  }, []);

  const activeTrip = trips[0]; // For now, use the first active trip
  const displayTitle = contentBlock?.title || "Reserve Your Tier";
  const displayDisclaimer = contentBlock?.items?.[0]?.description || "Land package only. International flights, visa fees, travel insurance, and personal spending are not included.";

  return (
    <section id="pricing" className="bg-background py-20 md:py-32 lg:py-40">
      <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">{displayTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {activeTrip?.pricing?.map((tier) => (
            <div key={tier.id} className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center">
              <span className="text-lg font-bold text-foreground mb-2">{tier.name}</span>
              <span className="text-sm text-muted-foreground mb-1">{tier.description}</span>
              <span className="text-2xl font-bold text-foreground mb-2">
                ${new Intl.NumberFormat().format(tier.price)}
              </span>
            </div>
          )) || (
            <>
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center">
                <span className="text-lg font-bold text-foreground mb-2">Early Bird</span>
                <span className="text-sm text-muted-foreground mb-1">First 10 Spots</span>
                <span className="text-2xl font-bold text-foreground mb-2">$3,200</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center">
                <span className="text-lg font-bold text-foreground mb-2">Standard Rate</span>
                <span className="text-sm text-muted-foreground mb-1">Regular Admission</span>
                <span className="text-2xl font-bold text-foreground mb-2">$3,500</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center">
                <span className="text-lg font-bold text-foreground mb-2">VIP Legacy Tier</span>
                <span className="text-sm text-muted-foreground mb-1">Premium Access</span>
                <span className="text-2xl font-bold text-foreground mb-2">$4,200</span>
              </div>
            </>
          )}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">{displayDisclaimer}</p>
      </div>
    </section>
  );
}
