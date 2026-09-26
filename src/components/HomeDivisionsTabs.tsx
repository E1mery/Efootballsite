"use client";

import React, { useState } from "react";
import StandingsTable from "@/components/StandingsTable";
import { LoaderSkeleton, StandingsTableSkeleton } from "@/components/ui/loader-skeleton";
import { Trophy, Shield, Award, ChevronRight } from "lucide-react";
import Link from "next/link";

interface HomeDivisionsTabsProps {
  div1Standings: any[];
  div2Standings: any[];
  div3Standings: any[];
  defaultDivision?: "Division 1" | "Division 2" | "Division 3";
}

export default function HomeDivisionsTabs({
  div1Standings,
  div2Standings,
  div3Standings,
  defaultDivision = "Division 1",
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
      badge: "TIER 1 PREMIERSHIP",
      color: "text-primary border-primary/30 bg-primary/10",
      description: "Elite Mobile Athletes. 1st-8th advance to UCL (1st Champion), 9th-12th to Europa League, Mid-Table safe, Bottom 3 relegated to Division 2.",
      standings: div1Standings,
    },
    "Division 2": {
      name: "Division 2 (Championship)",
      badge: "TIER 2 CHAMPIONSHIP",
      color: "text-secondary border-secondary/30 bg-secondary/10",
      description: "Championship Mobile Athletes. Top 3 PROMOTED to Division 1 & UCL, 4th to UCL, 5th-10th to Europa League, Mid-Table safe, Bottom 3 relegated to Division 3.",
      standings: div2Standings,
    },
    "Division 3": {
      name: "Division 3 (Academy)",
      badge: "TIER 3 ACADEMY",
      color: "text-primary border-primary/30 bg-primary/10",
      description: "National Academy Mobile Athletes. Top 3 PROMOTED to Division 2 & UCL, 4th to UCL, 5th-10th to Europa League, Mid-Table Academy (no relegation).",
      standings: div3Standings,
    },
  };

  const current = divisionData[activeDivision] || divisionData["Division 1"];

  return (
    <div className="space-y-6">
      {/* Division Switcher Buttons */}
      <div className="flex items-center gap-2 bg-background p-1.5 rounded-2xl border border-border w-full sm:w-fit overflow-x-auto no-scrollbar scroll-smooth">
        {(["Division 1", "Division 2", "Division 3"] as const).map((div) => {
          const isActive = activeDivision === div;
          return (
            <button
              key={div}
              type="button"
              onClick={() => handleTabChange(div)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap ${
                isActive
                  ? "bg-primary text-white font-black shadow-lg"
                  : "text-muted-foreground hover:text-white hover:bg-muted/60"
              }`}
            >
              <Trophy className={`h-4 w-4 ${isActive ? "text-white" : "text-muted-foreground"}`} />
              <span>{div}</span>
            </button>
          );
        })}
      </div>

      {/* Active Division Summary Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card/60 border border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${current.color}`}>
              {current.badge}
            </span>
            <h3 className="text-base font-black uppercase text-white">{current.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{current.description}</p>
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
          />
        </LoaderSkeleton>
      </div>
    </div>
  );
}
