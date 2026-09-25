import { StandingsTableSkeleton, Skeleton } from "@/components/ui/loader-skeleton";

export default function StandingsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-36 rounded-xl" />
          <Skeleton className="h-14 w-36 rounded-xl" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <StandingsTableSkeleton rows={12} />
    </div>
  );
}
