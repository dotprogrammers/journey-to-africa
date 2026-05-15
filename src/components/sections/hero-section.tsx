"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [heroData, setHeroData] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/hero`, {
      headers: {
        'Accept': 'application/json',
      }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setHeroData(json.data);
        }
      })
      .catch(err => console.error("Error fetching hero data:", err));
  }, []);

  const displaySideImages = heroData?.side_images?.length > 0 
    ? [...heroData.side_images]
        .sort((a: any, b: any) => (a.sortOrder ?? a.sort_order ?? 0) - (b.sortOrder ?? b.sort_order ?? 0))
        .map((img: any) => ({
        src: img.image || img.url,
        alt: img.image_alt || "Hero side image",
        position: img.position || "right",
        span: Number(img.span) || 1
      }))
    : [
        {
          src: "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1000",
          alt: "Mountain hiking adventure",
          position: "left",
          span: 1,
        },
        {
          src: "https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=1000",
          alt: "Camping under stars",
          position: "left",
          span: 1,
        },
        {
          src: "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1000",
          alt: "Forest exploration",
          position: "right",
          span: 1,
        },
        {
          src: "https://images.pexels.com/photos/1687093/pexels-photo-1687093.jpeg?auto=compress&cs=tinysrgb&w=1000",
          alt: "Lake camping view",
          position: "right",
          span: 1,
        },
      ];

  const mainTitle = heroData?.title || "JOURNEY TO AFRICA";
  const subtitle = heroData?.subtitle || "Return to Ghana with purpose.";
  const tagline = heroData?.tagline || "Juneteenth Legacy & Investment Experience";
  const description = heroData?.description || "A 10-day curated diaspora journey through Ghana centered on history, reflection, culture, and meaningful connection to Africa’s future.";
  const primaryBtn = heroData?.buttons?.primary || { text: "Reserve Your Place", link: "#reserve" };
  const secondaryBtn = heroData?.buttons?.secondary || { text: "View Experience", link: "#experience" };
  const mainImage = heroData?.main_image || heroData?.backgroundImage || "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&cs=tinysrgb&w=2000";

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollableHeight = window.innerHeight * 2;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));
      
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Text fades out first (0 to 0.2)
  const textOpacity = Math.max(0, 1 - (scrollProgress / 0.2));
  
  // Image transforms start after text fades (0.2 to 1)
  const imageProgress = Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.8));
  
  // Smooth interpolations
  const centerWidth = 100 - (imageProgress * 58); // 100% to 42%
  const centerHeight = 100 - (imageProgress * 30); // 100% to 70%
  const sideWidth = imageProgress * 22; // 0% to 22%
  const sideOpacity = imageProgress;
  const sideTranslateLeft = -100 + (imageProgress * 100); // -100% to 0%
  const sideTranslateRight = 100 - (imageProgress * 100); // 100% to 0%
  const borderRadius = imageProgress * 24; // 0px to 24px
  const gap = imageProgress * 16; // 0px to 16px
  
  // Vertical offset for side columns to move them up on mobile
  const sideTranslateY = -(imageProgress * 15); // Move up by 15% when fully expanded

  return (
    <section ref={sectionRef} className="relative bg-background">
      {/* Sticky container for scroll animation */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="flex h-full w-full items-center justify-center">
          {/* Bento Grid Container */}
          <div 
            className="relative flex h-full w-full items-stretch justify-center"
            style={{ gap: `${gap}px`, padding: `${imageProgress * 16}px`, paddingBottom: `${60 + (imageProgress * 40)}px` }}
          >
            {/* Main Hero Title and Supporting Lines */}
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 md:px-12 lg:px-20 pointer-events-none"
              style={{ opacity: 1 - imageProgress }}
            >
              <p className="text-base md:text-lg font-semibold text-white mb-2 text-center drop-shadow-md">{tagline}</p>
              <h1 className="text-[clamp(2.5rem,7vw,5rem)] font-bold leading-tight tracking-tighter text-white text-center mb-4 drop-shadow-lg">
                {mainTitle}
              </h1>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-medium text-white text-center mb-2 drop-shadow-md">{subtitle}</h2>
              <p className="max-w-xl mx-auto text-sm md:text-base lg:text-lg text-white/90 text-center mb-6 drop-shadow-sm">
                {description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-2 pointer-events-auto">
                <a href={primaryBtn.link} className="px-8 py-4 rounded-full bg-foreground text-background font-bold text-base md:text-lg shadow-xl hover:scale-105 transition-transform">{primaryBtn.text}</a>
                <a href={secondaryBtn.link} className="px-8 py-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-base md:text-lg shadow-xl hover:bg-white/30 transition-all">{secondaryBtn.text}</a>
              </div>
            </div>

            {/* Left Column */}
            <div 
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateLeft}%) translateY(${sideTranslateY}%)`,
                opacity: sideOpacity,
              }}
            >
              {displaySideImages.filter((img: any) => img.position === "left").map((img: any, idx: number) => (
                <div 
                  key={idx} 
                  className="relative overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02]"
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

            {/* Main Hero Image - Center */}
            <div 
              className="relative overflow-hidden shadow-2xl will-change-transform"
              style={{
                width: `${centerWidth}%`,
                height: `${centerHeight}%`,
                flex: "0 0 auto",
                borderRadius: `${borderRadius}px`,
              }}
            >
              <Image
                src={mainImage}
                alt="Main hero background"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                priority
              />
              
              {/* Overlay Text - Bottom Animated Text */}
              <div 
                className="absolute inset-0 flex items-end overflow-hidden pointer-events-none p-12 md:p-20"
                style={{ opacity: textOpacity }}
              >
                <h1 className="w-full text-[clamp(2.5rem,12vw,8rem)] font-bold leading-[0.8] tracking-tighter text-white drop-shadow-2xl">
                  {mainTitle.split(" ").map((word: string, wIdx: number) => (
                    <span key={wIdx} className="inline-block mr-4 whitespace-nowrap">
                      {word.split("").map((letter: string, index: number) => (
                        <span
                          key={index}
                          className="inline-block animate-[slideUp_0.8s_ease-out_forwards] opacity-0"
                          style={{
                            animationDelay: `${(wIdx * 5 + index) * 0.05}s`,
                          }}
                        >
                          {letter}
                        </span>
                      ))}
                    </span>
                  ))}
                </h1>
              </div>
              
              {/* Dark overlay for readability */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" 
                style={{ opacity: 1 - imageProgress }}
              />
            </div>

            {/* Right Column */}
            <div 
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateRight}%) translateY(${sideTranslateY}%)`,
                opacity: sideOpacity,
              }}
            >
              {displaySideImages.filter((img: any) => img.position === "right").map((img: any, idx: number) => (
                <div 
                  key={idx} 
                  className="relative overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02]"
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
    </section>
  );
}
