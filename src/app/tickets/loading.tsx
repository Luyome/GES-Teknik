import { Skeleton } from "@/components/ui/Skeleton";

export default function TicketsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-1 rounded-[var(--radius-card)] overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}
