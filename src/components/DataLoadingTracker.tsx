import { Database, CheckCircle2, Clock, ClipboardList } from "lucide-react";

interface DataLoadingTrackerProps {
  totalUniversities: number;
  completeUniversities: number;
  partialUniversities: number;
  surveyUniversities: number;
}

export const DataLoadingTracker = ({
  totalUniversities,
  completeUniversities,
  partialUniversities,
  surveyUniversities,
}: DataLoadingTrackerProps) => {
  // Survey universities are separate from complete/partial
  const officialComplete = completeUniversities;
  const officialPartial = partialUniversities;
  const withData = officialComplete + officialPartial + surveyUniversities;
  const withoutData = totalUniversities - withData;
  
  const completePercent = (officialComplete / totalUniversities) * 100;
  const partialPercent = (officialPartial / totalUniversities) * 100;
  const surveyPercent = (surveyUniversities / totalUniversities) * 100;

  return (
    <div className="rounded-lg border border-border/50 p-4 bg-card/50 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Database className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Stato caricamento dati</h4>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 text-sm">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span className="text-muted-foreground">Completi:</span>
          <span className="font-mono font-semibold text-success">{officialComplete}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-warning" />
          <span className="text-muted-foreground">Parziali:</span>
          <span className="font-mono font-semibold text-warning">{officialPartial}</span>
        </div>
        {surveyUniversities > 0 && (
          <div className="flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5 text-purple-600" />
            <span className="text-muted-foreground">Da sondaggio:</span>
            <span className="font-mono font-semibold text-purple-600">{surveyUniversities}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">In attesa:</span>
          <span className="font-mono font-semibold">{withoutData}</span>
        </div>
        <div className="sm:ml-auto text-muted-foreground">
          <span className="font-mono">{withData}/{totalUniversities}</span> università
        </div>
      </div>

      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-success transition-all duration-700 rounded-full"
          style={{ width: `${completePercent}%` }}
        />
        <div
          className="absolute inset-y-0 bg-warning transition-all duration-700 rounded-full"
          style={{ left: `${completePercent}%`, width: `${partialPercent}%` }}
        />
        {surveyUniversities > 0 && (
          <div
            className="absolute inset-y-0 bg-purple-500 transition-all duration-700 rounded-full"
            style={{ left: `${completePercent + partialPercent}%`, width: `${surveyPercent}%` }}
          />
        )}
      </div>

      {surveyUniversities > 0 && (
        <p className="text-xs text-purple-600 mt-3 flex items-start gap-1.5">
          <ClipboardList className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>In attesa della pubblicazione dei dati ufficiali, per alcune università sono disponibili risultati raccolti tramite sondaggi tra gli studenti. Tali dati sono da considerarsi indicativi.</span>
        </p>
      )}
    </div>
  );
};