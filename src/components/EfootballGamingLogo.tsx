import React from "react";

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
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  const textMap = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* High-tech Esports Gaming Crest */}
      <div className={`relative flex ${sizeMap[size]} shrink-0 items-center justify-center`}>
        {/* Ambient glow */}
        <div className="absolute inset-0 rounded-2xl bg-primary/25 blur-md" />

        {/* Outer Gaming Shield / Hexagon with Cyan/Gold gradient border */}
        <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-secondary p-0.5 shadow-lg">
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-background relative overflow-hidden">
            {/* Subtle angled gaming grid accent inside shield */}
            <div className="absolute inset-0 opacity-20 bg-logo-grid" />

            {/* Stylized Vector eFootball Soccer Gaming Icon */}
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-10 w-3/4 h-3/4 text-white drop-shadow-lg"
            >
              {/* Outer Gaming Ball Arcs */}
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="url(#gamingLogoGrad)"
                strokeWidth="2.5"
                strokeDasharray="18 4"
                className="opacity-90"
              />
              {/* Central stylized 'e' and football hexagon */}
              <g className="text-primary">
                <polygon
                  points="24,14 31,19 29,27 19,27 17,19"
                  fill="currentColor"
                  fillOpacity="0.3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </g>
              <path
                d="M24 14V6M31 19L38 15M29 27L35 34M19 27L13 34M17 19L10 15"
                stroke="url(#gamingLogoGrad)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <g className="text-secondary">
                <circle cx="24" cy="24" r="3.5" fill="currentColor" />
              </g>
              <defs>
                <linearGradient id="gamingLogoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop className="stop-primary" />
                  <stop offset="0.5" className="stop-primary" />
                  <stop offset="1" className="stop-secondary" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
            <span className={`font-black tracking-wider uppercase text-white font-sans text-xs sm:text-sm md:text-base lg:text-lg`}>
              EFOOTBALL
            </span>
            <span className={`font-black tracking-wider uppercase text-primary font-sans text-xs sm:text-sm md:text-base lg:text-lg`}>
              RWANDA
            </span>
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-secondary mt-0.5 sm:mt-1 truncate w-32 sm:w-auto">
            OFFICIAL ESPORTS LEAGUE
          </span>
        </div>
      )}
    </div>
  );
}
