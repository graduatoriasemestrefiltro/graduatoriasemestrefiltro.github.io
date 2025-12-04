import { useState, useMemo } from "react";
import { UniversityStats, StudentAggregate } from "@/types/results";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ClipboardList, HelpCircle } from "lucide-react";
import { SubjectBadge } from "./SubjectBadge";
import { formatUniversityName } from "@/lib/formatters";
import { CONFIG } from "@/lib/config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CircularProgress } from "./CircularProgress";
import { useEnrollments } from "@/hooks/useEnrollments";

const SurveyBadge = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700 border border-purple-200 font-sans w-fit cursor-pointer hover:bg-purple-200 transition-colors">
        <ClipboardList className="h-3 w-3" />
        <span>sondaggio</span>
      </button>
    </DialogTrigger>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-purple-700">
          <ClipboardList className="h-5 w-5" />
          Dati da sondaggio
        </DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        Dati raccolti tramite sondaggio svolto tra gli studenti. Da considerarsi indicativi e non ufficiali.
      </p>
    </DialogContent>
  </Dialog>
);

const MediaIdoneiHelp = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
    </DialogTrigger>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-success">
          <HelpCircle className="h-5 w-5" />
          Media idonei
        </DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        Media calcolata considerando solo gli studenti idonei e potenzialmente idonei, ovvero chi ha ottenuto ≥18 in tutti gli esami sostenuti finora.
      </p>
    </DialogContent>
  </Dialog>
);

interface UniversityTableProps {
  universities: UniversityStats[];
  studentAggregates: StudentAggregate[];
  limit?: number;
  showSubjectAverages?: boolean;
  showPassingOnly?: boolean;
}

type SortKey = "nome" | "totalStudents" | "avgScore" | "avgScoreIdonei" | "idonei" | "potenzIdonei" | "uniqueStudents" | "avgFisica" | "avgChimica" | "avgBiologia" | "coverage";
type SortDir = "asc" | "desc";

