import { useState } from "react";
import { useProcessedData } from "@/hooks/useResults";
import { Layout } from "@/components/Layout";
import { RankingTable } from "@/components/RankingTable";
import { ScoreDistributionChart } from "@/components/ScoreDistributionChart";
import { CommonStatsBar } from "@/components/CommonStatsBar";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";

type ViewMode = "generale" | "fisica" | "chimica" | "biologia";

const Graduatorie = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ViewMode>("generale");
  const {
    isLoading,
    error,
    results,
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
            <h1 className="text-2xl font-bold tracking-tight">Graduatorie</h1>
            <p className="text-muted-foreground text-sm">
              Classifiche complete per materia e graduatoria generale
            </p>
          </div>
          
          {/* Contextual Stats */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-sm w-full sm:w-auto">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Risultati caricati:</span>
            <span className="font-mono font-semibold">{globalStats.totalResults.toLocaleString("it-IT")}</span>
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

        {/* Rankings Table */}
        <div className="rounded-xl border border-border p-5 bg-card shadow-card">
          <RankingTable 
            results={results} 
            studentAggregates={studentAggregates}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as ViewMode)}
          />
        </div>

        {/* Score Distribution */}
        <ScoreDistributionChart 
          results={results} 
          studentAggregates={studentAggregates}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as ViewMode)}
        />
      </div>
    </Layout>
  );
};

export default Graduatorie;
