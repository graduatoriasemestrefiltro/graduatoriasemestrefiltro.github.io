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
        />

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
