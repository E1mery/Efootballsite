"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowRight, ShieldAlert, Gamepad2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      if (data.user?.role !== "ADMIN") {
        throw new Error("Access Denied: This portal is strictly reserved for League Administrators.");
      }

      // Successful Admin Login
      if (typeof window !== "undefined") {
        localStorage.setItem("efrl_user", JSON.stringify(data.user));
      }
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Home Button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl px-3.5 py-2 group shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-slate-400 group-hover:text-red-400" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 shadow-lg shadow-red-500/10">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="destructive" className="font-mono tracking-widest text-[10px] px-2 py-0.5">
              OFFICIAL COMMISSIONER PORTAL
            </Badge>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">
            League Admin Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Authorized personnel only. Access league tables, match scheduling, forfeit arbitration, and continental cup controls.
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-3xl border border-red-500/20 bg-slate-950/90 p-5 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-sky-500" />

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-red-400" />
                Admin Official Email
              </label>
              <Input
                type="email"
                placeholder="admin@efootball.rw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-red-400" />
                  Security Passphrase
                </label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors focus:outline-none"
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
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider py-6 rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Entering Admin Office...</span>
                </div>
              ) : (
                <>
                  <span>Enter Admin Office</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-red-400" /> End-to-End Encrypted Session
            </span>
            <span className="font-mono text-slate-500 text-[11px]">Authorized Admins Only</span>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          eFootball Rwanda League (EFRL) • Commissioner Office Security Portal
        </div>
      </div>
    </div>
  );
}
