"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Smartphone, Lock, User, CheckCircle, ShieldAlert, Trophy, Phone, MessageSquare, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getTeamsForDivision, findTeam } from "@/lib/teams";

export default function RegisterPage() {
  const router = useRouter();

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

  const [formData, setFormData] = useState({
    fullName: "",
    gamerTag: "",
    whatsapp: "",
    email: "",
    password: "",
    preferredDivision: "Division 1",
    realTeam: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [takenTeams, setTakenTeams] = useState<
    Record<string, { gamerTag: string; division: string }>
  >({});

  // Check if registration is open and fetch already claimed teams
  useEffect(() => {
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setRegistrationOpen(data.config.registrationOpen);
        }
      })
      .catch(() => setRegistrationOpen(true));

    fetch("/api/teams/taken")
      .then((res) => res.json())
      .then((data) => {
        if (data.takenTeams) {
          setTakenTeams(data.takenTeams);
        }
      })
      .catch((err) => console.error("Failed to load taken teams", err));
  }, []);

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
        localStorage.setItem("efrl_show_tutorial", "true");
      }

      // Successfully registered and session created! Redirect to dashboard with welcome flag
      router.push("/dashboard?welcome=true");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back to Home Button */}

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
          Player Registration
        </h1>
        <p className="mt-3 text-sm sm:text-base text-foreground leading-relaxed">
          Create your official athlete profile. Registrations have no limit! The League Commissioner will review your account to either place you directly into an active division or into the official Standby Reserve Pool.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Card */}
        <div className="lg:col-span-7 rounded-3xl border border-border bg-background/90 p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <h3 className="text-lg font-black uppercase text-white border-b border-border pb-3 mb-4 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <span>eFootball Mobile Player Profile</span>
          </h3>

          {registrationOpen === false && (
            <div className="mb-6 rounded-2xl bg-primary/10 border border-primary/30 p-4 text-xs text-primary flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-black uppercase tracking-wider text-primary">Division Entry Closed — Open for Reserve Pool</p>
                <p className="mt-1 text-foreground">
                  Official division schedules are set, but you can still register! All new registrants join the <strong>League Reserve Pool</strong>. Reserve athletes can vote in Match of the Day (MOTD) polls, track all division tables, and be called up as official replacement players.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Gamer Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase mb-1">
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
                <label className="block text-xs font-bold text-foreground uppercase mb-1">
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
              <label className="block text-xs font-bold text-primary uppercase mb-1 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                WhatsApp Number *
              </label>
              <Input
                required
                placeholder="e.g. +250 788 123 456"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
              <span className="text-xs text-muted-foreground mt-1 block">
                Required for matchmaking coordination with opponents and Commissioner updates.
              </span>
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase mb-1">
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
                <label className="block text-xs font-bold text-foreground uppercase mb-1">
                  Account Password *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-10"
                  />
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
            </div>

            {/* Requested Starting Division */}
            <div>
              <label className="block text-xs font-bold text-foreground uppercase mb-1">
                Requested Starting Division (Pending Commissioner Placement)
              </label>
              <select
                className="flex h-11 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.preferredDivision}
                onChange={(e) => {
                  const newDiv = e.target.value;
                  setFormData({ ...formData, preferredDivision: newDiv, realTeam: "" });
                }}
              >
                <option value="Division 1">Division 1 (Premiership - Premier League Teams)</option>
                <option value="Division 2">Division 2 (Championship - La Liga Teams)</option>
                <option value="Division 3">Division 3 (National Academy - Serie A Teams)</option>
              </select>
              <span className="text-xs text-muted-foreground mt-1 block">
                The League Administrator will review your account to either approve your division placement or place you in the official Standby Reserve Pool.
              </span>
            </div>

            {/* Official Real Football Club Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-foreground uppercase">
                  Official Club Representation (Avatar Logo)
                </label>
                <Badge variant="secondary" className="text-xs uppercase font-mono">
                  {formData.preferredDivision === "Division 1"
                    ? "Premier League"
                    : formData.preferredDivision === "Division 2"
                    ? "La Liga"
                    : "Serie A"}
                </Badge>
              </div>

              {formData.realTeam ? (
                <div className="p-3 rounded-2xl bg-primary/30 border border-primary/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-card p-1 flex items-center justify-center border border-border shrink-0">
                      {(() => {
                        const t = findTeam(formData.realTeam);
                        return t ? <img src={t.logo} alt={t.name} className="h-full w-full object-contain" /> : null;
                      })()}
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase text-primary block">Selected Football Club</span>
                      <span className="text-sm font-bold text-white">{formData.realTeam}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, realTeam: "" })}
                    className="text-xs text-destructive border-destructive/30 h-7"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    className="flex h-11 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.realTeam}
                    onChange={(e) => setFormData({ ...formData, realTeam: e.target.value })}
                  >
                    <option value="">Select your real football club (optional)</option>
                    {getTeamsForDivision(formData.preferredDivision).map((t) => {
                      const taken = takenTeams[t.name.trim().toLowerCase()];
                      return (
                        <option
                          key={t.name}
                          value={t.name}
                          disabled={Boolean(taken)}
                          className={taken ? "text-muted-foreground bg-background font-normal" : "text-white font-medium"}
                        >
                          {t.name} ({t.shortName}) {taken ? `[TAKEN by @${taken.gamerTag}]` : "— AVAILABLE"}
                        </option>
                      );
                    })}
                  </select>

                  {/* Visual Grid Picker with Live Availability */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1.5 border border-border rounded-xl bg-background/60">
                    {getTeamsForDivision(formData.preferredDivision).map((t) => {
                      const taken = takenTeams[t.name.trim().toLowerCase()];
                      const isSelected = formData.realTeam === t.name;
                      return (
                        <button
                          key={t.name}
                          type="button"
                          disabled={Boolean(taken)}
                          onClick={() => setFormData({ ...formData, realTeam: t.name })}
                          className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 relative ${
                            isSelected
                              ? "border-primary bg-primary/20 ring-2 ring-primary/50"
                              : taken
                              ? "border-border/60 bg-background/90 opacity-40 cursor-not-allowed"
                              : "border-border bg-card/60 hover:bg-muted hover:border-border"
                          }`}
                        >
                          <div className="h-8 w-8 rounded-lg bg-card p-1 flex items-center justify-center border border-border shrink-0">
                            <img src={t.logo} alt={t.name} className="h-full w-full object-contain" />
                          </div>
                          <div className="w-full text-center">
                            <div className="text-xs font-bold text-white truncate" title={t.name}>
                              {t.name}
                            </div>
                            {taken ? (
                              <span className="text-xs font-mono text-destructive font-bold block truncate">
                                TAKEN (@{taken.gamerTag})
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-primary font-semibold block">
                                Available
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <span className="text-xs text-muted-foreground block">
                Each real football club can only be represented by one athlete in the league. Taken clubs cannot be chosen.
              </span>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="yellow"
                size="lg"
                className="w-full font-black text-secondary-foreground shadow-xl"
                disabled={loading}
                rollingText={!loading}
                duplicateText="Claim Your Athlete Spot!"
              >
                {loading
                  ? "Submitting Profile..."
                  : registrationOpen === false
                  ? "Register for Official League Reserve Pool"
                  : "Submit Registration for League Review"}
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-2">
              Already registered?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Log In to Your Dashboard
              </Link>
            </div>
          </form>
        </div>

        {/* League Mobile Rules Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-border bg-card/50 p-6 space-y-4">
            <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-secondary" />
              eFootball Mobile League Rules
            </h3>
            <ul className="space-y-3 text-xs text-foreground leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  <strong>24-Hour Match Window:</strong> New fixtures drop every day at 12:00 AM midnight. You have strictly 24 hours to play and upload your result.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  <strong>WhatsApp Coordination:</strong> Click the WhatsApp button on your match fixture to message your opponent directly.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  <strong>Screenshot Proof Required:</strong> Take a screenshot of the in-game full-time score screen and upload it on your dashboard for admin verification.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
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
