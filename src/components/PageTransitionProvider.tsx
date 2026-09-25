"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { PageCurtains } from "@/components/ui/page-curtains";

interface PageMeta {
  title: string;
  subtitle: string;
}

/**
 * Resolves user-friendly destination page titles and subtitles based on target route pathname.
 */
function getPageInfo(pathname: string): PageMeta {
  if (!pathname || pathname === "/") {
    return {
      title: "Home",
      subtitle: "eFootball Rwanda League Official Championship",
    };
  }
  if (pathname.startsWith("/standings")) {
    return {
      title: "Standings & Tables",
      subtitle: "Division 1, Division 2 & Division 3",
    };
  }
  if (pathname.startsWith("/fixtures")) {
    return {
      title: "Fixtures & Results",
      subtitle: "Daily 24-Hour Matchday Schedule",
    };
  }
  if (pathname.startsWith("/continental")) {
    return {
      title: "UCL & Europa Draws",
      subtitle: "Post-Season Continental Championship",
    };
  }
  if (pathname.startsWith("/players")) {
    return {
      title: "Athlete Profiles",
      subtitle: "National League Registered Athletes",
    };
  }
  if (pathname.startsWith("/login")) {
    return {
      title: "Athlete Portal",
      subtitle: "Match Coordination & Score Submission",
    };
  }
  if (pathname.startsWith("/register")) {
    return {
      title: "Season Registration",
      subtitle: "Official League Athlete Onboarding",
    };
  }
  if (pathname.startsWith("/dashboard")) {
    return {
      title: "Athlete Dashboard",
      subtitle: "Active Matchday Hub & Opponent Chat",
    };
  }
  if (pathname.startsWith("/admin/login")) {
    return {
      title: "Admin Portal",
      subtitle: "League Commissioner Office Authentication",
    };
  }
  if (pathname.startsWith("/admin")) {
    return {
      title: "Commissioner Office",
      subtitle: "League Governance & Verification",
    };
  }

  // Fallback for custom or dynamic routes
  const clean = pathname.replace(/^\//, "").split("/")[0].replace(/-/g, " ");
  return {
    title: clean.charAt(0).toUpperCase() + clean.slice(1),
    subtitle: "eFootball Rwanda League",
  };
}

export default function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [currentPageInfo, setCurrentPageInfo] = React.useState<PageMeta>(() =>
    getPageInfo(pathname)
  );

  // Pre-trigger wipe curtain upon clicking internal links to capture destination immediately
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        !href.startsWith("//") &&
        target.target !== "_blank"
      ) {
        const nextUrl = href.split("?")[0].split("#")[0];
        if (nextUrl !== pathname) {
          const info = getPageInfo(nextUrl);
          setCurrentPageInfo(info);
          setIsTransitioning(true);
        }
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, {
        capture: true,
      });
    };
  }, [pathname]);

  // Route change listener ensuring destination info updates
  React.useEffect(() => {
    const info = getPageInfo(pathname);
    setCurrentPageInfo(info);
    setIsTransitioning(true);
  }, [pathname]);

  return (
    <PageCurtains
      effect="wipe"
      isTransitioning={isTransitioning}
      pageTitle={currentPageInfo.title}
      pageSubtitle={currentPageInfo.subtitle}
      onRevealed={() => setIsTransitioning(false)}
    >
      {children}
    </PageCurtains>
  );
}
