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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [features, setFeatures] = useState<any[]>([]);
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/features`, {
      headers: {
        'Accept': 'application/json',
      }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data && json.data.experience) {
          setFeatures(json.data.experience);
        }
      })
      .catch(err => console.error("Error fetching feature cards:", err));
  }, []);

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
    handleScroll(); // Initial check
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const displayFeatures = features.length > 0 ? features : [
    {
      title: "History",
      subtitle: "Cape Coast & Elmina Experience",
      description: "Walk through the historic sites that anchor the journey in truth, memory, and global Black history."
    },
    {
      title: "Reflection",
      subtitle: "Assin Manso Ceremony",
      description: "A powerful moment of remembrance, reconnection, and personal reflection."
    },
    {
      title: "Culture",
      subtitle: "Juneteenth in Ghana",
      description: "Celebrate freedom, heritage, and contemporary African identity in community."
    },
    {
      title: "Connection",
      subtitle: "Business Networking Event",
      description: "Meet founders, professionals, and ecosystem builders shaping Ghana’s future."
    },
    {
      title: "Spirituality",
      subtitle: "Mosque & Dialogue Visit",
      description: "Engage faith, culture, and African spiritual life in a grounded and respectful setting."
    },
    {
      title: "Community",
      subtitle: "Welcome & Farewell Legacy Dinners",
      description: "Begin and end the experience in fellowship, conversation, and intentional connection."
    }
  ];

  return (
    <section id="experience" className="bg-background">
      {/* Section Label */}
      <div className="px-6 py-20 text-center md:px-12 md:py-28 lg:px-20 lg:py-32 lg:pb-20">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">The Experience</p>
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl mb-6">
          Built for Legacy.<br />Designed for Return.
        </h2>
      </div>

      {/* Dynamic Feature/Benefit Cards */}
      <div className="grid grid-cols-1 gap-6 px-6 pb-20 md:grid-cols-2 lg:grid-cols-3 md:px-12 lg:px-20">
        {displayFeatures.map((feature, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-start h-full">
            <span className="text-lg font-bold text-foreground mb-2">{feature.title}</span>
            {feature.subtitle && (
              <span className="text-sm font-medium text-muted-foreground mb-1">{feature.subtitle}</span>
            )}
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}