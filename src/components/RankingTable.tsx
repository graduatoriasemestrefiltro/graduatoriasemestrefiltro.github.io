import { useMemo, useState } from "react";
import { Result, StudentAggregate } from "@/types/results";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Trophy, Medal, Award, ChevronLeft, ChevronRight, ClipboardList, Filter, HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatUniversityName } from "@/lib/formatters";
import { CONFIG } from "@/lib/config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const getSurveySource = (etichetta?: string) => {
  if (!etichetta) return null;
  if (etichetta.startsWith("UNIMI-")) {
    return "dati raccolti tramite sondaggio condotto interamente dai rappresentanti degli studenti dell'Università degli Studi di Milano (UniMi).";
  }
  if (etichetta.startsWith("SRV-")) {
    return "dati raccolti tramite il sondaggio condotto direttamente su questo sito.";
  }
  if (etichetta.startsWith("LOGI-")) {
    return "dati provenienti dal sondaggio di Logica Test.";
  }
  return null;
};

const SurveyBadge = ({ etichetta }: { etichetta?: string }) => {
  const sourceInfo = getSurveySource(etichetta);
  
  return (
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
        {sourceInfo && (
          <p className="text-sm text-muted-foreground border-t pt-3 mt-2">
            <strong>Fonte:</strong> {sourceInfo}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

const ITEMS_PER_PAGE = 50;

interface RankingTableProps {
  results: Result[];
  studentAggregates: StudentAggregate[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  selectedUniversities?: string[];
}

const PositionBadge = ({ position }: { position: number }) => {
  if (position === 1) {
    return <Trophy className="h-5 w-5 text-yellow-500" />;
  }
  if (position === 2) {
    return <Medal className="h-5 w-5 text-gray-400" />;
  }
  if (position === 3) {
    return <Award className="h-5 w-5 text-amber-600" />;
  }
  return <span className="font-mono text-muted-foreground">#{position}</span>;
};

// Pagination component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems,
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
  
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <span className="text-xs text-muted-foreground">
        {start}-{end} di {totalItems.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm px-2">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Mobile card for general ranking
const GeneralRankingCard = ({ student, position }: { student: any; position: number }) => (
  <div className="p-4 rounded-lg border border-border bg-card/50 space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <PositionBadge position={position} />
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs">{student.etichetta}</span>
          {!CONFIG.DISABLE_SURVEYS_GLOBALLY && student.isFromSurvey && <SurveyBadge etichetta={student.etichetta} />}
        </div>
      </div>
      {student.fullyQualified ? (
        <Badge className="bg-success/20 text-success border-success/30 text-xs">Idoneo</Badge>
      ) : student.allPassed ? (
        <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">Parziale</Badge>
      ) : (
        <Badge variant="outline" className="text-xs">Non idoneo</Badge>
      )}
    </div>
    <p className="text-xs text-muted-foreground truncate">{formatUniversityName(student.universita)}</p>
    <div className="flex items-center justify-between text-sm pt-1 border-t border-border/30">
      <span className="text-muted-foreground">Media:</span>
      <span className="font-mono font-bold">{student.media?.toFixed(2)}</span>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Totale:</span>
      <span className="font-mono">{((student.fisica || 0) + (student.chimica || 0) + (student.biologia || 0)).toFixed(2)}</span>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div className="text-center p-1.5 rounded bg-secondary/50">
        <p className="text-muted-foreground">Fisica</p>
        <p className="font-mono">{student.fisica?.toFixed(2) || "-"}</p>
      </div>
      <div className="text-center p-1.5 rounded bg-secondary/50">
        <p className="text-muted-foreground">Chimica</p>
        <p className="font-mono">{student.chimica?.toFixed(2) || "-"}</p>
      </div>
      <div className="text-center p-1.5 rounded bg-secondary/50">
        <p className="text-muted-foreground">Biologia</p>
        <p className="font-mono">{student.biologia?.toFixed(2) || "-"}</p>
      </div>
    </div>
  </div>
);

// Mobile card for subject ranking
const SubjectRankingCard = ({ result, position }: { result: Result; position: number }) => (
  <div className="p-4 rounded-lg border border-border bg-card/50 space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <PositionBadge position={position} />
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs">{result.etichetta}</span>
          {!CONFIG.DISABLE_SURVEYS_GLOBALLY && result.is_from_survey && <SurveyBadge etichetta={result.etichetta} />}
        </div>
      </div>
      <span className="font-mono font-bold">{parseFloat(result.punteggio).toFixed(2)}</span>
    </div>
    <p className="text-xs text-muted-foreground truncate">{formatUniversityName(result.universita.nome)}</p>
  </div>
);

export const RankingTable = ({ results, studentAggregates, activeTab: externalTab, onTabChange, selectedUniversities = [] }: RankingTableProps) => {
  const [search, setSearch] = useState("");
  const [internalTab, setInternalTab] = useState("generale");
  const [generalPage, setGeneralPage] = useState(1);
  const [onlyCompleteExams, setOnlyCompleteExams] = useState(false);
  const [subjectPages, setSubjectPages] = useState<Record<string, number>>({
    fisica: 1,
    chimica: 1,
    biologia: 1,
  });
  
  const activeTab = externalTab ?? internalTab;
  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track('ranking_tab_changed', { tab });
    }
  };

  const filterResults = (items: any[], searchTerm: string) => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.etichetta?.toLowerCase().includes(term) ||
        item.universita?.toLowerCase?.().includes(term) ||
        (item.universita?.nome && item.universita.nome.toLowerCase().includes(term))
    );
  };

  const generalRanking = useMemo(() => {
    let filtered = [...studentAggregates].filter((s) => s.media !== undefined);
    if (onlyCompleteExams) {
      filtered = filtered.filter((s) => s.completedExams === 3);
    }
    if (selectedUniversities.length > 0) {
      filtered = filtered.filter((s) => selectedUniversities.includes(s.universita));
    }
    return filtered
      .sort((a, b) => (b.media || 0) - (a.media || 0))
      .map((s, i) => ({ ...s, posizione: i + 1 }));
  }, [studentAggregates, onlyCompleteExams, selectedUniversities]);

  const subjectRankings = useMemo(() => {
    const subjects = ["fisica", "chimica", "biologia"] as const;
    return subjects.reduce((acc, subject) => {
      let filtered = results.filter((r) => r.materia === subject);
      if (selectedUniversities.length > 0) {
        filtered = filtered.filter((r) => selectedUniversities.includes(r.universita.nome));
      }
      acc[subject] = filtered
        .sort((a, b) => parseFloat(b.punteggio) - parseFloat(a.punteggio))
        .map((s, i) => ({ ...s, posizione: i + 1 }));
      return acc;
    }, {} as Record<string, Result[]>);
  }, [results, selectedUniversities]);

  const filteredGeneralRanking = filterResults(generalRanking, search);
  const generalTotalPages = Math.ceil(filteredGeneralRanking.length / ITEMS_PER_PAGE);
  const paginatedGeneralRanking = filteredGeneralRanking.slice(
    (generalPage - 1) * ITEMS_PER_PAGE,
    generalPage * ITEMS_PER_PAGE
  );

  // Reset page when search or filter changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setGeneralPage(1);
    setSubjectPages({ fisica: 1, chimica: 1, biologia: 1 });
  };

  const handleCompleteExamsToggle = (checked: boolean) => {
    setOnlyCompleteExams(checked);
    setGeneralPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per etichetta o università..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 w-full sm:w-[300px] bg-secondary/50 border-border"
          />
        </div>
        {activeTab === "generale" && (
          <div className="flex items-center gap-2">
            <Switch
              id="complete-exams"
              checked={onlyCompleteExams}
              onCheckedChange={handleCompleteExamsToggle}
            />
            <Label htmlFor="complete-exams" className="text-sm text-muted-foreground cursor-pointer">
              tutti gli esami svolti
            </Label>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Filtro "tutti gli esami svolti"</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Quando attivo, questo filtro mostra solo gli studenti che hanno completato tutte e tre le prove (Fisica, Chimica e Biologia). 
                  Gli studenti che hanno sostenuto solo una o due prove vengono esclusi dalla graduatoria generale.
                </p>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 w-full mb-4">
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

        <TabsContent value="generale">
          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {paginatedGeneralRanking.map((student) => (
              <GeneralRankingCard key={student.etichetta} student={student} position={student.posizione} />
            ))}
          </div>
          
          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 sticky top-0 bg-card">#</TableHead>
                  <TableHead className="min-w-[180px] sticky top-0 bg-card">Etichetta</TableHead>
                  <TableHead className="sticky top-0 bg-card">Università</TableHead>
                  <TableHead className="text-right sticky top-0 bg-card">Fisica</TableHead>
                  <TableHead className="text-right sticky top-0 bg-card">Chimica</TableHead>
                  <TableHead className="text-right sticky top-0 bg-card">Biologia</TableHead>
                  <TableHead className="text-right sticky top-0 bg-card">Media</TableHead>
                  <TableHead className="text-right sticky top-0 bg-card">Totale</TableHead>
                  <TableHead className="text-center sticky top-0 bg-card">Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGeneralRanking.map((student) => (
                  <TableRow key={student.etichetta}>
                    <TableCell>
                      <PositionBadge position={student.posizione} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex flex-col gap-1">
                        <span>{student.etichetta}</span>
                        {!CONFIG.DISABLE_SURVEYS_GLOBALLY && student.isFromSurvey && <SurveyBadge etichetta={student.etichetta} />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {formatUniversityName(student.universita)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {student.fisica?.toFixed(2) || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {student.chimica?.toFixed(2) || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {student.biologia?.toFixed(2) || "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold font-mono">
                      {student.media?.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold font-mono">
                      {((student.fisica || 0) + (student.chimica || 0) + (student.biologia || 0)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {student.fullyQualified ? (
                        <Badge className="bg-success/20 text-success border-success/30 text-xs">
                          Idoneo
                        </Badge>
                      ) : student.allPassed ? (
                        <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
                          Parziale
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Non idoneo
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {generalTotalPages > 1 && (
            <Pagination
              currentPage={generalPage}
              totalPages={generalTotalPages}
              totalItems={filteredGeneralRanking.length}
              onPageChange={setGeneralPage}
            />
          )}
        </TabsContent>

        {["fisica", "chimica", "biologia"].map((subject) => {
          const filteredSubject = filterResults(subjectRankings[subject] || [], search);
          const totalPages = Math.ceil(filteredSubject.length / ITEMS_PER_PAGE);
          const currentPage = subjectPages[subject];
          const paginatedSubject = filteredSubject.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
          );
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          
          return (
            <TabsContent key={subject} value={subject}>
              {/* Mobile: Cards */}
              <div className="md:hidden space-y-3">
                {paginatedSubject.map((result, index) => (
                  <SubjectRankingCard 
                    key={`${result.etichetta}-${result.materia}`} 
                    result={result} 
                    position={startIndex + index + 1} 
                  />
                ))}
              </div>
              
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 sticky top-0 bg-card">#</TableHead>
                      <TableHead className="min-w-[180px] sticky top-0 bg-card">Etichetta</TableHead>
                      <TableHead className="sticky top-0 bg-card">Università</TableHead>
                      <TableHead className="text-right sticky top-0 bg-card">Punteggio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubject.map((result, index) => (
                      <TableRow key={`${result.etichetta}-${result.materia}`}>
                        <TableCell>
                          <PositionBadge position={startIndex + index + 1} />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <div className="flex flex-col gap-1">
                            <span>{result.etichetta}</span>
                            {!CONFIG.DISABLE_SURVEYS_GLOBALLY && result.is_from_survey && <SurveyBadge etichetta={result.etichetta} />}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {formatUniversityName(result.universita.nome)}
                        </TableCell>
                        <TableCell className="text-right font-bold font-mono">
                          {parseFloat(result.punteggio).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredSubject.length}
                  onPageChange={(page) => setSubjectPages(prev => ({ ...prev, [subject]: page }))}
                />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
