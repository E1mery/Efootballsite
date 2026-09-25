"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative overflow-hidden group/btn inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 select-none touch-manipulation [&_svg]:transition-transform [&_svg]:duration-200 group-hover/btn:[&_svg]:scale-110 group-hover/btn:[&_svg]:translate-x-0.5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:shadow-primary/25 hover:bg-primary/90",
        yellow:
          "bg-secondary text-secondary-foreground font-bold shadow-md hover:shadow-lg hover:shadow-secondary/25 hover:bg-secondary/90",
        green:
          "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:shadow-primary/25 hover:bg-primary/90",
        outline:
          "border border-border bg-card/60 text-foreground hover:border-primary/50 hover:bg-muted/80 hover:text-foreground hover:shadow-md hover:shadow-primary/10",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:shadow-destructive/25 hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base font-bold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  whileHover?: any;
  whileTap?: any;
  rollingText?: boolean;
  duplicateText?: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  targetScale: number;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      disabled,
      whileHover,
      whileTap,
      rollingText = false,
      duplicateText,
      children,
      onPointerDown,
      onFocus,
      onBlur,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);

    const isRollingActive =
      rollingText && !disabled && !shouldReduceMotion && (isHovered || isFocused);

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!disabled && !shouldReduceMotion) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const targetScale = (Math.max(rect.width, rect.height) / 16) * 2;
        const id = Date.now() + Math.random();
        setRipples((prev) => [...prev.slice(-2), { id, x, y, targetScale }]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 400);
      }
      onPointerDown?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(true);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(false);
      onMouseLeave?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const defaultHover = shouldReduceMotion
      ? undefined
      : {
          scale: 1.03,
          y: -2.5,
        };

    const defaultTap = shouldReduceMotion
      ? undefined
      : {
          scale: 0.97,
          y: 0,
        };

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled}
        whileHover={disabled ? undefined : whileHover ?? defaultHover}
        whileTap={disabled ? undefined : whileTap ?? defaultTap}
        transition={{
          type: "spring",
          stiffness: 450,
          damping: 24,
          mass: 0.5,
        }}
        onPointerDown={handlePointerDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...(props as any)}
      >
        {/* Continuous skeleton shimmer animation across all buttons */}
        {!disabled && !shouldReduceMotion && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-sweep"
          />
        )}

        {/* Subtle highlight sheen sweep across the button on hover */}
        {!disabled && !shouldReduceMotion && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
          />
        )}

        {/* Tactile click ripple radiating from click coordinate without inline styles */}
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="pointer-events-none absolute -top-4 -left-4 h-8 w-8 rounded-full bg-white/30"
            initial={{ x: ripple.x, y: ripple.y, scale: 0, opacity: 0.35 }}
            animate={{ scale: ripple.targetScale, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        ))}

        {rollingText && typeof children === "string" ? (
          <span
            className="relative inline-flex flex-col overflow-hidden py-0.5"
            aria-hidden="true"
          >
            <motion.span
              animate={
                isRollingActive
                  ? { y: "-100%", opacity: 0 }
                  : { y: "0%", opacity: 1 }
              }
              transition={{
                duration: 0.28,
                ease: [0.33, 1, 0.68, 1] as const,
              }}
              className="inline-block"
            >
              {children}
            </motion.span>
            <motion.span
              initial={{ y: "100%", opacity: 0 }}
              animate={
                isRollingActive
                  ? { y: "0%", opacity: 1 }
                  : { y: "100%", opacity: 0 }
              }
              transition={{
                duration: 0.28,
                ease: [0.33, 1, 0.68, 1] as const,
              }}
              className="absolute inset-0 inline-flex items-center justify-center"
            >
              {duplicateText || children}
            </motion.span>
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
