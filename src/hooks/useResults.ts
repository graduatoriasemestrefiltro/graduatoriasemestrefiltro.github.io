import { useQuery } from "@tanstack/react-query";
import { Result, StudentAggregate, UniversityStats, RegionStats } from "@/types/results";
import { useSurveyData } from "@/contexts/SurveyDataContext";
import { CONFIG } from "@/lib/config";

// Debug flag: set to true to simulate survey data for Bari Aldo Moro
const DEBUG_SURVEY_BARI = false;

interface UniversityInfo {
  nome: string;
  id: string;
  region: string;
}

const fetchResults = async (): Promise<Result[]> => {
  const response = await fetch("https://graduatoriasemestrefiltro.github.io/data.json");
  if (!response.ok) {
    throw new Error("Failed to fetch results");
  }
  return response.json();
};

const fetchUniversities = async (): Promise<UniversityInfo[]> => {
  const response = await fetch("https://graduatoriasemestrefiltro.github.io/universities.json");
  if (!response.ok) {
    throw new Error("Failed to fetch universities");
  }
  return response.json();
};

export const useResults = () => {
  return useQuery({
    queryKey: ["results"],
    queryFn: fetchResults,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useUniversities = () => {
  return useQuery({
    queryKey: ["universities"],
    queryFn: fetchUniversities,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useProcessedData = () => {
  const { data: results, isLoading: resultsLoading, error: resultsError } = useResults();
  const { data: universities, isLoading: unisLoading, error: unisError } = useUniversities();
  const { includeSurveyData } = useSurveyData();

  const isLoading = resultsLoading || unisLoading;
  const error = resultsError || unisError;

  if (!results || !universities) {
    return { 
      isLoading, 
      error,
      results: [],
      studentAggregates: [],
      universityStats: [],
      regionStats: [],
      globalStats: null,
    };
  }

  // Create a map of university id -> region from the universities JSON
  const uniRegionMap = new Map<string, string>();
  const uniNameMap = new Map<string, string>();
  universities.forEach((u) => {
    uniRegionMap.set(u.id, u.region);
    uniNameMap.set(u.id, u.nome);
  });

  // Debug: mark Bari data as survey if flag is enabled
  let processedResults = DEBUG_SURVEY_BARI 
    ? results.map(r => ({
        ...r,
        is_from_survey: r.universita.id === "02" ? true : r.is_from_survey
      }))
    : results;

  // Filter data based on survey toggle and global config
  if (CONFIG.DISABLE_SURVEYS_GLOBALLY) {
    // When global config is active: toggle switches between ONLY official or ONLY survey
    if (includeSurveyData) {
      // Show ONLY survey data
      processedResults = processedResults.filter(r => r.is_from_survey);
    } else {
      // Show ONLY official data
      processedResults = processedResults.filter(r => !r.is_from_survey);
    }
  } else {
    // Normal mode: toggle off = only official, toggle on = merged (all data)
    if (!includeSurveyData) {
      processedResults = processedResults.filter(r => !r.is_from_survey);
    }
  }

  // Aggregate by student
  const studentMap = new Map<string, StudentAggregate>();
  
  processedResults.forEach((r) => {
    const score = parseFloat(r.punteggio);
    const existing = studentMap.get(r.etichetta) || {
      etichetta: r.etichetta,
      completedExams: 0,
      allPassed: true,
      fullyQualified: false,
      universita: r.universita.nome,
      isFromSurvey: false,
    };

    existing[r.materia] = score;
    existing.completedExams++;
    // Score ≥17.5 rounds to 18, so it's considered passing
    if (score < 17.5) {
      existing.allPassed = false;
    }
    existing.universita = r.universita.nome;
    // If any result is from survey, mark student as from survey
    if (r.is_from_survey) {
      existing.isFromSurvey = true;
    }

    studentMap.set(r.etichetta, existing);
  });

  const studentAggregates: StudentAggregate[] = Array.from(studentMap.values()).map((s) => {
    const scores = [s.fisica, s.chimica, s.biologia].filter((x): x is number => x !== undefined);
    const media = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined;
    const fullyQualified = s.completedExams === 3 && s.allPassed;
    
    return {
      ...s,
      media,
      fullyQualified,
    };
  });

  // University stats - start with all universities from the JSON
  const uniMap = new Map<string, UniversityStats>();
  
  // Initialize all universities (including those without data)
  universities.forEach((uni) => {
    // Fix typo in JSON: "Lomabrdia" -> "Lombardia"
    const region = uni.region === "Lomabrdia" ? "Lombardia" : uni.region;
    uniMap.set(uni.id, {
      id: uni.id,
      nome: uni.nome,
      regione: region,
      hasChimica: false,
      hasFisica: false,
      hasBiologia: false,
      totalStudents: 0,
      avgScore: 0,
      studentsChimica: 0,
      studentsFisica: 0,
      studentsBiologia: 0,
      isFromSurvey: false,
    });
  });
  
  // Track survey exam counts per university
  const uniSurveyExamCounts = new Map<string, { total: number; survey: number }>();
  
  // Update with actual data from results (track subject completion only, not avgScore yet)
  processedResults.forEach((r) => {
    // Convert ID to string to handle both string and number IDs from JSON
    const uniId = String(r.universita.id);
    const existing = uniMap.get(uniId);
    
    if (existing) {
      if (r.materia === "chimica") {
        existing.hasChimica = true;
        existing.studentsChimica++;
      }
      if (r.materia === "fisica") {
        existing.hasFisica = true;
        existing.studentsFisica++;
      }
      if (r.materia === "biologia") {
        existing.hasBiologia = true;
        existing.studentsBiologia++;
      }
      
      // Track survey exam counts
      const counts = uniSurveyExamCounts.get(uniId) || { total: 0, survey: 0 };
      counts.total++;
      if (r.is_from_survey) {
        counts.survey++;
      }
      uniSurveyExamCounts.set(uniId, counts);
    }
  });
  
  // Mark university as survey only if ≥50% of exams are from surveys
  uniSurveyExamCounts.forEach((counts, uniId) => {
    const uni = uniMap.get(uniId);
    if (uni && counts.total > 0 && counts.survey / counts.total >= 0.5) {
      uni.isFromSurvey = true;
    }
  });

  // Calculate avgScore per university using student averages (media delle medie)
  studentAggregates.forEach((student) => {
    if (student.media === undefined) return;
    
    // Find university by name
    const uniEntry = Array.from(uniMap.entries()).find(([_, uni]) => uni.nome === student.universita);
    if (uniEntry) {
      const [uniId, uni] = uniEntry;
      uni.avgScore = (uni.avgScore * uni.totalStudents + student.media) / (uni.totalStudents + 1);
      uni.totalStudents++;
    }
  });

  // Sort universities: those with data first (by avgScore desc), then those without data (by region, then name)
  const universityStats = Array.from(uniMap.values()).sort((a, b) => {
    // First, separate by whether they have data
    if (a.totalStudents > 0 && b.totalStudents === 0) return -1;
    if (a.totalStudents === 0 && b.totalStudents > 0) return 1;
    
    // Both have data: sort by avgScore descending
    if (a.totalStudents > 0 && b.totalStudents > 0) {
      return b.avgScore - a.avgScore;
    }
    
    // Both without data: sort by region, then by name
    const regionCompare = a.regione.localeCompare(b.regione, "it");
    if (regionCompare !== 0) return regionCompare;
    return a.nome.localeCompare(b.nome, "it");
  });

  // Region stats
  const regionMap = new Map<string, RegionStats>();
  
  universityStats.forEach((uni) => {
    if (uni.totalStudents === 0) return; // Skip universities without data for region stats
    
    const existing = regionMap.get(uni.regione) || {
      nome: uni.regione,
      universities: 0,
      studentsCount: 0,
      avgScore: 0,
      fullyQualified: 0,
      potentiallyQualified: 0,
    };

    existing.universities++;
    existing.avgScore = (existing.avgScore * existing.studentsCount + uni.avgScore * uni.totalStudents) / 
                        (existing.studentsCount + uni.totalStudents);
    existing.studentsCount += uni.totalStudents;

    regionMap.set(uni.regione, existing);
  });

  // Count fully qualified and potentially qualified per region
  studentAggregates.forEach((s) => {
    const uni = universityStats.find((u) => u.nome === s.universita);
    if (uni) {
      const region = regionMap.get(uni.regione);
      if (region) {
        if (s.fullyQualified) {
          region.fullyQualified++;
        } else if (s.allPassed) {
          region.potentiallyQualified++;
        }
      }
    }
  });

  const regionStats = Array.from(regionMap.values());

  // Global stats
  const totalSpots = 19196;
  const totalUniversities = universities.length;
  const fullyQualified = studentAggregates.filter((s) => s.fullyQualified).length;
  const almostQualified = studentAggregates.filter((s) => s.allPassed && !s.fullyQualified).length;
  const universitiesFromSurvey = universityStats.filter((u) => u.isFromSurvey && u.totalStudents > 0).length;
  // Exclude survey universities from official counts
  const universitiesWithOfficialData = universityStats.filter((u) => u.totalStudents > 0 && !u.isFromSurvey).length;
  const universitiesComplete = universityStats.filter((u) => u.hasChimica && u.hasFisica && u.hasBiologia && !u.isFromSurvey).length;

  // Calculate average of student averages (media delle medie)
  const studentsWithMedia = studentAggregates.filter(s => s.media !== undefined);
  const avgOfAverages = studentsWithMedia.length > 0 
    ? studentsWithMedia.reduce((acc, s) => acc + s.media!, 0) / studentsWithMedia.length 
    : 0;

  const globalStats = {
    totalSpots,
    totalUniversities,
    fullyQualified,
    almostQualified,
    remainingSpots: totalSpots - fullyQualified,
    universitiesWithData: universitiesWithOfficialData,
    universitiesComplete,
    universitiesFromSurvey,
    totalResults: results.length,
    uniqueStudents: studentAggregates.length,
    avgScore: avgOfAverages,
  };

  return {
    isLoading,
    error,
    results: processedResults,
    studentAggregates,
    universityStats,
    regionStats,
    globalStats,
  };
};
