"use client";

export function HostSection() {
  return (
    <section id="host" className="bg-background py-12 md:py-16 lg:py-20">
      <div className="max-w-2xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">Hosted By</h3>
        <div className="mb-4">
          <p className="text-base md:text-lg text-foreground font-semibold">Hassan “Shoot With Haz”</p>
          <p className="text-sm md:text-base text-muted-foreground mb-2">Visual storyteller and cultural curator helping shape a powerful return experience through media, memory, and community.</p>
        </div>
        <div>
          <p className="text-base md:text-lg text-foreground font-semibold">Ajib Abdus-Salaam</p>
          <p className="text-sm md:text-base text-muted-foreground">Co-host and experience architect focused on meaningful diaspora engagement, structure, and on-ground coordination.</p>
        </div>
      </div>
    </section>
  );
}
