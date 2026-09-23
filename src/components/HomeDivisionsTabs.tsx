"use client";

import React, { useState } from "react";
import StandingsTable from "@/components/StandingsTable";
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

  const divisionData = {
    "Division 1": {
      name: "Division 1 (Premiership)",
      badge: "TIER 1 PREMIERSHIP",
      color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
      description: "Elite Mobile Athletes. Top 8 advance to eFootball UCL, 9th-12th to Europa Cup. Bottom 3 relegated to Division 2.",
      standings: div1Standings,
    },
    "Division 2": {
      name: "Division 2 (Championship)",
      badge: "TIER 2 CHAMPIONSHIP",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      description: "Championship Mobile Athletes. Top 3 PROMOTED to Division 1. Bottom 3 relegated to Division 3. Top 4 qualify for UCL.",
      standings: div2Standings,
    },
    "Division 3": {
      name: "Division 3 (Academy)",
      badge: "TIER 3 ACADEMY",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      description: "National Academy Mobile Athletes. Top 3 PROMOTED to Division 2 at end of season. Top 4 qualify for UCL.",
      standings: div3Standings,
    },
  };

  const current = divisionData[activeDivision] || divisionData["Division 1"];

  return (
    <div className="space-y-6">
      {/* Division Switcher Buttons */}
      <div className="flex items-center gap-2 bg-[#080d1a] p-1.5 rounded-2xl border border-slate-800 w-full sm:w-fit overflow-x-auto no-scrollbar scroll-smooth">
        {(["Division 1", "Division 2", "Division 3"] as const).map((div) => {
          const isActive = activeDivision === div;
          return (
            <button
              key={div}
              type="button"
              onClick={() => setActiveDivision(div)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap ${
                isActive
                  ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Trophy className={`h-4 w-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
              <span>{div}</span>
            </button>
          );
        })}
      </div>

      {/* Active Division Summary Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${current.color}`}>
              {current.badge}
            </span>
            <h3 className="text-base font-black uppercase text-white">{current.name}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">{current.description}</p>
        </div>

        <Link
          href={`/standings?division=${encodeURIComponent(activeDivision)}`}
          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0"
        >
          <span>Full Division Details</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Standings Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#080d1c]/80 overflow-hidden shadow-2xl backdrop-blur-md">
        <StandingsTable
          standings={current.standings}
          divisionName={activeDivision}
          compact={false}
        />
      </div>
    </div>
  );
}
