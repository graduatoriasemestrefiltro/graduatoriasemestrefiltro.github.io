import { Database, Building2, ClipboardList, Globe, Info } from "lucide-react";
import { CONFIG } from "@/lib/config";
import { StudentAggregate } from "@/types/results";
import { useSurveyData } from "@/contexts/SurveyDataContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DataCollectionStatsProps {
  studentAggregates: StudentAggregate[];
}

export const DataCollectionStats = ({ studentAggregates }: DataCollectionStatsProps) => {
  const { includeSurveyData } = useSurveyData();
  const totalEnrolled = CONFIG.TOTAL_ENROLLED_STUDENTS;
  const totalCollected = studentAggregates.length;
  
  // Count by source based on etichetta prefix
  const ministerialCount = studentAggregates.filter(s => 
    !s.etichetta.startsWith("SRV-") && 
    !s.etichetta.startsWith("UNIMI-") && 
    !s.etichetta.startsWith("LOGI-")
  ).length;
  
  const internalSurveyCount = studentAggregates.filter(s => 
    s.etichetta.startsWith("SRV-")
  ).length;
  
  const unimiSurveyCount = studentAggregates.filter(s => 
    s.etichetta.startsWith("UNIMI-")
  ).length;
  
  const logicaTestCount = studentAggregates.filter(s => 
    s.etichetta.startsWith("LOGI-")
  ).length;
  
  const collectedPercent = (totalCollected / totalEnrolled) * 100;

  const ministerialSource = { 
    label: "dati ministeriali", 
    count: ministerialCount, 
    icon: Building2, 
    color: "text-blue-600",
    bgColor: "bg-blue-500"
  };

  const otherSources = [
    { 
      label: "sondaggio interno", 
      count: internalSurveyCount, 
      icon: ClipboardList, 
      color: "text-purple-600",
      bgColor: "bg-purple-500"
    },
    { 
      label: "sondaggio UniMi", 
      count: unimiSurveyCount, 
      icon: ClipboardList, 
      color: "text-indigo-600",
      bgColor: "bg-indigo-500"
    },
    { 
      label: "Logica Test", 
      count: logicaTestCount, 
      icon: Globe, 
      color: "text-emerald-600",
      bgColor: "bg-emerald-500"
    },
  ].filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  const sources = ministerialSource.count > 0 
    ? [ministerialSource, ...otherSources] 
    : otherSources;

  return (
    <div className="rounded-lg border border-border/50 p-4 bg-card/50 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Database className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Fonti dati raccolti</h4>
        <span className="ml-auto text-sm text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{totalCollected.toLocaleString("it-IT")}</span>
          {" / "}
          <span className="font-mono">{totalEnrolled.toLocaleString("it-IT")}</span>
          {" "}studenti ({collectedPercent.toFixed(1)}%)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 text-sm">
        {sources.map((source) => (
          <div key={source.label} className="flex items-center gap-1.5">
            <source.icon className={`h-3.5 w-3.5 ${source.color}`} />
            <span className="text-muted-foreground">{source.label}:</span>
            <span className={`font-mono font-semibold ${source.color}`}>
              {source.count.toLocaleString("it-IT")}
            </span>
          </div>
        ))}
      </div>

      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        {(() => {
          let offset = 0;
          return sources.map((source) => {
            const width = (source.count / totalEnrolled) * 100;
            const left = offset;
            offset += width;
            return (
              <div
                key={source.label}
                className={`absolute inset-y-0 ${source.bgColor} transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            );
          });
        })()}
      </div>

      {includeSurveyData && (
        <Dialog>
          <DialogTrigger asChild>
            <button className="mt-2 text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              note sulla deduplicazione
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deduplicazione dei dati</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                Nonostante i tentativi di deduplicazione, potrebbe esserci una minima sovrapposizione tra i dati provenienti da fonti diverse.
              </p>
              <p>
                <strong>Sondaggio UniMi:</strong> dai dati raccolti da Logica Test, rimuoviamo manualmente gli studenti UniMi, per i quali viene utilizzato il sondaggio dedicato dell'università, più completo e numeroso.
              </p>
              <p>
                <strong>Sondaggio interno:</strong> gli studenti UniMi che tentano di compilare il sondaggio interno vengono automaticamente reindirizzati al sondaggio dedicato della loro università.
              </p>
              <p>
                <strong>Logica Test:</strong> durante la compilazione del sondaggio interno, chiediamo se si è già compilato il modulo di Logica Test e, in caso affermativo, di indicare il proprio username, così da poter escludere i duplicati.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
