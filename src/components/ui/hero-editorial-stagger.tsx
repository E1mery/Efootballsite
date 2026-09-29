"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HeroEditorialStaggerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  isActive?: boolean;
}

export interface StaggerRevealHeadlineProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div" | "span";
  className?: string;
  duration?: number;
  wordStagger?: number;
}

export interface StaggerRevealItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  yOffset?: number;
  duration?: number;
}

const defaultEase = [0.16, 1, 0.3, 1] as const;

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: (custom?: { staggerDelay?: number; initialDelay?: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom?.staggerDelay ?? 0.08,
      delayChildren: custom?.initialDelay ?? 0.04,
    },
  }),
  inactive: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

const headlineContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: (custom?: { wordStagger?: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom?.wordStagger ?? 0.025,
      delayChildren: 0.02,
    },
  }),
  inactive: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

const maskedWordVariants: Variants = {
  hidden: {
    y: "115%",
    opacity: 0,
  },
  visible: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: defaultEase,
    },
  },
  inactive: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: defaultEase,
    },
  },
  inactive: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * useStaggerReveal
 * Headless helper hook for managing editorial entrance animations.
 */
export function useStaggerReveal(isActive = true) {
  const shouldReduceMotion = useReducedMotion();
  return {
    animate: shouldReduceMotion || isActive ? "visible" : "inactive",
    initial: isActive ? "hidden" : "inactive",
    shouldReduceMotion,
  };
}

/**
 * StaggerRevealItem
 * Follower item that staggers in smoothly after or alongside preceding editorial elements.
 */
export const StaggerRevealItem = React.forwardRef<
  HTMLDivElement,
  StaggerRevealItemProps
>(({ children, as = "div", className, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion.create(as as any);

  if (shouldReduceMotion) {
    const Fallback = as as any;
    return (
      <Fallback ref={ref} className={className} {...props}>
        {children}
      </Fallback>
    );
  }

  return (
    <Component
      ref={ref}
      variants={itemVariants}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
});
StaggerRevealItem.displayName = "StaggerRevealItem";

/**
 * StaggerRevealHeadline
 * Split-target headline component featuring masked word-by-word / line reveal with editorial easing.
 */
export const StaggerRevealHeadline = React.forwardRef<
  HTMLHeadingElement,
  StaggerRevealHeadlineProps
>(
  (
    {
      children,
      as = "h2",
      className,
      duration = 0.6,
      wordStagger = 0.025,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();
    const HeadingComponent = motion.create(as as any);

    if (shouldReduceMotion) {
      const Fallback = as as any;
      return (
        <Fallback ref={ref} className={className} {...props}>
          {children}
        </Fallback>
      );
    }

    // Split text or handle nested nodes gracefully
    const renderWords = (content: React.ReactNode): React.ReactNode => {
      if (content === null || content === undefined || typeof content === "boolean") {
        return null;
      }

      if (typeof content === "number") {
        content = String(content);
      }

      if (typeof content === "string") {
        const words = content.trim().split(/\s+/);
        if (words.length === 0 || (words.length === 1 && words[0] === "")) {
          return null;
        }
        return words.map((word, idx) => (
          <span
            key={`word-${idx}-${word}`}
            className="inline-block overflow-hidden align-top mr-1.5 last:mr-0"
          >
            <motion.span
              className="inline-block"
              variants={maskedWordVariants}
            >
              {word}
            </motion.span>
          </span>
        ));
      }

      if (React.isValidElement(content)) {
        return (
          <span className="inline-block overflow-hidden align-top mr-1.5 last:mr-0">
            <motion.span
              className="inline-block"
              variants={maskedWordVariants}
            >
              {content}
            </motion.span>
          </span>
        );
      }

      if (Array.isArray(content)) {
        return content.map((item, idx) => (
          <React.Fragment key={`frag-${idx}`}>
            {renderWords(item)}
          </React.Fragment>
        ));
      }

      return content;
    };

    return (
      <HeadingComponent
        ref={ref}
        variants={headlineContainerVariants}
        custom={{ wordStagger }}
        className={className}
        {...props}
      >
        {renderWords(children)}
      </HeadingComponent>
    );
  }
);
StaggerRevealHeadline.displayName = "StaggerRevealHeadline";

/**
 * HeroEditorialStagger / StaggerReveal
 * Orchestrated editorial container for headlines and followers from Motion UI.
 */
export const HeroEditorialStagger = React.forwardRef<
  HTMLDivElement,
  HeroEditorialStaggerProps
>(
  (
    {
      children,
      as = "div",
      className,
      staggerDelay = 0.08,
      initialDelay = 0.04,
      isActive = true,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();
    const Container = motion.create(as as any);

    if (shouldReduceMotion) {
      const Fallback = as as any;
      return (
        <Fallback ref={ref} className={className} {...props}>
          {children}
        </Fallback>
      );
    }

    return (
      <Container
        ref={ref}
        initial={isActive ? "hidden" : "inactive"}
        animate={isActive ? "visible" : "inactive"}
        variants={containerVariants}
        custom={{ staggerDelay, initialDelay }}
        className={className}
        {...props}
      >
        {children}
      </Container>
    );
  }
);
HeroEditorialStagger.displayName = "HeroEditorialStagger";

// Alias export matching Motion UI specification
export const StaggerReveal = HeroEditorialStagger;
