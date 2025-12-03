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
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { SubjectBadge } from "./SubjectBadge";
import { formatUniversityName } from "@/lib/formatters";

interface UniversityTableProps {
  universities: UniversityStats[];
  studentAggregates: StudentAggregate[];
  limit?: number;
}

type SortKey = "nome" | "totalStudents" | "avgScore" | "idonei" | "potenzIdonei" | "uniqueStudents";
type SortDir = "asc" | "desc";

// Mobile card for university
const UniversityCard = ({ uni }: { uni: any }) => (
  <div className="p-4 rounded-lg border border-border bg-card/50 space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{formatUniversityName(uni.nome)}</h4>
        <p className="text-xs text-muted-foreground">{uni.regione}</p>
      </div>
      <div className="flex gap-1">
        <SubjectBadge subject="F" active={uni.hasFisica} />
        <SubjectBadge subject="C" active={uni.hasChimica} />
        <SubjectBadge subject="B" active={uni.hasBiologia} />
      </div>
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
            <span className="text-muted-foreground">Potenziali:</span>
            <Badge className="bg-warning/20 text-warning border-0 font-mono text-xs">{uni.potenzIdonei}</Badge>
          </div>
        </div>
      </div>
  </div>
);

export const UniversityTable = ({ universities, studentAggregates, limit }: UniversityTableProps) => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("avgScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Calculate students stats per university
  const universityData = useMemo(() => {
    return universities.map((uni) => {
      const students = studentAggregates.filter((s) => s.universita === uni.nome);
      const idonei = students.filter((s) => s.fullyQualified).length;
      const potenzIdonei = students.filter((s) => s.allPassed && !s.fullyQualified).length;
      const nonIdonei = students.filter((s) => !s.allPassed).length;
      const uniqueStudents = students.length;

      return {
        ...uni,
        uniqueStudents,
        idonei,
        potenzIdonei,
        nonIdonei,
      };
    });
  }, [universities, studentAggregates]);

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
          <UniversityCard key={uni.id} uni={uni} />
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
                <TableHead className="text-center">Materie</TableHead>
                <TableHead className="text-right">
                  <SortButton column="uniqueStudents" label="Studenti" />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton column="avgScore" label="Media" />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton column="idonei" label="Idonei" />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton column="potenzIdonei" label="Potenziali" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((uni) => (
                <TableRow key={uni.id} className="hover:bg-secondary/20">
                  <TableCell className="font-medium">
                    {formatUniversityName(uni.nome)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {uni.regione}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <SubjectBadge subject="F" active={uni.hasFisica} />
                      <SubjectBadge subject="C" active={uni.hasChimica} />
                      <SubjectBadge subject="B" active={uni.hasBiologia} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {uni.uniqueStudents.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {uni.avgScore.toFixed(2)}
                  </TableCell>
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
