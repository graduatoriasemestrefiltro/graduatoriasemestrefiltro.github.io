import { useState } from "react";
import { AnimatedCounter } from "./AnimatedCounter";
import { CheckCircle2, Clock, Trophy, Users, TrendingUp, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectionMethod } from "@/hooks/useEnrollments";

interface SpotsTrackerProps {
  totalSpots: number;
  totalStudents: number;
  fullyQualified: number;
  potentiallyQualified: number;
  estimatedIdonei?: number;
  estimatedPotenziali?: number;
  projectionMethod?: ProjectionMethod;
  onProjectionMethodChange?: (method: ProjectionMethod) => void;
}

const EstimationHelp = ({ method }: { method: ProjectionMethod }) => (
  <Dialog>
    <DialogTrigger asChild>
      <button className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ml-1">
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
    </DialogTrigger>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-primary">
          <TrendingUp className="h-5 w-5" />
          Metodi di proiezione
        </DialogTitle>
      </DialogHeader>
      <div className="text-sm text-muted-foreground space-y-4">
        <div className={method === "national" ? "p-3 rounded-lg bg-primary/10 border border-primary/20" : ""}>
          <p className={method === "national" ? "text-foreground" : ""}>
            <strong>Nazionale {method === "national" && "(selezionato)"}</strong>: assume che tutti gli studenti che non hanno compilato il sondaggio, a livello nazionale, rispecchino la media nazionale di quelli che lo hanno compilato.
          </p>
        </div>
        <div className={method === "per-university" ? "p-3 rounded-lg bg-primary/10 border border-primary/20" : ""}>
          <p className={method === "per-university" ? "text-foreground" : ""}>
            <strong>Per università {method === "per-university" && "(selezionato)"}</strong>: per ogni ateneo, assume che gli studenti che non hanno compilato il sondaggio abbiano in media lo stesso tasso di idoneità di quelli che l'hanno compilato nella stessa università.
          </p>
        </div>
        <p className="text-xs italic">
          Da considerarsi puramente indicativa: il campione potrebbe non essere rappresentativo, alcuni iscritti potrebbero non aver sostenuto tutti gli esami, e i risultati del sondaggio potrebbero contenere errori di inserimento.
        </p>
      </div>
    </DialogContent>
  </Dialog>
);

export const SpotsTracker = ({
  totalSpots,
  totalStudents,
  fullyQualified,
  potentiallyQualified,
  estimatedIdonei,
  estimatedPotenziali,
  projectionMethod = "national",
  onProjectionMethodChange,
}: SpotsTrackerProps) => {
  const [showEstimate, setShowEstimate] = useState(false);
  
  // Consider both fully and potentially qualified as "assigned"
  const totalAssigned = fullyQualified + potentiallyQualified;
  const assignedPercent = (totalAssigned / totalSpots) * 100;
  const fullyPercent = (fullyQualified / totalSpots) * 100;
  const potentiallyPercent = (potentiallyQualified / totalSpots) * 100;

  // Estimated values
  const hasEstimates = estimatedIdonei !== undefined && estimatedPotenziali !== undefined;
  const estimatedTotal = hasEstimates ? estimatedIdonei + estimatedPotenziali : 0;
  const estimatedPercent = hasEstimates ? (estimatedTotal / totalSpots) * 100 : 0;
  const estimatedFullyPercent = hasEstimates ? (estimatedIdonei / totalSpots) * 100 : 0;
  const estimatedPotentiallyPercent = hasEstimates ? (estimatedPotenziali / totalSpots) * 100 : 0;

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
          <p className="text-[10px] text-muted-foreground/70 mt-1">con esiti disponibili</p>
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

      {/* Progress bars */}
      <div className="space-y-4">
        {/* Actual data */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Riempimento (dati raccolti)</span>
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
            <span>Dati raccolti: <span className="font-mono text-success">{fullyQualified.toLocaleString("it-IT")}</span> idonei + <span className="font-mono text-warning">{potentiallyQualified.toLocaleString("it-IT")}</span> potenziali</span>
            <span>Posti rimanenti: <span className="font-mono font-medium text-foreground">{(totalSpots - totalAssigned).toLocaleString("it-IT")}</span></span>
          </div>
        </div>

        {/* Toggle button for estimated data */}
        {hasEstimates && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newState = !showEstimate;
              setShowEstimate(newState);
              if (typeof window !== 'undefined' && (window as any).umami) {
                (window as any).umami.track(newState ? 'estimate_expanded' : 'estimate_collapsed');
              }
            }}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {showEstimate ? "Nascondi stima proiettata" : "Mostra stima proiettata"}
            {showEstimate ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
        )}

        {/* Estimated data */}
        {hasEstimates && showEstimate && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Projection method selector */}
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-muted-foreground">Metodo:</span>
              <Select
                value={projectionMethod}
                onValueChange={(value) => {
                  onProjectionMethodChange?.(value as ProjectionMethod);
                  if (typeof window !== 'undefined' && (window as any).umami) {
                    (window as any).umami.track('projection_method_changed', { method: value });
                  }
                }}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="national">Nazionale</SelectItem>
                <SelectItem value="per-university">Per università</SelectItem>
              </SelectContent>
              </Select>
              <EstimationHelp method={projectionMethod} />
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center">
                Riempimento (stima proiettata)
              </span>
              <span className="font-mono font-medium text-primary">
                {estimatedPercent.toFixed(2)}%
              </span>
            </div>
            <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-success/60 transition-all duration-1000 rounded-l-full"
                style={{ width: `${Math.min(estimatedFullyPercent, 100)}%` }}
              />
              <div
                className="absolute inset-y-0 bg-warning/50 transition-all duration-1000 rounded-r-full"
                style={{ 
                  left: `${Math.min(estimatedFullyPercent, 100)}%`, 
                  width: `${Math.min(estimatedPotentiallyPercent, 100 - estimatedFullyPercent)}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Stimati: <span className="font-mono text-success">{estimatedIdonei?.toLocaleString("it-IT")}</span> idonei + <span className="font-mono text-warning">{estimatedPotenziali?.toLocaleString("it-IT")}</span> potenziali</span>
              <span>Posti rimanenti (stima): <span className="font-mono font-medium text-foreground">{Math.max(0, totalSpots - estimatedTotal).toLocaleString("it-IT")}</span></span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};