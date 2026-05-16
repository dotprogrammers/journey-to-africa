"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function ReserveSection() {
  const [section, setSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sections/reserve_section")
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setSection(json.data);
        }
      })
      .catch(err => console.error("Error fetching reserve section:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!section || !section.isActive) return null;

  const displayTitle = section.heading || "Apply for the 2026 Cohort";
  const displayContent = section.description || "Spaces are intentionally limited to preserve the quality of the experience and the strength of the group.";
  const displayButton = section.ctaPrimaryText || "Apply Now";
  const displayLink = section.ctaPrimaryLink || "/booking";
  const displayNote = section.note || "";

  return (
    <section id="reserve" className="bg-background py-20 md:py-32 lg:py-40">
      <div className="max-w-2xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">{displayTitle}</h2>
        <p className="text-base md:text-lg text-muted-foreground mb-6">{displayContent}</p>
        
        {displayLink && (
          <Link 
            href={displayLink}
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-foreground text-background font-semibold text-base md:text-lg shadow-lg hover:opacity-90 transition transform hover:scale-105 duration-200 mb-2"
          >
            {displayButton}
          </Link>
        )}
        
        {displayNote && (
          <p className="mt-6 text-xs text-muted-foreground italic bg-muted/30 py-2 px-4 rounded-lg inline-block">
            {displayNote}
          </p>
        )}
      </div>
    </section>
  );
}
