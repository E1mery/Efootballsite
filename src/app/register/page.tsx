"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Smartphone, Lock, User, CheckCircle, ShieldAlert, Trophy, Phone, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    gamerTag: "",
    whatsapp: "",
    email: "",
    password: "",
    preferredDivision: "Division 1",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  // Check if registration is open
  useState(() => {
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setRegistrationOpen(data.config.registrationOpen);
        }
      })
      .catch(() => setRegistrationOpen(true));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      // Save user session in localStorage for immediate navbar persistence
      if (typeof window !== "undefined" && data.user) {
        localStorage.setItem("efrl_user", JSON.stringify(data.user));
      }

      // Successfully registered and session created! Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-3">
          <Badge variant="yellow">EFOOTBALL MOBILE GAMING</Badge>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
            Open Athlete Registration
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
          Player Registration
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
          Create your official athlete profile. Registrations have no limit! The League Commissioner will review your account to either place you directly into an active division or into the official Standby Reserve Pool.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Card */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-950/90 p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <h3 className="text-lg font-black uppercase text-white border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-sky-400" />
            <span>Mobile Athlete Profile</span>
          </h3>

          {registrationOpen === false && (
            <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-300 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-black uppercase tracking-wider text-amber-400">Registration Is Currently Closed</p>
                <p className="mt-1 text-slate-300">
                  The League Administrator has temporarily closed registrations. Please log in if you already have an account, or check back soon.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Gamer Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Kevin Mugisha"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Gamer Tag / In-Game Nickname *
                </label>
                <Input
                  required
                  placeholder="e.g. KGL_Sniper99"
                  value={formData.gamerTag}
                  onChange={(e) => setFormData({ ...formData, gamerTag: e.target.value })}
                />
              </div>
            </div>

            {/* WhatsApp Contact */}
            <div>
              <label className="block text-xs font-bold text-emerald-400 uppercase mb-1 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                WhatsApp Number *
              </label>
              <Input
                required
                placeholder="e.g. +250 788 123 456"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Required for matchmaking coordination with opponents and Commissioner updates.
              </span>
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Email Address *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="player@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Account Password *
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {/* Requested Starting Division */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Requested Starting Division (Pending Commissioner Placement)
              </label>
              <select
                className="flex h-11 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={formData.preferredDivision}
                onChange={(e) => setFormData({ ...formData, preferredDivision: e.target.value })}
              >
                <option value="Division 1">Division 1 (Premiership - Elite)</option>
                <option value="Division 2">Division 2 (Championship - Semi-Pro)</option>
                <option value="Division 3">Division 3 (National Academy - Grassroots)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                The League Administrator will review your account to either approve your division placement or place you in the official Standby Reserve Pool.
              </span>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="yellow"
                size="lg"
                className="w-full font-black text-slate-950 shadow-xl shadow-yellow-500/20"
                disabled={loading || registrationOpen === false}
              >
                {loading
                  ? "Submitting Profile..."
                  : registrationOpen === false
                  ? "Registration Closed"
                  : "Submit Registration for League Review"}
              </Button>
            </div>

            <div className="text-center text-xs text-slate-400 pt-2">
              Already registered?{" "}
              <Link href="/login" className="text-sky-400 font-bold hover:underline">
                Log In to Your Dashboard
              </Link>
            </div>
          </form>
        </div>

        {/* League Mobile Rules Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              eFootball Mobile League Rules
            </h3>
            <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>24-Hour Match Window:</strong> New fixtures drop every day at 12:00 AM midnight. You have strictly 24 hours to play and upload your result.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>WhatsApp Coordination:</strong> Click the WhatsApp button on your match fixture to message your opponent directly.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Screenshot Proof Required:</strong> Take a screenshot of the in-game full-time score screen and upload it on your dashboard for admin verification.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <span>
                  <strong>3 Missed Matches Disqualification:</strong> If an opponent doesn't respond or misses 3 consecutive matches, submit forfeit screenshot proof and they will be immediately removed and replaced.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
