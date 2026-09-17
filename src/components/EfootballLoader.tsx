import React from "react";

interface EfootballLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function EfootballLoader({
  size = "md",
  text,
  className = "",
}: EfootballLoaderProps) {
  const sizeMap = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const ringSizes = {
    sm: "w-8 h-8",
    md: "w-14 h-14",
    lg: "w-24 h-24",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-4 ${className}`}>
      <div className={`relative flex items-center justify-center ${ringSizes[size]}`}>
        {/* Pulsing background glow */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-lg animate-efootball-pulse" />

        {/* Orbiting eFootball Energy Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-amber-400 animate-efootball-spin" />

        {/* Inner Gaming Football Icon */}
        <div className={`relative flex ${sizeMap[size]} items-center justify-center rounded-full bg-[#070d1e] border border-cyan-500/40 shadow-inner`}>
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3/4 h-3/4"
          >
            {/* Soccer ball segments */}
            <circle cx="16" cy="16" r="14" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.8" />
            <polygon
              points="16,9 21,13 19,19 13,19 11,13"
              fill="#00B2FF"
              fillOpacity="0.4"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />
            <path
              d="M16 9V3M21 13L28 10M19 19L24 26M13 19L8 26M11 13L4 10"
              stroke="#38BDF8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="16" cy="16" r="2.5" fill="#FBBF24" />
          </svg>
        </div>
      </div>

      {text && (
        <span className="text-xs font-bold uppercase tracking-widest text-slate-300 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}
