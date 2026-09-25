"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { PageCurtains, type CurtainEffect } from "@/components/ui/page-curtains";
import { Sparkles, SlidersHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const EFFECTS: CurtainEffect[] = ["doors", "wipe", "fade", "iris"];

export default function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [effect, setEffect] = React.useState<CurtainEffect>("doors");
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const prevPathnameRef = React.useRef(pathname);

  // Load saved transition preference from localStorage if available
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("efrl_curtain_effect") as CurtainEffect | null;
      if (saved && EFFECTS.includes(saved)) {
        setEffect(saved);
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  // Listen to route changes
  React.useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setIsTransitioning(true);
    }
  }, [pathname]);

  const handleSelectEffect = (newEffect: CurtainEffect) => {
    setEffect(newEffect);
    try {
      localStorage.setItem("efrl_curtain_effect", newEffect);
    } catch {
      // ignore
    }
    // Preview selected transition
    setIsTransitioning(true);
  };

  return (
    <>
      <PageCurtains
        effect={effect}
        isTransitioning={isTransitioning}
        onRevealed={() => setIsTransitioning(false)}
      >
        {children}
      </PageCurtains>

      {/* Discrete Curated Transition Selector Pill */}
      <aside
        aria-label="Page transition controls"
        className="fixed bottom-4 right-4 z-40 hidden sm:flex flex-col items-end gap-1.5"
      >
        {isPanelOpen && (
          <div className="rounded-2xl border border-border bg-card/95 p-3 backdrop-blur-xl shadow-2xl space-y-2 animate-fade-in w-56">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Transition Curtain
              </span>
              <span className="text-xs font-mono font-bold text-primary uppercase">
                {effect}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {EFFECTS.map((eff) => (
                <button
                  key={eff}
                  type="button"
                  onClick={() => handleSelectEffect(eff)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-bold capitalize transition-colors duration-150 text-center",
                    effect === eff
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-background/60 text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  {eff}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsPanelOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg backdrop-blur-md hover:border-primary/50 transition-colors"
          title="Curated Page Transition Style"
        >
          <Sparkles className="h-3.5 w-3.5 text-secondary" />
          <span className="font-mono uppercase text-xs">Curtains: {effect}</span>
          {isPanelOpen ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </aside>
    </>
  );
}
