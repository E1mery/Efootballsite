import React from "react";
import Image from "next/image";

interface EfootballGamingLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export default function EfootballGamingLogo({
  className = "",
  size = "md",
  showText = true,
}: EfootballGamingLogoProps) {
  const sizePixels = {
    sm: 36,
    md: 44,
    lg: 64,
    xl: 100,
  };

  const sizeClasses = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-16 w-16",
    xl: "h-24 w-24 sm:h-28 sm:w-28",
  };

  const dim = sizePixels[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* High-definition circular crest */}
      <div className={`relative flex ${sizeClasses[size]} shrink-0 items-center justify-center`}>
        {/* Subtle ambient glow */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-md pointer-events-none" />

        {/* Circular Emblem with smooth clipping and border */}
        <div className="relative h-full w-full rounded-full overflow-hidden shadow-lg shadow-primary/20 ring-1 ring-border bg-card">
          <Image
            src="/logo.png"
            alt="eFootball Rwanda League Logo"
            width={dim * 2}
            height={dim * 2}
            priority={size === "xl" || size === "md"}
            className="h-full w-full object-cover rounded-full"
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
            <span className="font-black tracking-wider uppercase text-foreground font-sans text-xs sm:text-sm md:text-base lg:text-lg">
              EFOOTBALL
            </span>
            <span className="font-black tracking-wider uppercase text-primary font-sans text-xs sm:text-sm md:text-base lg:text-lg">
              RWANDA
            </span>
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mt-0.5 sm:mt-1 truncate max-w-32 sm:max-w-none">
            OFFICIAL ESPORTS LEAGUE
          </span>
        </div>
      )}
    </div>
  );
}