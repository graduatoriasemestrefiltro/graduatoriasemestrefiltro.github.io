import { AnimatedCounter } from "./AnimatedCounter";
import { CheckCircle2, Clock, Trophy, Users } from "lucide-react";

interface SpotsTrackerProps {
  totalSpots: number;
  totalStudents: number;
  fullyQualified: number;
  potentiallyQualified: number;
}

export const SpotsTracker = ({
  totalSpots,
  totalStudents,
  fullyQualified,
  potentiallyQualified,
}: SpotsTrackerProps) => {
  // Consider both fully and potentially qualified as "assigned"
  const totalAssigned = fullyQualified + potentiallyQualified;
  const assignedPercent = (totalAssigned / totalSpots) * 100;
  const fullyPercent = (fullyQualified / totalSpots) * 100;
  const potentiallyPercent = (potentiallyQualified / totalSpots) * 100;

  return (
    <div className="rounded-xl border border-border/50 p-6 gradient-card shadow-card">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Tracker posti disponibili</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground mb-1">Posti totali</p>
          <p className="text-2xl font-bold font-mono">
            <AnimatedCounter value={totalSpots} />
          </p>
        </div>
        <div className="text-center p-4 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
            <Users className="h-3 w-3" />
            Studenti
          </p>
          <p className="text-2xl font-bold font-mono">
            <AnimatedCounter value={totalStudents} />
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">hanno sostenuto l'esame</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
          <p className="text-xs text-success mb-1 flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Idonei
          </p>
          <p className="text-2xl font-bold font-mono text-success">
            <AnimatedCounter value={fullyQualified} />
          </p>
          <p className="text-[10px] text-success/70 mt-1">≥18 in tutte le prove</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-amber-100 border border-amber-300/50">
          <p className="text-xs text-amber-700 mb-1 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            Potenziali
          </p>
          <p className="text-2xl font-bold font-mono text-amber-700">
            <AnimatedCounter value={potentiallyQualified} />
          </p>
          <p className="text-[10px] text-amber-700/70 mt-1">≥18 nelle prove svolte</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Riempimento graduatoria</span>
          <span className="font-mono font-medium">
            {assignedPercent.toFixed(2)}%
          </span>
        </div>
        <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 gradient-success transition-all duration-1000 rounded-l-full"
            style={{ width: `${fullyPercent}%` }}
          />
          <div
            className="absolute inset-y-0 gradient-warning transition-all duration-1000 rounded-r-full opacity-70"
            style={{ left: `${fullyPercent}%`, width: `${potentiallyPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>
            Posti rimanenti:{" "}
            <span className="font-mono font-medium text-foreground">
              <AnimatedCounter value={totalSpots - totalAssigned} />
            </span>
          </span>
          <span>{totalSpots.toLocaleString("it-IT")}</span>
        </div>
      </div>
    </div>
  );
};
