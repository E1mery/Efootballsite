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
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-500/20 border-yellow-500/30",
      title: `Welcome to the eFootball Rwanda League, ${player?.gamerTag || "Athlete"}!`,
      subtitle: "Official eFootball Mobile Competitive Circuit",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Congratulations on joining the official eFootball Rwanda League! Your account is officially created and ready to compete for domestic titles, prize money, and continental glory.
          </p>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-yellow-400">
              <Trophy className="h-4 w-4" />
              <span>League Division System:</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li>
                <strong className="text-white">Division 1 (Premiership):</strong> The elite tier competing for the national championship and UCL slots.
              </li>
              <li>
                <strong className="text-white">Division 2 & Division 3:</strong> Competitive ladders where top finishers earn official end-of-season promotion.
              </li>
              <li>
                <strong className="text-white">League Reserve Pool:</strong> Standby athletes called up immediately when active division spots open.
              </li>
            </ul>
          </div>
          <p className="text-[11px] text-slate-400">
            Current Placement: <strong className="text-white">{isReserved ? "Reserve Pool (Standby)" : player?.division || "Division 1"}</strong> • Platform: <strong className="text-sky-400">eFootball Mobile Only</strong>
          </p>
        </div>
      ),
    },
    {
      id: "cycle",
      badge: "STEP 2: MATCH SCHEDULE & DEADLINES",
      badgeVariant: "default" as const,
      icon: Clock,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/20 border-cyan-500/30",
      title: "24-Hour Match Windows & Midnight Cutoffs",
      subtitle: "Every match fixture expires automatically at 12:00 AM",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            The league runs on an automated daily cycle. Each scheduled fixture has a strict <strong className="text-cyan-300">24-hour match window</strong> that expires at midnight (12:00 AM).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase text-cyan-400 block">⏱️ Live Countdown:</span>
              <p className="text-xs text-slate-300">
                Your dashboard displays a live countdown timer for today&apos;s active fixture so you always know how much time remains.
              </p>
            </div>
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-400 block">⚠️ Attendance Discipline:</span>
              <p className="text-xs text-slate-300">
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
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/20 border-emerald-500/30",
      title: "Coordinating Matches via WhatsApp",
      subtitle: "Direct peer-to-peer match scheduling",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Matches in the league are played inside the official <strong className="text-white">eFootball Mobile app (Friend Match / Room Match)</strong>.
          </p>
          <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-3.5 space-y-2">
            <h5 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">
              How to arrange your match in 3 steps:
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-emerald-100">
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
          <p className="text-[11px] text-slate-400">
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
      iconColor: "text-sky-400",
      iconBg: "bg-sky-500/20 border-sky-500/30",
      title: "Submit Scores & Upload Screenshot Proof",
      subtitle: "Official score verification by commissioners",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Immediately after your match concludes, you must submit the result through your portal before the midnight deadline:
          </p>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Screenshot the Final Whistle:</strong> Take a clear mobile screenshot showing the full final score screen inside eFootball.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Click &quot;Submit Score&quot;:</strong> Enter the goals scored by each athlete and upload or paste the screenshot URL.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
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
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/20 border-rose-500/30",
      title: "Opponent Not Responding? Claim a Forfeit",
      subtitle: "Protected 3-0 forfeit victory mechanism",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            What happens if your opponent ignores your WhatsApp messages or doesn&apos;t show up to play? The EFRL system protects active players:
          </p>
          <div className="rounded-2xl bg-rose-950/20 border border-rose-500/30 p-3.5 space-y-2">
            <h5 className="font-bold text-rose-300 text-xs uppercase tracking-wider">
              Forfeit Protection Rules:
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li>
                1. Take a screenshot of your unanswered WhatsApp chat showing you reached out to your opponent with sufficient time.
              </li>
              <li>
                2. Click the red <strong>&quot;Claim Forfeit&quot;</strong> button on your match card.
              </li>
              <li>
                3. Upload the screenshot proof and submit. The commissioner desk reviews the chat and awards you a <strong className="text-rose-400">3-0 Forfeit Win (+3 Points)</strong>.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "standings",
      badge: "STEP 6: STANDINGS & CONTINENTAL CUPS",
      badgeVariant: "yellow" as const,
      icon: Trophy,
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-500/20 border-yellow-500/30",
      title: "Standings, Promotion & UCL Qualification",
      subtitle: "Track live tables, goal difference & continental cups",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Every point counts in the league! Explore the <strong className="text-white">&quot;All Division Tables&quot;</strong> tab in your portal:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase text-yellow-400 block">🏆 Points & Tie-breakers:</span>
              <p className="text-xs text-slate-300">
                Win = 3 pts, Draw = 1 pt, Loss = 0 pts. Ranked by Points → Goal Difference → Goals Scored.
              </p>
            </div>
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-400 block">⭐ Continental Cups:</span>
              <p className="text-xs text-slate-300">
                Top finishers in Division 1 qualify for the eFootball Champions League (UCL) & Europa League tournaments!
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
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/20 border-amber-500/30",
      title: "The Quick Action Hub Is Always Here for You",
      subtitle: "Click the floating ⚡ button anytime you need assistance",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Whenever there is something you want to do in your portal but you don&apos;t know how to do it, look for the glowing <strong className="text-amber-400">⚡ Quick Actions &amp; Help</strong> button in the bottom-right corner of your screen!
          </p>
          <div className="rounded-2xl bg-gradient-to-r from-amber-950/30 to-indigo-950/30 border border-amber-500/30 p-3.5 space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Instant Shortcuts Available in 1-Click:</span>
            </h5>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <span className="flex items-center gap-1">⚡ Submit match score</span>
              <span className="flex items-center gap-1">⚡ Claim a forfeit win</span>
              <span className="flex items-center gap-1">⚡ WhatsApp opponent</span>
              <span className="flex items-center gap-1">⚡ Check division standings</span>
              <span className="flex items-center gap-1">⚡ Contact league admins</span>
              <span className="flex items-center gap-1">⚡ Replay this guide</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-[#070c18] p-5 sm:p-7 shadow-2xl space-y-5 overflow-hidden ring-1 ring-slate-700/50">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-sky-500 to-indigo-500" />

        {/* Top Controls: Step counter and close button */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Badge variant={current.badgeVariant} className="text-[10px] font-mono font-bold tracking-wider">
              {current.badge}
            </Badge>
            <span className="text-xs font-mono text-slate-500">
              {currentStep + 1} of {steps.length}
            </span>
          </div>

          <button
            onClick={handleFinish}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                  ? "w-8 bg-yellow-400"
                  : idx < currentStep
                  ? "w-3 bg-sky-500/70"
                  : "w-3 bg-slate-800"
              }`}
              title={`Jump to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Main Content Area */}
        <div className="space-y-4 min-h-[260px] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl border ${current.iconBg} shrink-0`}>
                <StepIcon className={`h-6 w-6 ${current.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                  {current.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{current.subtitle}</p>
              </div>
            </div>

            <div className="pt-2">{current.content}</div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <button
            onClick={handleFinish}
            className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors self-start sm:self-auto order-2 sm:order-1"
          >
            Skip Tutorial
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="text-xs font-bold gap-1 border-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            )}

            {!isLast ? (
              <Button
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-black gap-1 shadow-lg shadow-sky-500/20 px-4"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinish}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 text-xs font-black gap-1 shadow-xl shadow-yellow-500/30 px-5"
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
