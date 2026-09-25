"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Smartphone, Lock, User, ShieldCheck, AlertCircle, Eye, EyeOff, KeyRound, X, CheckCircle2, Clock, RefreshCw, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import EfootballLoader from "@/components/EfootballLoader";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdminRequired = searchParams.get("admin") === "true";
  const errorParam = searchParams.get("error");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    errorParam === "admin_required"
      ? "Access Denied: You must be logged in as an Administrator to access the Admin Control Center."
      : ""
  );

  // Forgot password flow state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<"IDLE" | "PENDING" | "APPROVED">("IDLE");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("efrl_user");
      if (cached) {
        try {
          const user = JSON.parse(cached);
          if (user.role === "ADMIN") {
            router.replace("/admin");
          }
        } catch (e) {}
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      if (typeof window !== "undefined") {
        localStorage.setItem("efrl_user", JSON.stringify({ ...data.user, player: data.player }));
      }

      if (data.user?.role === "ADMIN") {
        window.location.href = "/admin";
      } else {
        if (isAdminRequired) {
          setError("Your account is a Player account. Administrator access is required.");
          return;
        }
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your registered email address.");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request.");

      setForgotStatus(data.status || "PENDING");
      setForgotMessage(data.message || "Request sent to Commissioner.");
    } catch (err: any) {
      setForgotError(err.message || "An error occurred. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your registered email address.");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check status.");

      if (data.status === "APPROVED") {
        setForgotStatus("APPROVED");
        setForgotMessage(data.message);
      } else if (data.status === "PENDING") {
        setForgotStatus("PENDING");
        setForgotMessage(data.message);
      } else if (data.status === "NOT_FOUND") {
        setForgotStatus("IDLE");
        setForgotError(data.message);
      } else {
        setForgotStatus("IDLE");
        setForgotMessage(data.message);
      }
    } catch (err: any) {
      setForgotError(err.message || "An error occurred.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setForgotError("Please fill out both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match. Please re-type.");
      return;
    }
    if (newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");

      setResetSuccess(true);
      setForgotMessage(data.message || "Password updated successfully! Logging you in...");

      if (typeof window !== "undefined") {
        localStorage.setItem("efrl_user", JSON.stringify({ ...data.user, player: data.player }));
      }

      setTimeout(() => {
        router.push(data.redirectUrl || "/dashboard");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setForgotError(err.message || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">

        {/* Ambient glow */}
        <div className="absolute -top-16 -left-16 w-60 h-60 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative rounded-3xl border border-border bg-background/90 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isAdminRequired && (
                <Badge variant="destructive" className="text-xs uppercase font-mono">
                  Admin Portal
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-black uppercase text-white tracking-tight">
              {isAdminRequired ? "Administrator Sign In" : "Sign In to Your Account"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isAdminRequired
                ? "Enter verified administrator credentials to access the League Control Room."
                : "Sign in to access your 24-hr daily match, coordinate on WhatsApp, and submit results."}
            </p>
          </div>

          {isAdminRequired && !error && (
            <div className="mb-6 rounded-xl bg-primary/10 border border-primary/30 p-3 text-xs text-primary flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>Authentication Required: Please sign in as an Administrator.</span>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground uppercase mb-1">
                Email or Gamer Tag
              </label>
              <div className="relative">
                <Input
                  required
                  placeholder="e.g. admin@efootball.rw or your gamer tag"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-9"
                />
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-foreground uppercase">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (identifier.includes("@")) {
                      setForgotEmail(identifier.trim());
                    }
                    setForgotError("");
                    setForgotMessage("");
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-bold text-primary hover:text-primary hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-white transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="yellow"
              size="lg"
              className="w-full font-black text-secondary-foreground shadow-lg"
              disabled={loading}
              rollingText={!loading}
              duplicateText={isAdminRequired ? "Authenticate as Admin" : "Enter Athlete Portal"}
            >
              {loading ? "Verifying..." : isAdminRequired ? "Authenticate as Admin" : "Sign In"}
            </Button>
          </form>

          {/* FORGOT PASSWORD MODAL */}
          {showForgotModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-fade-in duration-200">
              <div className="relative w-full max-w-md rounded-3xl border border-border bg-background p-6 sm:p-8 shadow-2xl space-y-6">
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStatus("IDLE");
                    setForgotError("");
                    setForgotMessage("");
                    setResetSuccess(false);
                  }}
                  className="absolute right-4 top-4 p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-card transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Modal Header */}
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 text-primary">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black uppercase text-white tracking-tight">
                    {forgotStatus === "APPROVED"
                      ? "Set Your New Password"
                      : "Forgot Your Password?"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {forgotStatus === "APPROVED"
                      ? "The Commissioner has granted permission. Enter and confirm your new password below."
                      : "Enter your registered email address. The system will send a reset request to the League Commissioner for approval."}
                  </p>
                </div>

                {/* Error & Message Alerts */}
                {forgotError && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotMessage && (
                  <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 text-xs text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>{forgotMessage}</span>
                  </div>
                )}

                {/* STEP 1: REQUEST OR CHECK APPROVAL */}
                {forgotStatus !== "APPROVED" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground uppercase mb-1">
                        Your Registered Email Address
                      </label>
                      <div className="relative">
                        <Input
                          type="email"
                          required
                          placeholder="athlete@example.rw"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="pl-9"
                        />
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {forgotStatus === "PENDING" ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/30 text-secondary space-y-2 text-xs">
                          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-secondary">
                            <Clock className="h-4 w-4 animate-spin" />
                            <span>Waiting for Admin Approval</span>
                          </div>
                          <p className="text-foreground leading-relaxed">
                            Your password reset request has been logged. The League Commissioner will grant permission in the Admin Office. Once approved, click the button below to set your new password.
                          </p>
                        </div>

                        <Button
                          type="button"
                          onClick={handleCheckStatus}
                          disabled={forgotLoading}
                          className="w-full font-black text-secondary-foreground gap-2 h-11"
                        >
                          <RefreshCw className={`h-4 w-4 ${forgotLoading ? "animate-spin" : ""}`} />
                          <span>{forgotLoading ? "Checking..." : "Check Commissioner Approval & Continue"}</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <Button
                          type="button"
                          onClick={() => handleRequestReset()}
                          disabled={forgotLoading}
                          className="w-full font-black text-secondary-foreground h-11"
                        >
                          {forgotLoading ? "Sending Request..." : "Send Reset Request to Admin"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCheckStatus}
                          disabled={forgotLoading}
                          className="w-full text-xs font-bold text-foreground h-11"
                        >
                          <Clock className="h-4 w-4 mr-1.5" />
                          I Already Requested – Check Approval Status
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: ENTER NEW PASSWORD & CONFIRM (WHEN APPROVED) */}
                {forgotStatus === "APPROVED" && (
                  <form onSubmit={handleConfirmReset} className="space-y-4">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-2 text-primary text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Commissioner Permission Granted: Enter your new password</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground uppercase mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          required
                          minLength={6}
                          placeholder="Enter at least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-9 pr-10"
                        />
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground uppercase mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          minLength={6}
                          placeholder="Retype your new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-9 pr-10"
                        />
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="yellow"
                      disabled={forgotLoading || resetSuccess}
                      className="w-full font-black text-secondary-foreground h-11"
                    >
                      {forgotLoading ? "Updating Password..." : resetSuccess ? "Logging in..." : "Set New Password & Sign In"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Registration link */}
          <div className="mt-6 text-center text-xs text-muted-foreground border-t border-border pt-5 space-y-2">
            <div>
              Don&apos;t have an eFootball Mobile account?{" "}
              <Link
                href="/register"
                className="font-bold text-primary hover:text-primary underline underline-offset-2 ml-1"
              >
                Create Account
              </Link>
            </div>
            <div className="pt-2">
              <Link
                href="/admin/login"
                className="text-xs font-mono text-primary hover:text-primary flex items-center justify-center gap-1 hover:underline"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Go to Dedicated League Admin Office →
              </Link>
            </div>
          </div>
        </div>

        {/* External Resources & Community Links */}
        <div className="rounded-2xl mt-5 border border-border bg-background/80 p-4 space-y-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block text-center">
            External Community & League Tables (Open Access)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://discord.gg/rbaFrBB5p"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-card border border-border hover:border-primary/40 text-center text-xs text-foreground font-semibold transition-all hover:text-white"
            >
              Official Discord ↗
            </a>
            <a
              href="https://www.instagram.com/efootball_rwanda1/?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-card border border-border hover:border-primary/40 text-center text-xs text-foreground font-semibold transition-all hover:text-white"
            >
              Official Instagram ↗
            </a>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase font-bold tracking-wider"
          >
            ← Back to eFootball Rwanda League Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><EfootballLoader size="md" text="Loading Player Portal..." /></div>}>
      <LoginForm />
    </Suspense>
  );
}
