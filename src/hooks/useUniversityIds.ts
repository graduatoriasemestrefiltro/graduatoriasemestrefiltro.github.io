import { useCallback } from "react";
import { universityMappings, UniversityMapping } from "@/data/universityIds";

// Normalize for comparison - removes accents, quotes, and normalizes spacing
const normalizeForComparison = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents (à -> a, è -> e, etc.)
    .replace(/['"'`]/g, "") // Remove various quote characters
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

  // Find by partial match using keywords with exclusion support
  const findUniversityByPartialMatch = useCallback((searchName: string): UniversityMapping | null => {
    const normalized = normalizeForComparison(searchName);
    
    // Try exact match first
    let found = universityMappings.find(m => normalizeForComparison(m.name) === normalized);
    if (found) return found;
    
    // Try keyword match with exclusion logic
    // First pass: try to find universities with specific keywords (those with excludeKeywords defined)
    // This ensures more specific matches are tried before generic ones
    const specificMappings = universityMappings.filter(m => m.excludeKeywords && m.excludeKeywords.length > 0);
    const genericMappings = universityMappings.filter(m => !m.excludeKeywords || m.excludeKeywords.length === 0);
    
    // Check specific mappings first (with exclusions)
    for (const mapping of [...genericMappings, ...specificMappings]) {
      // Check if any exclude keyword is present
      const hasExclusion = mapping.excludeKeywords?.some(excl => 
        normalized.includes(normalizeForComparison(excl))
      );
      
      if (hasExclusion) continue;
      
      // Check if any keyword matches
      const hasKeyword = mapping.keywords.some(keyword => 
        normalized.includes(normalizeForComparison(keyword))
      );
      
      if (hasKeyword) return mapping;
    }
    
    // Try partial match on full name - check if one contains the other
    found = universityMappings.find(m => {
      const mappingNorm = normalizeForComparison(m.name);
      return mappingNorm.includes(normalized) || normalized.includes(mappingNorm);
    });
    
    return found ?? null;
  }, []);

  return {
    mappings: universityMappings,
    loading: false,
    getIdByName,
    getNameById,
    findUniversityByPartialMatch,
  };
};
