"use client";

import { useEffect, useState } from "react";

export function WhoSection() {
  const [section, setSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sections/who_section")
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setSection(json.data);
        }
      })
      .catch(err => console.error("Error fetching who section:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!section || !section.isActive) return null;

  const displayTitle = section.heading || "Who This Is For";
  const displayContent = section.description || "";

  return (
    <section id="who" className="bg-background py-20 md:py-32 lg:py-40">
      <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">{displayTitle}</h2>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">{displayContent}</p>
      </div>
    </section>
  );
}
