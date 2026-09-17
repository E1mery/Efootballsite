"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Smartphone, Lock, User, ShieldCheck, AlertCircle } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    errorParam === "admin_required"
      ? "Access Denied: You must be logged in as an Administrator to access the Admin Control Center."
      : ""
  );

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
        router.push("/admin");
      } else {
        if (isAdminRequired) {
          setError("Your account is a Player account. Administrator access is required.");
          return;
        }
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        {/* Ambient glow */}
        <div className="absolute -top-16 -left-16 w-60 h-60 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative rounded-3xl border border-slate-800 bg-slate-950/90 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-0.5 shadow-lg shadow-sky-500/20 mb-3">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                <Smartphone className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="yellow" className="text-[10px] font-mono uppercase tracking-wider">
                eFootball Mobile Arena
              </Badge>
              {isAdminRequired && (
                <Badge variant="destructive" className="text-[10px] uppercase font-mono">
                  Admin Portal
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-black uppercase text-white tracking-tight">
              {isAdminRequired ? "Administrator Sign In" : "Sign In to Your Account"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isAdminRequired
                ? "Enter verified administrator credentials to access the League Control Room."
                : "Sign in to access your 24-hr daily match, coordinate on WhatsApp, and submit results."}
            </p>
          </div>

          {isAdminRequired && !error && (
            <div className="mb-6 rounded-xl bg-sky-500/10 border border-sky-500/30 p-3 text-xs text-sky-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-sky-400" />
              <span>Authentication Required: Please sign in as an Administrator.</span>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
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
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <Button
              type="submit"
              variant="yellow"
              size="lg"
              className="w-full font-black text-slate-950 shadow-lg shadow-yellow-500/20"
              disabled={loading}
            >
              {loading ? "Verifying..." : isAdminRequired ? "Authenticate as Admin" : "Sign In"}
            </Button>
          </form>

          {/* Registration link */}
          <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-900 pt-5 space-y-2">
            <div>
              Don&apos;t have an eFootball Mobile account?{" "}
              <Link
                href="/register"
                className="font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2 ml-1"
              >
                Create Account
              </Link>
            </div>
            <div className="pt-2">
              <Link
                href="/admin/login"
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 hover:underline"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Go to Dedicated League Admin Office →
              </Link>
            </div>
          </div>
        </div>

        {/* External Resources & Community Links */}
        <div className="rounded-2xl border border-slate-800 bg-[#080d1e]/80 p-4 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            External Community & League Tables (Open Access)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://discord.gg/rbaFrBB5p"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-center text-xs text-slate-300 font-semibold transition-all hover:text-white"
            >
              Official Discord ↗
            </a>
            <a
              href="https://www.instagram.com/efootball_rwanda1/?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/40 text-center text-xs text-slate-300 font-semibold transition-all hover:text-white"
            >
              Official Instagram ↗
            </a>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-cyan-400 transition-colors uppercase font-bold tracking-wider"
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
