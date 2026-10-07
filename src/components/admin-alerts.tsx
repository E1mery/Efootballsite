"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Bell, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { AdminTab } from "@/components/admin/admin-nav";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminAlertItem = {
  id: AdminTab;
  title: string;
  description: string;
  count: number;
  icon: LucideIcon;
};

type AdminAlertsProps = {
  totalAlerts: number;
  alerts: AdminAlertItem[];
  onNavigate?: (tab: AdminTab) => void;
  onViewAll?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function AdminAlerts({
  totalAlerts,
  alerts,
  onNavigate,
  onViewAll,
  open: controlledOpen,
  onOpenChange,
}: AdminAlertsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const actionable = alerts.filter((a) => a.count > 0);

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction={isDesktop ? "right" : "bottom"}
    >
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          title="Items needing review"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {totalAlerts > 0 && (
            <Badge
              variant="destructive"
              className="absolute right-1 top-1 px-1 py-0 text-xs font-bold"
            >
              {totalAlerts}
            </Badge>
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10">
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </span>
              <DrawerTitle>Items Needing Review</DrawerTitle>
            </div>
            {totalAlerts > 0 ? (
              <Badge variant="destructive" className="text-xs font-bold">
                {totalAlerts} Pending
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                All clear
              </Badge>
            )}
          </div>
          <DrawerDescription>
            Operational alerts across the league office
          </DrawerDescription>
        </DrawerHeader>

        <div className="max-h-96 overflow-y-auto px-4 pb-2 sm:max-h-none sm:flex-1">
          {actionable.length === 0 ? (
            <p className="py-8 text-center text-xs italic text-muted-foreground">
              All caught up! Nothing needs review right now.
            </p>
          ) : (
            <div className="space-y-2">
              {actionable.map((alert) => {
                const Icon = alert.icon;
                return (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.(alert.id);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      "border-secondary/50 bg-secondary/10 ring-1 ring-secondary/20 hover:bg-secondary/20"
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                      <Icon className="h-4 w-4 text-primary" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-foreground">
                        {alert.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {alert.description}
                      </span>
                    </span>
                    <Badge variant="yellow" className="text-xs font-bold">
                      {alert.count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button
            onClick={() => {
              setOpen(false);
              onViewAll?.();
            }}
            className="w-full font-bold"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
