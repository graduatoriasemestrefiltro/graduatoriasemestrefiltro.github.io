import { AlertTriangle, Building2, ClipboardList, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CircularProgress } from "./CircularProgress";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatUniversityName } from "@/lib/formatters";

interface CoverageSource {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface CoverageDetailDialogProps {
  universityName: string;
  coverage: number;
  sourcesBreakdown: {
    ministerial: number;
    internal: number;
    unimi: number;
    logica: number;
  };
  totalExams: number;
  expectedExams: number;
  uniqueStudents: number;
  size?: number;
  strokeWidth?: number;
}

export const CoverageDetailDialog = ({
  universityName,
  coverage,
  sourcesBreakdown,
  totalExams,
  expectedExams: expectedExamsRaw,
  uniqueStudents,
  size = 40,
  strokeWidth = 4,
}: CoverageDetailDialogProps) => {
  const { ministerial, internal, unimi, logica } = sourcesBreakdown;
  const expectedExams = Math.round(expectedExamsRaw);
  const expectedStudents = Math.round(expectedExamsRaw / 3);
  
  // Calculate ministerial coverage percentage relative to expected exams
  const ministerialCoveragePercent = expectedExams > 0 ? (ministerial / expectedExams) * 100 : 0;
  const hasHighOfficialCoverage = ministerialCoveragePercent >= 5;
  const useStudentBased = !hasHighOfficialCoverage;
  
  // Scale factor to convert exams to approximate students (proportional)
  const examToStudentRatio = totalExams > 0 ? uniqueStudents / totalExams : 0;
  
  // Base values depending on mode
  const totalCollected = useStudentBased ? uniqueStudents : totalExams;
  const totalExpected = useStudentBased ? expectedStudents : expectedExams;
  const uncovered = Math.max(0, totalExpected - totalCollected);
  
  // Scale source values if using student-based view
  const scaleValue = (examCount: number) => useStudentBased ? Math.round(examCount * examToStudentRatio) : examCount;
  
  // Percentages relative to expected, sorted by percentage descending
  const sources: CoverageSource[] = [
    { name: "Dati ministeriali", value: scaleValue(ministerial), color: "#3b82f6", percentage: totalExpected > 0 ? (scaleValue(ministerial) / totalExpected) * 100 : 0 },
    { name: "Sondaggio interno", value: scaleValue(internal), color: "#a855f7", percentage: totalExpected > 0 ? (scaleValue(internal) / totalExpected) * 100 : 0 },
    { name: "Sondaggio UniMi", value: scaleValue(unimi), color: "#6366f1", percentage: totalExpected > 0 ? (scaleValue(unimi) / totalExpected) * 100 : 0 },
    { name: "Logica Test", value: scaleValue(logica), color: "#10b981", percentage: totalExpected > 0 ? (scaleValue(logica) / totalExpected) * 100 : 0 },
  ].filter(s => s.value > 0).sort((a, b) => b.percentage - a.percentage);

  // Add uncovered slice for pie chart (always at the end)
  const pieData = [
    ...sources,
    { name: "Non coperti", value: uncovered, color: "#e5e7eb", percentage: totalExpected > 0 ? (uncovered / totalExpected) * 100 : 0 },
  ];

  const unitLabel = useStudentBased ? "studenti" : "esami";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button 
          className="hover:opacity-80 transition-opacity cursor-pointer"
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).umami) {
              (window as any).umami.track('coverage_details_opened', { university: universityName });
            }
          }}
        >
          <CircularProgress percentage={coverage} size={size} strokeWidth={strokeWidth} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            Copertura dati - {formatUniversityName(universityName)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{coverage.toFixed(1)}%</div>
            {useStudentBased ? (
              <p className="text-sm text-muted-foreground">
                {uniqueStudents.toLocaleString("it-IT")} studenti su {expectedStudents.toLocaleString("it-IT")} iscritti all'appello
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {totalExams.toLocaleString("it-IT")} esami raccolti su {expectedExams.toLocaleString("it-IT")} attesi
              </p>
            )}
          </div>

          {pieData.length > 1 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={1}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div className="space-y-2">
            {pieData.map((source) => (
              <div key={source.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: source.color }}
                  />
                  <span className="text-muted-foreground">{source.name}</span>
                </div>
                <div className="font-mono">
                  <span className="font-semibold">{source.value.toLocaleString("it-IT")}</span>
                  <span className="text-muted-foreground ml-1">({source.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>

          {hasHighOfficialCoverage && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium mb-1">Possibili sovrapposizioni</p>
                  <p>
                    Questa università ha dati ministeriali parziali (spesso solo una materia). 
                    Potrebbero esserci duplicazioni con i dati da sondaggio, difficili da identificare 
                    perché i codici ministeriali e quelli dei sondaggi non sono confrontabili.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
