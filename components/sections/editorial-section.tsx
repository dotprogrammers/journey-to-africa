"use client";

const specs = [
  { label: "Weight", value: "400g" },
  { label: "Capacity", value: "0.5L - 2L" },
  { label: "Setup", value: "2 min" },
  { label: "Packed size", value: "30 x 15 cm" },
];

export function EditorialSection() {
  return (
    <section className="bg-background py-20 md:py-32 lg:py-40">
      <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-20">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-center">
          Where Heritage Meets<br />Future.
        </h2>
        <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground text-center mb-8">
          This is not a standard group trip. Journey to Africa is a carefully curated return experience for members of the diaspora who want to engage Ghana with depth and direction. Over ten days, guests move from places of historical significance into spaces of celebration, dialogue, and opportunity—building not only memories, but meaningful pathways for long-term connection with Africa.
        </p>
      </div>
    </section>
  );
}
