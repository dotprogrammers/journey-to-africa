"use client";

export function ReserveSection() {
  return (
    <section id="reserve" className="bg-background py-20 md:py-32 lg:py-40">
      <div className="max-w-2xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">Apply for the 2026 Cohort</h2>
        <p className="text-base md:text-lg text-muted-foreground mb-6">Spaces are intentionally limited to preserve the quality of the experience and the strength of the group. Submit your interest to receive full itinerary details, next steps, and reservation guidance.</p>
        <button className="px-6 py-3 rounded-full bg-foreground text-background font-semibold text-base md:text-lg shadow-md hover:opacity-90 transition mb-2">Apply Now</button>
        <p className="mt-4 text-xs text-muted-foreground">Early Bird pricing is limited to the first 10 confirmed participants.</p>
      </div>
    </section>
  );
}
