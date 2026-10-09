"use client";

import { Trophy, Flame, Zap, Shield, Crown, Award, User, ExternalLink } from "lucide-react";
import { AllTimeRecord } from "@/lib/hallOfFameStatsService";

interface AllTimeRecordsProps {
  records: AllTimeRecord[];
  onViewAllRecords?: () => void;
}

export default function AllTimeRecords({
  records = [],
  onViewAllRecords,
}: AllTimeRecordsProps) {
  const getRecordIcon = (category: string) => {
    switch (category) {
      case "TITLES":
        return Crown;
      case "GOALS":
        return Flame;
      case "WINS":
        return Trophy;
      case "STREAK":
        return Zap;
      case "CLEAN_SHEETS":
      case "DEFENSE":
        return Shield;
      case "FINALS":
        return Award;
      default:
        return Trophy;
    }
  };

  // We show up to 6 core records (or all available)
  const displayRecords = records.slice(0, 6);

  return (
    <section className="py-8 sm:py-12 border-b border-border/40">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold tracking-widest uppercase text-secondary">
              HISTORICAL LEADERS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground tracking-tight">
            All-Time League Records
          </h2>
        </div>

        {onViewAllRecords && (
          <button
            onClick={onViewAllRecords}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary hover:underline self-start sm:self-auto"
          >
            <span>View Full Records</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {displayRecords.length === 0 ? (
        <div className="text-center p-8 sm:p-12 rounded-2xl hof-navy-surface border border-border/60">
          <Award className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">
            Records Pending Data
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            All-time records require verified official matches. Complete fixtures will automatically generate and crown record holders here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {displayRecords.map((rec) => {
            const Icon = getRecordIcon(rec.category);
            const primaryHolder = rec.holders && rec.holders.length > 0 ? rec.holders[0] : null;

            return (
              <div
                key={rec.id || rec.recordKey}
                className="hof-navy-surface rounded-2xl p-5 sm:p-6 border border-border/60 hover:border-secondary/50 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {rec.title}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4 text-secondary" />
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">
                    {rec.valueFormatted}
                  </div>

                  {/* Transparency Note */}
                  <div className="text-xs text-muted-foreground mb-4 line-clamp-1">
                    {rec.transparencyNote || "Calculated from verified league data"}
                  </div>
                </div>

                {/* Record Holder Section */}
                <div className="border-t border-border/50 pt-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wide text-foreground truncate">
                      {primaryHolder ? primaryHolder.gamerTag : "No Holder Yet"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {primaryHolder?.fullName || (rec.holders.length > 1 ? `+${rec.holders.length - 1} tied` : "Official Holder")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
