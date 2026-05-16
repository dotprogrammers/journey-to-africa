"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getFallbackImage } from "@/lib/utils";
import { SmartImage } from "@/components/smart-image";

export function GallerySection() {
  const galleryRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sectionHeight, setSectionHeight] = useState("100vh");
  const [translateX, setTranslateX] = useState(0);
  const rafRef = useRef<number | null>(null);
  const [contentBlock, setContentBlock] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/gallery_section`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setContentBlock(json.data);
        }
      })
      .catch(err => console.error("Error fetching gallery data:", err));
  }, []);

  const displayTitle = contentBlock?.heading || "Moments of Return";
  const displaySubtitle = contentBlock?.subheading || "History. Celebration. Reflection. Connection.";
  const images = contentBlock?.items?.length > 0 ? [...contentBlock.items]
    .sort((a: any, b: any) => (a.sortOrder ?? a.sort_order ?? 0) - (b.sortOrder ?? b.sort_order ?? 0))
    .map((item: any) => ({
    src: item.image || item.url,
    alt: item.image_alt || "Gallery image"
  })) : [
    { src: "https://images.pexels.com/photos/1208777/pexels-photo-1208777.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Adventure cycling" },
    { src: "https://images.pexels.com/photos/1659437/pexels-photo-1659437.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Lake reflection" },
    { src: "https://images.pexels.com/photos/2450296/pexels-photo-2450296.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Kayaking adventure" },
    { src: "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Stream crossing" },
    { src: "https://images.pexels.com/photos/1309584/pexels-photo-1309584.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Campfire warmth" },
    { src: "https://images.pexels.com/photos/869258/pexels-photo-869258.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Snow adventure" },
    { src: "https://images.pexels.com/photos/1578750/pexels-photo-1578750.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Mountain summit" },
    { src: "https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Canyon views" },
  ];

  // Calculate section height based on content width
  useEffect(() => {
    const calculateHeight = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.scrollWidth;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      // Height = viewport height + the extra scroll needed to reveal all content
      const totalHeight = viewportHeight + (containerWidth - viewportWidth);
      setSectionHeight(`${totalHeight}px`);
    };

    // Small delay to ensure container is rendered
    const timer = setTimeout(calculateHeight, 100);
    window.addEventListener("resize", calculateHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);

  const updateTransform = useCallback(() => {
    if (!galleryRef.current || !containerRef.current) return;
    
    const rect = galleryRef.current.getBoundingClientRect();
    const containerWidth = containerRef.current.scrollWidth;
    const viewportWidth = window.innerWidth;
    
    // Total scroll distance needed to reveal all images
    const totalScrollDistance = containerWidth - viewportWidth;
    
    // Current scroll position within this section
    const scrolled = Math.max(0, -rect.top);
    
    // Progress from 0 to 1
    const progress = Math.min(1, scrolled / totalScrollDistance);
    
    // Calculate new translateX
    const newTranslateX = progress * -totalScrollDistance;
    
    setTranslateX(newTranslateX);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Use requestAnimationFrame for smooth updates
      rafRef.current = requestAnimationFrame(updateTransform);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateTransform();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateTransform]);

  return (
    <section 
      id="gallery"
      ref={galleryRef}
      className="relative bg-background py-20 md:py-32 lg:py-40"
      style={{ height: sectionHeight }}
    >
      <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-20 mb-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 text-center">{displayTitle}</h2>
        <p className="text-base md:text-lg text-muted-foreground text-center mb-6">{displaySubtitle}</p>
      </div>
      {/* Sticky container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="flex h-full items-center justify-center">
          {/* Responsive grid gallery */}
          <div className="grid grid-cols-1 gap-6 px-6 md:grid-cols-2 lg:grid-cols-4 md:px-12 lg:px-20 w-full">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md"
              >
                <SmartImage
                  src={image.src}
                  fallbackType="gallery"
                  alt={image.alt}
                  fill
                  className="object-cover"
                  priority={index < 3}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
