import { useProcessedData } from "@/hooks/useResults";
import { Layout } from "@/components/Layout";
import { SpotsTracker } from "@/components/SpotsTracker";
import { DataLoadingTracker } from "@/components/DataLoadingTracker";
import { DataCollectionStats } from "@/components/DataCollectionStats";
import { ItalyMap } from "@/components/ItalyMap";
import { DashboardCard } from "@/components/DashboardCard";
import { UniversityTable } from "@/components/UniversityTable";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, ExternalLink, Mail } from "lucide-react";
import { CONFIG } from "@/lib/config";
import { useEnrollments, calculateEstimatedTotals, ProjectionMethod } from "@/hooks/useEnrollments";
import { useMemo, useState } from "react";


const Index = () => {
  const queryClient = useQueryClient();
  const [projectionMethod, setProjectionMethod] = useState<ProjectionMethod>("national");
  const {
    isLoading,
    error,
    results,
    studentAggregates,
    universityStats,
    regionStats,
    globalStats,
  } = useProcessedData();
  
  const { getEnrollment, getTotalEnrollment, loading: enrollmentsLoading } = useEnrollments();

  // Calculate estimated totals
  const estimatedTotals = useMemo(() => {
    if (enrollmentsLoading || !studentAggregates.length) return null;
    return calculateEstimatedTotals(studentAggregates, getEnrollment, getTotalEnrollment, projectionMethod);
  }, [studentAggregates, getEnrollment, getTotalEnrollment, enrollmentsLoading, projectionMethod]);

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
          estimatedIdonei={estimatedTotals?.estimatedIdonei}
          estimatedPotenziali={estimatedTotals?.estimatedPotenziali}
          projectionMethod={projectionMethod}
          onProjectionMethodChange={setProjectionMethod}
        />

        {/* Data Loading Tracker or Data Collection Stats */}
        {CONFIG.HIDE_DATA_LOADING_TRACKER ? (
          <DataCollectionStats studentAggregates={studentAggregates} />
        ) : (
          <DataLoadingTracker
            totalUniversities={globalStats.totalUniversities}
            completeUniversities={globalStats.universitiesComplete}
            partialUniversities={globalStats.universitiesWithData - globalStats.universitiesComplete}
            surveyUniversities={globalStats.universitiesFromSurvey}
          />
        )}

        {/* Survey Call to Action */}
        {!CONFIG.DISABLE_SURVEYS_GLOBALLY && (
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/50 dark:from-purple-950/40 dark:to-indigo-950/40 dark:border-purple-800/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-shrink-0 p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                  <ClipboardList className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                    I dati ufficiali tardano? Aiutaci a raccoglierli!
                  </h3>
                  <p className="text-sm text-purple-700/80 dark:text-purple-300/80">
                    In attesa dei dati ufficiali pubblici e anonimizzati, compila il sondaggio per aiutare tutti a orientarsi.
                    <span className="block mt-1 text-purple-600/90 dark:text-purple-300/90">Ogni risposta conta: insieme rendiamo questi giorni un po' meno stressanti per tutti! 💜</span>
                  </p>
                </div>
                <Button 
                  asChild
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <a 
                    href="https://tally.so/r/eq5d0x" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (typeof window !== 'undefined' && (window as any).umami) {
                        (window as any).umami.track('Survey button click');
                      }
                    }}
                  >
                    Compila il sondaggio
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
              
              {/* Note for representatives */}
              <div className="mt-4 pt-4 border-t border-purple-200/50 dark:border-purple-700/50">
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70 flex items-center gap-2">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span>
                    <strong>Rappresentanti:</strong> se avete raccolto dati aggregati, scriveteci a{" "}
                    <a 
                      href="mailto:semestrefiltro2025@atomicmail.io" 
                      className="underline hover:no-underline"
                    >
                      semestrefiltro2025@atomicmail.io
                    </a>
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* University Preview */}
          <div className="lg:col-span-2">
            <DashboardCard title="Top università" to="/universita" linkText="Vedi tutte">
              <UniversityTable
                universities={universityStats}
                studentAggregates={studentAggregates}
                results={results}
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
