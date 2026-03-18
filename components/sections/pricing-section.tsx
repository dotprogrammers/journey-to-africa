"use client";

export function PricingSection() {
  return (
    <section id="pricing" className="bg-background py-20 md:py-32 lg:py-40">
      <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">Reserve Your Tier</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center">
            <span className="text-lg font-bold text-foreground mb-2">Early Bird</span>
            <span className="text-sm text-muted-foreground mb-1">First 10 Spots</span>
            <span className="text-2xl font-bold text-foreground mb-2">$3,200</span>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center">
            <span className="text-lg font-bold text-foreground mb-2">Standard Rate</span>
            <span className="text-sm text-muted-foreground mb-1">Regular Admission</span>
            <span className="text-2xl font-bold text-foreground mb-2">$3,500</span>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center">
            <span className="text-lg font-bold text-foreground mb-2">VIP Legacy Tier</span>
            <span className="text-sm text-muted-foreground mb-1">Premium Access</span>
            <span className="text-2xl font-bold text-foreground mb-2">$4,200</span>
          </div>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">Land package only. International flights, visa fees, travel insurance, and personal spending are not included.</p>
      </div>
    </section>
  );
}
