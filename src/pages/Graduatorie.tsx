import { useState, useMemo } from "react";
import { useProcessedData } from "@/hooks/useResults";
import { Layout } from "@/components/Layout";
import { RankingTable } from "@/components/RankingTable";
import { ScoreDistributionChart } from "@/components/ScoreDistributionChart";
import { CommonStatsBar } from "@/components/CommonStatsBar";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, X, Atom, Beaker, Dna, Calculator, Filter } from "lucide-react";
import { formatUniversityName } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ViewMode = "generale" | "fisica" | "chimica" | "biologia";

const Graduatorie = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ViewMode>("generale");
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const {
    isLoading,
    error,
    results,
    studentAggregates,
    universityStats,
    globalStats,
  } = useProcessedData();

  // Get unique university names from results
  const availableUniversities = useMemo(() => {
    if (!universityStats) return [];
    return universityStats
      .filter(u => u.totalStudents > 0)
      .map(u => u.nome)
      .sort((a, b) => formatUniversityName(a).localeCompare(formatUniversityName(b)));
  }, [universityStats]);

  const toggleUniversity = (uni: string) => {
    setSelectedUniversities(prev => 
      prev.includes(uni) 
        ? prev.filter(u => u !== uni)
        : [...prev, uni]
    );
  };

  const clearUniversities = () => setSelectedUniversities([]);

  // Compute filtered averages and pass rates
  const filteredStats = useMemo(() => {
    const filteredResults = selectedUniversities.length > 0
      ? results.filter(r => selectedUniversities.includes(r.universita.nome))
      : results;
    
    const filteredAggregates = selectedUniversities.length > 0
      ? studentAggregates.filter(s => selectedUniversities.includes(s.universita))
      : studentAggregates;

    const calcAvg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const calcPassRate = (arr: number[]) => arr.length > 0 ? (arr.filter(x => x >= 18).length / arr.length) * 100 : 0;

    const fisicaScores = filteredResults.filter(r => r.materia === "fisica").map(r => parseFloat(r.punteggio));
    const chimicaScores = filteredResults.filter(r => r.materia === "chimica").map(r => parseFloat(r.punteggio));
    const biologiaScores = filteredResults.filter(r => r.materia === "biologia").map(r => parseFloat(r.punteggio));
    const mediaScores = filteredAggregates.filter(s => s.media !== undefined).map(s => s.media!);

    // For media, calculate % of students who passed all their exams (allPassed)
    const passRateAllExams = filteredAggregates.length > 0 
      ? (filteredAggregates.filter(s => s.allPassed).length / filteredAggregates.length) * 100 
      : 0;

    // Header stats
    const uniqueStudents = filteredAggregates.length;
    const fullyQualified = filteredAggregates.filter(s => s.fullyQualified).length;
    const potentiallyQualified = filteredAggregates.filter(s => s.allPassed && !s.fullyQualified).length;

    return {
      avgMedia: calcAvg(mediaScores),
      avgFisica: calcAvg(fisicaScores),
      avgChimica: calcAvg(chimicaScores),
      avgBiologia: calcAvg(biologiaScores),
      passRateMedia: passRateAllExams,
      passRateFisica: calcPassRate(fisicaScores),
      passRateChimica: calcPassRate(chimicaScores),
      passRateBiologia: calcPassRate(biologiaScores),
      uniqueStudents,
      fullyQualified,
      potentiallyQualified,
    };
  }, [results, studentAggregates, selectedUniversities]);

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
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Risultati caricati:</span>
              <span className="font-mono font-semibold">{globalStats.totalResults.toLocaleString("it-IT")}</span>
            </div>
            
            {/* University Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Filtra università
                  {selectedUniversities.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {selectedUniversities.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 bg-card" align="end">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-medium">Seleziona università</span>
                  {selectedUniversities.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearUniversities} className="h-7 px-2 text-xs">
                      Rimuovi filtri
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="p-2 space-y-1">
                    {availableUniversities.map((uni) => (
                      <label
                        key={uni}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedUniversities.includes(uni)}
                          onCheckedChange={() => toggleUniversity(uni)}
                        />
                        <span className="text-sm truncate">{formatUniversityName(uni)}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Selected Universities Tags and Filter Alert */}
        {selectedUniversities.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {selectedUniversities.map((uni) => (
                <Badge key={uni} variant="secondary" className="gap-1 pr-1">
                  {formatUniversityName(uni)}
                  <button
                    onClick={() => toggleUniversity(uni)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Alert className="bg-amber-50 border-amber-200">
              <Filter className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="text-amber-800">
                  Stai visualizzando i dati filtrati per {selectedUniversities.length} {selectedUniversities.length === 1 ? "università" : "università"}.
                </span>
                <Button variant="outline" size="sm" onClick={clearUniversities} className="shrink-0">
                  Rimuovi filtri
                </Button>
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Common Stats Bar - hidden on mobile */}
        <div className="hidden sm:block">
          <CommonStatsBar
            uniqueStudents={filteredStats.uniqueStudents}
            avgScore={filteredStats.avgMedia}
            fullyQualified={filteredStats.fullyQualified}
            potentiallyQualified={filteredStats.potentiallyQualified}
          />
        </div>

        {/* Rankings Table */}
        <div className="rounded-xl border border-border p-5 bg-card shadow-card">
          <RankingTable 
            results={results} 
            studentAggregates={studentAggregates}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as ViewMode)}
            selectedUniversities={selectedUniversities}
          />
        </div>

        {/* Average Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border p-4 bg-card shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Media generale</span>
            </div>
            <span className="text-2xl font-bold font-mono">{filteredStats.avgMedia.toFixed(2)}</span>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-success font-semibold">{filteredStats.passRateMedia.toFixed(1)}%</span>
              <br />≥18 in tutti gli esami
            </p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-card shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Atom className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Media fisica</span>
            </div>
            <span className="text-2xl font-bold font-mono">{filteredStats.avgFisica.toFixed(2)}</span>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-success font-semibold">{filteredStats.passRateFisica.toFixed(1)}%</span>
              <br />≥18
            </p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-card shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Beaker className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Media chimica</span>
            </div>
            <span className="text-2xl font-bold font-mono">{filteredStats.avgChimica.toFixed(2)}</span>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-success font-semibold">{filteredStats.passRateChimica.toFixed(1)}%</span>
              <br />≥18
            </p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-card shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Dna className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Media biologia</span>
            </div>
            <span className="text-2xl font-bold font-mono">{filteredStats.avgBiologia.toFixed(2)}</span>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-success font-semibold">{filteredStats.passRateBiologia.toFixed(1)}%</span>
              <br />≥18
            </p>
          </div>
        </div>

        {/* Score Distribution */}
        <ScoreDistributionChart 
          results={results} 
          studentAggregates={studentAggregates}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as ViewMode)}
          selectedUniversities={selectedUniversities}
        />
      </div>
    </Layout>
  );
};

export default Graduatorie;
