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
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg animate-efootball-pulse" />

        {/* Orbiting eFootball Energy Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-secondary animate-efootball-spin" />

        {/* Inner Gaming Football Icon */}
        <div className={`relative flex ${sizeMap[size]} items-center justify-center rounded-full bg-background border border-primary/40 shadow-inner`}>
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3/4 h-3/4"
          >
            {/* Soccer ball segments */}
            <g className="text-primary">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" />
              <polygon
                points="16,9 21,13 19,19 13,19 11,13"
                fill="currentColor"
                fillOpacity="0.4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M16 9V3M21 13L28 10M19 19L24 26M13 19L8 26M11 13L4 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
            <g className="text-secondary">
              <circle cx="16" cy="16" r="2.5" fill="currentColor" />
            </g>
          </svg>
        </div>
      </div>

      {text && (
        <span className="text-xs font-bold uppercase tracking-widest text-foreground animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}
