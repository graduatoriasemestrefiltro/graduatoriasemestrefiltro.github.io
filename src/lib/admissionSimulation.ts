import { StudentAggregate } from '@/types/results';
import { universityEnrollments, UniversityEnrollmentData } from '@/data/universityEnrollments';

interface SimulatedStudent {
  media: number;
  universityId: string;
}

export interface AdmissionSimulationResult {
  userGlobalPosition: number;
  userUniPosition: number;
  displacedAboveUser: number;
  scaledUniSpots: number;
  realUniSpots: number;
  status: 'guaranteed' | 'at_risk' | 'unlikely';
  worstCaseCompetitors: number;
}

/**
 * Find university enrollment data by name (flexible matching)
 */
const findUniversityByName = (name: string): UniversityEnrollmentData | null => {
  const normalized = name.toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"\\]/g, "")
    .trim();
  
  for (const uni of universityEnrollments) {
    const uniNormalized = uni.nome.toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['"\\]/g, "")
      .trim();
    
    if (normalized.includes(uniNormalized) || uniNormalized.includes(normalized)) {
      return uni;
    }
    
    // Try matching by key words
    const nameWords = normalized.split(/\s+/).filter(w => w.length > 4);
    const uniWords = uniNormalized.split(/\s+/).filter(w => w.length > 4);
    
    for (const nw of nameWords) {
      for (const uw of uniWords) {
        if (nw === uw && !['UNIVERSITA', 'DEGLI', 'STUDI', 'DELLA'].includes(nw)) {
          return uni;
        }
      }
    }
  }
  
  return null;
};

/**
 * Get university ID from name
 */
const getUniversityId = (name: string): string | null => {
  const uni = findUniversityByName(name);
  return uni?.id || null;
};

/**
 * Admission simulation aligned with MinimumScoreCard logic.
 * 
 * Uses the SAME worst-case calculation as MinimumScoreCard:
 * 1. Build list of ELIGIBLE students only (allPassed = true)
 * 2. Scale spots per-university based on coverage
 * 3. Simulate assignment - track displaced students at each score level
 * 4. For user: calculate (positionInUni - 1) + displacedAboveUser
 * 5. Compare against scaledSpots to determine status
 */
export const simulateAdmission = (
  studentAggregates: StudentAggregate[],
  userMedia: number,
  userUniName: string,
  _projectionRatio: number // kept for API compatibility but not used
): AdmissionSimulationResult | null => {
  // Find user's university data
  const userUniData = findUniversityByName(userUniName);
  if (!userUniData?.postiDisponibili || !userUniData?.iscrittiAppello) {
    return null;
  }
  
  const userUniId = userUniData.id;
  const realUniSpots = userUniData.postiDisponibili;
  
  // Build student list with university IDs - ONLY eligible students (allPassed = true)
  // This aligns with MinimumScoreCard calculation methodology
  const students: SimulatedStudent[] = [];
  const sampleCountByUni: Record<string, number> = {};
  
  for (const student of studentAggregates) {
    if (student.media === undefined || student.media <= 0) continue;
    if (!student.allPassed) continue; // Only eligible students
    
    const uniId = getUniversityId(student.universita);
    if (!uniId) continue;
    
    students.push({
      media: student.media,
      universityId: uniId,
    });
    
    sampleCountByUni[uniId] = (sampleCountByUni[uniId] || 0) + 1;
  }
  
  // Add user (assumed eligible since they're checking admission)
  const userStudent: SimulatedStudent = {
    media: userMedia,
    universityId: userUniId,
  };
  students.push(userStudent);
  sampleCountByUni[userUniId] = (sampleCountByUni[userUniId] || 0) + 1;
  
  // Sort by media descending
  const sortedStudents = [...students].sort((a, b) => b.media - a.media);
  
  // Find user positions
  const userGlobalPosition = sortedStudents.findIndex(s => s === userStudent) + 1;
  const sameUniStudents = sortedStudents.filter(s => s.universityId === userUniId);
  const userUniPosition = sameUniStudents.findIndex(s => s === userStudent) + 1;
  
  // Scale spots per-university based on coverage
  const scaledSpots: Record<string, number> = {};
  
  for (const uni of universityEnrollments) {
    if (uni.postiDisponibili && uni.iscrittiAppello) {
      const sampleCount = sampleCountByUni[uni.id] || 0;
      const coverage = sampleCount / uni.iscrittiAppello;
      scaledSpots[uni.id] = Math.max(0, Math.round(uni.postiDisponibili * coverage));
    }
  }
  
  const scaledUniSpots = scaledSpots[userUniId] || 0;
  
  // ========================================
  // WORST CASE SIMULATION (same as MinimumScoreCard)
  // Track displaced students above each score level
  // ========================================
  const remainingSpots = { ...scaledSpots };
  const displacedAboveScore: { score: number; displaced: number }[] = [];
  let cumulativeDisplaced = 0;
  
  for (const student of sortedStudents) {
    const spots = remainingSpots[student.universityId];
    if (spots === undefined) continue;
    
    if (spots > 0) {
      remainingSpots[student.universityId]--;
    } else {
      cumulativeDisplaced++;
    }
    
    displacedAboveScore.push({ score: student.media, displaced: cumulativeDisplaced });
  }
  
  // Find how many displaced are above user's score
  let displacedAboveUser = 0;
  for (const entry of displacedAboveScore) {
    if (entry.score > userMedia) {
      displacedAboveUser = entry.displaced;
    } else {
      break;
    }
  }
  
  // Calculate worst-case competitors: (positionInUni - 1) + displacedAboveUser
  const worstCaseCompetitors = (userUniPosition - 1) + displacedAboveUser;
  
  // Determine status based on same logic as MinimumScoreCard cutoff
  let status: 'guaranteed' | 'at_risk' | 'unlikely';
  
  if (worstCaseCompetitors >= scaledUniSpots) {
    // User doesn't get in even in worst case calculation
    // But check if they might get in without displaced (at_risk vs unlikely)
    if (userUniPosition - 1 >= scaledUniSpots) {
      // Even without displaced, user doesn't fit
      status = 'unlikely';
    } else {
      // User fits without displaced, but not with them
      status = 'at_risk';
    }
  } else {
    // User fits even with all displaced above them
    status = 'guaranteed';
  }
  
  return {
    userGlobalPosition,
    userUniPosition,
    displacedAboveUser,
    scaledUniSpots,
    realUniSpots,
    status,
    worstCaseCompetitors,
  };
};