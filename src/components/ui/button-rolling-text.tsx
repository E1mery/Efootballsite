"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

export interface ButtonRollingTextProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">,
    VariantProps<typeof buttonVariants> {
  href?: string;
  target?: string;
  rel?: string;
  prefetch?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  text?: string;
  duplicateText?: string;
  stagger?: boolean;
  staggerDelay?: number;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isActive?: boolean;
  children?: React.ReactNode;
}

const letterTransition = {
  duration: 0.28,
  ease: [0.33, 1, 0.68, 1] as const,
};

/**
 * ButtonRollingText
 * Primary call-to-action button or link whose duplicate label rolls into place on hover or keyboard focus using Motion.
 * Supports both button and Next.js / external Link navigation.
 */
export const ButtonRollingText = React.forwardRef<
  any,
  ButtonRollingTextProps
>(
  (
    {
      className,
      variant = "default",
      size = "default",
      href,
      target,
      rel,
      prefetch,
      onClick,
      type = "button",
      text,
      duplicateText,
      stagger = true,
      staggerDelay,
      icon,
      iconPosition = "left",
      isActive,
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
      text || (typeof children === "string" ? children : "") || "";
    const duplicate = duplicateText || label;

    const active = !disabled && (isHovered || isFocused);

    const characters = React.useMemo(() => label.split(""), [label]);
    const duplicateCharacters = React.useMemo(
      () => duplicate.split(""),
      [duplicate]
    );

    const effectiveStaggerDelay = React.useMemo(() => {
      if (staggerDelay !== undefined) return staggerDelay;
      if (characters.length > 25) return 0.01;
      if (characters.length > 15) return 0.015;
      return 0.02;
    }, [staggerDelay, characters.length]);

    const textElement = React.useMemo(() => {
      if (!label && children) {
        return <span>{children}</span>;
      }

      if (shouldReduceMotion) {
        return <span>{children || label}</span>;
      }

      if (stagger) {
        return (
          <span
            className="relative inline-flex items-center overflow-hidden py-0.5"
            aria-hidden="true"
          >
            {/* Primary Character Stream */}
            <span className="inline-flex items-center">
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
                    delay: i * effectiveStaggerDelay,
                  }}
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </span>

            {/* Duplicate Rolling Character Stream */}
            <span className="absolute inset-0 inline-flex items-center">
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
                    delay: i * effectiveStaggerDelay,
                  }}
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </span>
          </span>
        );
      }

      return (
        <span
          className="relative inline-flex flex-col items-center justify-center overflow-hidden py-0.5"
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
      );
    }, [
      label,
      children,
      shouldReduceMotion,
      stagger,
      characters,
      duplicateCharacters,
      active,
      effectiveStaggerDelay,
      duplicate,
    ]);

    const content = (
      <>
        {/* Leading Icon */}
        {icon && iconPosition === "left" && (
          <span className="inline-flex shrink-0 items-center justify-center mr-1.5 transition-transform duration-300 group-hover/roll:scale-110">
            {icon}
          </span>
        )}

        {/* Rolling Text Content */}
        {textElement}

        {/* Trailing Icon */}
        {icon && iconPosition === "right" && (
          <span className="inline-flex shrink-0 items-center justify-center ml-1.5 transition-transform duration-300 group-hover/roll:translate-x-0.5 group-hover/roll:scale-110">
            {icon}
          </span>
        )}
      </>
    );

    if (href) {
      const isExternal =
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//") ||
        href.startsWith("mailto:");

      const linkClasses = cn(
        buttonVariants({ variant, size }),
        "group/roll relative inline-flex items-center justify-center overflow-hidden font-bold tracking-wide select-none touch-manipulation transition-all duration-200 active:scale-95",
        disabled && "pointer-events-none opacity-50",
        className
      );

      if (isExternal) {
        return (
          <a
            ref={ref}
            href={href}
            target={target ?? "_blank"}
            rel={rel ?? "noopener noreferrer"}
            aria-label={label || undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onClick={onClick as any}
            className={linkClasses}
            {...(props as any)}
          >
            {content}
          </a>
        );
      }

      return (
        <Link
          ref={ref}
          href={href}
          target={target}
          rel={rel}
          prefetch={prefetch}
          aria-label={label || undefined}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onClick={onClick as any}
          className={linkClasses}
          {...(props as any)}
        >
          {content}
        </Link>
      );
    }

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        type={type}
        aria-label={label || undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={onClick as any}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        className={cn(
          buttonVariants({ variant, size }),
          "group/roll relative inline-flex items-center justify-center overflow-hidden font-bold tracking-wide select-none touch-manipulation",
          className
        )}
        {...(props as any)}
      >
        {content}
      </motion.button>
    );
  }
);
ButtonRollingText.displayName = "ButtonRollingText";
