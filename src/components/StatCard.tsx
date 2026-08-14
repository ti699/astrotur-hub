import { cn } from "@/lib/utils";
import type { FleetStat } from "@/data/mockData";

export function StatCard({ stat }: { stat: FleetStat }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft">
      <p
        className={cn(
          "text-3xl font-bold tracking-tight",
          stat.highlight ? "text-primary" : "text-foreground",
        )}
      >
        {stat.value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {stat.label}
      </p>
    </div>
  );
}
