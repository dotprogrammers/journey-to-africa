"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [email, setEmail] = useState("");
  const [sessionValid, setSessionValid] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("jta_reset_token");
    const emailAddr = sessionStorage.getItem("jta_reset_email");

    if (!token || !emailAddr) {
      setSessionValid(false);
      return;
    }

    setResetToken(token);
    setEmail(emailAddr);
  }, []);

  // Password strength indicators
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError("Password does not meet all requirements");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          resetToken,
          newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        // Clear session storage
        sessionStorage.removeItem("jta_reset_token");
        sessionStorage.removeItem("jta_reset_email");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/admin/login");
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Invalid session
  if (!sessionValid) {
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
          </div>
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  No active reset session found. Please start the password reset process from the beginning.
                </AlertDescription>
              </Alert>
              <Button variant="outline" className="w-full mt-4" onClick={() => router.push("/admin/forgot-password")}>
                Start Password Reset
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100">
              <Lock className="size-6 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">Set New Password</CardTitle>
            <CardDescription>
              Create a strong password for<br />
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                  <CheckCircle className="size-4" />
                  <AlertDescription>
                    Your password has been reset successfully! Redirecting to login...
                  </AlertDescription>
                </Alert>
                <Button variant="outline" className="w-full" onClick={() => router.push("/admin/login")}>
                  Go to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="space-y-1.5 text-xs">
                  <p className="text-muted-foreground font-medium">Password must contain:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { label: "8+ characters", valid: hasMinLength },
                      { label: "Uppercase letter", valid: hasUppercase },
                      { label: "Lowercase letter", valid: hasLowercase },
                      { label: "Number", valid: hasNumber },
                    ].map((req) => (
                      <div key={req.label} className="flex items-center gap-1.5">
                        <div className={`size-1.5 rounded-full ${req.valid ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                        <span className={req.valid ? "text-emerald-600" : "text-muted-foreground"}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !passwordValid || newPassword !== confirmPassword}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
