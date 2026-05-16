"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getFallbackImage } from "@/lib/utils";
import { SmartImage } from "@/components/smart-image";

export function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [alpineTranslateX, setAlpineTranslateX] = useState(-100);
  const [forestTranslateX, setForestTranslateX] = useState(100);
  const [titleOpacity, setTitleOpacity] = useState(1);
  const [contentBlock, setContentBlock] = useState<any>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/philosophy_section`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setContentBlock(json.data);
        }
      })
      .catch(err => console.error("Error fetching philosophy data:", err));
  }, []);

  const displayTitle = contentBlock?.title || "More Than a Journey—A Homecoming";
  const displaySubtitle = contentBlock?.tagline || "Flagship Experience";
  const displayContent = contentBlock?.description || "Journey to Africa is a premium diaspora experience designed for those who want more than tourism. It brings together historical remembrance, spiritual reflection, cultural immersion, and structured exposure to business and investment pathways in Ghana.";

  const updateTransforms = useCallback(() => {
    if (!sectionRef.current) return;
    
    const rect = sectionRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionHeight = sectionRef.current.offsetHeight;
    
    // Calculate progress based on scroll position
    const scrollableRange = sectionHeight - windowHeight;
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollableRange));
    
    // Alpine comes from left (-100% to 0%)
    setAlpineTranslateX((1 - progress) * -100);
    
    // Forest comes from right (100% to 0%)
    setForestTranslateX((1 - progress) * 100);
    
    // Title fades out as blocks come together
    setTitleOpacity(1 - progress);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Use requestAnimationFrame for smooth updates
      rafRef.current = requestAnimationFrame(updateTransforms);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateTransforms();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateTransforms]);

  return (
    <section id="intro" className="relative bg-background overflow-hidden">
      {/* Premium Visual + Main Theme */}
      <div className="absolute inset-0 -z-10 opacity-60 blur-sm pointer-events-none select-none transition-all duration-700">
        <SmartImage
          src={contentBlock?.background_image}
          fallbackType="section"
          alt="Section background"
          fill
          className="object-cover object-center w-full h-full"
          priority
        />
      </div>
      <div className="relative px-6 py-20 md:px-12 md:py-28 lg:px-20 lg:py-36 lg:pb-14 flex flex-col items-center justify-center">
        <div className="max-w-3xl text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4 animate-fade-in-down">{displaySubtitle}</p>
          <h2
            className="mt-2 text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground drop-shadow-lg animate-fade-in-up"
            style={{ opacity: titleOpacity, transition: 'opacity 0.5s' }}
          >
            {displayTitle}
          </h2>
          <p className="mt-8 leading-relaxed text-foreground text-lg md:text-xl lg:text-2xl font-medium animate-fade-in-up delay-150">
            {displayContent}
          </p>
        </div>
      </div>
    </section>
  );
}
