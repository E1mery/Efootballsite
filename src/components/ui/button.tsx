"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90",
        yellow:
          "bg-secondary text-secondary-foreground font-bold shadow-lg hover:bg-secondary/90",
        green:
          "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90",
        outline:
          "border border-border bg-card/60 text-foreground hover:border-primary/50 hover:bg-muted/80 hover:text-foreground",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, disabled, whileHover, whileTap, asChild, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled}
        whileHover={disabled ? undefined : whileHover ?? { scale: 1.02, y: -0.5 }}
        whileTap={disabled ? undefined : whileTap ?? { scale: 0.96, y: 0.5 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        {...(props as any)}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
