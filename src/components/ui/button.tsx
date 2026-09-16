import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwanda-blue disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-500/40",
        yellow:
          "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold shadow-lg shadow-yellow-500/25 hover:from-amber-300 hover:to-yellow-400 hover:shadow-yellow-500/40",
        green:
          "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/40",
        outline:
          "border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-sky-500/50 hover:bg-slate-800/80 hover:text-white",
        ghost:
          "text-slate-300 hover:bg-slate-800/60 hover:text-white",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/25",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
