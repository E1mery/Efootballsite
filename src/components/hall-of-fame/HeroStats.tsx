"use client";

import Image from "next/image";
import { Crown, Trophy, Users, Calendar, Flame } from "lucide-react";
import { BRANDING_ASSETS } from "@/lib/assets.config";

interface HeroStatsProps {
  metrics: {
    totalChampions: number;
    totalLegends: number;
    totalSeasons: number;
    allTimeGoals: number;
  };
}

export default function HeroStats({ metrics }: HeroStatsProps) {
  const statCards = [
    {
      label: "TOTAL CHAMPIONS",
      value: metrics.totalChampions.toLocaleString(),
      icon: Crown,
      description: "Official title winners",
    },
    {
      label: "HALL OF FAME PLAYERS",
      value: metrics.totalLegends.toLocaleString(),
      icon: Users,
      description: "Immortalized legends",
    },
    {
      label: "TOTAL SEASONS",
      value: metrics.totalSeasons.toLocaleString(),
      icon: Calendar,
      description: "Completed campaigns",
    },
    {
      label: "ALL-TIME GOALS",
      value: metrics.allTimeGoals.toLocaleString(),
      icon: Flame,
      description: "In official matches",
    },
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-border/40">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Headlines */}
        <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/30">
            <Crown className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold tracking-widest uppercase text-secondary">
              HALL OF FAME
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground font-sans">
              THE LEGENDS WHO
            </h1>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-secondary font-sans">
              MADE HISTORY
            </h1>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
            The definitive record of esports greatness. Celebrating the champions, record breakers, and undisputed masters of Rwandan eFootball.
          </p>
        </div>

        {/* Right Column: Hero Trophy Artwork */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Glowing ring backdrop */}
            <div className="absolute inset-4 rounded-full bg-secondary/15 blur-2xl animate-pulse" />
            <div className="absolute inset-8 rounded-full border border-secondary/30" />

            {/* Stadium light vignette */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden -z-10 opacity-30">
              <Image
                src={BRANDING_ASSETS.heroStadiumBg}
                alt="Stadium background"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>

            {/* Central Trophy Image */}
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
              <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-2xl overflow-hidden flex items-center justify-center drop-shadow-2xl">
                <Image
                  src={BRANDING_ASSETS.heroGoldenTrophy}
                  alt="Hall of Fame Championship Trophy"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 140px, 180px"
                />
              </div>
              <span className="mt-2 text-xs uppercase font-extrabold tracking-wider text-secondary/90">
                Official Hall of Fame
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Computed 4 Stat Counters */}
      <div className="mt-10 sm:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="hof-navy-surface p-4 sm:p-5 rounded-xl border border-border/60 hover:border-secondary/40 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                  {stat.label}
                </span>
                <Icon className="w-4 h-4 text-secondary/80" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight font-sans">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stat.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
