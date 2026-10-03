"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type UserAvatarMenuProps = {
  avatarImageUrl?: string | null;
  avatarAlt?: string;
  fallbackInitial: string;
  triggerLabel: string;
  displayName: string;
  subtitle?: string;
  settingsLabel?: string;
  onSettings: () => void;
  onSignOut: () => void;
  signingOut?: boolean;
};

export default function UserAvatarMenu({
  avatarImageUrl,
  avatarAlt,
  fallbackInitial,
  triggerLabel,
  displayName,
  subtitle,
  settingsLabel = "Settings",
  onSettings,
  onSignOut,
  signingOut = false,
}: UserAvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open ]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${triggerLabel} account menu`}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-muted px-2 py-1",
          "hover:bg-accent hover:text-accent-foreground transition-colors",
          open && "bg-accent"
        )}
      >
        {avatarImageUrl ? (
          <img
            src={avatarImageUrl}
            alt={avatarAlt || displayName}
            className="h-8 w-8 shrink-0 rounded-full object-cover bg-card"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground"
          >
            {fallbackInitial}
          </span>
        )}
        <span className="hidden max-w-28 truncate text-sm font-semibold text-foreground sm:block">
          {triggerLabel}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={`${displayName} account menu`}
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="p-1">
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSettings();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>{settingsLabel}</span>
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              disabled={signingOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{signingOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
