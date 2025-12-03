import { Result, StudentAggregate } from "@/types/results";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Atom, Beaker, Dna, Users } from "lucide-react";

interface ScoreDistributionChartProps {
  results: Result[];
  studentAggregates: StudentAggregate[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  selectedUniversities?: string[];
}

type ViewMode = "generale" | "fisica" | "chimica" | "biologia";

export const ScoreDistributionChart = ({ 
  results, 
  studentAggregates,
  activeTab: externalTab,
  onTabChange,
  selectedUniversities = []
}: ScoreDistributionChartProps) => {
  const [internalTab, setInternalTab] = useState<ViewMode>("generale");
  
  // Map "generale" to "media" for chart logic
  const activeTab = externalTab ?? internalTab;
  const viewMode = activeTab === "generale" ? "media" : activeTab as ViewMode;
  
  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab as ViewMode);
    }
  };

  const filteredResults = useMemo(() => {
    if (selectedUniversities.length === 0) return results;
    return results.filter((r) => selectedUniversities.includes(r.universita.nome));
  }, [results, selectedUniversities]);

  const filteredAggregates = useMemo(() => {
    if (selectedUniversities.length === 0) return studentAggregates;
    return studentAggregates.filter((s) => selectedUniversities.includes(s.universita));
  }, [studentAggregates, selectedUniversities]);

  const chartData = useMemo(() => {
    // Create data for each integer score from -3 to 31
    const scores = Array.from({ length: 35 }, (_, i) => i - 3);
    
    return scores.map((score) => {
      const data: any = { score: score.toString() };
      
      if (viewMode === "fisica") {
        data.count = filteredResults.filter(
          (r) => r.materia === "fisica" && Math.round(parseFloat(r.punteggio)) === score
        ).length;
      } else if (viewMode === "chimica") {
        data.count = filteredResults.filter(
          (r) => r.materia === "chimica" && Math.round(parseFloat(r.punteggio)) === score
        ).length;
      } else if (viewMode === "biologia") {
        data.count = filteredResults.filter(
          (r) => r.materia === "biologia" && Math.round(parseFloat(r.punteggio)) === score
        ).length;
      } else if (viewMode === "media") {
        data.count = filteredAggregates.filter(
          (s) => s.media !== undefined && Math.round(s.media) === score
        ).length;
      }
      
      return data;
    });
  }, [filteredResults, filteredAggregates, viewMode]);

  const getBarColor = () => {
    switch (viewMode) {
      case "fisica": return "hsl(210 100% 50%)";
      case "chimica": return "hsl(142 76% 36%)";
      case "biologia": return "hsl(38 92% 50%)";
      case "media": return "hsl(280 80% 50%)";
      default: return "hsl(var(--primary))";
    }
  };

  const getLabel = () => {
    switch (viewMode) {
      case "fisica": return "Fisica";
      case "chimica": return "Chimica";
      case "biologia": return "Biologia";
      case "media": return "Media studenti";
      default: return "";
    }
  };

  return (
    <div className="rounded-xl border border-border p-6 bg-card shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold">Distribuzione punteggi</h3>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="generale" className="text-[11px] sm:text-sm px-1 sm:px-3">
              Generale
            </TabsTrigger>
            <TabsTrigger value="fisica" className="text-[11px] sm:text-sm px-1 sm:px-3">
              Fisica
            </TabsTrigger>
            <TabsTrigger value="chimica" className="text-[11px] sm:text-sm px-1 sm:px-3">
              Chimica
            </TabsTrigger>
            <TabsTrigger value="biologia" className="text-[11px] sm:text-sm px-1 sm:px-3">
              Biologia
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="score"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              interval={2}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "var(--shadow-card)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              labelFormatter={(value) => `Punteggio: ${value}`}
              formatter={(value: number) => [value, getLabel()]}
            />
            <Bar
              dataKey="count"
              name={getLabel()}
              fill={getBarColor()}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-xs text-muted-foreground text-center mt-2">
        {viewMode === "media" 
          ? "Distribuzione della media dei punteggi per studente"
          : `Distribuzione dei punteggi di ${getLabel()}`
        }
      </p>
    </div>
  );
};
