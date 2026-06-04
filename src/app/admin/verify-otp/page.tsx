"use client";

import { useState, Suspense, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft, ShieldCheck, RotateCcw, CheckCircle } from "lucide-react";

const OTP_EXPIRY_SECONDS = 600; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 120; // 2 minutes between resends
const MAX_RESEND_REQUESTS = 3;

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer states
  const [otpTimeLeft, setOtpTimeLeft] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendRequestsLeft, setResendRequestsLeft] = useState(MAX_RESEND_REQUESTS);
  const [otpExpired, setOtpExpired] = useState(false);

  // OTP expiry countdown
  useEffect(() => {
    if (otpTimeLeft <= 0) {
      setOtpExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          setOtpExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpTimeLeft]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (value && !/^\d$/.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError("");

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      if (value && index === 5) {
        const fullOtp = newOtp.join("");
        if (fullOtp.length === 6) {
          handleVerify(fullOtp);
        }
      }
    },
    [otp] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newOtp = pastedData.split("").concat(Array(6 - pastedData.length).fill(""));
      setOtp(newOtp.slice(0, 6));
      const nextEmpty = newOtp.findIndex((v) => !v);
      inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();

      if (pastedData.length === 6) {
        handleVerify(pastedData);
      }
    }
  };

  const handleVerify = async (otpString?: string) => {
    const fullOtp = otpString || otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    if (!email) {
      setError("Email not found. Please go back and start over.");
      return;
    }

    if (otpExpired) {
      setError("This code has expired. Please request a new one.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      const data = await res.json();

      if (data.success && data.data?.resetToken) {
        sessionStorage.setItem("jta_reset_token", data.data.resetToken);
        sessionStorage.setItem("jta_reset_email", email);
        router.push("/admin/reset-password");
      } else {
        setError(data.error || "Verification failed");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("An error occurred. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendRequestsLeft <= 0 || resending) return;

    setResending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("A new verification code has been sent to your email.");
        setResendRequestsLeft((prev) => prev - 1);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setOtpTimeLeft(OTP_EXPIRY_SECONDS);
        setOtpExpired(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        // Clear success message after 4 seconds
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(data.error || "Failed to resend code");
        if (data.retryAfterSeconds) {
          setResendCooldown(data.retryAfterSeconds);
        }
      }
    } catch {
      setError("An error occurred while resending the code");
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              No email provided. Please start from the forgot password page.
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="w-full mt-4" onClick={() => router.push("/admin/forgot-password")}>
            Go to Forgot Password
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-amber-100">
          <ShieldCheck className="size-6 text-amber-600" />
        </div>
        <CardTitle className="text-xl">Verify Code</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to<br />
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-6"
        >
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
              <CheckCircle className="size-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* OTP Expiry Timer */}
          <div className="text-center">
            {otpExpired ? (
              <p className="text-sm font-medium text-destructive">
                Code expired. Please request a new one below.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Code expires in{" "}
                <span className={`font-mono font-semibold ${otpTimeLeft <= 60 ? "text-amber-600" : "text-foreground"}`}>
                  {formatTime(otpTimeLeft)}
                </span>
              </p>
            )}
          </div>

          {/* OTP Input Grid */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={loading || otpExpired}
                className="size-12 text-center text-lg font-mono font-bold rounded-lg"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={loading || otp.join("").length !== 6 || otpExpired}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>
        </form>

        {/* Resend Section */}
        <div className="mt-6 space-y-3 text-center">
          {resendRequestsLeft > 0 ? (
            resendCooldown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend available in{" "}
                <span className="font-mono font-semibold text-foreground">
                  {formatTime(resendCooldown)}
                </span>
              </p>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={resending || resendRequestsLeft <= 0}
                className="text-sm"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 size-3.5" />
                    Resend Code
                  </>
                )}
              </Button>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Maximum resend limit reached. Please wait 15 minutes.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            {resendRequestsLeft} of {MAX_RESEND_REQUESTS} resend requests remaining
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/admin/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Forgot Password
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-lg font-bold text-white">
              J
            </div>
            <span className="text-2xl font-semibold text-white">JTA Admin</span>
          </div>
          <p className="text-slate-400">Journey to Africa Administration</p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          }
        >
          <VerifyOtpForm />
        </Suspense>
      </div>
    </div>
  );
}
