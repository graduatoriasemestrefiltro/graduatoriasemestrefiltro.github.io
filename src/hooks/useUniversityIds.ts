import { useState, useEffect, useCallback } from "react";

interface UniversityMapping {
  id: string;
  name: string;
}

interface UniversityIdsData {
  universities: UniversityMapping[];
}

// Normalize for comparison
const normalizeForComparison = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const useUniversityIds = () => {
  const [mappings, setMappings] = useState<UniversityMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/university_ids.json")
      .then((res) => res.json())
      .then((data: UniversityIdsData) => {
        setMappings(data.universities);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load university IDs:", err);
        setLoading(false);
      });
  }, []);

  const getIdByName = useCallback((name: string): string | null => {
    const normalized = normalizeForComparison(name);
    const found = mappings.find(m => normalizeForComparison(m.name) === normalized);
    return found?.id ?? null;
  }, [mappings]);

  const getNameById = useCallback((id: string): string | null => {
    const found = mappings.find(m => m.id === id);
    return found?.name ?? null;
  }, [mappings]);

  // Find by partial match (for cases where names differ slightly)
  const findUniversityByPartialMatch = useCallback((searchName: string): UniversityMapping | null => {
    const normalized = normalizeForComparison(searchName);
    
    // Try exact match first
    let found = mappings.find(m => normalizeForComparison(m.name) === normalized);
    if (found) return found;
    
    // Try partial match - check if one contains the other
    found = mappings.find(m => {
      const mappingNorm = normalizeForComparison(m.name);
      return mappingNorm.includes(normalized) || normalized.includes(mappingNorm);
    });
    
    return found ?? null;
  }, [mappings]);

  return {
    mappings,
    loading,
    getIdByName,
    getNameById,
    findUniversityByPartialMatch,
  };
};
