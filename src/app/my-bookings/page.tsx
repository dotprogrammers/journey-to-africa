"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Loader2,
  ArrowRight,
  CreditCard,
  FileText,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  LogIn,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
}

interface Payment {
  id: string;
  paystackReference: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface Booking {
  id: string;
  bookingReference: string;
  status: string;
  numberOfTravelers: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  paidAt?: string;
  pricingTier: PricingTier;
  payments: Payment[];
}

// ============================================================
// Status Badge
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string; icon?: React.ReactNode }> = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Pending",
      icon: <Clock className="w-3 h-3" />,
    },
    confirmed: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Confirmed",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    paid: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Paid",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    completed: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      label: "Completed",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Cancelled",
      icon: <XCircle className="w-3 h-3" />,
    },
    refunded: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      label: "Refunded",
    },
  };

  const c = config[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

// ============================================================
// Login Form Component
// ============================================================

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("admin-credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        onLogin();
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-foreground/5 rounded-2xl flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Sign In to View Bookings
          </h1>
          <p className="text-sm text-muted-foreground">
            Access your bookings and payment history
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/booking" className="text-foreground font-medium underline">
              Book a trip
            </Link>{" "}
            to create one.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Booking Card Component
// ============================================================

function BookingCard({ booking }: { booking: Booking }) {
  const isPayable = ["pending", "confirmed"].includes(booking.status);
  const isPaid = ["paid", "completed"].includes(booking.status);

  return (
    <div className="bg-white border border-border rounded-2xl p-6 hover:border-foreground/20 transition-colors">
      {/* Top Row: Reference + Status */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">
            Reference
          </p>
          <p className="text-lg font-bold text-foreground">
            {booking.bookingReference}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Tier</p>
          <p className="text-sm font-medium text-foreground">
            {booking.pricingTier?.name}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Travelers</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            {booking.numberOfTravelers}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-bold text-foreground">
            ${booking.totalAmount?.toLocaleString()}{" "}
            <span className="font-normal text-muted-foreground text-xs">
              {booking.currency}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Booked On</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            {new Date(booking.createdAt).toLocaleDateString()}
          </p>
        </div>
        {booking.paidAt && (
          <div>
            <p className="text-xs text-muted-foreground">Paid On</p>
            <p className="text-sm font-medium text-green-700">
              {new Date(booking.paidAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {isPayable && (
          <Link
            href={`/booking-confirmation?ref=${booking.bookingReference}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Pay Now
          </Link>
        )}
        {isPaid && (
          <Link
            href={`/booking-confirmation?ref=${booking.bookingReference}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-100 text-green-800 text-xs font-semibold hover:bg-green-200 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            View Details
          </Link>
        )}
        <Link
          href={`/booking-confirmation?ref=${booking.bookingReference}`}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-muted transition"
        >
          View
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings();
  }, []);

  // Show login form if not authenticated
  if (authChecked && !isAuthenticated) {
    return (
      <LoginForm
        onLogin={() => {
          setIsAuthenticated(true);
          setLoading(true);
          fetchBookings();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">
            Loading your bookings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-6 md:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                My Bookings
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your Journey to Africa bookings
              </p>
            </div>
            <Link
              href="/booking"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition"
            >
              New Booking
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 md:px-12 lg:px-20">
        {/* Stats Summary */}
        {bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {bookings.length}
              </p>
              <p className="text-xs text-muted-foreground">Total Bookings</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">
                {bookings.filter((b) => ["pending", "confirmed"].includes(b.status)).length}
              </p>
              <p className="text-xs text-muted-foreground">Awaiting Payment</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-700">
                {bookings.filter((b) => b.status === "paid").length}
              </p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {bookings.filter((b) => b.status === "completed").length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              No Bookings Yet
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              You haven&apos;t made any bookings yet. Start your Journey to Africa
              by selecting a pricing tier.
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition"
            >
              Book Your Journey
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}

        {/* Mobile CTA */}
        {bookings.length > 0 && (
          <div className="sm:hidden mt-6">
            <Link
              href="/booking"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition"
            >
              New Booking
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
