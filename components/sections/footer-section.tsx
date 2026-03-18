"use client";

import Link from "next/link";

const footerLinks = {
  experience: [
    { label: "Overview", href: "#experience" },
    { label: "Included", href: "#inclusions" },
    { label: "Pricing", href: "#pricing" },
    { label: "Reserve", href: "#reserve" },
  ],
  about: [
    { label: "Our Mission", href: "#" },
    { label: "Hosts", href: "#host" },
    { label: "Ghana 2026", href: "#stats" },
    { label: "Contact", href: "#" },
  ],
  support: [
    { label: "FAQ", href: "#" },
    { label: "Payments", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Travel Notes", href: "#" },
  ],
};

export function FooterSection() {
  return (
    <footer className="bg-background">
      {/* Main Footer Content */}
      <div className="border-t border-border px-6 py-16 md:px-12 md:py-20 lg:px-20">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <Link href="/" className="text-lg font-bold text-foreground">
              JOURNEY TO AFRICA
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Journey to Africa is a premium Ghana-based legacy experience reconnecting the diaspora through history, reflection, culture, and future-facing engagement.
            </p>
          </div>

          {/* Experience */}
          <div>
            <h4 className="mb-4 text-sm font-medium text-foreground">Experience</h4>
            <ul className="space-y-3">
              {footerLinks.experience.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="mb-4 text-sm font-medium text-foreground">About</h4>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 text-sm font-medium text-foreground">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border px-6 py-6 md:px-12 lg:px-20">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-muted-foreground">
            2026 Journey to Africa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
