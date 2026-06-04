"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Check, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";

// ============================================================
// Types
// ============================================================

interface PricingTier {
  id: string;
  name: string;
  subtitle?: string;
  price: number;
  currency: string;
  maxCapacity: number;
  currentBookings: number;
  availableSlots: number;
  isEarlyBird: boolean;
  earlyBirdEndsAt?: string;
  features?: string;
}

// ============================================================
// Schemas
// ============================================================

const userDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().optional(),
});

const tripDetailsSchema = z.object({
  numberOfTravelers: z.number().int().min(1).max(10),
  specialRequests: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
  passportNumber: z.string().optional(),
  nationality: z.string().optional(),
});

const travelerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  passportNumber: z.string().optional(),
  nationality: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  specialNeeds: z.string().optional(),
});

type UserDetails = z.infer<typeof userDetailsSchema>;
type TripDetails = z.infer<typeof tripDetailsSchema>;
type Traveler = z.infer<typeof travelerSchema>;

// ============================================================
// Steps
// ============================================================

const STEPS = [
  { id: 1, label: "Select Tier" },
  { id: 2, label: "Your Details" },
  { id: 3, label: "Trip Details" },
  { id: 4, label: "Travelers" },
  { id: 5, label: "Review" },
];

// ============================================================
// Component
// ============================================================

