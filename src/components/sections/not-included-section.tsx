"use client";

import { useEffect, useState } from "react";

export function NotIncludedSection() {
  const [section, setSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sections/not_included_section")
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setSection(json.data);
        }
      })
      .catch(err => console.error("Error fetching not-included section:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!section || !section.isActive) return null;

  const displayTitle = section.heading || "Not Included";
  const displayContent = section.description || "";

  return (
    <section id="not-included" className="bg-background py-10 md:py-16">
      <div className="max-w-2xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">{displayTitle}</h3>
        <p className="text-base text-muted-foreground">{displayContent}</p>
      </div>
    </section>
  );
}
