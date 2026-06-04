"use client";

import { useEffect, useState } from "react";

interface StatItem {
  label?: string;
  title?: string;
  value?: string;
  subtitle?: string;
  sortOrder?: number;
  sort_order?: number;
}

interface TripData {
  stats: StatItem[];
}

interface ContentBlockData {
  items?: StatItem[];
  content?: string;
}

export function StatsSection() {
  const [trip, setTrip] = useState<TripData | null>(null);
  const [contentBlock, setContentBlock] = useState<ContentBlockData | null>(null);

  useEffect(() => {
    // Fetch Trip Stats
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/trips`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data?.length > 0) {
          setTrip(json.data[0]);
        }
      })
      .catch(err => console.error("Error fetching trips:", err));

    // Fetch Content Block
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/blocks`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data?.stats) {
          setContentBlock(json.data.stats[0]);
        }
      })
      .catch(err => console.error("Error fetching blocks:", err));
  }, []);

  const stats: StatItem[] = [...(trip?.stats || contentBlock?.items || [])].sort((a, b) => (a.sortOrder ?? a.sort_order ?? 0) - (b.sortOrder ?? b.sort_order ?? 0));

  return (
    <section id="stats" className="bg-background py-20 md:py-32 lg:py-40">
      <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{stat.label || stat.title}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value || stat.subtitle}</p>
            </div>
          ))}
        </div>
        <p className="text-base md:text-lg text-muted-foreground mt-6">
          {contentBlock?.content || "Journey to Africa is created for travelers who want substance, beauty, and direction in one experience—grounded in Ghana’s history and open to its future."}
        </p>
      </div>
    </section>
  );
}
