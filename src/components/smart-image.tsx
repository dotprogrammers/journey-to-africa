"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { getFallbackImage } from "@/lib/utils";

interface SmartImageProps extends ImageProps {
  fallbackType?: 'hero' | 'gallery' | 'host' | 'section' | 'avatar';
}

export function SmartImage({ src, fallbackType = 'section', alt, ...props }: SmartImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={getFallbackImage(imgSrc as string, fallbackType)}
      alt={alt || "Image"}
      onError={() => {
        if (imgSrc !== '') {
          setImgSrc('');
        }
      }}
    />
  );
}
