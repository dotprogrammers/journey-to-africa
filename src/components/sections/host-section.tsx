"use client";

import { useEffect, useState } from "react";

export function HostSection() {
  const [contentBlock, setContentBlock] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/blocks`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(json => {
        if (json.data?.host) {
          setContentBlock(json.data.host[0]);
        }
      })
      .catch(err => console.error("Error fetching host blocks:", err));
  }, []);

  const displayTitle = contentBlock?.title || "Hosted By";
  const displayHosts = contentBlock?.items || [
    {
      title: "Hassan “Shoot With Haz”",
      description: "Visual storyteller and cultural curator helping shape a powerful return experience through media, memory, and community.",
    },
    {
      title: "Ajib Abdus-Salaam",
      description: "Co-host and experience architect focused on meaningful diaspora engagement, structure, and on-ground coordination.",
    },
  ];

  return (
    <section id="host" className="bg-background py-12 md:py-16 lg:py-20">
      <div className="max-w-2xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6">{displayTitle}</h3>
        {displayHosts.map((host: any, index: number) => (
          <div key={index} className="mb-6 last:mb-0">
            <p className="text-base md:text-lg text-foreground font-semibold">{host.title}</p>
            <p className="text-sm md:text-base text-muted-foreground">{host.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
