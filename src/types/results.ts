export interface Result {
  posizione: number;
  etichetta: string;
  punteggio: string;
  materia: "fisica" | "chimica" | "biologia";
  universita: {
    nome: string;
    id: string;
  };
}

export interface StudentAggregate {
  etichetta: string;
  fisica?: number;
  chimica?: number;
  biologia?: number;
  media?: number;
  completedExams: number;
  allPassed: boolean; // ≥18 in all completed
  fullyQualified: boolean; // ≥18 in all 3
  universita: string;
}

export interface UniversityStats {
  id: string;
  nome: string;
  regione: string;
  hasChimica: boolean;
  hasFisica: boolean;
  hasBiologia: boolean;
  totalStudents: number;
  avgScore: number;
  studentsChimica: number;
  studentsFisica: number;
  studentsBiologia: number;
}

export interface RegionStats {
  nome: string;
  universities: number;
  studentsCount: number;
  avgScore: number;
  fullyQualified: number;
  potentiallyQualified: number;
}
