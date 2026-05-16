"use client";

import { useEffect, useState } from "react";
import { getFallbackImage } from "@/lib/utils";
import { SmartImage } from "@/components/smart-image";

export function TestimonialsSection() {
  const [contentBlock, setContentBlock] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/blocks`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data?.testimonials) {
          setContentBlock(json.data.testimonials[0]);
        }
      })
      .catch(err => console.error("Error fetching testimonials blocks:", err));
  }, []);

  const displayContent = contentBlock?.content || "Alpine & Forest accessories combine aerospace-grade materials with cutting-edge technology — designed for explorers who refuse to compromise on quality or performance in the wild.";
  const displayImage = getFallbackImage(contentBlock?.items?.[0]?.image, 'section');

  return (
    <section id="about" className="bg-background">
      {/* Large Text Statement */}
      <div className="px-6 py-24 md:px-12 md:py-32 lg:px-20 lg:py-40">
        <p className="mx-auto max-w-5xl text-2xl leading-relaxed text-foreground md:text-3xl lg:text-[2.5rem] lg:leading-snug">
          {displayContent}
        </p>
      </div>

      {/* About Image */}
      <div className="relative aspect-[16/9] w-full">
        <SmartImage
          src={displayImage}
          fallbackType="section"
          alt="Testimonial background"
          fill
          className="object-cover"
        />
        {/* Fade gradient overlay - white at bottom fading to transparent at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
    </section>
  );
}