export default function BookingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 state
  const [selectedTierId, setSelectedTierId] = useState("");

  // Step 2 state
  const userDetailsForm = useForm<UserDetails>({
    defaultValues: { name: "", email: "", phone: "", country: "", city: "" },
    mode: "onChange",
  });

  // Step 3 state
  const tripDetailsForm = useForm<TripDetails>({
    defaultValues: {
      numberOfTravelers: 1,
      specialRequests: "",
      dietaryRequirements: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      passportNumber: "",
      nationality: "",
    },
    mode: "onChange",
  });

  // Step 4 state
  const [travelers, setTravelers] = useState<Traveler[]>([]);

  // Fetch pricing tiers
  useEffect(() => {
    async function fetchTiers() {
      try {
        const res = await fetch("/api/pricing-tiers");
        const data = await res.json();
        if (data.success) {
          setTiers(data.data);
        }
      } catch (err) {
        console.error("Error fetching tiers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTiers();
  }, []);

  // When number of travelers changes, update travelers array
  const numberOfTravelers = tripDetailsForm.watch("numberOfTravelers");
  useEffect(() => {
    const count = numberOfTravelers || 1;
    setTravelers(prev => {
      const updated = [...prev];
      while (updated.length < count - 1) {
        updated.push({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          dateOfBirth: "",
          gender: "",
          passportNumber: "",
          nationality: "",
          dietaryRequirements: "",
          specialNeeds: "",
        });
      }
      return updated.slice(0, Math.max(0, count - 1));
    });
  }, [numberOfTravelers]);

  const selectedTier = tiers.find(t => t.id === selectedTierId);

  // Validation per step
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!selectedTierId;
      case 2:
        return userDetailsForm.formState.isValid;
      case 3:
        return tripDetailsForm.formState.isValid;
      case 4: {
        if (numberOfTravelers <= 1) return true;
        return travelers.every(t => travelerSchema.safeParse(t).success);
      }
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5 && canProceed()) {
      setError("");
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setError("");
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const userDetails = userDetailsForm.getValues();
      const tripDetails = tripDetailsForm.getValues();

      // Step 1: Register the user
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userDetails.name,
          email: userDetails.email,
          phone: userDetails.phone,
          country: userDetails.country,
          city: userDetails.city,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.error || "Registration failed");
        setSubmitting(false);
        return;
      }

      // Step 2: Sign in to get session
      const signInResult = await signIn("admin-credentials", {
        email: userDetails.email,
        password: registerData.data.generatedPassword,
        redirect: false,
      });

      if (!signInResult?.ok) {
        // If password login failed but user exists, they might need to log in normally.
        // For this "Guest" flow, we'll assume the admin handles existing users or we might need a different strategy.
        // For now, let's keep it simple as per user request.
        setError("Account created but failed to sign in automatically. Our admin will contact you.");
        setSubmitting(false);
        return;
      }

      // Step 3: Create the booking
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricingTierId: selectedTierId,
          numberOfTravelers: tripDetails.numberOfTravelers,
          specialRequests: tripDetails.specialRequests,
          dietaryRequirements: tripDetails.dietaryRequirements,
          emergencyContactName: tripDetails.emergencyContactName,
          emergencyContactPhone: tripDetails.emergencyContactPhone,
          passportNumber: tripDetails.passportNumber,
          nationality: tripDetails.nationality,
        }),
      });

      const bookingData = await bookingRes.json();

      if (!bookingRes.ok) {
        setError(bookingData.error || "Booking creation failed");
        setSubmitting(false);
        return;
      }

      // Step 4: Add travelers
      const bookingId = bookingData.data.id;
      for (let i = 0; i < travelers.length; i++) {
        const t = travelers[i];
        await fetch(`/api/bookings/${bookingId}/travelers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...t,
            isPrimary: i === 0,
          }),
        });
      }

      // Step 5: Redirect to confirmation
      router.push(`/booking-confirmation?ref=${bookingData.data.bookingReference}`);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-6 md:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Book Your Journey</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete the steps below to reserve your spot</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-border px-6 md:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto flex items-center gap-2 py-4 overflow-x-auto">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  currentStep === step.id
                    ? "bg-foreground text-background"
                    : currentStep > step.id
                    ? "bg-foreground/10 text-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span>{step.id}</span>
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="w-6 h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 md:px-12 lg:px-20">
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Select Tier */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Select Your Tier</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier) => {
                const isSoldOut = tier.maxCapacity > 0 && tier.availableSlots <= 0;
                return (
                  <button
                    key={tier.id}
                    onClick={() => !isSoldOut && setSelectedTierId(tier.id)}
                    disabled={isSoldOut}
                    className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
                      selectedTierId === tier.id
                        ? "border-foreground bg-foreground/5"
                        : isSoldOut
                        ? "border-muted bg-muted/30 opacity-50 cursor-not-allowed"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    {tier.isEarlyBird && (
                      <span className="absolute top-3 right-3 text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Early Bird
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-foreground mb-1">{tier.name}</h3>
                    {tier.subtitle && (
                      <p className="text-sm text-muted-foreground mb-2">{tier.subtitle}</p>
                    )}
                    <p className="text-2xl font-bold text-foreground mb-1">
                      ${tier.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{tier.currency}</p>
                    {tier.maxCapacity > 0 && (
                      <p className={`text-xs mt-2 ${isSoldOut ? "text-destructive" : "text-muted-foreground"}`}>
                        {isSoldOut ? "Sold out" : `${tier.availableSlots} spots remaining`}
                      </p>
                    )}
                    {tier.features && (
                      <ul className="mt-3 space-y-1">
                        {JSON.parse(tier.features).slice(0, 4).map((feature: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-primary">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                        {JSON.parse(tier.features).length > 4 && (
                          <li className="text-xs text-muted-foreground">
                            +{JSON.parse(tier.features).length - 4} more
                          </li>
                        )}
                      </ul>
                    )}
                    {selectedTierId === tier.id && (
                      <div className="absolute top-3 left-3">
                        <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-background" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Your Details */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Your Details</h2>
            <p className="text-sm text-muted-foreground mb-6">We'll create an account for you to manage your booking.</p>
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                <input
                  {...userDetailsForm.register("name", { required: true, minLength: 2 })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="Your full name"
                />
                {userDetailsForm.formState.errors.name && (
                  <p className="text-xs text-destructive mt-1">{userDetailsForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                <input
                  {...userDetailsForm.register("email", { required: true })}
                  type="email"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="you@example.com"
                />
                {userDetailsForm.formState.errors.email && (
                  <p className="text-xs text-destructive mt-1">{userDetailsForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone *</label>
                  <input
                    {...userDetailsForm.register("phone", { required: true })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Country *</label>
                  <input
                    {...userDetailsForm.register("country", { required: true })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="United States"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">City</label>
                <input
                  {...userDetailsForm.register("city")}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="Your city"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Trip Details */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Trip Details</h2>
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Number of Travelers *</label>
                <select
                  {...tripDetailsForm.register("numberOfTravelers", { valueAsNumber: true })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? "traveler" : "travelers"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Special Requests</label>
                <textarea
                  {...tripDetailsForm.register("specialRequests")}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="Any special requests..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Dietary Requirements</label>
                <textarea
                  {...tripDetailsForm.register("dietaryRequirements")}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="Any dietary requirements..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Emergency Contact Name *</label>
                  <input
                    {...tripDetailsForm.register("emergencyContactName", { required: true })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="Contact name"
                  />
                  {tripDetailsForm.formState.errors.emergencyContactName && (
                    <p className="text-xs text-destructive mt-1">Required</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Emergency Contact Phone *</label>
                  <input
                    {...tripDetailsForm.register("emergencyContactPhone", { required: true })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="+1 234 567 8900"
                  />
                  {tripDetailsForm.formState.errors.emergencyContactPhone && (
                    <p className="text-xs text-destructive mt-1">Required</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Passport Number</label>
                  <input
                    {...tripDetailsForm.register("passportNumber")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="Your passport number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nationality</label>
                  <input
                    {...tripDetailsForm.register("nationality")}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="Your nationality"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Additional Travelers */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Additional Travelers</h2>
            {numberOfTravelers <= 1 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No additional travelers needed. You are the primary traveler.
              </div>
            ) : (
              <div className="space-y-8">
                {travelers.map((traveler, idx) => (
                  <div key={idx} className="border border-border rounded-xl p-6">
                    <h3 className="text-sm font-bold text-foreground mb-4">Traveler {idx + 2}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">First Name *</label>
                        <input
                          value={traveler.firstName}
                          onChange={(e) => {
                            const updated = [...travelers];
                            updated[idx] = { ...updated[idx], firstName: e.target.value };
                            setTravelers(updated);
                          }}
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Last Name *</label>
                        <input
                          value={traveler.lastName}
                          onChange={(e) => {
                            const updated = [...travelers];
                            updated[idx] = { ...updated[idx], lastName: e.target.value };
                            setTravelers(updated);
                          }}
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                          placeholder="Last name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                        <input
                          value={traveler.email || ""}
                          onChange={(e) => {
                            const updated = [...travelers];
                            updated[idx] = { ...updated[idx], email: e.target.value };
                            setTravelers(updated);
                          }}
                          type="email"
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                          placeholder="Email (optional)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Phone</label>
                        <input
                          value={traveler.phone || ""}
                          onChange={(e) => {
                            const updated = [...travelers];
                            updated[idx] = { ...updated[idx], phone: e.target.value };
                            setTravelers(updated);
                          }}
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                          placeholder="Phone (optional)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Date of Birth</label>
                        <input
                          value={traveler.dateOfBirth || ""}
                          onChange={(e) => {
                            const updated = [...travelers];
                            updated[idx] = { ...updated[idx], dateOfBirth: e.target.value };
                            setTravelers(updated);
                          }}
                          type="date"
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Gender</label>
                        <select
                          value={traveler.gender || ""}
                          onChange={(e) => {
                            const updated = [...travelers];
                            updated[idx] = { ...updated[idx], gender: e.target.value };
                            setTravelers(updated);
                          }}
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Passport Number</label>
                        <input
                          value={traveler.passportNumber || ""}
                          onChange={(e) => {
                            const updated = [...travelers];
                            updated[idx] = { ...updated[idx], passportNumber: e.target.value };
                            setTravelers(updated);
                          }}
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                          placeholder="Passport number"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Nationality</label>
                        <input
                          value={traveler.nationality || ""}
                          onChange={(e) => {
                            const updated = [...travelers];
                            updated[idx] = { ...updated[idx], nationality: e.target.value };
                            setTravelers(updated);
                          }}
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                          placeholder="Nationality"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-foreground mb-1">Dietary Requirements</label>
                        <input
                          value={traveler.dietaryRequirements || ""}
                          onChange={(e) => {
                            const updated = [...travelers];
                            updated[idx] = { ...updated[idx], dietaryRequirements: e.target.value };
                            setTravelers(updated);
                          }}
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                          placeholder="Dietary requirements"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-foreground mb-1">Special Needs</label>
                        <input
                          value={traveler.specialNeeds || ""}
                          onChange={(e) => {
                            const updated = [...travelers];
                            updated[idx] = { ...updated[idx], specialNeeds: e.target.value };
                            setTravelers(updated);
                          }}
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                          placeholder="Any special needs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Review & Submit</h2>
            <div className="space-y-6">
              {/* Tier */}
              <div className="border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-2">Selected Tier</h3>
                <p className="text-foreground font-semibold">{selectedTier?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedTier?.subtitle}</p>
                <p className="text-lg font-bold text-foreground mt-1">
                  ${selectedTier?.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">× {numberOfTravelers} {numberOfTravelers === 1 ? "traveler" : "travelers"}</span>
                </p>
              </div>

              {/* Contact */}
              <div className="border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-2">Your Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{userDetailsForm.getValues("name")}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{userDetailsForm.getValues("email")}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{userDetailsForm.getValues("phone")}</span></div>
                  <div><span className="text-muted-foreground">Country:</span> <span className="text-foreground">{userDetailsForm.getValues("country")}</span></div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-2">Trip Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Travelers:</span> <span className="text-foreground">{numberOfTravelers}</span></div>
                  <div><span className="text-muted-foreground">Emergency Contact:</span> <span className="text-foreground">{tripDetailsForm.getValues("emergencyContactName")}</span></div>
                  <div><span className="text-muted-foreground">Emergency Phone:</span> <span className="text-foreground">{tripDetailsForm.getValues("emergencyContactPhone")}</span></div>
                  {tripDetailsForm.getValues("dietaryRequirements") && (
                    <div><span className="text-muted-foreground">Dietary:</span> <span className="text-foreground">{tripDetailsForm.getValues("dietaryRequirements")}</span></div>
                  )}
                  {tripDetailsForm.getValues("specialRequests") && (
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Special Requests:</span> <span className="text-foreground">{tripDetailsForm.getValues("specialRequests")}</span></div>
                  )}
                </div>
              </div>

              {/* Additional Travelers */}
              {travelers.length > 0 && (
                <div className="border border-border rounded-xl p-6">
                  <h3 className="text-sm font-bold text-foreground mb-2">Additional Travelers</h3>
                  <div className="space-y-3">
                    {travelers.map((t, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-foreground font-medium">{t.firstName} {t.lastName}</span>
                        {t.email && <span className="text-muted-foreground ml-2">({t.email})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-2 border-foreground/20 rounded-xl p-6 bg-foreground/5">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-foreground">
                    ${((selectedTier?.price || 0) * numberOfTravelers).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTier?.name} tier × {numberOfTravelers} {numberOfTravelers === 1 ? "traveler" : "travelers"}
                </p>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-border"
                  defaultChecked={false}
                  id="terms"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the terms and conditions, including the cancellation policy and travel requirements for Journey to Africa 2026.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Booking"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
