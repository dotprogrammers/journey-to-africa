"use client";

import { useEffect, useState } from "react";

export function StatsSection() {
  const [trip, setTrip] = useState<any>(null);
  const [contentBlock, setContentBlock] = useState<any>(null);

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
        if (json.data?.stats_experience) {
          setContentBlock(json.data.stats_experience[0]);
        }
      })
      .catch(err => console.error("Error fetching blocks:", err));
  }, []);

  return (
    <section id="stats" className="bg-background py-20 md:py-32 lg:py-40">
      <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Duration</p>
            <p className="text-2xl font-bold text-foreground">10 Days</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Dates</p>
            <p className="text-2xl font-bold text-foreground">
              {trip ? `${trip.dates.start}–${trip.dates.end}` : "June 15–24, 2026"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Location</p>
            <p className="text-2xl font-bold text-foreground">{trip?.location || "Accra, Cape Coast & Elmina"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Format</p>
            <p className="text-2xl font-bold text-foreground">Land Package Only</p>
          </div>
        </div>
        <p className="text-base md:text-lg text-muted-foreground mt-6">
          {contentBlock?.content || "Journey to Africa is created for travelers who want substance, beauty, and direction in one experience—grounded in Ghana’s history and open to its future."}
        </p>
      </div>
    </section>
  );
}
