"use client";

import { useState } from "react";
import {
  Sparkles,
  Smartphone,
  Clock,
  MessageSquare,
  Upload,
  ShieldAlert,
  Trophy,
  Bell,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenActionHub?: () => void;
  player?: any;
  isReserved?: boolean;
}

export default function QuickGuideModal({
  isOpen,
  onClose,
  onOpenActionHub,
  player,
  isReserved = false,
}: QuickGuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: "welcome",
      badge: "STEP 1: GETTING STARTED",
      badgeVariant: "yellow" as const,
      icon: Sparkles,
      iconColor: "text-secondary",
      iconBg: "bg-secondary/20 border-secondary/30",
      title: `Welcome to the eFootball Rwanda League, ${player?.gamerTag || "Athlete"}!`,
      subtitle: "Official eFootball Mobile Competitive Circuit",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-foreground leading-relaxed">
          <p>
            Congratulations on joining the official eFootball Rwanda League! Your account is officially created and ready to compete for domestic titles, prize money, and continental glory.
          </p>
          <div className="rounded-2xl bg-card/80 border border-border p-3.5 space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-secondary">
              <Trophy className="h-4 w-4" />
              <span>Real Football Team Representation:</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-foreground">
              <li>
                <strong className="text-white">Division 1:</strong> Represented by official <span className="text-primary font-semibold">Premier League</span> teams &amp; badges.
              </li>
              <li>
                <strong className="text-white">Division 2:</strong> Represented by official <span className="text-secondary font-semibold">La Liga</span> teams &amp; badges.
              </li>
              <li>
                <strong className="text-white">Division 3:</strong> Represented by official <span className="text-primary font-semibold">Serie A</span> teams &amp; badges.
              </li>
              <li className="text-xs text-secondary font-semibold">
                🔒 <strong>Strict Club Uniqueness Protocol:</strong> Each football team can only be selected by one athlete. Once a club is claimed, no other player can choose it!
              </li>
              <li className="text-xs text-muted-foreground">
                Your selected club&apos;s crest acts as your official avatar everywhere: league tables, fixtures, match cards, and continental draws!
              </li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Current Placement: <strong className="text-white">{isReserved ? "Reserve Pool (Standby)" : player?.division || "Division 1"}</strong> • Platform: <strong className="text-primary">eFootball Mobile Only</strong>
          </p>
        </div>
      ),
    },
    {
      id: "cycle",
      badge: "STEP 2: MATCH SCHEDULE & DEADLINES",
      badgeVariant: "default" as const,
      icon: Clock,
      iconColor: "text-primary",
      iconBg: "bg-primary/20 border-primary/30",
      title: "24-Hour Match Windows & Midnight Cutoffs",
      subtitle: "Every match fixture expires automatically at 12:00 AM",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-foreground leading-relaxed">
          <p>
            The league runs on an automated daily cycle. Each scheduled fixture has a strict <strong className="text-primary">24-hour match window</strong> that expires at midnight (12:00 AM).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-card border border-border p-3 space-y-1">
              <span className="text-xs font-bold uppercase text-primary block">⏱️ Live Countdown:</span>
              <p className="text-xs text-foreground">
                Your dashboard displays a live countdown timer for today&apos;s active fixture so you always know how much time remains.
              </p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3 space-y-1">
              <span className="text-xs font-bold uppercase text-destructive block">⚠️ Attendance Discipline:</span>
              <p className="text-xs text-foreground">
                Failing to submit 3 consecutive fixtures leads to automatic league disqualification. Always play your match or communicate with admins!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "whatsapp",
      badge: "STEP 3: PLAYING YOUR MATCH",
      badgeVariant: "green" as const,
      icon: MessageSquare,
      iconColor: "text-primary",
      iconBg: "bg-primary/20 border-primary/30",
      title: "Coordinating Matches via WhatsApp",
      subtitle: "Direct peer-to-peer match scheduling",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-foreground leading-relaxed">
          <p>
            Matches in the league are played inside the official <strong className="text-white">eFootball Mobile app (Friend Match / Room Match)</strong>.
          </p>
          <div className="rounded-2xl bg-primary/20 border border-primary/30 p-3.5 space-y-2">
            <h5 className="font-bold text-primary text-xs uppercase tracking-wider">
              How to arrange your match in 3 steps:
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-primary">
              <li>
                Click the green <strong>&quot;WhatsApp Opponent&quot;</strong> button on your active match card to open direct WhatsApp chat.
              </li>
              <li>
                Agree on kickoff time and create a <strong>Friend Match Room</strong> in eFootball Mobile.
              </li>
              <li>
                Share the Room Number with your opponent and play your match!
              </li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Keep your registered WhatsApp active so opponents can contact you quickly.
          </p>
        </div>
      ),
    },
    {
      id: "submission",
      badge: "STEP 4: SUBMITTING SCORES",
      badgeVariant: "default" as const,
      icon: Upload,
      iconColor: "text-primary",
      iconBg: "bg-primary/20 border-primary/30",
      title: "Submit Scores & Upload Screenshot Proof",
      subtitle: "Official score verification by commissioners",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-foreground leading-relaxed">
          <p>
            Immediately after your match concludes, you must submit the result through your portal before the midnight deadline:
          </p>
          <div className="rounded-2xl bg-card border border-border p-3.5 space-y-2">
            <ul className="space-y-2 text-xs text-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Screenshot the Final Whistle:</strong> Take a clear mobile screenshot showing the full final score screen inside eFootball.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Click &quot;Submit Score&quot;:</strong> Enter the goals scored by each athlete and upload or paste the screenshot URL.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Admin Verification:</strong> League Commissioners inspect the screenshot and verify the score to update division standings.
                </span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "forfeit",
      badge: "STEP 5: HANDLING FORFEITS",
      badgeVariant: "destructive" as const,
      icon: ShieldAlert,
      iconColor: "text-destructive",
      iconBg: "bg-destructive/20 border-destructive/30",
      title: "Opponent Not Responding? Claim a Forfeit",
      subtitle: "Protected 3-0 forfeit victory mechanism",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-foreground leading-relaxed">
          <p>
            What happens if your opponent ignores your WhatsApp messages or doesn&apos;t show up to play? The EFRL system protects active players:
          </p>
          <div className="rounded-2xl bg-destructive/20 border border-destructive/30 p-3.5 space-y-2">
            <h5 className="font-bold text-destructive text-xs uppercase tracking-wider">
              Forfeit Protection Rules:
            </h5>
            <ul className="space-y-1.5 text-xs text-foreground">
              <li>
                1. Take a screenshot of your unanswered WhatsApp chat showing you reached out to your opponent with sufficient time.
              </li>
              <li>
                2. Click the red <strong>&quot;Claim Forfeit&quot;</strong> button on your match card.
              </li>
              <li>
                3. Upload the screenshot proof and submit. The commissioner desk reviews the chat and awards you a <strong className="text-destructive">3-0 Forfeit Win (+3 Points)</strong>.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "standings",
      badge: "STEP 6: CONTINENTAL CUPS & LIVE DRAWS",
      badgeVariant: "yellow" as const,
      icon: Trophy,
      iconColor: "text-secondary",
      iconBg: "bg-secondary/20 border-secondary/30",
      title: "UCL, Europa League & Commissioner Live Draws",
      subtitle: "Official animated draws with spinning roulette & sound",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-foreground leading-relaxed">
          <p>
            Once domestic division fixtures conclude, top performers qualify for the continental stage: <strong className="text-primary">eFootball Champions League (UCL)</strong> and <strong className="text-secondary">Europa League</strong>.
          </p>
          <div className="space-y-2.5">
            <div className="rounded-xl bg-card border border-border p-3 space-y-1.5">
              <span className="text-xs font-bold uppercase text-primary block flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Simultaneous Live Broadcasts (Automatic Draw Start):</span>
              </span>
              <p className="text-xs text-foreground">
                Players no longer vote or select groups manually. The League Commissioner unlocks the continental tournaments, schedules the official draw date/time, and executes the animated draw directly from the Admin Portal.
              </p>
              <p className="text-xs text-foreground">
                You can track the scheduled draw date, time, and live countdown directly in your portal. When the timer reaches 00:00:00 or when the Commissioner starts the broadcast from the Admin Office, the live animated draws launch on all players&apos; portals simultaneously!
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-xl bg-card border border-border p-2.5 space-y-1">
                <span className="text-xs font-bold uppercase text-secondary block">🎰 Animated Roulette &amp; Audio:</span>
                <p className="text-xs text-foreground">
                  Enjoy immersive ball spinning roulette sounds, athlete reveal chimes, group lock sounds, and victory fanfare.
                </p>
              </div>
              <div className="rounded-xl bg-card border border-border p-2.5 space-y-1">
                <span className="text-xs font-bold uppercase text-primary block">📺 Watch in Player Portal:</span>
                <p className="text-xs text-foreground">
                  Track the scheduled draw countdown in your dashboard and watch the official draw event live!
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-card border border-border p-2.5 space-y-1">
              <span className="text-xs font-bold uppercase text-primary block">🛡️ UEFA Division Protection:</span>
              <p className="text-xs text-foreground">
                The automated system guarantees no more than 2 athletes from the same league end up in the same group!
                </p>
              </div>
            </div>
          </div>
      ),
    },
    {
      id: "quickactions",
      badge: "STEP 7: QUICK ACTIONS & NEED HELP",
      badgeVariant: "default" as const,
      icon: Zap,
      iconColor: "text-secondary",
      iconBg: "bg-secondary/20 border-secondary/30",
      title: "The Quick Action Hub Is Always Here for You",
      subtitle: "Click the floating ⚡ button anytime you need assistance",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-foreground leading-relaxed">
          <p>
            Whenever there is something you want to do in your portal but you don&apos;t know how to do it, look for the glowing <strong className="text-secondary">⚡ Quick Actions &amp; Help</strong> button in the bottom-right corner of your screen!
          </p>
          <div className="rounded-2xl bg-gradient-to-r from-secondary/30 to-primary/30 border border-secondary/30 p-3.5 space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-secondary" />
              <span>Instant Shortcuts Available in 1-Click:</span>
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs text-foreground">
              <span className="flex items-center gap-1">⚡ Submit match score</span>
              <span className="flex items-center gap-1">⚡ Claim a forfeit win</span>
              <span className="flex items-center gap-1">⚡ WhatsApp opponent</span>
              <span className="flex items-center gap-1">⚡ Check division standings</span>
              <span className="flex items-center gap-1">⚡ Contact league admins</span>
              <span className="flex items-center gap-1">⚡ Replay this guide</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Notices &amp; broadcasts in the Announcements tab automatically clear after 24 hours to keep your portal clean and up to date.
          </p>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];
  const StepIcon = current.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleFinish = () => {
    try {
      localStorage.setItem("efrl_tutorial_completed", "true");
    } catch (e) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-border bg-background p-5 sm:p-7 shadow-2xl space-y-5 overflow-hidden ring-1 ring-ring/50">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-primary" />

        {/* Top Controls: Step counter and close button */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Badge variant={current.badgeVariant} className="text-xs font-mono font-bold tracking-wider">
              {current.badge}
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>
          </div>

          <button
            onClick={handleFinish}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-white hover:bg-muted transition-colors"
            title="Close Quick Guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-1.5">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep
                  ? "w-8 bg-secondary"
                  : idx < currentStep
                  ? "w-3 bg-primary/70"
                  : "w-3 bg-muted"
              }`}
              title={`Jump to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Main Content Area */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl border ${current.iconBg} shrink-0`}>
                <StepIcon className={`h-6 w-6 ${current.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                  {current.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{current.subtitle}</p>
              </div>
            </div>

            <div className="pt-2">{current.content}</div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/80">
          <button
            onClick={handleFinish}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto order-2 sm:order-1"
          >
            Skip Tutorial
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="text-xs font-bold gap-1 border-border"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            )}

            {!isLast ? (
              <Button
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="bg-primary hover:bg-primary text-white text-xs font-black gap-1 shadow-lg px-4"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinish}
                className="bg-gradient-to-r from-secondary to-secondary hover:from-secondary hover:to-secondary text-secondary-foreground text-xs font-black gap-1 shadow-xl px-5"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Ready to Play! (Enter Portal)</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
