import { useProcessedData } from "@/hooks/useResults";
import { Layout } from "@/components/Layout";
import { SpotsTracker } from "@/components/SpotsTracker";
import { DataLoadingTracker } from "@/components/DataLoadingTracker";
import { ItalyMap } from "@/components/ItalyMap";
import { DashboardCard } from "@/components/DashboardCard";
import { UniversityTable } from "@/components/UniversityTable";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail } from "lucide-react";


const Index = () => {
  const queryClient = useQueryClient();
  const {
    isLoading,
    error,
    results,
    studentAggregates,
    universityStats,
    regionStats,
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
      <div className="space-y-6">
        {/* Spots Tracker */}
        <SpotsTracker
          totalSpots={globalStats.totalSpots}
          totalStudents={globalStats.uniqueStudents}
          fullyQualified={globalStats.fullyQualified}
          potentiallyQualified={globalStats.almostQualified}
        />

        {/* Data Loading Tracker */}
        <DataLoadingTracker
          totalUniversities={globalStats.totalUniversities}
          completeUniversities={globalStats.universitiesComplete}
          partialUniversities={globalStats.universitiesWithData - globalStats.universitiesComplete}
          surveyUniversities={globalStats.universitiesFromSurvey}
        />

        {/* Survey Data Call to Action */}
        <Alert className="bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800">
          <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <AlertDescription className="text-purple-800 dark:text-purple-200">
            <strong>Ciao rappresentanti! 👋</strong> Se avete raccolto i risultati dei vostri colleghi tramite sondaggi, 
            vi invitiamo a condividerli con noi scrivendo a{" "}
            <a 
              href="mailto:semestrefiltro2025@atomicmail.io" 
              className="font-semibold underline hover:no-underline"
            >
              semestrefiltro2025@atomicmail.io
            </a>
            . I dati verranno pubblicati su questo sito per permettere a tutti gli studenti una consultazione più semplice e immediata. Ogni contributo è prezioso: insieme possiamo aiutarci a orientarci meglio in questi giorni decisivi per la scelta sul voto. Grazie di cuore! 💜
          </AlertDescription>
        </Alert>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* University Preview */}
          <div className="lg:col-span-2">
            <DashboardCard title="Top università" to="/universita" linkText="Vedi tutte">
              <UniversityTable
                universities={universityStats}
                studentAggregates={studentAggregates}
                limit={5}
              />
            </DashboardCard>
          </div>

          {/* Italy Map */}
          <div className="lg:col-span-1">
            <ItalyMap regionStats={regionStats} universityStats={universityStats} />
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Index;
