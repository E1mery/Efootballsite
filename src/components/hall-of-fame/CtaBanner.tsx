"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trophy } from "lucide-react";
import { BRANDING_ASSETS } from "@/lib/assets.config";

interface CtaBannerProps {
  currentSeasonName?: string;
  currentSeasonLink?: string;
}

export default function CtaBanner({
  currentSeasonName = "Current Season",
  currentSeasonLink = "/standings",
}: CtaBannerProps) {
  return (
    <section className="py-8 sm:py-10">
      <div className="relative rounded-3xl overflow-hidden border border-secondary/30 bg-card/60 p-6 sm:p-8 lg:p-10">
        {/* Panoramic Stadium Background */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <Image
            src={BRANDING_ASSETS.hofCtaStadiumBg}
            alt="Rwanda eFootball Hall of Fame Stadium Arena"
            fill
            priority
            className="object-cover object-center lg:object-right"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          {/* Left-heavy dark scrim to guarantee high contrast for typography */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/50" />
        </div>

        {/* Subtle electric-blue & gold ambient glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/15 blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none -z-10" />

        {/* Content (Left-aligned over the shadowed area of the stadium) */}
        <div className="relative z-10 max-w-xl text-left space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-foreground font-sans">
              YOUR NAME COULD BE HERE.
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-secondary uppercase tracking-widest">
              Compete. Win. Make History.
            </p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
            Every match is verified and calculated into the official national records. Rise through the divisions and immortalize your legacy in the Rwanda eFootball Hall of Fame.
          </p>

          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href={currentSeasonLink}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black uppercase text-xs tracking-wider shadow-lg shadow-secondary/20 hover:shadow-secondary/30 transition-all hover:scale-105"
            >
              <Trophy className="w-4 h-4" />
              <span>View {currentSeasonName}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
