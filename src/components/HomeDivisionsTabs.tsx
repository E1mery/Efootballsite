"use client";

import React, { useState } from "react";
import Image from "next/image";
import StandingsTable from "@/components/StandingsTable";
import { LoaderSkeleton, StandingsTableSkeleton } from "@/components/ui/loader-skeleton";
import { Trophy, Shield, Award, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getTrophyForCompetition } from "@/lib/assets.config";

interface HomeDivisionsTabsProps {
  div1Standings: any[];
  div2Standings: any[];
  div3Standings: any[];
  defaultDivision?: "Division 1" | "Division 2" | "Division 3";
  updatesMap?: Record<string, { updateKey: string; userAlreadyViewed?: boolean }>;
  currentUserId?: string | null;
  currentRound?: number;
}

export default function HomeDivisionsTabs({
  div1Standings,
  div2Standings,
  div3Standings,
  defaultDivision = "Division 1",
  updatesMap,
  currentUserId,
  currentRound,
}: HomeDivisionsTabsProps) {
  const [activeDivision, setActiveDivision] = useState<"Division 1" | "Division 2" | "Division 3">(defaultDivision);
  const [isMorphing, setIsMorphing] = useState(false);

  const handleTabChange = (div: "Division 1" | "Division 2" | "Division 3") => {
    if (div === activeDivision) return;
    setIsMorphing(true);
    setActiveDivision(div);
    setTimeout(() => {
      setIsMorphing(false);
    }, 220);
  };

  const divisionData = {
    "Division 1": {
      name: "Division 1 (Premiership)",
      description: "Elite Mobile Athletes. 1st-8th advance to UCL (1st Champion), 9th-16th to Europa League, Mid-Table safe, Bottom 3 relegated to Division 2.",
      standings: div1Standings,
    },
    "Division 2": {
      name: "Division 2 (Championship)",
      description: "Championship Mobile Athletes. Top 3 PROMOTED to Division 1 & UCL, 4th to UCL, 5th-8th to Europa League, Mid-Table safe, Bottom 3 relegated to Division 3.",
      standings: div2Standings,
    },
    "Division 3": {
      name: "Division 3 (Academy)",
      description: "National Academy Mobile Athletes. Top 3 PROMOTED to Division 2 & UCL, 4th to UCL, 5th-8th to Europa League, Mid-Table Academy (no relegation).",
      standings: div3Standings,
    },
  };

  const current = divisionData[activeDivision] || divisionData["Division 1"];
  const activeTrophy = getTrophyForCompetition(activeDivision);

  return (
    <div className="space-y-6">
      {/* Division Switcher Buttons */}
      <div className="flex items-center gap-2 bg-background p-1.5 rounded-2xl border border-border w-full sm:w-fit overflow-x-auto no-scrollbar scroll-smooth">
        {(["Division 1", "Division 2", "Division 3"] as const).map((div) => {
          const isActive = activeDivision === div;
          const trophy = getTrophyForCompetition(div);
          return (
            <button
              key={div}
              type="button"
              onClick={() => handleTabChange(div)}
              className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap ${
                isActive
                  ? "bg-primary text-white font-black shadow-lg"
                  : "text-muted-foreground hover:text-white hover:bg-muted/60"
              }`}
            >
              <div className="relative h-4 w-4 shrink-0">
                <Image
                  src={trophy.imagePath}
                  alt={div}
                  fill
                  className="object-contain"
                  sizes="16px"
                />
              </div>
              <span>{div}</span>
            </button>
          );
        })}
      </div>

      {/* Active Division Summary Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card/60 border border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0 rounded-xl bg-card border border-border p-1 flex items-center justify-center shadow-md">
            <Image
              src={activeTrophy.imagePath}
              alt={activeDivision}
              fill
              className="object-contain p-1"
              sizes="48px"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black uppercase text-white truncate">{current.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{current.description}</p>
          </div>
        </div>

        <Link
          href={`/standings?division=${encodeURIComponent(activeDivision)}`}
          className="text-xs font-bold text-primary hover:text-primary flex items-center gap-1 shrink-0"
        >
          <span>Full Division Details</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Standings Table with Shimmer Skeleton Morph */}
      <div className="rounded-2xl border border-border bg-background/80 overflow-hidden shadow-2xl backdrop-blur-md">
        <LoaderSkeleton
          loading={isMorphing}
          skeleton={<StandingsTableSkeleton rows={8} />}
        >
          <StandingsTable
            standings={current.standings}
            divisionName={activeDivision}
            compact={false}
            updateKey={updatesMap?.[activeDivision]?.updateKey}
            userAlreadyViewed={updatesMap?.[activeDivision]?.userAlreadyViewed}
            currentUserId={currentUserId}
            currentRound={currentRound}
          />
        </LoaderSkeleton>
      </div>
    </div>
  );
}
