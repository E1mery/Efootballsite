"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";

export default function AnimatedEfootballBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Floating particles (Digital stadium dust/sparks) — primary blue + secondary gold only
    const particleCount = prefersReducedMotion ? 0 : 40;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4 - 0.2,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.4 ? "oklch(0.42 0.18 266)" : "oklch(0.86 0.18 92)",
    }));

    let pulseTime = 0;

    const render = () => {
      pulseTime += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Floating Digital Stadium Embers
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (0.6 + Math.sin(pulseTime + p.x) * 0.4);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* High-definition official eFootball Stadium background */}
      <Image
        src="/images/home-stadium-bg.jpg"
        alt="eFootball Stadium Background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-45"
      />

      {/* Cinematic Theme Vignette & Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/90" />
      <div className="absolute inset-0 bg-hero-glow opacity-70" />

      {/* Floating Stadium Atmosphere Sparks / Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Subtle Carbon Grid Overlay */}
      <div className="absolute inset-0 bg-carbon-grid opacity-20" />
    </div>
  );
}
