"use client";

import Image from "next/image";

export function EditorialSection() {
  return (
    <section className="relative bg-background py-20 md:py-32 lg:py-40 overflow-hidden">
      {/* Premium Background Image */}
      <div className="absolute inset-0 -z-10 opacity-50 blur-sm pointer-events-none select-none transition-all duration-700">
        <Image
          src="https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&fit=crop&w=1200&q=80"
          alt="Ghana celebration"
          fill
          className="object-cover object-center w-full h-full"
          priority
        />
      </div>
      <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-20 relative">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-center drop-shadow-lg animate-fade-in-up">
          Where Heritage Meets<br />Future.
        </h2>
        <p className="text-lg md:text-xl lg:text-2xl text-foreground text-center mb-8 animate-fade-in-up delay-150 bg-background/60 rounded-xl p-4 shadow-lg">
          This is not a standard group trip. Journey to Africa is a carefully curated return experience for members of the diaspora who want to engage Ghana with depth and direction. Over ten days, guests move from places of historical significance into spaces of celebration, dialogue, and opportunity—building not only memories, but meaningful pathways for long-term connection with Africa.
        </p>
      </div>
    </section>
  );
}
