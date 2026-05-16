import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFallbackImage(src: string | null | undefined, type: 'hero' | 'gallery' | 'host' | 'section' | 'avatar' = 'section') {
  if (src && src.trim() !== '') return src;

  const fallbacks = {
    hero: "https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&cs=tinysrgb&w=2000",
    gallery: "https://images.pexels.com/photos/1208777/pexels-photo-1208777.jpeg?auto=compress&cs=tinysrgb&w=1200",
    host: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800",
    section: "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1200",
    avatar: "/placeholder-user.jpg"
  };

  return fallbacks[type];
}
