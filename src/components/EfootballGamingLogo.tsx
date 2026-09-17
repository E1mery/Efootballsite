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
        <div className="absolute inset-0 rounded-2xl bg-cyan-500/25 blur-md" />

        {/* Outer Gaming Shield / Hexagon with Cyan/Gold gradient border */}
        <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-600 to-amber-500 p-[2px] shadow-lg shadow-cyan-500/20">
          <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#070b16] relative overflow-hidden">
            {/* Subtle angled gaming grid accent inside shield */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,#38bdf8_1px,transparent_1px)] bg-[size:6px_6px]" />

            {/* Stylized Vector eFootball Soccer Gaming Icon */}
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-10 w-3/4 h-3/4 text-white drop-shadow-[0_2px_8px_rgba(0,178,255,0.6)]"
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
              <polygon
                points="24,14 31,19 29,27 19,27 17,19"
                fill="#00B2FF"
                fillOpacity="0.3"
                stroke="#38BDF8"
                strokeWidth="2"
              />
              <path
                d="M24 14V6M31 19L38 15M29 27L35 34M19 27L13 34M17 19L10 15"
                stroke="url(#gamingLogoGrad)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="24" cy="24" r="3.5" fill="#FBBF24" />
              <defs>
                <linearGradient id="gamingLogoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38BDF8" />
                  <stop offset="0.5" stopColor="#00B2FF" />
                  <stop offset="1" stopColor="#F59E0B" />
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
            <span className={`font-black tracking-wider uppercase text-cyan-400 font-sans text-xs sm:text-sm md:text-base lg:text-lg`}>
              RWANDA
            </span>
          </div>
          <span className="text-[7.5px] sm:text-[9px] uppercase font-bold tracking-[0.12em] sm:tracking-[0.22em] text-amber-400/90 mt-0.5 sm:mt-1 truncate max-w-[130px] sm:max-w-none">
            OFFICIAL ESPORTS LEAGUE
          </span>
        </div>
      )}
    </div>
  );
}
