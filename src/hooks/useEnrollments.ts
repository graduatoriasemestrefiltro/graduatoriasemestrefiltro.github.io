import { useState, useEffect, useMemo } from "react";
import { StudentAggregate } from "@/types/results";

interface EnrollmentData {
  [universityName: string]: number;
}

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
const SPECIAL_MAPPINGS: Record<string, string[]> = {
  'Roma "Sapienza"': ["SAPIENZA", "ROMA SAPIENZA", "LA SAPIENZA"],
  'Roma "Tor Vergata"': ["TOR VERGATA", "ROMA TOR VERGATA"],
  "Universita' di Catania": ["CATANIA"],
  "Universita' di Bologna": ["BOLOGNA", "ALMA MATER"],
  "Universita' di Genova": ["GENOVA"],
  "Universita' degli Studi di Milano": ["MILANO", "STATALE DI MILANO"],
  "Universita' degli Studi di Palermo": ["PALERMO"],
  "Universita' degli Studi di Napoli Federico II": ["NAPOLI FEDERICO II", "FEDERICO II"],
};

export const useEnrollments = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/university_enrollments.json")
      .then((res) => res.json())
      .then((data) => {
        setEnrollments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load enrollments:", err);
        setLoading(false);
      });
  }, []);

  const getEnrollment = (universityName: string): number | null => {
    // Direct match
    if (enrollments[universityName]) {
      return enrollments[universityName];
    }
    
    const normalizedSearch = normalizeUniName(universityName);
    
    // Check special mappings first
    for (const [enrollmentKey, aliases] of Object.entries(SPECIAL_MAPPINGS)) {
      if (enrollments[enrollmentKey]) {
        for (const alias of aliases) {
          if (normalizedSearch.includes(alias) || alias.includes(normalizedSearch)) {
            return enrollments[enrollmentKey];
          }
        }
      }
    }
    
    // Normalized match
    for (const [key, value] of Object.entries(enrollments)) {
      if (normalizeUniName(key) === normalizedSearch) {
        return value;
      }
    }
    
    // Partial match (more flexible)
    for (const [key, value] of Object.entries(enrollments)) {
      const normalizedKey = normalizeUniName(key);
      // Check if key words match
      const searchWords = normalizedSearch.split(" ").filter(w => w.length > 3);
      const keyWords = normalizedKey.split(" ").filter(w => w.length > 3);
      
      // If main identifying word matches
      for (const searchWord of searchWords) {
        for (const keyWord of keyWords) {
          if (searchWord === keyWord && searchWord.length > 4) {
            return value;
          }
        }
      }
    }
    
    return null;
  };

  const getTotalEnrollment = (): number => {
    return Object.values(enrollments).reduce((sum, val) => sum + val, 0);
  };

  return { enrollments, loading, getEnrollment, getTotalEnrollment };
};

// Calculate estimated totals based on coverage
export const calculateEstimatedTotals = (
  studentAggregates: StudentAggregate[],
  getEnrollment: (name: string) => number | null
) => {
  // Group students by university
  const byUniversity: { [key: string]: StudentAggregate[] } = {};
  studentAggregates.forEach((student) => {
    if (!byUniversity[student.universita]) {
      byUniversity[student.universita] = [];
    }
    byUniversity[student.universita].push(student);
  });

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
