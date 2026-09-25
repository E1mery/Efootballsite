"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

export interface ButtonRollingTextProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  text?: string;
  duplicateText?: string;
  stagger?: boolean;
  staggerDelay?: number;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children?: React.ReactNode;
}

const letterTransition = {
  duration: 0.32,
  ease: [0.33, 1, 0.68, 1] as const,
};

/**
 * ButtonRollingText
 * Primary call-to-action button whose duplicate label rolls into place on hover or keyboard focus in Motion for React.
 */
export const ButtonRollingText = React.forwardRef<
  HTMLButtonElement,
  ButtonRollingTextProps
>(
  (
    {
      className,
      variant = "default",
      size = "default",
      text,
      duplicateText,
      stagger = false,
      staggerDelay = 0.02,
      icon,
      iconPosition = "right",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);

    // Derive label from text prop or string children
    const label =
      text || (typeof children === "string" ? children : "") || "Action";
    const duplicate = duplicateText || label;

    const active = !disabled && (isHovered || isFocused);

    const characters = React.useMemo(() => label.split(""), [label]);
    const duplicateCharacters = React.useMemo(
      () => duplicate.split(""),
      [duplicate]
    );

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        aria-label={label}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        className={cn(
          buttonVariants({ variant, size }),
          "group/roll relative inline-flex items-center justify-center overflow-hidden font-bold tracking-wide",
          className
        )}
        {...(props as any)}
      >
        {/* Leading Icon */}
        {icon && iconPosition === "left" && (
          <span className="mr-2 inline-flex shrink-0 transition-transform duration-300 group-hover/roll:scale-110">
            {icon}
          </span>
        )}

        {/* Text Container with overflow hidden for the roll effect */}
        {shouldReduceMotion ? (
          <span>{children || label}</span>
        ) : stagger ? (
          <span
            className="relative inline-flex overflow-hidden py-0.5"
            aria-hidden="true"
          >
            {/* Primary Character Stream */}
            <span className="inline-flex">
              {characters.map((char, i) => (
                <motion.span
                  key={`char-${i}`}
                  animate={
                    active
                      ? { y: "-100%", opacity: 0 }
                      : { y: "0%", opacity: 1 }
                  }
                  transition={{
                    ...letterTransition,
                    delay: i * staggerDelay,
                  }}
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </span>

            {/* Duplicate Rolling Character Stream */}
            <span className="absolute inset-0 inline-flex">
              {duplicateCharacters.map((char, i) => (
                <motion.span
                  key={`dup-char-${i}`}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={
                    active
                      ? { y: "0%", opacity: 1 }
                      : { y: "100%", opacity: 0 }
                  }
                  transition={{
                    ...letterTransition,
                    delay: i * staggerDelay,
                  }}
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </span>
          </span>
        ) : (
          <span
            className="relative inline-flex flex-col overflow-hidden py-0.5"
            aria-hidden="true"
          >
            {/* Primary Label */}
            <motion.span
              animate={
                active
                  ? { y: "-100%", opacity: 0 }
                  : { y: "0%", opacity: 1 }
              }
              transition={{
                duration: 0.28,
                ease: [0.33, 1, 0.68, 1] as const,
              }}
              className="inline-block"
            >
              {children || label}
            </motion.span>

            {/* Duplicate Rolling Label */}
            <motion.span
              initial={{ y: "100%", opacity: 0 }}
              animate={
                active
                  ? { y: "0%", opacity: 1 }
                  : { y: "100%", opacity: 0 }
              }
              transition={{
                duration: 0.28,
                ease: [0.33, 1, 0.68, 1] as const,
              }}
              className="absolute inset-0 inline-flex items-center justify-center"
            >
              {duplicate}
            </motion.span>
          </span>
        )}

        {/* Trailing Icon */}
        {icon && iconPosition === "right" && (
          <span className="ml-2 inline-flex shrink-0 transition-transform duration-300 group-hover/roll:translate-x-0.5 group-hover/roll:scale-110">
            {icon}
          </span>
        )}
      </motion.button>
    );
  }
);
ButtonRollingText.displayName = "ButtonRollingText";
