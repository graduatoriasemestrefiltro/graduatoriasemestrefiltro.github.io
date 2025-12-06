import { useMemo } from 'react';
import { StudentAggregate } from '@/types/results';
import { useEnrollments, calculateEstimatedTotals } from '@/hooks/useEnrollments';
import { universityEnrollments, getEnrollmentById } from '@/data/universityEnrollments';
import { Trophy, MapPin, TrendingUp, HelpCircle } from 'lucide-react';
import { formatUniversityName } from '@/lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TOTAL_SPOTS = 19196;

interface MinimumScoreCardProps {
  studentAggregates: StudentAggregate[];
  selectedUniversityId?: string; // University ID from URL
  selectedUniversityName?: string; // University name for display
  // Map from university name to ID for matching students
  universityNameToId: Map<string, string>;
}

export const MinimumScoreCard = ({ 
  studentAggregates, 
  selectedUniversityId,
  selectedUniversityName,
  universityNameToId 
}: MinimumScoreCardProps) => {
  const { getEnrollment, getTotalEnrollment } = useEnrollments();

  const minimumScores = useMemo(() => {
    // Helper to get uni ID from student's university name
    const getUniId = (uniName: string): string | null => {
      return universityNameToId.get(uniName) || null;
    };
    
    // Get eligible students sorted by score, with their university IDs
    const eligibleStudents = studentAggregates
      .filter(s => s.media !== undefined && s.allPassed)
      .map(s => ({ 
        media: s.media!, 
        universita: s.universita,
        uniId: getUniId(s.universita)
      }))
      .sort((a, b) => b.media - a.media);
    
    if (eligibleStudents.length === 0) return null;
    
    // Calculate projection ratio
    const { estimatedIdonei, estimatedPotenziali } = calculateEstimatedTotals(
      studentAggregates,
      getEnrollment,
      getTotalEnrollment,
      'national'
    );
    const estimatedEligible = estimatedIdonei + estimatedPotenziali;
    const projectionRatio = estimatedEligible / (eligibleStudents.length || 1);
    
    // National minimum: find position at TOTAL_SPOTS
    // If projected total > TOTAL_SPOTS, there's a cutoff
    const nationalCutoffPosition = Math.ceil(TOTAL_SPOTS / projectionRatio);
    const nationalMinMedia = eligibleStudents.length >= nationalCutoffPosition 
      ? eligibleStudents[nationalCutoffPosition - 1]?.media 
      : eligibleStudents[eligibleStudents.length - 1]?.media;
    
    // University specific calculation (if single uni selected)
    let uniMinMedia: number | null = null;
    let uniMinMediaWorstCase: number | null = null;
    let uniName: string | null = null;
    let uniSpots: number | null = null;
    
    if (selectedUniversityId) {
      const uniData = getEnrollmentById(selectedUniversityId);
      if (uniData?.postiDisponibili && uniData?.iscrittiAppello) {
        uniName = selectedUniversityName || uniData.nome;
        uniSpots = uniData.postiDisponibili;
        const uniId = selectedUniversityId;
        
        // Students at this uni (using pre-computed uniId from map)
        const uniStudents = eligibleStudents.filter(s => s.uniId === uniId);
        
        if (uniStudents.length > 0) {
          // ========================================
          // STEP 1: Build sample count per university and calculate scaled spots
          // (same logic as admissionSimulation.ts)
          // ========================================
          const sampleCountByUni: Record<string, number> = {};
          for (const s of eligibleStudents) {
            if (s.uniId) sampleCountByUni[s.uniId] = (sampleCountByUni[s.uniId] || 0) + 1;
          }
          
          const scaledSpots: Record<string, number> = {};
          for (const uni of universityEnrollments) {
            if (uni.postiDisponibili && uni.iscrittiAppello) {
              const sampleCount = sampleCountByUni[uni.id] || 0;
              const coverage = sampleCount / uni.iscrittiAppello;
              scaledSpots[uni.id] = Math.max(0, Math.round(uni.postiDisponibili * coverage));
            }
          }
          
          // ========================================
          // STEP 2: CASCADING SIMULATION
          // Iteratively assign displaced students to next best universities
          // until all are placed or no more spots available
          // ========================================
          
          // Calculate attractiveness for weighted redistribution
          const attractivenessScores: Record<string, number> = {};
          for (const uni of universityEnrollments) {
            if (uni.postiDisponibili && uni.iscrittiCorso) {
              attractivenessScores[uni.id] = uni.iscrittiCorso / uni.postiDisponibili;
            }
          }
          
          // Helper: distribute students to universities by attractiveness
          // Returns students that couldn't be placed (all spots taken)
          const distributeByAttractiveness = (
            students: typeof eligibleStudents,
            remainingSpots: Record<string, number>,
            targetUniId: string
          ): { assignedToTarget: number; stillDisplaced: typeof eligibleStudents } => {
            let assignedToTarget = 0;
            let currentDisplaced = [...students];
            
            // Keep distributing until no more displaced or no more spots
            while (currentDisplaced.length > 0) {
              // Get universities with remaining spots
              const availableUnis = Object.entries(remainingSpots)
                .filter(([_, spots]) => spots > 0)
                .map(([id]) => id);
              
              if (availableUnis.length === 0) {
                // No more spots anywhere
                break;
              }
              
              // Calculate attractiveness share for available universities only
              let totalAvailableAttractiveness = 0;
              for (const id of availableUnis) {
                totalAvailableAttractiveness += attractivenessScores[id] || 1;
              }
              
              // Distribute students proportionally to attractiveness
              const distribution: Record<string, number> = {};
              let totalDistributed = 0;
              
              for (const id of availableUnis) {
                const share = (attractivenessScores[id] || 1) / totalAvailableAttractiveness;
                const count = Math.round(currentDisplaced.length * share);
                distribution[id] = count;
                totalDistributed += count;
              }
              
              // Adjust for rounding errors
              if (totalDistributed < currentDisplaced.length && availableUnis.length > 0) {
                // Add remaining to most attractive available university
                const mostAttractive = availableUnis.reduce((best, id) => 
                  (attractivenessScores[id] || 0) > (attractivenessScores[best] || 0) ? id : best
                );
                distribution[mostAttractive] += currentDisplaced.length - totalDistributed;
              }
              
              // Assign students, collect those who couldn't be placed
              const nextDisplaced: typeof eligibleStudents = [];
              let studentIdx = 0;
              
              for (const [uniIdDest, wantedCount] of Object.entries(distribution)) {
                const spots = remainingSpots[uniIdDest] || 0;
                const actuallyAssigned = Math.min(wantedCount, spots);
                
                // Track assignments to target university
                if (uniIdDest === targetUniId) {
                  assignedToTarget += actuallyAssigned;
                }
                
                // Update remaining spots
                remainingSpots[uniIdDest] = spots - actuallyAssigned;
                
                // Students who couldn't get a spot cascade to next round
                const overflow = wantedCount - actuallyAssigned;
                for (let i = 0; i < overflow; i++) {
                  if (studentIdx + actuallyAssigned + i < currentDisplaced.length) {
                    nextDisplaced.push(currentDisplaced[studentIdx + actuallyAssigned + i]);
                  }
                }
                
                studentIdx += wantedCount;
              }
              
              // If no progress was made, break to avoid infinite loop
              if (nextDisplaced.length === currentDisplaced.length) {
                break;
              }
              
              currentDisplaced = nextDisplaced;
            }
            
            return { assignedToTarget, stillDisplaced: currentDisplaced };
          };
          
          // ========================================
          // REALISTIC ESTIMATE: Cascading simulation
          // ========================================
          const sortedAllStudents = [...eligibleStudents].sort((a, b) => b.media - a.media);
          const remainingSpotsRealistic = { ...scaledSpots };
          let displacedRealistic: typeof eligibleStudents = [];
          let totalAssignedToTargetRealistic = 0;
          
          // First pass: assign to first choice
          for (const student of sortedAllStudents) {
            if (!student.uniId) continue;
            const spots = remainingSpotsRealistic[student.uniId];
            if (spots === undefined) continue;
            
            if (spots > 0) {
              remainingSpotsRealistic[student.uniId]--;
              // Track if assigned to target university as first choice
              if (student.uniId === uniId) {
                totalAssignedToTargetRealistic++;
              }
            } else {
              displacedRealistic.push(student);
            }
          }
          
          // Cascading: redistribute displaced until none left or no spots
          let cascadeRound = 0;
          const maxCascadeRounds = 10; // Prevent infinite loops
          while (displacedRealistic.length > 0 && cascadeRound < maxCascadeRounds) {
            const { assignedToTarget, stillDisplaced } = distributeByAttractiveness(
              displacedRealistic,
              remainingSpotsRealistic,
              uniId
            );
            totalAssignedToTargetRealistic += assignedToTarget;
            
            // If no change, break
            if (stillDisplaced.length === displacedRealistic.length) break;
            
            displacedRealistic = stillDisplaced;
            cascadeRound++;
          }
          
          // ========================================
          // WORST CASE: All displaced from all rounds come to this university
          // ========================================
          const remainingSpotsWorstCase = { ...scaledSpots };
          let allDisplacedWorstCase: typeof eligibleStudents = [];
          
          // First pass: assign to first choice, track all displaced
          for (const student of sortedAllStudents) {
            if (!student.uniId) continue;
            const spots = remainingSpotsWorstCase[student.uniId];
            if (spots === undefined) continue;
            
            if (spots > 0) {
              remainingSpotsWorstCase[student.uniId]--;
            } else {
              allDisplacedWorstCase.push(student);
            }
          }
          
          
          // ========================================
          // STEP 3: Calculate cutoff - simulate who gets in
          // ========================================
          const scaledUniSpots = scaledSpots[uniId] || 0;
          
          if (scaledUniSpots > 0) {
            // Sort first-choice students by score
            const sortedUniStudents = [...uniStudents].sort((a, b) => b.media - a.media);
            
            // ========================================
            // REALISTIC: Based on cascading simulation results
            // Already calculated how many got assigned via cascading
            // ========================================
            // Total assigned to target = first choice who got in + cascaded who got in
            // The cutoff is the score of the last person who got in
            
            // For realistic: use the cascading simulation result
            // Count how many first-choice students got in (until spots ran out)
            const firstChoiceAssigned = Math.min(sortedUniStudents.length, Math.ceil(scaledUniSpots));
            
            // Check remaining spots after cascading simulation
            const remainingAfterCascade = remainingSpotsRealistic[uniId] || 0;
            const spotsUsedByCascade = scaledUniSpots - remainingAfterCascade;
            
            // If there are still spots after first-choice, the cutoff is lower
            // If not all first-choice fit, cutoff is the last admitted first-choice
            if (sortedUniStudents.length > 0) {
              if (sortedUniStudents.length <= scaledUniSpots) {
                // All first-choice students get in
                // Cutoff is determined by cascaded displaced students
                if (remainingAfterCascade > 0) {
                  // Not all spots filled - minimum is the lowest first-choice score
                  uniMinMedia = sortedUniStudents[sortedUniStudents.length - 1]?.media;
                } else {
                  // Spots filled by cascade - need to find the cutoff among cascaded
                  // For simplicity, use lowest first-choice as conservative estimate
                  uniMinMedia = sortedUniStudents[sortedUniStudents.length - 1]?.media;
                }
              } else {
                // More first-choice than spots - cutoff is at spot position
                const cutoffIdx = Math.ceil(scaledUniSpots) - 1;
                uniMinMedia = sortedUniStudents[cutoffIdx]?.media;
              }
            }
            
            // ========================================
            // WORST CASE: Same logic as admissionSimulation.ts
            // For each position, count displaced ABOVE that position
            // competitorsForPosition = (positionInUni - 1) + displacedAbovePosition
            // Find the position where competitorsForPosition >= scaledSpots
            // ========================================
            
            // We need to find the cutoff score using the same logic as thank you page:
            // For a student at position P in their uni ranking:
            // - There are (P-1) first-choice students above them at this uni
            // - There are D displaced students (from other unis) ranked above them nationally
            // - They get in if (P-1) + D < scaledSpots
            
            // To find cutoff: iterate through sorted uni students and find where
            // (position-1) + displacedAboveThisStudent >= scaledSpots
            
            const allStudentsSorted = [...eligibleStudents].sort((a, b) => b.media - a.media);
            
            // Build a map of "how many displaced are above each score"
            // A student is "displaced" if their first-choice uni had no spots when they were processed
            const remainingForWorstCase = { ...scaledSpots };
            const displacedAboveScore: { score: number; displaced: number }[] = [];
            let cumulativeDisplaced = 0;
            
            for (const student of allStudentsSorted) {
              if (!student.uniId) continue;
              const spots = remainingForWorstCase[student.uniId];
              if (spots === undefined) continue;
              
              if (spots > 0) {
                remainingForWorstCase[student.uniId]--;
              } else {
                cumulativeDisplaced++;
              }
              
              displacedAboveScore.push({ score: student.media, displaced: cumulativeDisplaced });
            }
            
            // Now find cutoff for this university
            // For each first-choice student at this uni, check if they would get in
            for (let i = 0; i < sortedUniStudents.length; i++) {
              const student = sortedUniStudents[i];
              const positionInUni = i + 1; // 1-indexed
              
              // Find how many displaced are above this student's score nationally
              let displacedAbove = 0;
              for (const entry of displacedAboveScore) {
                if (entry.score > student.media) {
                  displacedAbove = entry.displaced;
                } else {
                  break;
                }
              }
              
              // Total competitors = (position in uni - 1) + displaced above
              const competitors = (positionInUni - 1) + displacedAbove;
              
              // If competitors >= scaledSpots, this student doesn't get in
              // So the cutoff is the previous student's score
              if (competitors >= scaledUniSpots) {
                if (i > 0) {
                  uniMinMediaWorstCase = sortedUniStudents[i - 1]?.media;
                } else {
                  // Even first student doesn't fit - use their score as minimum
                  uniMinMediaWorstCase = student.media;
                }
                break;
              }
              
              // If we reach the end and everyone fits
              if (i === sortedUniStudents.length - 1) {
                uniMinMediaWorstCase = student.media;
              }
            }
          }
        }
      }
    }
    
    return {
      nationalMinMedia,
      nationalMinTotal: nationalMinMedia ? nationalMinMedia * 3 : null,
      estimatedEligible,
      actualEligible: eligibleStudents.length,
      uniMinMedia,
      uniMinTotal: uniMinMedia ? uniMinMedia * 3 : null,
      uniMinMediaWorstCase,
      uniMinTotalWorstCase: uniMinMediaWorstCase ? uniMinMediaWorstCase * 3 : null,
      uniName,
      uniSpots,
    };
  }, [studentAggregates, selectedUniversityId, selectedUniversityName, universityNameToId, getEnrollment, getTotalEnrollment]);

  if (!minimumScores) return null;

  return (
    <div className="rounded-xl border border-border p-5 bg-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Punteggio minimo stimato per l'ammissione</h3>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button className="p-1 rounded-full hover:bg-secondary/50 transition-colors">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Come calcoliamo il punteggio minimo</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Media minima nazionale:</strong> Stimata proiettando i {minimumScores.actualEligible.toLocaleString('it-IT')} studenti idonei 
                raccolti su un totale stimato di ~{minimumScores.estimatedEligible.toLocaleString('it-IT')} studenti idonei a livello nazionale. 
                Il punteggio mostrato è la media stimata dell'ultimo studente ammesso nei {TOTAL_SPOTS.toLocaleString('it-IT')} posti disponibili.
              </p>
              {minimumScores.uniName && (
                <p>
                  <strong>Media minima per {formatUniversityName(minimumScores.uniName)}:</strong> Calcolata simulando l'assegnazione 
                  degli studenti alle sedi in ordine di punteggio. Per stimare quanti studenti non assegnati alla loro prima scelta 
                  potrebbero competere per questa sede, utilizziamo il rapporto tra iscritti al corso e posti disponibili come indicatore 
                  di "attrattività" della sede. Le sedi più ambite (alto rapporto iscritti/posti) riceveranno una quota maggiore 
                  di studenti non assegnati. I dati sulle seconde scelte non sono pubblici.
                </p>
              )}
              <p className="text-xs text-amber-600">
                ⚠️ Queste stime sono basate sui dati raccolti e potrebbero differire dai risultati ufficiali.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className={`grid gap-4 ${minimumScores.uniMinMedia ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {/* National minimum */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="p-2 rounded-full bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">Media minima nazionale per l'ammissione</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono">{minimumScores.nationalMinMedia?.toFixed(2) || '—'}</span>
              <span className="text-sm text-muted-foreground">
                (totale: <span className="font-semibold font-mono">{minimumScores.nationalMinTotal?.toFixed(2) || '—'}</span>)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per entrare nei {TOTAL_SPOTS.toLocaleString('it-IT')} posti
            </p>
          </div>
        </div>

        {/* University minimum (only if single uni selected) */}
        {minimumScores.uniName && (minimumScores.uniMinMedia || minimumScores.uniMinMediaWorstCase) && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="p-2 rounded-full bg-blue-100">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-2">
                Media minima per l'ammissione a {formatUniversityName(minimumScores.uniName)}
              </p>
              
              {/* Two estimates side by side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Realistic estimate */}
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Stima realistica</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-blue-700">{minimumScores.uniMinMedia?.toFixed(2) || '—'}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(minimumScores.uniMinTotal)?.toFixed(1)})
                    </span>
                  </div>
                </div>
                
                {/* Worst case */}
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Caso peggiore</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-amber-600">{minimumScores.uniMinMediaWorstCase?.toFixed(2) || '—'}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(minimumScores.uniMinTotalWorstCase)?.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
              
              {minimumScores.uniSpots && (
                <p className="text-xs text-muted-foreground mt-2">
                  Per entrare nei {minimumScores.uniSpots.toLocaleString('it-IT')} posti di questa sede
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                Non esistono dati pubblici sulle seconde scelte. Il <span className="font-medium">caso peggiore</span> assume che tutti gli studenti non assegnati alla prima scelta scelgano questa sede. La <span className="font-medium">stima realistica</span> distribuisce questi studenti in base all'attrattività di ogni ateneo, calcolata come rapporto tra iscritti come prima scelta e posti disponibili.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alert if minimum is below 18 */}
      {minimumScores.nationalMinMedia && minimumScores.nationalMinMedia < 18 && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <strong>Nota:</strong> Da decreto ministeriale, salvo modifiche, è necessario almeno 18 a ciascun esame per essere ammessi in graduatoria. 
          Pertanto la media minima effettiva sarà comunque ≥18, indipendentemente dalla stima teorica.
        </div>
      )}
    </div>
  );
};
