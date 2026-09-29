"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, LogIn, UserPlus, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle?: string;
  actionDescription?: string;
  redirectUrl?: string;
}

export default function AuthPromptModal({
  isOpen,
  onClose,
  actionTitle = "Protected League Feature",
  actionDescription = "This action requires an active Rwanda eFootball athlete account. Sign in to your existing account or register as an athlete to participate.",
  redirectUrl = "/",
}: AuthPromptModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const loginHref = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(redirectUrl)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Icon and Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
            <Lock className="h-7 w-7" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs border-primary/40 text-primary font-mono uppercase">
                AUTHENTICATION REQUIRED
              </Badge>
            </div>
            <h3 id="auth-modal-title" className="text-xl font-black uppercase text-foreground tracking-tight">
              {actionTitle}
            </h3>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {actionDescription}
          </p>
        </div>

        {/* System Benefits Note */}
        <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4 space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Verified Athlete Experience</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            Sign in to submit 24-hr match scores, cast prediction votes, coordinate on WhatsApp, and earn official league points.
          </p>
        </div>

        {/* Actions: Login & Register */}
        <div className="space-y-3 pt-1">
          <Link href={loginHref} className="block w-full" onClick={onClose}>
            <Button variant="yellow" size="lg" className="w-full font-black text-secondary-foreground shadow-lg flex items-center justify-center gap-2">
              <LogIn className="h-4 w-4" />
              <span>Sign In to Your Account</span>
            </Button>
          </Link>

          <Link href={registerHref} className="block w-full" onClick={onClose}>
            <Button variant="outline" size="lg" className="w-full font-bold text-foreground border-border hover:bg-muted flex items-center justify-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Create Athlete Account</span>
            </Button>
          </Link>
        </div>

        {/* Dismiss Footer */}
        <div className="pt-2 text-center border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Continue browsing public league results
          </button>
        </div>
      </div>
    </div>
  );
}
