"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Globe,
  Sparkles,
  Shield,
  Play,
  RotateCcw,
  FastForward,
  CheckCircle,
  AlertTriangle,
  Lock,
  Flame,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";
import { drawAudio } from "@/lib/drawAudio";

export interface DrawAthlete {
  id: string;
  gamerTag: string;
  fullName: string;
  division: string;
  realTeam?: string | null;
  avatar?: string | null;
  overallRating: number;
}

interface ContinentalDrawExperienceProps {
  competition: "UCL" | "EUROPA";
  qualifiedAthletes: DrawAthlete[];
  existingSlots?: Array<{
    groupName: string;
    playerId: string;
    playerDivision: string;
    slotIndex?: number;
    player?: any;
  }>;
  isAdmin?: boolean;
  onCommitDraw?: (slots: Array<{ groupName: string; playerId: string; playerDivision: string; slotIndex: number }>) => Promise<void>;
  onClose?: () => void;
}

export default function ContinentalDrawExperience({
  competition,
  qualifiedAthletes,
  existingSlots = [],
  isAdmin = false,
  onCommitDraw,
  onClose,
}: ContinentalDrawExperienceProps) {
  const isUcl = competition === "UCL";
  const themeColors = isUcl
    ? {
        primary: "indigo",
        accent: "sky",
        bgGrad: "from-background via-primary/70 to-background",
        border: "border-primary/40",
        glow: "",
        badge: "bg-primary/20 text-primary border-primary/40",
      }
    : {
        primary: "amber",
        accent: "orange",
        bgGrad: "from-background via-secondary/70 to-background",
        border: "border-secondary/40",
        glow: "",
        badge: "bg-secondary/20 text-secondary border-secondary/40",
      };

  // Group allocations state
  const GROUPS = ["Group A", "Group B", "Group C", "Group D"];

  // Prepare draw order and pots
  // UCL: Pot 1 (Top 8 Div 1), Pot 2 (Top 4 Div 2), Pot 3 (Top 4 Div 3)
  // Europa: Pot 1 (4 Div 1), Pot 2 (6 Div 2), Pot 3 (6 Div 3)
  const div1Players = qualifiedAthletes.filter((a) => a.division === "Division 1");
  const div2Players = qualifiedAthletes.filter((a) => a.division === "Division 2");
  const div3Players = qualifiedAthletes.filter((a) => a.division === "Division 3");

  // Draw Sequence state
  const [currentGroupAllocations, setCurrentGroupAllocations] = useState<
    Record<string, DrawAthlete[]>
  >({
    "Group A": [],
    "Group B": [],
    "Group C": [],
    "Group D": [],
  });

  const [remainingPool, setRemainingPool] = useState<DrawAthlete[]>([]);
  const [currentDrawnAthlete, setCurrentDrawnAthlete] = useState<DrawAthlete | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinName, setSpinName] = useState("");
  const [blockedGroups, setBlockedGroups] = useState<string[]>([]);
  const [targetGroup, setTargetGroup] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(drawAudio.isMuted());

  // Initialize pool
  useEffect(() => {
    if (existingSlots.length >= 16) {
      // Reconstitute existing completed slots
      const initial: Record<string, DrawAthlete[]> = {
        "Group A": [],
        "Group B": [],
        "Group C": [],
        "Group D": [],
      };
      existingSlots.forEach((slot) => {
        const found = qualifiedAthletes.find((a) => a.id === slot.playerId) || {
          id: slot.playerId,
          gamerTag: slot.player?.gamerTag || "Player",
          fullName: slot.player?.fullName || "",
          division: slot.playerDivision,
          realTeam: slot.player?.realTeam,
          avatar: slot.player?.avatar,
          overallRating: slot.player?.overallRating || 85,
        };
        if (initial[slot.groupName]) {
          initial[slot.groupName].push(found);
        }
      });
      setCurrentGroupAllocations(initial);
      setRemainingPool([]);
      setIsCompleted(true);
    } else {
      // Create ordered draw sequence:
      // Real UEFA style: Draw Pot 1, then Pot 2, then Pot 3
      const shuffledD1 = [...div1Players].sort(() => Math.random() - 0.5);
      const shuffledD2 = [...div2Players].sort(() => Math.random() - 0.5);
      const shuffledD3 = [...div3Players].sort(() => Math.random() - 0.5);

      let sequence: DrawAthlete[] = [];
      if (isUcl) {
        // UCL: Pot 2 (Div 2) -> Pot 3 (Div 3) -> Pot 1 (Div 1)
        sequence = [...shuffledD2, ...shuffledD3, ...shuffledD1];
      } else {
        // Europa: Pot 1 (Div 1) -> Pot 2 (Div 2) -> Pot 3 (Div 3)
        sequence = [...shuffledD1, ...shuffledD2, ...shuffledD3];
      }

      setRemainingPool(sequence);
      setCurrentGroupAllocations({
        "Group A": [],
        "Group B": [],
        "Group C": [],
        "Group D": [],
      });
      setIsCompleted(false);
    }
  }, [qualifiedAthletes, existingSlots, isUcl]);

  // Find eligible group for an athlete with division protection:
  // "no more than 2 players from the same division in the same group"
  const findEligibleGroup = (
    athlete: DrawAthlete,
    allocations: Record<string, DrawAthlete[]>
  ): { validGroup: string; invalidGroups: string[] } => {
    const invalid: string[] = [];

    for (const g of GROUPS) {
      const inGrp = allocations[g] || [];
      if (inGrp.length >= 4) {
        invalid.push(g);
        continue;
      }
      const sameDivCount = inGrp.filter((p) => p.division === athlete.division).length;
      if (sameDivCount >= 2) {
        invalid.push(g);
        continue;
      }
      return { validGroup: g, invalidGroups: invalid };
    }

    // Fallback if tight
    for (const g of GROUPS) {
      if ((allocations[g] || []).length < 4) {
        return { validGroup: g, invalidGroups: invalid };
      }
    }
    return { validGroup: GROUPS[0], invalidGroups: invalid };
  };

  // Perform a single step draw
  const performDrawStep = () => {
    if (remainingPool.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setBlockedGroups([]);
    setTargetGroup(null);
    setCurrentDrawnAthlete(null);

    const nextAthlete = remainingPool[0];

    // High-speed cycling roulette effect
    let cycleCount = 0;
    const allAthletesPool = qualifiedAthletes;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * allAthletesPool.length);
      setSpinName(allAthletesPool[randomIdx].gamerTag);
      drawAudio.playSpinTick(0.9 + (cycleCount / 22) * 0.4);
      cycleCount++;

      if (cycleCount > 22) {
        clearInterval(interval);
        finalizePick(nextAthlete);
      }
    }, 60);
  };

  const finalizePick = (athlete: DrawAthlete) => {
    drawAudio.playAthleteReveal();
    setCurrentDrawnAthlete(athlete);
    setSpinName(athlete.gamerTag);

    // Compute destination group enforcing division protection
    const { validGroup, invalidGroups } = findEligibleGroup(athlete, currentGroupAllocations);
    setBlockedGroups(invalidGroups);

    // Highlight target group after brief suspense
    setTimeout(() => {
      setTargetGroup(validGroup);

      // Slot athlete into group
      setTimeout(() => {
        setCurrentGroupAllocations((prev) => {
          const updated = { ...prev };
          updated[validGroup] = [...updated[validGroup], athlete];
          return updated;
        });
        drawAudio.playGroupLock();

        setRemainingPool((prev) => {
          const next = prev.slice(1);
          if (next.length === 0) {
            setIsCompleted(true);
            setIsAutoPlaying(false);
            drawAudio.playFanfare();
          }
          return next;
        });

        setIsSpinning(false);
      }, 700);
    }, 600);
  };

  // Auto-play loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying && !isSpinning && remainingPool.length > 0 && !isCompleted) {
      timer = setTimeout(() => {
        performDrawStep();
      }, 1200);
    }
    return () => clearTimeout(timer);
  }, [isAutoPlaying, isSpinning, remainingPool, isCompleted]);

  // Fast forward / Instant complete
  const handleInstantComplete = () => {
    setIsAutoPlaying(false);
    let tempAllocations = { ...currentGroupAllocations };
    let tempPool = [...remainingPool];

    while (tempPool.length > 0) {
      const athlete = tempPool.shift()!;
      const { validGroup } = findEligibleGroup(athlete, tempAllocations);
      tempAllocations[validGroup] = [...tempAllocations[validGroup], athlete];
    }

    setCurrentGroupAllocations(tempAllocations);
    setRemainingPool([]);
    setIsSpinning(false);
    setCurrentDrawnAthlete(null);
    setTargetGroup(null);
    setBlockedGroups([]);
    setIsCompleted(true);
    drawAudio.playFanfare();
  };

  // Commit official draw to database (Admin only)
  const handleCommit = async () => {
    if (!onCommitDraw) return;
    setCommitting(true);
    try {
      const slotsPayload: Array<{
        groupName: string;
        playerId: string;
        playerDivision: string;
        slotIndex: number;
      }> = [];

      GROUPS.forEach((groupName) => {
        const members = currentGroupAllocations[groupName] || [];
        members.forEach((athlete, idx) => {
          slotsPayload.push({
            groupName,
            playerId: athlete.id,
            playerDivision: athlete.division,
            slotIndex: idx + 1,
          });
        });
      });

      await onCommitDraw(slotsPayload);
      setCommitSuccess(true);
    } catch (err: any) {
      alert(`Commit error: ${err.message}`);
    } finally {
      setCommitting(false);
    }
  };

  const totalDrawn = 16 - remainingPool.length;

  return (
    <div className={`relative rounded-3xl border ${themeColors.border} bg-gradient-to-b ${themeColors.bgGrad} p-4 sm:p-8 backdrop-blur-2xl shadow-2xl text-white space-y-6 overflow-hidden`}>
      {/* Decorative Background Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

      {/* Broadcast Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
            <Badge className={`${themeColors.badge} font-black text-xs tracking-wider uppercase`}>
              Official Live Draw Broadcast
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Progress: {totalDrawn}/16 Athletes
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center gap-2.5">
            {isUcl ? (
              <Trophy className="h-7 w-7 text-primary animate-pulse" />
            ) : (
              <Globe className="h-7 w-7 text-secondary animate-pulse" />
            )}
            <span>eFootball {competition} Group Stage Draws</span>
          </h2>
          <p className="text-xs text-foreground">
            <strong>Association Protection Constraint:</strong> No more than 2 players from the same division can be drawn into the same group.
          </p>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Mute/Unmute Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextMuted = drawAudio.toggleMute();
              setIsMuted(nextMuted);
            }}
            className="p-2 rounded-xl bg-card border border-border text-foreground hover:text-white hover:bg-muted transition-all flex items-center gap-1.5 text-xs font-mono shadow-inner"
            title={isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
          >
            {isMuted ? (
              <>
                <VolumeX className="h-4 w-4 text-destructive" />
                <span className="text-xs text-destructive font-bold">Sound Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-xs text-primary font-bold">Sound ON</span>
              </>
            )}
          </button>

          {!isCompleted ? (
            isAdmin ? (
              <>
                <Button
                  onClick={performDrawStep}
                  disabled={isSpinning || remainingPool.length === 0}
                  variant="default"
                  size="sm"
                  className={`font-black text-xs shadow-lg ${
                    isUcl
                      ? "bg-primary hover:bg-primary text-white"
                      : "bg-secondary hover:bg-secondary text-white"
                  }`}
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  {isSpinning ? "Drawing Capsule..." : "Spin & Draw Next"}
                </Button>

                <Button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  disabled={remainingPool.length === 0}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold border-border bg-card/80 hover:bg-muted"
                >
                  {isAutoPlaying ? "Pause Broadcast" : "Auto Broadcast"}
                </Button>

                <Button
                  onClick={handleInstantComplete}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-white"
                  title="Fast forward all remaining picks"
                >
                  <FastForward className="h-3.5 w-3.5 mr-1" /> Skip to End
                </Button>
              </>
            ) : (
              <Badge variant="secondary" className="text-xs font-mono py-1 px-3 border border-border">
                Official Draw Controlled by Commissioner
              </Badge>
            )
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="live" className="text-xs font-bold py-1 px-3">
                Official Draw Completed
              </Badge>

              {isAdmin && onCommitDraw && (
                <Button
                  onClick={handleCommit}
                  disabled={committing || commitSuccess}
                  size="sm"
                  className={`font-black text-xs ${
                    commitSuccess
                      ? "bg-primary text-white"
                      : "bg-gradient-to-r from-secondary to-secondary text-secondary-foreground hover:brightness-110 shadow-lg"
                  }`}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  {commitSuccess
                    ? "Official Groups Locked & Saved!"
                    : committing
                    ? "Saving Official Draw..."
                    : "Save Official Groups & Generate Fixtures"}
                </Button>
              )}
            </div>
          )}

          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-white"
            >
              Exit
            </Button>
          )}
        </div>
      </div>

      {/* Main Center Stage: Spinning Pod & Drawing Reveal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Pot Summary */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card/60 p-4 space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Remaining Pot Pool
            </span>
            <Badge variant="secondary" className="font-mono text-xs">
              {remainingPool.length} Left
            </Badge>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {remainingPool.length === 0 ? (
              <p className="text-center py-8 text-xs text-primary font-bold">
                ✓ All 16 Athletes Drawn!
              </p>
            ) : (
              remainingPool.map((athlete) => {
                const avatarUrl = resolvePlayerAvatar(athlete);
                return (
                  <div
                    key={athlete.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-background/70 border border-border/80 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img
                        src={avatarUrl}
                        alt={athlete.gamerTag}
                        className="h-5 w-5 rounded-full object-contain shrink-0 bg-card p-0.5 border border-border"
                        onError={(e: any) => {
                          e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${athlete.gamerTag}`;
                        }}
                      />
                      <span className="font-bold text-white truncate w-28">
                        {athlete.gamerTag}
                      </span>
                    </div>
                    <Badge
                      variant={
                        athlete.division === "Division 1"
                          ? "secondary"
                          : athlete.division === "Division 2"
                          ? "yellow"
                          : "live"
                      }
                      className="text-xs px-1 py-0 shrink-0"
                    >
                      {athlete.division.replace("Division ", "D")}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Animated Spinning Drum & Revealer */}
        <div className="lg:col-span-6 relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/40 via-background to-background shadow-2xl overflow-hidden">
          {/* Neon Star Glow Center */}
          <div className="absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none" />

          {isSpinning ? (
            <div className="text-center space-y-4 animate-fade-in animate-zoom-in duration-200">
              {/* Spinning 3D Spheres Animation */}
              <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-t-secondary border-r-transparent border-b-primary border-l-transparent animate-spin duration-700" />
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary via-primary to-primary flex items-center justify-center shadow-lg">
                  <Sparkles className="h-7 w-7 text-white animate-pulse" />
                </div>
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-widest text-primary block animate-pulse">
                  Selecting Capsule...
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wider drop-shadow-md">
                  {spinName || "SHUFFLING..."}
                </span>
              </div>
            </div>
          ) : currentDrawnAthlete ? (
            <div className="text-center space-y-3 animate-zoom-in duration-300">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-black uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-secondary" />
                Drawn Capsule
              </div>

              {/* Athlete Card Reveal */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-card/90 border-2 border-secondary/60 shadow-xl w-60">
                <div className="relative mb-2">
                  <img
                    src={resolvePlayerAvatar(currentDrawnAthlete)}
                    alt={currentDrawnAthlete.gamerTag}
                    className="h-16 w-16 rounded-2xl object-contain bg-background p-2 border-2 border-border shadow-lg"
                    onError={(e: any) => {
                      e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentDrawnAthlete.gamerTag}`;
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-black font-mono">
                    {currentDrawnAthlete.overallRating || 85}
                  </div>
                </div>

                <h3 className="text-xl font-black text-white">{currentDrawnAthlete.gamerTag}</h3>
                <p className="text-xs text-muted-foreground">{currentDrawnAthlete.fullName}</p>

                {currentDrawnAthlete.realTeam && (
                  <span className="text-xs font-bold text-secondary mt-1">
                    {currentDrawnAthlete.realTeam}
                  </span>
                )}

                <Badge
                  variant={
                    currentDrawnAthlete.division === "Division 1"
                      ? "secondary"
                      : currentDrawnAthlete.division === "Division 2"
                      ? "yellow"
                      : "live"
                  }
                  className="text-xs mt-2"
                >
                  {currentDrawnAthlete.division}
                </Badge>
              </div>

              {/* Destination Tag */}
              {targetGroup ? (
                <div className="p-2.5 rounded-xl bg-primary/40 border border-primary/50 text-primary text-xs font-black animate-bounce flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Assigned to {targetGroup}!</span>
                </div>
              ) : blockedGroups.length > 0 ? (
                <div className="text-xs text-destructive bg-destructive/40 border border-destructive/30 p-2 rounded-xl">
                  Division Cap Active: {blockedGroups.join(", ")} already at max limit.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center space-y-3 py-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
                <Trophy className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-black uppercase text-white">
                {isCompleted ? "Draw Successfully Completed" : "Ready for Draw"}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isCompleted
                  ? "All 16 athletes are officially assigned to Groups A-D with strict division separation."
                  : "Click 'Spin & Draw Next' or 'Auto Broadcast' to start drawing qualified players into groups."}
              </p>
            </div>
          )}
        </div>

        {/* Right: Quick Rules & Stats */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card/60 p-4 space-y-3 backdrop-blur-md">
          <span className="text-xs font-black uppercase text-foreground block border-b border-border pb-2">
            Draw Regulations
          </span>
          <div className="space-y-2 text-xs text-foreground">
            <div className="p-2 rounded-xl bg-background/80 border border-border/80">
              <strong className="text-secondary block mb-0.5">Max 2 per Division</strong>
              No group may contain 3 or more athletes from the same league.
            </div>
            <div className="p-2 rounded-xl bg-background/80 border border-border/80">
              <strong className="text-primary block mb-0.5">Simultaneous 2-Legs</strong>
              Group matches are played in 2-legged home & away ties with aggregate scores.
            </div>
            <div className="p-2 rounded-xl bg-background/80 border border-border/80">
              <strong className="text-primary block mb-0.5">Top 2 Advance</strong>
              Top 2 athletes from each of the 4 groups qualify for the Quarter-Finals.
            </div>
          </div>
        </div>
      </div>

      {/* 4 Official Groups Grid (A, B, C, D) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {GROUPS.map((groupName) => {
          const members = currentGroupAllocations[groupName] || [];
          const isTargeted = targetGroup === groupName;
          const isBlocked = blockedGroups.includes(groupName);

          return (
            <div
              key={groupName}
              className={`rounded-2xl border p-4 space-y-3 transition-all duration-300 ${
                isTargeted
                  ? "border-primary bg-primary/30 ring-2 ring-primary/50 scale-102 shadow-xl"
                  : isBlocked
                  ? "border-destructive/30 bg-destructive/20 opacity-70"
                  : "border-border bg-card/70 hover:border-border"
              }`}
            >
              {/* Group Header */}
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <span className="text-sm font-black uppercase text-primary flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  {groupName}
                </span>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {members.length}/4 Slots
                </span>
              </div>

              {/* Slot Cards */}
              <div className="space-y-2">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const athlete = members[slotIdx];
                  if (!athlete) {
                    return (
                      <div
                        key={slotIdx}
                        className={`h-11 rounded-xl border border-dashed flex items-center justify-center text-xs font-bold ${
                          isTargeted && members.length === slotIdx
                            ? "border-primary bg-primary/10 text-primary animate-pulse"
                            : "border-border/80 text-muted-foreground bg-background/40"
                        }`}
                      >
                        {isTargeted && members.length === slotIdx
                          ? "Incoming Draw..."
                          : `Slot ${slotIdx + 1} Open`}
                      </div>
                    );
                  }

                  const avatarUrl = resolvePlayerAvatar(athlete);
                  return (
                    <div
                      key={athlete.id}
                      className="flex items-center justify-between rounded-xl bg-background/80 p-2 text-xs border border-border hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={avatarUrl}
                          alt={athlete.gamerTag}
                          className="h-6 w-6 rounded-full object-contain shrink-0 bg-card p-0.5 border border-border"
                          onError={(e: any) => {
                            e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${athlete.gamerTag}`;
                          }}
                        />
                        <div className="truncate">
                          <span className="font-bold text-white truncate block">
                            {athlete.gamerTag}
                          </span>
                          {athlete.realTeam && (
                            <span className="text-xs text-secondary truncate block">
                              {athlete.realTeam}
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant={
                          athlete.division === "Division 1"
                            ? "secondary"
                            : athlete.division === "Division 2"
                            ? "yellow"
                            : "live"
                        }
                        className="text-xs px-1 py-0 shrink-0"
                      >
                        {athlete.division.replace("Division ", "D")}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Group Division Status */}
              <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>D1: {members.filter((m) => m.division === "Division 1").length}/2</span>
                <span>D2: {members.filter((m) => m.division === "Division 2").length}/2</span>
                <span>D3: {members.filter((m) => m.division === "Division 3").length}/2</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
