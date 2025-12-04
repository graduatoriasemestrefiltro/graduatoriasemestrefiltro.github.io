import { useMemo } from "react";
import { StudentAggregate } from "@/types/results";
import { universityEnrollments } from "@/data/universityEnrollments";

// Normalize university name for matching
const normalizeUniName = (name: string): string => {
  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/['"\\]/g, "") // Remove quotes and backslashes
    .replace(/UNIVERSITA DEGLI STUDI (DI |DEL |DELLA |DELL)?/g, "")
    .replace(/UNIVERSITA (DI |DEL |DELLA |DELL)?/g, "")
    .replace(/UNIVERSITA'/g, "")
    .replace(/UNIVERSITÀ/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Special mappings for universities with unusual naming in enrollment data
// Format: enrollmentKey -> { aliases: string[], excludeIf: string[] }
const SPECIAL_MAPPINGS: Record<string, { aliases: string[], excludeIf?: string[] }> = {
  'Roma "Sapienza"': { 
    aliases: ["SAPIENZA", "ROMA SAPIENZA", "LA SAPIENZA"],
    excludeIf: ["TOR VERGATA"]
  },
  'Roma "Tor Vergata"': { 
    aliases: ["TOR VERGATA", "ROMA TOR VERGATA"] 
  },
  "Universita' di Catania": { 
    aliases: ["CATANIA"] 
  },
  "Universita' di Bologna": { 
    aliases: ["BOLOGNA", "ALMA MATER"] 
  },
  "Universita' di Genova": { 
    aliases: ["GENOVA"] 
  },
  "Universita' degli Studi di Milano": { 
    aliases: ["STATALE MILANO", "STATALE DI MILANO"],
    excludeIf: ["BICOCCA", "POLITECNICO"]  // Don't match Milano-Bicocca or Politecnico
  },
  "UNIVERSITA' DEGLI STUDI DI MILANO-BICOCCA": {
    aliases: ["BICOCCA", "MILANO-BICOCCA", "MILANO BICOCCA"]
  },
  "Universita' degli Studi di Palermo": { 
    aliases: ["PALERMO"] 
  },
  "Universita' degli Studi di Napoli Federico II": { 
    aliases: ["NAPOLI FEDERICO II", "FEDERICO II"],
    excludeIf: ["PARTHENOPE", "VANVITELLI", "CAMPANIA"]
  },
  "UNIVERSITA' DEGLI STUDI DI NAPOLI PARTHENOPE": {
    aliases: ["PARTHENOPE", "NAPOLI PARTHENOPE"]
  },
  "UNIVERSITA' DEGLI STUDI DELLA CAMPANIA \"LUIGI VANVITELLI\"": {
    aliases: ["VANVITELLI", "CAMPANIA VANVITELLI", "LUIGI VANVITELLI"]
  },
};

export const useEnrollments = () => {
  const getEnrollment = useMemo(() => (universityName: string): number | null => {
    // Direct match
    if (universityEnrollments[universityName]) {
      return universityEnrollments[universityName];
    }
    
    const normalizedSearch = normalizeUniName(universityName);
    
    // Check special mappings first (with exclusions)
    for (const [enrollmentKey, config] of Object.entries(SPECIAL_MAPPINGS)) {
      if (universityEnrollments[enrollmentKey]) {
        // Check if any exclusion term is present
        const hasExclusion = config.excludeIf?.some(excl => 
          normalizedSearch.includes(excl)
        );
        
        if (!hasExclusion) {
          for (const alias of config.aliases) {
            if (normalizedSearch.includes(alias) || alias === normalizedSearch) {
              return universityEnrollments[enrollmentKey];
            }
          }
        }
      }
    }
    
    // Exact normalized match
    for (const [key, value] of Object.entries(universityEnrollments)) {
      if (normalizeUniName(key) === normalizedSearch) {
        return value;
      }
    }
    
    // Strict partial match - only if a unique identifying word matches
    // and it's not a common word like "MILANO", "NAPOLI", "ROMA"
    const commonCityWords = ["MILANO", "NAPOLI", "ROMA", "TORINO", "FIRENZE", "BOLOGNA", "PALERMO", "CATANIA", "GENOVA"];
    
    for (const [key, value] of Object.entries(universityEnrollments)) {
      const normalizedKey = normalizeUniName(key);
      const searchWords = normalizedSearch.split(" ").filter(w => w.length > 4 && !commonCityWords.includes(w));
      const keyWords = normalizedKey.split(" ").filter(w => w.length > 4 && !commonCityWords.includes(w));
      
      // Match on unique identifying words (not city names)
      for (const searchWord of searchWords) {
        for (const keyWord of keyWords) {
          if (searchWord === keyWord) {
            return value;
          }
        }
      }
    }
    
    return null;
  }, []);

  const getTotalEnrollment = useMemo(() => (): number => {
    return Object.values(universityEnrollments).reduce((sum, val) => sum + val, 0);
  }, []);

  return { enrollments: universityEnrollments, loading: false, getEnrollment, getTotalEnrollment };
};

export type ProjectionMethod = "per-university" | "national";

// Calculate estimated totals based on coverage
export const calculateEstimatedTotals = (
  studentAggregates: StudentAggregate[],
  getEnrollment: (name: string) => number | null,
  getTotalEnrollment: () => number,
  method: ProjectionMethod = "per-university"
) => {
  // Group students by university
  const byUniversity: { [key: string]: StudentAggregate[] } = {};
  studentAggregates.forEach((student) => {
    if (!byUniversity[student.universita]) {
      byUniversity[student.universita] = [];
    }
    byUniversity[student.universita].push(student);
  });

  const totalEnrollment = getTotalEnrollment();
  const totalActualStudents = studentAggregates.length;
  const totalActualIdonei = studentAggregates.filter((s) => s.fullyQualified).length;
  const totalActualPotenziali = studentAggregates.filter((s) => s.allPassed && !s.fullyQualified).length;

  if (method === "national") {
    // National projection: assume all non-respondents nationally have the same rates
    if (totalActualStudents === 0) {
      return { estimatedIdonei: 0, estimatedPotenziali: 0, estimatedStudents: 0, coveredUniversities: 0 };
    }
    const nationalRatioIdonei = totalActualIdonei / totalActualStudents;
    const nationalRatioPotenziali = totalActualPotenziali / totalActualStudents;
    
    return {
      estimatedIdonei: Math.round(totalEnrollment * nationalRatioIdonei),
      estimatedPotenziali: Math.round(totalEnrollment * nationalRatioPotenziali),
      estimatedStudents: totalEnrollment,
      coveredUniversities: Object.keys(byUniversity).length,
    };
  }

  // Per-university projection (original method)
  let estimatedIdonei = 0;
  let estimatedPotenziali = 0;
  let estimatedStudents = 0;
  let coveredUniversities = 0;

  for (const [uni, students] of Object.entries(byUniversity)) {
    const enrollment = getEnrollment(uni);
    const actualStudents = students.length;
    const actualIdonei = students.filter((s) => s.fullyQualified).length;
    const actualPotenziali = students.filter((s) => s.allPassed && !s.fullyQualified).length;

    if (enrollment && actualStudents > 0) {
      // Extrapolate based on coverage ratio
      const ratio = enrollment / actualStudents;
      estimatedIdonei += Math.round(actualIdonei * ratio);
      estimatedPotenziali += Math.round(actualPotenziali * ratio);
      estimatedStudents += Math.round(enrollment);
      coveredUniversities++;
    } else {
      // No enrollment data, use actual values
      estimatedIdonei += actualIdonei;
      estimatedPotenziali += actualPotenziali;
      estimatedStudents += actualStudents;
    }
  }

  return {
    estimatedIdonei,
    estimatedPotenziali,
    estimatedStudents,
    coveredUniversities,
  };
};
