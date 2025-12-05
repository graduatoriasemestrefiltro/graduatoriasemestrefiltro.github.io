import { useMemo } from "react";
import { StudentAggregate } from "@/types/results";
import { universityEnrollments, UniversityEnrollmentData } from "@/data/universityEnrollments";

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
    .replace(/ALMA MATER STUDIORUM -?\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const useEnrollments = () => {
  // Get enrollment count (iscrittiAppello) by university name
  const getEnrollment = useMemo(() => (universityName: string): number | null => {
    const normalizedSearch = normalizeUniName(universityName);
    
    // Try to find by normalized name match
    for (const uni of universityEnrollments) {
      const normalizedUniName = normalizeUniName(uni.nome);
      if (normalizedUniName === normalizedSearch || 
          normalizedSearch.includes(normalizedUniName) || 
          normalizedUniName.includes(normalizedSearch)) {
        return uni.iscrittiAppello;
      }
    }
    
    // Try partial match on key identifying words
    const commonCityWords = ["MILANO", "NAPOLI", "ROMA", "TORINO", "FIRENZE", "BOLOGNA", "PALERMO", "CATANIA", "GENOVA"];
    const searchWords = normalizedSearch.split(" ").filter(w => w.length > 4 && !commonCityWords.includes(w));
    
    for (const uni of universityEnrollments) {
      const normalizedUniName = normalizeUniName(uni.nome);
      const uniWords = normalizedUniName.split(" ").filter(w => w.length > 4 && !commonCityWords.includes(w));
      
      for (const searchWord of searchWords) {
        for (const uniWord of uniWords) {
          if (searchWord === uniWord) {
            return uni.iscrittiAppello;
          }
        }
      }
    }
    
    return null;
  }, []);

  // Get total enrollment across all universities (returns null if no data)
  const getTotalEnrollment = useMemo(() => (): number | null => {
    const total = universityEnrollments.reduce((sum, uni) => sum + (uni.iscrittiAppello || 0), 0);
    return total > 0 ? total : null;
  }, []);

  // Get full enrollment data by university ID
  const getEnrollmentById = useMemo(() => (id: string): UniversityEnrollmentData | undefined => {
    return universityEnrollments.find(u => u.id === id);
  }, []);

  // Get total available spots across all universities
  const getTotalSpots = useMemo(() => (): number => {
    return universityEnrollments.reduce((sum, uni) => sum + (uni.postiDisponibili || 0), 0);
  }, []);

  // Get available spots (postiDisponibili) by university name
  const getSpots = useMemo(() => (universityName: string): number | null => {
    const normalizedSearch = normalizeUniName(universityName);
    
    // Try to find by normalized name match
    for (const uni of universityEnrollments) {
      const normalizedUniName = normalizeUniName(uni.nome);
      if (normalizedUniName === normalizedSearch || 
          normalizedSearch.includes(normalizedUniName) || 
          normalizedUniName.includes(normalizedSearch)) {
        return uni.postiDisponibili;
      }
    }
    
    // Try partial match on key identifying words
    const commonCityWords = ["MILANO", "NAPOLI", "ROMA", "TORINO", "FIRENZE", "BOLOGNA", "PALERMO", "CATANIA", "GENOVA"];
    const searchWords = normalizedSearch.split(" ").filter(w => w.length > 4 && !commonCityWords.includes(w));
    
    for (const uni of universityEnrollments) {
      const normalizedUniName = normalizeUniName(uni.nome);
      const uniWords = normalizedUniName.split(" ").filter(w => w.length > 4 && !commonCityWords.includes(w));
      
      for (const searchWord of searchWords) {
        for (const uniWord of uniWords) {
          if (searchWord === uniWord) {
            return uni.postiDisponibili;
          }
        }
      }
    }
    
    return null;
  }, []);

  return { 
    enrollments: universityEnrollments, 
    loading: false, 
    getEnrollment, 
    getTotalEnrollment,
    getEnrollmentById,
    getTotalSpots,
    getSpots,
  };
};

export type ProjectionMethod = "per-university" | "national";

// Calculate estimated totals based on coverage
export const calculateEstimatedTotals = (
  studentAggregates: StudentAggregate[],
  getEnrollment: (name: string) => number | null,
  getTotalEnrollment: () => number | null,
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

  // If no enrollment data available, return actual values without projection
  if (!totalEnrollment || totalEnrollment === 0) {
    return {
      estimatedIdonei: totalActualIdonei,
      estimatedPotenziali: totalActualPotenziali,
      estimatedStudents: totalActualStudents,
      coveredUniversities: Object.keys(byUniversity).length,
    };
  }

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
