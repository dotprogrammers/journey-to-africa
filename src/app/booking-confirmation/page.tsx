"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2,
  CreditCard,
  AlertCircle,
  Clock,
  RefreshCw,
  Shield,
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
  paymentMethod?: string;
  paidAt?: string;
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

type PaymentState =
  | "idle" // No payment initiated yet
  | "initializing" // Calling /api/paystack/initialize
  | "redirecting" // Redirecting to Paystack
  | "verifying" // Verifying payment after Paystack redirect
  | "success" // Payment successful
  | "failed" // Payment failed
  | "error"; // Unexpected error

// ============================================================
// Status Badge Component
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
    confirmed: { bg: "bg-blue-100", text: "text-blue-800", label: "Confirmed" },
    paid: { bg: "bg-green-100", text: "text-green-800", label: "Paid" },
    completed: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Completed" },
    cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
    refunded: { bg: "bg-purple-100", text: "text-purple-800", label: "Refunded" },
  };

  const c = config[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// ============================================================
// Main Component
// ============================================================

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingRef = searchParams.get("ref");
  const paystackReference = searchParams.get("reference");
  const stripeSessionId = searchParams.get("session_id");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [paymentError, setPaymentError] = useState("");
  const [paymentData, setPaymentData] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeGateway, setActiveGateway] = useState<string>("paystack");

  // Fetch booking details
  const fetchBooking = useCallback(async () => {
    if (!bookingRef) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/bookings?ref=${encodeURIComponent(bookingRef)}`);
      const data = await res.json();

      if (data.success && data.data) {
        setBooking(data.data);

        // If booking is already paid, show success
        if (data.data.status === "paid" || data.data.status === "completed") {
          setPaymentState("success");
        }
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
    } finally {
      setLoading(false);
    }
  }, [bookingRef]);

  // Verify payment when redirected back from Paystack
  const verifyPayment = useCallback(
    async (reference: string, gateway: string = "paystack") => {
      setPaymentState("verifying");
      setPaymentError("");

      try {
        const endpoint = gateway === "stripe" 
          ? `/api/stripe/verify/${encodeURIComponent(reference)}`
          : `/api/paystack/verify/${encodeURIComponent(reference)}`;
          
        const res = await fetch(endpoint);
        const data = await res.json();

        if (data.success && data.data?.status === "success") {
          setPaymentState("success");
          setPaymentData(data.data);
          // Refresh booking details
          await fetchBooking();
        } else {
          setPaymentState("failed");
          setPaymentError(
            data.data?.message || data.error || "Payment verification failed"
          );
        }
      } catch {
        setPaymentState("error");
        setPaymentError("Failed to verify payment. Please try again.");
      }
    },
    [fetchBooking]
  );

  // Initial load
  useEffect(() => {
    let cancelled = false;
    async function init() {
      await fetchBooking();
      if (!cancelled) setAuthChecked(true);
    }
    init();
    return () => { cancelled = true; };
  }, [fetchBooking]);

  // Fetch active gateway config
  useEffect(() => {
    async function fetchGateway() {
      try {
        const res = await fetch("/api/payments/config");
        const data = await res.json();
        if (data.success) {
          setActiveGateway(data.data.activeGateway);
        }
      } catch (err) {
        console.error("Error fetching gateway config:", err);
      }
    }
    fetchGateway();
  }, []);

  // If we have a reference, verify the payment
  useEffect(() => {
    if (booking && paymentState === "idle") {
      if (paystackReference) {
        verifyPayment(paystackReference, "paystack");
      } else if (stripeSessionId) {
        verifyPayment(stripeSessionId, "stripe");
      }
    }
  }, [paystackReference, stripeSessionId, booking, paymentState, verifyPayment]);

  // Initialize Paystack payment
  const handlePayNow = async () => {
    if (!booking) return;

    setPaymentState("initializing");
    setPaymentError("");

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data = await res.json();

      if (data.success && data.data?.authorizationUrl) {
        setPaymentState("redirecting");
        // Redirect to Paystack payment page
        window.location.href = data.data.authorizationUrl;
      } else {
        setPaymentState("error");
        setPaymentError(data.error || "Failed to initialize payment");
      }
    } catch {
      setPaymentState("error");
      setPaymentError("Failed to initialize payment. Please try again.");
    }
  };

  // Retry payment
  const handleRetry = () => {
    setPaymentState("idle");
    setPaymentError("");
  };

  // ============================================================
  // Render
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">
            Loading booking details...
          </p>
        </div>
      </div>
    );
  }

  if (!bookingRef) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">
            No Booking Reference
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            We couldn&apos;t find a booking reference. Please check your booking
            confirmation email or create a new booking.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition"
          >
            Book Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!booking && authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">
            Booking Not Found
          </h1>
          <p className="text-sm text-muted-foreground mb-2">
            We couldn&apos;t find a booking with reference{" "}
            <strong>{bookingRef}</strong>.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Make sure you&apos;re signed in with the account used to create this
            booking.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition"
            >
              Book Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/my-bookings"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border text-foreground font-semibold text-sm hover:bg-muted transition"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const isPayable = ["pending", "confirmed"].includes(booking.status);
  const isPaid = ["paid", "completed"].includes(booking.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-6 md:px-12 lg:px-20">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Booking Confirmation
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 md:px-12 lg:px-20">
        {/* Payment Success Banner */}
        {paymentState === "success" && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-green-900 mb-1">
              Payment Successful!
            </h2>
            <p className="text-sm text-green-700 mb-4">
              Your payment has been confirmed. You&apos;ll receive a confirmation
              email shortly.
            </p>
            {paymentData && (
              <div className="bg-white/60 rounded-xl p-4 text-left max-w-sm mx-auto">
                <div className="space-y-1.5 text-sm">
                  {paymentData.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Payment Method</span>
                      <span className="text-green-900 font-medium capitalize">
                        {paymentData.paymentMethod.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                  {paymentData.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Date</span>
                      <span className="text-green-900 font-medium">
                        {new Date(paymentData.paidAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Verifying Banner */}
        {paymentState === "verifying" && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-blue-900 mb-1">
              Verifying Payment...
            </h2>
            <p className="text-sm text-blue-700">
              Please wait while we confirm your payment with {activeGateway === "stripe" ? "Stripe" : "Paystack"}.
            </p>
          </div>
        )}

        {/* Payment Failed Banner */}
        {(paymentState === "failed" || paymentState === "error") && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-red-900 mb-1">
              {paymentState === "failed" ? "Payment Failed" : "Payment Error"}
            </h2>
            <p className="text-sm text-red-700 mb-4">
              {paymentError || "Something went wrong with your payment."}
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-900 text-white text-sm font-semibold hover:opacity-90 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Booking Reference Card */}
        <div className="bg-foreground/5 border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Booking Reference
            </p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {booking.bookingReference}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Created on {new Date(booking.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Booking Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tier</span>
              <span className="text-foreground font-medium">
                {booking.pricingTier?.name || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Travelers</span>
              <span className="text-foreground font-medium">
                {booking.numberOfTravelers}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per Person</span>
              <span className="text-foreground font-medium">
                ${booking.pricingTier?.price?.toLocaleString()} {booking.currency}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <span className="text-foreground font-bold">Total Amount</span>
              <span className="text-foreground font-bold text-lg">
                ${booking.totalAmount?.toLocaleString()} {booking.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {booking.payments && booking.payments.length > 0 && (
          <div className="bg-white border border-border rounded-2xl p-6 mb-6">
            <h3 className="text-sm font-bold text-foreground mb-4">
              Payment History
            </h3>
            <div className="space-y-3">
              {booking.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-foreground font-medium">
                      {payment.paystackReference}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString()}
                      {payment.paymentMethod && ` · ${payment.paymentMethod}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-medium">
                      ${payment.amount?.toLocaleString()} {payment.currency}
                    </p>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pay Now Section */}
        {isPayable && paymentState !== "verifying" && paymentState !== "redirecting" && (
          <div className="bg-white border-2 border-foreground/10 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-foreground mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Complete Your Payment
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Secure your spot by completing payment via {activeGateway === "stripe" ? "Stripe" : "Paystack"}
                </p>
              </div>
            </div>

            <div className="bg-foreground/5 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Amount Due
                </span>
                <span className="text-xl font-bold text-foreground">
                  ${booking.totalAmount?.toLocaleString()} {booking.currency}
                </span>
              </div>
            </div>

            <button
              onClick={handlePayNow}
              disabled={paymentState === "initializing"}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paymentState === "initializing" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initializing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay Now with {activeGateway === "stripe" ? "Stripe" : "Paystack"}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Shield className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Secure payment powered by {activeGateway === "stripe" ? "Stripe" : "Paystack"}
              </span>
            </div>
          </div>
        )}

        {/* Already Paid Info */}
        {isPaid && paymentState !== "success" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-800">
              This booking has been paid for
            </p>
            {booking.paidAt && (
              <p className="text-xs text-green-600 mt-1">
                Paid on {new Date(booking.paidAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Cancelled Info */}
        {booking.status === "cancelled" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
            <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-800">
              This booking has been cancelled
            </p>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Next Steps</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <span className="text-foreground font-bold mt-0.5 flex-shrink-0 w-5 h-5 bg-foreground/10 rounded-full flex items-center justify-center text-xs">
                1
              </span>
              <span>
                {isPaid
                  ? "Check your email for a payment confirmation with full details."
                  : "Complete your payment to secure your spot on the trip."}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-foreground font-bold mt-0.5 flex-shrink-0 w-5 h-5 bg-foreground/10 rounded-full flex items-center justify-center text-xs">
                2
              </span>
              <span>
                {isPaid
                  ? "You'll receive your full itinerary and travel preparation guide."
                  : "Once confirmed, you'll receive a payment confirmation email."}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-foreground font-bold mt-0.5 flex-shrink-0 w-5 h-5 bg-foreground/10 rounded-full flex items-center justify-center text-xs">
                3
              </span>
              <span>
                {isPaid
                  ? "Prepare for your Journey to Africa experience in June 2026!"
                  : "Complete payment within 48 hours to hold your place."}
              </span>
            </li>
          </ul>
        </div>

        {/* Help Text */}
        <div className="text-center text-xs text-muted-foreground mb-8">
          <p>
            Questions? Contact us at{" "}
            <a
              href="mailto:info@journeytoafrica.com"
              className="text-foreground underline"
            >
              info@journeytoafrica.com
            </a>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/my-bookings"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition"
          >
            My Bookings
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border text-foreground font-semibold text-sm hover:bg-muted transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Loading...</p>
          </div>
        </div>
      }
    >
      <BookingConfirmationContent />
    </Suspense>
  );
}
