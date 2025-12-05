import { StudentAggregate } from '@/types/results';
import { universityEnrollments, UniversityEnrollmentData } from '@/data/universityEnrollments';

interface SimulatedStudent {
  media: number;
  universityId: string;
  isUser?: boolean;
}

interface AdmissionSimulationResult {
  userGlobalPosition: number;
  userUniPosition: number;
  displacedAboveUser: number;
  scaledUniSpots: number;
  realUniSpots: number;
  status: 'guaranteed' | 'at_risk' | 'unlikely';
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
 * SIMPLIFIED admission simulation - works entirely with sample data.
 * 
 * Logic:
 * 1. Scale each university's spots based on ITS coverage (sampleCount/enrollment)
 * 2. Simulate assignment in score order using scaled spots
 * 3. Count displaced students (couldn't get first choice)
 * 4. Check: userPositionAtUni + displacedAboveUser > scaledSpots → at risk
 * 
 * No projections - direct calculation with sample data.
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
  const userUniEnrollment = userUniData.iscrittiAppello;
  
  // Build student list with university IDs
  const students: SimulatedStudent[] = [];
  const sampleCountByUni: Record<string, number> = {};
  
  for (const student of studentAggregates) {
    if (student.media === undefined || student.media <= 0) continue;
    
    const uniId = getUniversityId(student.universita);
    if (!uniId) continue;
    
    students.push({
      media: student.media,
      universityId: uniId,
    });
    
    sampleCountByUni[uniId] = (sampleCountByUni[uniId] || 0) + 1;
  }
  
  // Add user
  const userStudent: SimulatedStudent = {
    media: userMedia,
    universityId: userUniId,
    isUser: true,
  };
  students.push(userStudent);
  sampleCountByUni[userUniId] = (sampleCountByUni[userUniId] || 0) + 1;
  
  // Sort by media descending
  students.sort((a, b) => b.media - a.media);
  
  // Find user positions
  const userGlobalPosition = students.findIndex(s => s.isUser) + 1;
  const sameUniStudents = students.filter(s => s.universityId === userUniId);
  const userUniPosition = sameUniStudents.findIndex(s => s.isUser) + 1;
  
  // Scale spots per-university based on coverage
  const scaledSpots: Record<string, number> = {};
  const coverageByUni: Record<string, number> = {};
  
  for (const uni of universityEnrollments) {
    if (uni.postiDisponibili && uni.iscrittiAppello) {
      const sampleCount = sampleCountByUni[uni.id] || 0;
      const coverage = sampleCount / uni.iscrittiAppello;
      coverageByUni[uni.id] = coverage;
      
      // Scale spots proportionally to coverage
      // If we have 30% of students, we use 30% of spots
      const scaled = Math.max(0, Math.round(uni.postiDisponibili * coverage));
      scaledSpots[uni.id] = scaled;
    }
  }
  
  const scaledUniSpots = scaledSpots[userUniId] || 0;
  
  // Simulate assignment - count displaced
  let displacedAboveUser = 0;
  const remainingSpots = { ...scaledSpots };
  
  for (let i = 0; i < userGlobalPosition - 1; i++) {
    const student = students[i];
    const spots = remainingSpots[student.universityId];
    
    if (spots === undefined) continue;
    
    if (spots > 0) {
      remainingSpots[student.universityId]--;
    } else {
      // Displaced - first choice was full
      displacedAboveUser++;
    }
  }
  
  // Key calculation: can user get into their university?
  // Students competing for user's uni = students at that uni above user + displaced who might choose it
  const competitorsForUserUni = (userUniPosition - 1) + displacedAboveUser;
  
  // Determine status
  let status: 'guaranteed' | 'at_risk' | 'unlikely';
  
  if (userUniPosition - 1 >= scaledUniSpots) {
    // Even without displaced, user doesn't fit
    status = 'unlikely';
  } else if (competitorsForUserUni >= scaledUniSpots) {
    // User fits without displaced, but not with them
    status = 'at_risk';
  } else {
    // User fits even with all displaced
    status = 'guaranteed';
  }
  
  return {
    userGlobalPosition,
    userUniPosition,
    displacedAboveUser,
    scaledUniSpots,
    realUniSpots,
    status,
  };
};
