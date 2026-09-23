"use client";

import React, { useEffect, useRef } from "react";

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

    // Floating particles (Digital stadium dust/sparks)
    const particleCount = 40;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4 - 0.2,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.4 ? "hsl(var(--primary))" : "hsl(var(--secondary))",
    }));

    let pulseTime = 0;

    const render = () => {
      pulseTime += 0.015;
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Dark Ambient Radial Vignette
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 3,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      gradient.addColorStop(0, "rgba(0, 178, 255, 0.07)");
      gradient.addColorStop(0.5, "rgba(7, 11, 22, 0.4)");
      gradient.addColorStop(1, "rgba(5, 8, 17, 0.95)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Animated Football Tactical Grid & Pitch Lines
      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1.5;

      const centerX = width / 2;
      const centerY = height * 0.45;
      const pitchWidth = Math.min(width * 0.85, 900);
      const pitchHeight = pitchWidth * 0.55;

      // Draw Center Circle with gentle pulsing radius
      const centerCircleRadius = 70 + Math.sin(pulseTime) * 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerCircleRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Center spot
      ctx.fillStyle = "rgba(251, 191, 36, 0.4)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Halfway line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - pitchHeight / 2);
      ctx.lineTo(centerX, centerY + pitchHeight / 2);
      ctx.stroke();

      // Outer Pitch Boundary
      ctx.strokeStyle = "rgba(56, 189, 248, 0.06)";
      ctx.strokeRect(
        centerX - pitchWidth / 2,
        centerY - pitchHeight / 2,
        pitchWidth,
        pitchHeight
      );

      // Left Penalty Box
      const boxWidth = pitchWidth * 0.16;
      const boxHeight = pitchHeight * 0.48;
      ctx.strokeRect(
        centerX - pitchWidth / 2,
        centerY - boxHeight / 2,
        boxWidth,
        boxHeight
      );

      // Right Penalty Box
      ctx.strokeRect(
        centerX + pitchWidth / 2 - boxWidth,
        centerY - boxHeight / 2,
        boxWidth,
        boxHeight
      );
      ctx.restore();

      // 3. Floating Digital Stadium Embers
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
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {/* Carbon fiber grid overlay */}
      <div className="absolute inset-0 bg-carbon-grid opacity-40" />
    </div>
  );
}
