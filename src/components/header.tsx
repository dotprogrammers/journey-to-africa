"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/settings`)
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setSettings(json.data);
        }
      })
      .catch(err => console.error("Error fetching settings:", err));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logoText = settings?.logo_text || settings?.site_name || "JOURNEY TO AFRICA";

  return (
    <header 
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl transition-all duration-300 ${isScrolled ? "bg-background/80 backdrop-blur-md rounded-full" : "bg-transparent"}`}
      style={{
        boxShadow: isScrolled ? "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px" : "none"
      }}
    >
      <div className="flex items-center justify-between transition-all duration-300 px-2 pl-5 py-2">
        {/* Logo */}
        <Link href="#" className={`text-lg font-medium tracking-tight transition-colors duration-300 ${isScrolled ? "text-foreground" : "text-white"}`}>
          {logoText}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-10 md:flex">
          <Link
            href="#experience"
            className={`text-sm font-medium transition-colors ${isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"}`}
          >
            Experience
          </Link>
          <Link
            href="#legacy"
            className={`text-sm font-medium transition-colors ${isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"}`}
          >
            Legacy
          </Link>
          <Link
            href="#gallery"
            className={`text-sm font-medium transition-colors ${isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"}`}
          >
            Gallery
          </Link>
          <Link
            href="#reserve"
            className={`text-sm font-medium transition-colors ${isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"}`}
          >
            Reserve
          </Link>
        </nav>
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="#reserve"
            className={`px-4 py-2 text-sm font-semibold transition-all rounded-full ${isScrolled ? "bg-foreground text-background hover:opacity-80" : "bg-white text-foreground hover:bg-white/90"}`}
          >
            Apply Now
          </Link>
        </div>
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t border-border bg-background px-6 py-8 md:hidden rounded-b-2xl">
            <nav className="flex flex-col gap-6">
              <Link
                href="#experience"
                className="text-lg text-foreground font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Experience
              </Link>
              <Link
                href="#legacy"
                className="text-lg text-foreground font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Legacy
              </Link>
              <Link
                href="#gallery"
                className="text-lg text-foreground font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Gallery
              </Link>
              <Link
                href="#reserve"
                className="text-lg text-foreground font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Reserve
              </Link>
              <Link
                href="#reserve"
                className="mt-4 bg-foreground px-5 py-3 text-center text-sm font-semibold text-background rounded-full"
                onClick={() => setIsMenuOpen(false)}
              >
                Apply Now
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
