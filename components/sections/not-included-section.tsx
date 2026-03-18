"use client";

export function NotIncludedSection() {
  return (
    <section id="not-included" className="bg-background py-8 md:py-12 lg:py-16">
      <div className="max-w-2xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">Not Included</h3>
        <p className="text-base md:text-lg text-muted-foreground">International flights, visa fees, travel insurance, and personal spending.</p>
      </div>
    </section>
  );
}
