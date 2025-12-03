import { useProcessedData } from "@/hooks/useResults";
import { Layout } from "@/components/Layout";
import { UniversityTable } from "@/components/UniversityTable";
import { CommonStatsBar } from "@/components/CommonStatsBar";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2 } from "lucide-react";

const Universita = () => {
  const queryClient = useQueryClient();
  const {
    isLoading,
    error,
    universityStats,
    studentAggregates,
    globalStats,
  } = useProcessedData();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !globalStats) {
    return <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: ["results"] })} />;
  }

  return (
    <Layout>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Statistiche università</h1>
            <p className="text-muted-foreground text-sm">
              Panoramica dettagliata delle statistiche per ogni università
            </p>
          </div>
          
          {/* Contextual Stats */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-sm w-full sm:w-auto">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Con dati:</span>
            <span className="font-mono font-semibold">{globalStats.universitiesWithData}/{globalStats.totalUniversities}</span>
            <span className="text-border mx-2">|</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-muted-foreground">Complete:</span>
            <span className="font-mono font-semibold text-success">{globalStats.universitiesComplete}</span>
          </div>
        </div>

        {/* Common Stats Bar - hidden on mobile */}
        <div className="hidden sm:block">
          <CommonStatsBar
            uniqueStudents={globalStats.uniqueStudents}
            avgScore={globalStats.avgScore}
            fullyQualified={globalStats.fullyQualified}
            potentiallyQualified={globalStats.almostQualified}
          />
        </div>

        {/* Full Table */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          {/* Legend integrated in card header */}
          <div className="px-5 py-3 border-b border-border flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <span className="text-muted-foreground">Idonei</span>
              <span className="text-foreground/60">≥18 in tutte e 3 le materie</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-warning" />
              <span className="text-muted-foreground">Potenziali</span>
              <span className="text-foreground/60">≥18 nelle prove sostenute</span>
            </div>
          </div>
          <div className="p-5">
            <UniversityTable
              universities={universityStats}
              studentAggregates={studentAggregates}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Universita;