// Mobile card for university
const UniversityCard = ({ uni, showSubjectAverages }: { uni: any; showSubjectAverages?: boolean }) => (
  <div className="p-4 rounded-lg border border-border bg-card/50 space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{formatUniversityName(uni.nome)}</h4>
          {uni.coverage !== null && (
            <CircularProgress percentage={uni.coverage} size={32} strokeWidth={3} />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{uni.regione}</p>
        {!CONFIG.DISABLE_SURVEYS_GLOBALLY && uni.isFromSurvey && <div className="mt-2"><SurveyBadge /></div>}
      </div>
      {!CONFIG.HIDE_DATA_LOADING_TRACKER && (
        <div className="flex gap-1">
          <SubjectBadge subject="F" active={uni.hasFisica} />
          <SubjectBadge subject="C" active={uni.hasChimica} />
          <SubjectBadge subject="B" active={uni.hasBiologia} />
        </div>
      )}
    </div>
      <div className="flex gap-4 text-sm">
        <div className="flex-1 space-y-2 pr-3 border-r border-border">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Studenti:</span>
            <span className="font-mono">{uni.uniqueStudents.toLocaleString("it-IT")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Idonei:</span>
            <Badge className="bg-success/20 text-success border-0 font-mono text-xs">{uni.idonei}</Badge>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Media:</span>
            <span className="font-mono font-semibold">{uni.avgScore.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Media idonei:</span>
            <span className="font-mono font-semibold text-success">{uni.avgScoreIdonei > 0 ? uni.avgScoreIdonei.toFixed(2) : "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Potenziali:</span>
            <Badge className="bg-warning/20 text-warning border-0 font-mono text-xs">{uni.potenzIdonei}</Badge>
          </div>
        </div>
      </div>
      {showSubjectAverages && (
        <div className="flex gap-4 text-sm pt-2 border-t border-border">
          <div className="flex-1 flex justify-between">
            <span className="text-muted-foreground">Media F:</span>
            <span className="font-mono text-blue-600">{uni.avgFisica > 0 ? uni.avgFisica.toFixed(2) : "-"}</span>
          </div>
          <div className="flex-1 flex justify-between">
            <span className="text-muted-foreground">Media C:</span>
            <span className="font-mono text-emerald-600">{uni.avgChimica > 0 ? uni.avgChimica.toFixed(2) : "-"}</span>
          </div>
          <div className="flex-1 flex justify-between">
            <span className="text-muted-foreground">Media B:</span>
            <span className="font-mono text-amber-600">{uni.avgBiologia > 0 ? uni.avgBiologia.toFixed(2) : "-"}</span>
          </div>
        </div>
      )}
  </div>
);

export const UniversityTable = ({ universities, studentAggregates, limit, showSubjectAverages = false, showPassingOnly = false }: UniversityTableProps) => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("avgScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const { getEnrollment } = useEnrollments();

  // Calculate students stats per university
  const universityData = useMemo(() => {
    return universities.map((uni) => {
      const students = studentAggregates.filter((s) => s.universita === uni.nome);
      const idonei = students.filter((s) => s.fullyQualified).length;
      const potenzIdonei = students.filter((s) => s.allPassed && !s.fullyQualified).length;
      const nonIdonei = students.filter((s) => !s.allPassed).length;
      const uniqueStudents = students.length;
      
      // Calculate average score for idonei + potenziali only
      const qualifiedStudents = students.filter((s) => s.allPassed);
      const avgScoreIdonei = qualifiedStudents.length > 0 
        ? qualifiedStudents.reduce((sum, s) => sum + (s.media || 0), 0) / qualifiedStudents.length 
        : 0;

      // Calculate average per subject (all students)
      const studentsWithFisica = students.filter((s) => s.fisica !== null && s.fisica !== undefined);
      const studentsWithChimica = students.filter((s) => s.chimica !== null && s.chimica !== undefined);
      const studentsWithBiologia = students.filter((s) => s.biologia !== null && s.biologia !== undefined);
      
      const avgFisicaAll = studentsWithFisica.length > 0 
        ? studentsWithFisica.reduce((sum, s) => sum + (s.fisica || 0), 0) / studentsWithFisica.length 
        : 0;
      const avgChimicaAll = studentsWithChimica.length > 0 
        ? studentsWithChimica.reduce((sum, s) => sum + (s.chimica || 0), 0) / studentsWithChimica.length 
        : 0;
      const avgBiologiaAll = studentsWithBiologia.length > 0 
        ? studentsWithBiologia.reduce((sum, s) => sum + (s.biologia || 0), 0) / studentsWithBiologia.length 
        : 0;

      // Calculate average per subject (only passing scores ≥18)
      const passingFisica = students.filter((s) => s.fisica !== null && s.fisica !== undefined && s.fisica >= 18);
      const passingChimica = students.filter((s) => s.chimica !== null && s.chimica !== undefined && s.chimica >= 18);
      const passingBiologia = students.filter((s) => s.biologia !== null && s.biologia !== undefined && s.biologia >= 18);
      
      const avgFisicaPassing = passingFisica.length > 0 
        ? passingFisica.reduce((sum, s) => sum + (s.fisica || 0), 0) / passingFisica.length 
        : 0;
      const avgChimicaPassing = passingChimica.length > 0 
        ? passingChimica.reduce((sum, s) => sum + (s.chimica || 0), 0) / passingChimica.length 
        : 0;
      const avgBiologiaPassing = passingBiologia.length > 0 
        ? passingBiologia.reduce((sum, s) => sum + (s.biologia || 0), 0) / passingBiologia.length 
        : 0;

      // Calculate coverage percentage based on actual exams collected vs expected
      // Enrollment is average students per exam, so total expected exams = enrollment * 3
      const enrollment = getEnrollment(uni.nome);
      const actualExams = studentsWithFisica.length + studentsWithChimica.length + studentsWithBiologia.length;
      const expectedExams = enrollment ? enrollment * 3 : null;
      const coverage = expectedExams && actualExams > 0 
        ? Math.min((actualExams / expectedExams) * 100, 100) 
        : null;

      return {
        ...uni,
        uniqueStudents,
        idonei,
        potenzIdonei,
        nonIdonei,
        avgScoreIdonei,
        avgFisicaAll,
        avgChimicaAll,
        avgBiologiaAll,
        avgFisicaPassing,
        avgChimicaPassing,
        avgBiologiaPassing,
        // Dynamic values based on toggle
        avgFisica: showPassingOnly ? avgFisicaPassing : avgFisicaAll,
        avgChimica: showPassingOnly ? avgChimicaPassing : avgChimicaAll,
        avgBiologia: showPassingOnly ? avgBiologiaPassing : avgBiologiaAll,
        enrollment,
        coverage,
      };
    });
  }, [universities, studentAggregates, showPassingOnly, getEnrollment]);

  const sortedData = useMemo(() => {
    const filtered = universityData.filter((uni) =>
      uni.nome.toLowerCase().includes(search.toLowerCase()) ||
      uni.regione.toLowerCase().includes(search.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aVal: number | string = a[sortKey];
      let bVal: number | string = b[sortKey];

      if (typeof aVal === "string") {
        return sortDir === "asc" 
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortDir === "asc" ? aVal - (bVal as number) : (bVal as number) - aVal;
    });
  }, [universityData, search, sortKey, sortDir]);

  const displayData = limit ? sortedData.slice(0, limit) : sortedData;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortButton = ({ column, label }: { column: SortKey; label: string }) => {
    const isActive = sortKey === column;
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 px-2 -ml-2 font-medium ${isActive ? "text-primary" : ""}`}
        onClick={() => toggleSort(column)}
      >
        {label}
        {isActive ? (
          sortDir === "desc" ? (
            <ArrowDown className="ml-1 h-3 w-3 text-primary" />
          ) : (
            <ArrowUp className="ml-1 h-3 w-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-4">
      {!limit && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca università o regione..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-border"
          />
        </div>
      )}

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3 pr-2">
        {displayData.map((uni) => (
          <UniversityCard key={uni.id} uni={uni} showSubjectAverages={showSubjectAverages} />
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead className="w-[280px]">
                  <SortButton column="nome" label="Università" />
                </TableHead>
                <TableHead>Regione</TableHead>
                {!CONFIG.HIDE_DATA_LOADING_TRACKER && (
                  <TableHead className="text-center">Materie</TableHead>
                )}
                <TableHead className="text-right">
                  <SortButton column="uniqueStudents" label="Studenti" />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton column="avgScore" label="Media" />
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <SortButton column="avgScoreIdonei" label="Media idonei" />
                    <MediaIdoneiHelp />
                  </div>
                </TableHead>
                {showSubjectAverages && (
                  <>
                    <TableHead className="text-right">
                      <SortButton column="avgFisica" label="Media fisica" />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton column="avgChimica" label="Media chimica" />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton column="avgBiologia" label="Media biologia" />
                    </TableHead>
                  </>
                )}
                <TableHead className="text-right">
                  <SortButton column="idonei" label="Idonei" />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton column="potenzIdonei" label="Potenziali" />
                </TableHead>
                <TableHead className="text-center">
                  <SortButton column="coverage" label="Copertura" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((uni) => (
                <TableRow key={uni.id} className="hover:bg-secondary/20">
                  <TableCell className="font-medium">
                    <div>
                      {formatUniversityName(uni.nome)}
                      {!CONFIG.DISABLE_SURVEYS_GLOBALLY && uni.isFromSurvey && <div className="mt-1"><SurveyBadge /></div>}
                    </div>
                  </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {uni.regione}
                    </TableCell>
                    {!CONFIG.HIDE_DATA_LOADING_TRACKER && (
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <SubjectBadge subject="F" active={uni.hasFisica} />
                          <SubjectBadge subject="C" active={uni.hasChimica} />
                          <SubjectBadge subject="B" active={uni.hasBiologia} />
                        </div>
                      </TableCell>
                    )}
                  <TableCell className="text-right font-mono">
                    {uni.uniqueStudents.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {uni.avgScore.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-success">
                    {uni.avgScoreIdonei > 0 ? uni.avgScoreIdonei.toFixed(2) : "-"}
                  </TableCell>
                  {showSubjectAverages && (
                    <>
                      <TableCell className="text-right font-mono text-blue-600">
                        {uni.avgFisica > 0 ? uni.avgFisica.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600">
                        {uni.avgChimica > 0 ? uni.avgChimica.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-amber-600">
                        {uni.avgBiologia > 0 ? uni.avgBiologia.toFixed(2) : "-"}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-right">
                    <Badge className="bg-success/20 text-success border-0 font-mono">
                      {uni.idonei}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-warning/20 text-warning border-0 font-mono">
                      {uni.potenzIdonei}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {uni.coverage !== null ? (
                      <div className="flex justify-center">
                        <CircularProgress percentage={uni.coverage} size={40} strokeWidth={4} />
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {displayData.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          Nessuna università trovata
        </p>
      )}
    </div>
  );
};
