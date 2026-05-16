"use client";

import { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { SmartImage } from "./smart-image";

interface FadeImageProps extends Omit<ImageProps, "onLoad"> {
  fadeDelay?: number;
  fallbackType?: 'hero' | 'gallery' | 'host' | 'section' | 'avatar';
}

export function FadeImage({ className, src, fadeDelay = 0, fallbackType = 'section', ...props }: FadeImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, fadeDelay);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [fadeDelay]);

  return (
    <div ref={ref} className="relative h-full w-full">
      <SmartImage
        {...props}
        src={src}
        fallbackType={fallbackType}
        className={`${className || ""} transition-all duration-700 ease-out ${
          isVisible && isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
        }`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
