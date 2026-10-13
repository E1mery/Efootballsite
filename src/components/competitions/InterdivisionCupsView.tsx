"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import ChampionsLeagueView from "./ChampionsLeagueView";
import EuropaLeagueView from "./EuropaLeagueView";
import SuperCupView, { SuperCupPlayer, SuperCupMatchData } from "./SuperCupView";

export type InterdivisionCupId = "UCL" | "EUROPA" | "SUPER_CUP";

export interface InterdivisionCupsViewProps {
  season?: string;
  currentPlayer?: any;
  leagueConfig?: any;
  // UCL data
  uclQualified?: any[];
  uclSlots?: any[];
  uclMatches?: any[];
  uclGroupStandings?: any[];
  pastChampionsUcl?: any[];
  // Europa data
  europaQualified?: any[];
  europaSlots?: any[];
  europaMatches?: any[];
  europaGroupStandings?: any[];
  pastChampionsEuropa?: any[];
  // Super Cup data
  uclChampion?: SuperCupPlayer | null;
  europaChampion?: SuperCupPlayer | null;
  superCupMatch?: SuperCupMatchData | null;
  pastSuperCupWinners?: any[];
  // Callbacks & active cup selection
  onOpenSubmitResult?: (match: any) => void;
  initialCup?: InterdivisionCupId;
}

const CUPS: Array<{
  id: InterdivisionCupId;
  label: string;
  shortLabel: string;
  trophyImage: string;
}> = [
  {
    id: "UCL",
    label: "Champions League",
    shortLabel: "UCL",
    trophyImage: "/assets/trophies/champions-league.png",
  },
  {
    id: "EUROPA",
    label: "Europa League",
    shortLabel: "Europa",
    trophyImage: "/assets/trophies/europa-league.png",
  },
  {
    id: "SUPER_CUP",
    label: "Super Cup",
    shortLabel: "Super Cup",
    trophyImage: "/assets/trophies/super-cup.png",
  },
];

export default function InterdivisionCupsView({
  season = "Season 1 (2026)",
  currentPlayer,
  leagueConfig,
  uclQualified = [],
  uclSlots = [],
  uclMatches = [],
  uclGroupStandings = [],
  pastChampionsUcl = [],
  europaQualified = [],
  europaSlots = [],
  europaMatches = [],
  europaGroupStandings = [],
  pastChampionsEuropa = [],
  uclChampion = null,
  europaChampion = null,
  superCupMatch = null,
  pastSuperCupWinners = [],
  onOpenSubmitResult,
  initialCup = "UCL",
}: InterdivisionCupsViewProps) {
  const [activeCup, setActiveCup] = useState<InterdivisionCupId>(initialCup);

  const handleSelectCup = (cupId: InterdivisionCupId) => {
    setActiveCup(cupId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "INTERDIVISION_CUPS");
      url.searchParams.set("cup", cupId);
      window.history.replaceState(null, "", url.toString());
    }
  };

  return (
    <div className="space-y-6">
      {/* Interdivision Cups Sub-Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card/60 border border-border backdrop-blur-md">
          {CUPS.map((cup) => {
            const isActive = activeCup === cup.id;
            return (
              <button
                key={cup.id}
                type="button"
                onClick={() => handleSelectCup(cup.id)}
                className={cn(
                  "flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap",
                  isActive
                    ? "bg-primary text-white font-black shadow-lg"
                    : "text-muted-foreground hover:text-white hover:bg-muted/60"
                )}
              >
                <div className="relative h-4 w-4 shrink-0">
                  <Image
                    src={cup.trophyImage}
                    alt={cup.label}
                    fill
                    sizes="16px"
                    className="object-contain drop-shadow"
                  />
                </div>
                <span>{cup.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Cup View */}
      {activeCup === "UCL" && (
        <ChampionsLeagueView
          season={season}
          currentPlayer={currentPlayer}
          leagueConfig={leagueConfig}
          qualifiedPlayers={uclQualified}
          groupSlots={uclSlots}
          matches={uclMatches}
          standings={uclGroupStandings}
          pastChampions={pastChampionsUcl}
          onOpenSubmitResult={onOpenSubmitResult}
        />
      )}

      {activeCup === "EUROPA" && (
        <EuropaLeagueView
          season={season}
          currentPlayer={currentPlayer}
          leagueConfig={leagueConfig}
          qualifiedPlayers={europaQualified}
          groupSlots={europaSlots}
          matches={europaMatches}
          standings={europaGroupStandings}
          pastChampions={pastChampionsEuropa}
          onOpenSubmitResult={onOpenSubmitResult}
        />
      )}

      {activeCup === "SUPER_CUP" && (
        <SuperCupView
          season={season}
          currentPlayer={currentPlayer}
          uclChampion={uclChampion}
          europaChampion={europaChampion}
          superCupMatch={superCupMatch}
          pastSuperCupWinners={pastSuperCupWinners}
          onOpenSubmitResult={onOpenSubmitResult}
        />
      )}
    </div>
  );
}
