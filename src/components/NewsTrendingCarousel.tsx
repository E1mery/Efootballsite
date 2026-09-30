"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Newspaper,
  Calendar,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  HeroEditorialStagger,
  StaggerRevealHeadline,
  StaggerRevealItem,
} from "@/components/ui/hero-editorial-stagger";

export interface CarouselSlide {
  id: string;
  type?: string;
  badge?: string;
  category: string;
  tabLabel?: string;
  title: string;
  subtitle?: string;
  description: string;
  featuredImage: string;
  buttonText?: string | null;
  buttonUrl?: string | null;
  publishDate?: string | Date;
  expirationDate?: string | Date;
  data?: any;
}

interface NewsTrendingCarouselProps {
  slides?: CarouselSlide[];
  userSession?: { authenticated: boolean; user?: any; player?: any } | null;
}

const ROTATION_INTERVAL_MS = 8000;

function getSlideDiff(index: number, current: number, total: number): number {
  if (total <= 1) return 0;
  if (total === 2) {
    if (index === current) return 0;
    return 1;
  }
  let diff = index - current;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

export default function NewsTrendingCarousel({
  slides = [],
}: NewsTrendingCarouselProps) {
  const shouldReduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentIndex(index);
      setProgress(0);
    }
  };

  const getCoverflowProps = useCallback(
    (diff: number) => {
      if (totalSlides <= 1 || diff === 0) {
        return {
          x: "-50%",
          y: 0,
          z: 0,
          rotateY: 0,
          scale: 1,
          opacity: 1,
          zIndex: 30,
          filter: "brightness(1) blur(0px)",
          pointerEvents: "auto" as const,
        };
      }

      if (shouldReduceMotion) {
        if (diff === 1) {
          return {
            x: "calc(-50% + 72%)",
            y: 0,
            z: 0,
            rotateY: 0,
            scale: 0.9,
            opacity: 0.5,
            zIndex: 20,
            filter: "brightness(0.8) blur(0px)",
            pointerEvents: "auto" as const,
          };
        }
        if (diff === -1) {
          return {
            x: "calc(-50% - 72%)",
            y: 0,
            z: 0,
            rotateY: 0,
            scale: 0.9,
            opacity: 0.5,
            zIndex: 20,
            filter: "brightness(0.8) blur(0px)",
            pointerEvents: "auto" as const,
          };
        }
        return {
          x: diff > 0 ? "calc(-50% + 140%)" : "calc(-50% - 140%)",
          y: 0,
          z: 0,
          rotateY: 0,
          scale: 0.75,
          opacity: 0,
          zIndex: 10,
          filter: "brightness(0.5) blur(0px)",
          pointerEvents: "none" as const,
        };
      }

      // 3D Motion Coverflow
      if (diff === 1) {
        return {
          x: "calc(-50% + 70%)",
          y: 0,
          z: -140,
          rotateY: -30,
          scale: 0.86,
          opacity: 0.55,
          zIndex: 20,
          filter: "brightness(0.75) blur(0.5px)",
          pointerEvents: "auto" as const,
        };
      }
      if (diff === -1) {
        return {
          x: "calc(-50% - 70%)",
          y: 0,
          z: -140,
          rotateY: 30,
          scale: 0.86,
          opacity: 0.55,
          zIndex: 20,
          filter: "brightness(0.75) blur(0.5px)",
          pointerEvents: "auto" as const,
        };
      }
      if (diff > 1) {
        return {
          x: "calc(-50% + 140%)",
          y: 0,
          z: -280,
          rotateY: -45,
          scale: 0.72,
          opacity: 0,
          zIndex: 10,
          filter: "brightness(0.5) blur(2px)",
          pointerEvents: "none" as const,
        };
      }
      // diff < -1
      return {
        x: "calc(-50% - 140%)",
        y: 0,
        z: -280,
        rotateY: 45,
        scale: 0.72,
        opacity: 0,
        zIndex: 10,
        filter: "brightness(0.5) blur(2px)",
        pointerEvents: "none" as const,
      };
    },
    [totalSlides, shouldReduceMotion]
  );

  useEffect(() => {
    if (totalSlides <= 1 || isPaused) {
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / ROTATION_INTERVAL_MS) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [totalSlides, isPaused, nextSlide]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    } else if (e.key === "Home") {
      e.preventDefault();
      goToSlide(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goToSlide(totalSlides - 1);
    }
  };

  // If there are no eligible news records in the database, do not render demo slides
  if (totalSlides === 0) {
    return null;
  }

  return (
    <section
      aria-label="News & Trending Hero Banner"
      role="region"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative z-20 mx-auto max-w-360 px-2 sm:px-4 lg:px-6 select-none focus:outline-none"
    >
      {/* COVERFLOW STAGE */}
      <div className="carousel-stage-container">
        {slides.map((slide, index) => {
          const diff = getSlideDiff(index, currentIndex, totalSlides);
          const isCenter = diff === 0;

          const formattedPublishDate = slide.publishDate
            ? new Date(slide.publishDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : null;

          return (
            <motion.div
              key={slide.id || index}
              className={cn(
                "carousel-slide-card",
                isCenter && "carousel-card-active"
              )}
              initial={false}
              animate={getCoverflowProps(diff)}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 28,
                mass: 0.9,
              }}
              drag={isCenter && totalSlides > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                const swipeThreshold = 50;
                const velocityThreshold = 350;
                if (
                  info.offset.x < -swipeThreshold ||
                  info.velocity.x < -velocityThreshold
                ) {
                  nextSlide();
                } else if (
                  info.offset.x > swipeThreshold ||
                  info.velocity.x > velocityThreshold
                ) {
                  prevSlide();
                }
              }}
              whileHover={
                !isCenter && Math.abs(diff) === 1
                  ? {
                      scale: 0.89,
                      opacity: 0.8,
                      rotateY: diff === 1 ? -18 : 18,
                      transition: { duration: 0.25 },
                    }
                  : undefined
              }
            >
              {/* Dynamic Background Image from real featuredImage */}
              <div className="carousel-bg-layer overflow-hidden">
                <img
                  src={slide.featuredImage || "/images/carousel-stadium-bg.jpg"}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
              </div>
              {/* 1. Dark transparent base overlay */}
              <div className="carousel-overlay-dark" />
              {/* 2. Left-to-right gradient darker towards text area */}
              <div className="carousel-overlay-gradient" />
              {/* 3. Subtle vignette around edges */}
              <div className="carousel-overlay-vignette" />
              {/* 4. Ambient stadium floodlight / brand glow */}
              <div className="carousel-overlay-glow" />

              {/* Top Brand Accent Line */}
              <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary opacity-80 relative z-10" />

              {/* Clickable Overlay for Preview / Inactive Cards */}
              {!isCenter && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goToSlide(index);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label={`View ${slide.category}: ${slide.title}`}
                  className="absolute inset-0 z-30 bg-background/55 hover:bg-background/25 backdrop-blur-sm cursor-pointer transition-all duration-300 flex items-center justify-center group/preview focus:outline-none"
                >
                  <span className="opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 px-3.5 py-1.5 rounded-xl bg-card/90 border border-secondary/40 text-xs font-mono font-bold text-secondary shadow-xl pointer-events-none">
                    Click to view
                  </span>
                </button>
              )}

              {/* SLIDE CARD INNER CONTENT */}
              <HeroEditorialStagger
                key={`editorial-${slide.id || index}-${isCenter ? "active" : "inactive"}`}
                isActive={isCenter}
                className="relative z-10 p-5 sm:p-7 md:p-8 flex-1 flex flex-col justify-between gap-4 md:px-12"
              >
                {/* News Article Main Body */}
                <div className="flex-1 flex flex-col justify-center py-1 sm:py-2">
                  <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Left Column: Text & CTA */}
                    <div className="space-y-3 text-left max-w-2xl flex-1">
                      <StaggerRevealItem>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="yellow"
                            className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5"
                          >
                            <Newspaper className="h-3 w-3 mr-1" />
                            <span>{slide.category}</span>
                          </Badge>
                          {formattedPublishDate && (
                            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formattedPublishDate}</span>
                            </span>
                          )}
                        </div>
                      </StaggerRevealItem>

                      <StaggerRevealHeadline className="carousel-headline">
                        {slide.title}
                      </StaggerRevealHeadline>

                      <StaggerRevealItem>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-4 whitespace-pre-line">
                          {slide.description}
                        </p>
                      </StaggerRevealItem>

                      {/* Optional CTA Button (Rendered only when configured) */}
                      {slide.buttonText && slide.buttonUrl && (
                        <StaggerRevealItem>
                          <div className="pt-2">
                            <Link
                              href={slide.buttonUrl}
                              tabIndex={isCenter ? 0 : -1}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              className={cn(
                                buttonVariants({ variant: "yellow", size: "default" }),
                                "carousel-cta-btn font-black text-secondary-foreground text-xs sm:text-sm gap-2 rounded-xl shadow-lg cursor-pointer pointer-events-auto inline-flex items-center"
                              )}
                            >
                              <span>{slide.buttonText}</span>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </StaggerRevealItem>
                      )}
                    </div>

                    {/* Right Column: Featured Image Showcase */}
                    {slide.featuredImage && (
                      <StaggerRevealItem>
                        <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-sm xl:max-w-md aspect-video shrink-0 group/img">
                          <img
                            src={slide.featuredImage}
                            alt={slide.title}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />
                        </div>
                      </StaggerRevealItem>
                    )}
                  </div>
                </div>

                {/* BOTTOM ROW: League Branding & Expiration info */}
                <StaggerRevealItem>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground/70">
                    <span className="truncate">eFootball Rwanda League • Official News</span>
                    <span className="uppercase tracking-widest hidden sm:inline-block">
                      Verified Bulletin
                    </span>
                  </div>
                </StaggerRevealItem>
              </HeroEditorialStagger>

              {/* DYNAMIC PROGRESS LINE ON BOTTOM OF ACTIVE CARD */}
              {isCenter && totalSlides > 1 && !isPaused && (
                <div className="h-1 w-full bg-border/40 overflow-hidden relative z-10">
                  <div
                    className="h-full bg-secondary transition-all duration-75 ease-linear"
                    // eslint-disable-next-line shadcn/no-inline-styles -- dynamic progress 0-100%
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}

        {/* FLOATING NAVIGATION BUTTONS */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevSlide();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={totalSlides <= 1}
              aria-label="Previous news slide"
              className="carousel-nav-btn absolute left-2 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-50 group flex cursor-pointer pointer-events-auto select-none"
            >
              <ChevronLeft className="h-5 w-5 text-foreground transition-transform duration-200 group-hover:-translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextSlide();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={totalSlides <= 1}
              aria-label="Next news slide"
              className="carousel-nav-btn absolute right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-50 group flex cursor-pointer pointer-events-auto select-none"
            >
              <ChevronRight className="h-5 w-5 text-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </>
        )}
      </div>

      {/* Pagination Dots */}
      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-2 pt-3 sm:pt-4">
          {slides.map((s, idx) => (
            <button
              key={s.id || idx}
              type="button"
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "carousel-dot",
                idx === currentIndex ? "carousel-dot-active" : "carousel-dot-inactive"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
