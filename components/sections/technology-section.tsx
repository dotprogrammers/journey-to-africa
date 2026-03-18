"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

function ScrollRevealText({ text }: { text: string }) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Slower animation - more viewport range
      const startOffset = windowHeight * 0.9;
      const endOffset = windowHeight * 0.1;
      
      const totalDistance = startOffset - endOffset;
      const currentPosition = startOffset - rect.top;
      
      const newProgress = Math.max(0, Math.min(1, currentPosition / totalDistance));
      setProgress(newProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const words = text.split(" ");
  
  return (
    <p
      ref={containerRef}
      className="text-3xl font-semibold leading-snug md:text-4xl lg:text-5xl"
    >
      {words.map((word, index) => {
        const wordProgress = index / words.length;
        const isRevealed = progress > wordProgress;
        
        return (
          <span
            key={index}
            className="transition-colors duration-150"
            style={{
              color: isRevealed ? "var(--foreground)" : "#e4e4e7",
            }}
          >
            {word}{index < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
}

const sideImages = [
  {
    src: "https://images.pexels.com/photos/1076081/pexels-photo-1076081.jpeg?auto=compress&cs=tinysrgb&w=1000",
    alt: "Forest trail",
    position: "left",
    span: 1,
  },
  {
    src: "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1000",
    alt: "Mountain peak",
    position: "left",
    span: 1,
  },
  {
    src: "https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=1000",
    alt: "Alpine landscape",
    position: "right",
    span: 1,
  },
  {
    src: "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1000",
    alt: "Snow mountain",
    position: "right",
    span: 1,
  },
];

export function TechnologySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textSectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [textProgress, setTextProgress] = useState(0);
  
  const descriptionText = "Experience outdoor gear reimagined with cutting-edge technology. Alpine & Forest accessories combine ultra-lightweight materials, intelligent temperature control, and weather-resistant engineering to elevate every adventure. From mountain peaks to forest trails, your gear adapts to the conditions.";

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollableHeight = window.innerHeight * 2;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));
      
      setScrollProgress(progress);

      // Text scroll progress
      return (
        <section id="experience" className="bg-background">
          {/* Section Label */}
          <div className="px-6 py-20 text-center md:px-12 md:py-28 lg:px-20 lg:py-32 lg:pb-20">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">The Experience</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl mb-6">
              Built for Legacy.<br />Designed for Return.
            </h2>
          </div>
          {/* Six Feature/Benefit Cards */}
          <div className="grid grid-cols-1 gap-6 px-6 pb-20 md:grid-cols-2 lg:grid-cols-3 md:px-12 lg:px-20">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-start">
              <span className="text-lg font-bold text-foreground mb-2">History</span>
              <span className="text-sm font-medium text-muted-foreground mb-1">Cape Coast & Elmina Experience</span>
              <p className="text-sm text-muted-foreground">Walk through the historic sites that anchor the journey in truth, memory, and global Black history.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-start">
              <span className="text-lg font-bold text-foreground mb-2">Reflection</span>
              <span className="text-sm font-medium text-muted-foreground mb-1">Assin Manso Ceremony</span>
              <p className="text-sm text-muted-foreground">A powerful moment of remembrance, reconnection, and personal reflection.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-start">
              <span className="text-lg font-bold text-foreground mb-2">Culture</span>
              <span className="text-sm font-medium text-muted-foreground mb-1">Juneteenth in Ghana</span>
              <p className="text-sm text-muted-foreground">Celebrate freedom, heritage, and contemporary African identity in community.</p>
            </div>
            {/* Feature 4 */}
            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-start">
              <span className="text-lg font-bold text-foreground mb-2">Connection</span>
              <span className="text-sm font-medium text-muted-foreground mb-1">Business Networking Event</span>
              <p className="text-sm text-muted-foreground">Meet founders, professionals, and ecosystem builders shaping Ghana’s future.</p>
            </div>
            {/* Feature 5 */}
            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-start">
              <span className="text-lg font-bold text-foreground mb-2">Spirituality</span>
              <span className="text-sm font-medium text-muted-foreground mb-1">Mosque & Dialogue Visit</span>
              <p className="text-sm text-muted-foreground">Engage faith, culture, and African spiritual life in a grounded and respectful setting.</p>
            </div>
            {/* Feature 6 */}
            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-start">
              <span className="text-lg font-bold text-foreground mb-2">Community</span>
              <span className="text-sm font-medium text-muted-foreground mb-1">Welcome & Farewell Legacy Dinners</span>
              <p className="text-sm text-muted-foreground">Begin and end the experience in fellowship, conversation, and intentional connection.</p>
            </div>
          </div>
        </section>
              
              {/* Title Text - Fades out word by word with blur */}
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              >
                <h2 className="max-w-3xl font-medium leading-tight tracking-tight text-white md:text-5xl lg:text-7xl text-5xl">
                  {["Technology", "Meets", "Wilderness."].map((word, index) => {
                    // Each word fades out sequentially based on scrollProgress
                    const wordFadeStart = index * 0.07; // Technology: 0, Meets: 0.07, Wilderness: 0.14
                    const wordFadeEnd = wordFadeStart + 0.07;
                    const wordProgress = Math.max(0, Math.min(1, (scrollProgress - wordFadeStart) / (wordFadeEnd - wordFadeStart)));
                    const wordOpacity = 1 - wordProgress;
                    const wordBlur = wordProgress * 10; // 0px to 10px blur
                    
                    return (
                      <span
                        key={index}
                        className="inline-block"
                        style={{
                          opacity: wordOpacity,
                          filter: `blur(${wordBlur}px)`,
                          transition: 'opacity 0.1s linear, filter 0.1s linear',
                          marginRight: index < 2 ? '0.3em' : '0',
                        }}
                      >
                        {word}
                        {index === 1 && <br />}
                      </span>
                    );
                  })}
                </h2>
              </div>
            </div>

            {/* Right Column */}
            <div 
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateRight}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages.filter(img => img.position === "right").map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative overflow-hidden will-change-transform"
                  style={{
                    flex: img.span,
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  <Image
                    src={img.src || "/placeholder.svg"}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Scroll space to enable animation */}
      <div className="h-[200vh]" />

      {/* Description Section with Background Image and Scroll Reveal */}
      <div 
        ref={textSectionRef}
        className="relative overflow-hidden bg-background px-6 py-24 md:px-12 md:py-32 lg:px-20 lg:py-40"
      >
        {/* Background Image with Grayscale Filter */}
        

        {/* Text Content */}
        <div className="relative z-10 mx-auto max-w-4xl">
          <ScrollRevealText text={descriptionText} />
        </div>
      </div>
    </section>
  );
}
