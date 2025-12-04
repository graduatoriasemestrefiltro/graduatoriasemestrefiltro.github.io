import { useCallback } from "react";
import { universityMappings, UniversityMapping } from "@/data/universityIds";

// Normalize for comparison
const normalizeForComparison = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const useUniversityIds = () => {
  const getIdByName = useCallback((name: string): string | null => {
    const normalized = normalizeForComparison(name);
    const found = universityMappings.find(m => normalizeForComparison(m.name) === normalized);
    return found?.id ?? null;
  }, []);

  const getNameById = useCallback((id: string): string | null => {
    const found = universityMappings.find(m => m.id === id);
    return found?.name ?? null;
  }, []);

  // Find by partial match (for cases where names differ slightly)
  const findUniversityByPartialMatch = useCallback((searchName: string): UniversityMapping | null => {
    const normalized = normalizeForComparison(searchName);
    
    // Try exact match first
    let found = universityMappings.find(m => normalizeForComparison(m.name) === normalized);
    if (found) return found;
    
    // Try partial match - check if one contains the other
    found = universityMappings.find(m => {
      const mappingNorm = normalizeForComparison(m.name);
      return mappingNorm.includes(normalized) || normalized.includes(mappingNorm);
    });
    
    return found ?? null;
  }, []);

  return {
    mappings: universityMappings,
    loading: false, // No longer loading since it's a direct import
    getIdByName,
    getNameById,
    findUniversityByPartialMatch,
  };
};
