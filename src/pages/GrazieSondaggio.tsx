import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Check, Copy, MessageCircle, Send, Heart, AlertTriangle, Github, Trophy, MapPin, Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProcessedData } from '@/hooks/useResults';
import { useEnrollments, calculateEstimatedTotals } from '@/hooks/useEnrollments';
import { formatUniversityName } from '@/lib/formatters';
import { universityEnrollments } from '@/data/universityEnrollments';
import { simulateAdmission } from '@/lib/admissionSimulation';

const SURVEY_URL = 'https://graduatoriasemestrefiltro.github.io/#/sondaggio';
const HOME_URL = 'https://graduatoriasemestrefiltro.github.io';
const SHARE_MESSAGE = `Hai sostenuto gli esami del semestre filtro? Compila questo breve sondaggio anonimo per aiutare tutti a capire come stanno andando le graduatorie! 📊\n\n🔗 Compila il sondaggio: ${SURVEY_URL}\n📈 Guarda le statistiche: ${HOME_URL}`;
const TOTAL_SPOTS = 19196;

// Check if we're after December 10th 11:00 AM (second exam session completed)
const isAfterSecondExam = (): boolean => {
  const now = new Date();
  const cutoff = new Date('2025-12-10T11:00:00+01:00'); // 11:00 CET
  return now >= cutoff;
};

const GrazieSondaggio = () => {
  const afterSecondExam = isAfterSecondExam();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('id');
  const formattedId = submissionId ? `SRV-${submissionId.toUpperCase()}` : null;
  
  // Get scores from URL parameters
  const fisica = searchParams.get('fisica');
  const chimica = searchParams.get('chimica');
  const biologia = searchParams.get('biologia');
  const uni = searchParams.get('uni');
  
  const [copied, setCopied] = useState(false);
  
  // Fetch existing data for position calculation
  const { studentAggregates, universityStats, isLoading } = useProcessedData();
  const { getEnrollment, getTotalEnrollment } = useEnrollments();

  // Parse user scores - treat 0 as "not taken", negative scores are valid (wrong answers deduct points)
  const userScores = useMemo(() => {
    const fis = fisica ? parseFloat(fisica) : null;
    const chi = chimica ? parseFloat(chimica) : null;
    const bio = biologia ? parseFloat(biologia) : null;
    
    // Helper to check if exam was taken (0 = not taken, any other number including negative = taken)
    const wasTaken = (s: number | null): s is number => s !== null && !isNaN(s) && s !== 0;
    
    // Filter out null/NaN and 0 (which means not taken) - negative scores ARE valid
    const takenScores = [fis, chi, bio].filter(wasTaken);
    const media = takenScores.length > 0 ? takenScores.reduce((a, b) => a + b, 0) / takenScores.length : null;
    const completedExams = takenScores.length;
    // Score ≥17.5 rounds to 18, so it's considered passing
    const allPassed = takenScores.length > 0 && takenScores.every(s => s >= 17.5);
    const fullyQualified = completedExams === 3 && allPassed;
    
    // Check if any taken exam is failed (< 17.5, which rounds to <18)
    const hasFailedExam = takenScores.some(s => s < 17.5);
    
    return {
      fisica: wasTaken(fis) ? fis : null,
      chimica: wasTaken(chi) ? chi : null,
      biologia: wasTaken(bio) ? bio : null,
      media,
      completedExams,
      allPassed,
      fullyQualified,
      hasFailedExam,
    };
  }, [fisica, chimica, biologia]);

  // Calculate positions
  const positions = useMemo(() => {
    if (!userScores.media || isLoading) return null;
    
    // ALL students with media (for general/university rankings)
    const allStudentsWithMedia = studentAggregates
      .filter(s => s.media !== undefined)
      .map(s => ({ media: s.media!, universita: s.universita, fullyQualified: s.fullyQualified, allPassed: s.allPassed }));
    
    // ELIGIBLE students only (for projected admission ranking)
    const eligibleStudents = studentAggregates
      .filter(s => s.media !== undefined && s.allPassed)
      .map(s => ({ media: s.media!, universita: s.universita, fullyQualified: s.fullyQualified, allPassed: s.allPassed }));
    
    const userEntry = {
      media: userScores.media,
      universita: uni || '',
      fullyQualified: userScores.fullyQualified,
      allPassed: userScores.allPassed,
    };
    
    // General ranking: among ALL students
    const sortedAll = [...allStudentsWithMedia, userEntry].sort((a, b) => b.media - a.media);
    const generalPosition = sortedAll.findIndex(s => s === userEntry) + 1;
    
    // University ranking: among ALL students at that uni
    let universityPosition: number | null = null;
    let universityTotal: number | null = null;
    if (uni) {
      const uniStudents = allStudentsWithMedia.filter(s => s.universita === uni);
      const sortedUni = [...uniStudents, userEntry].sort((a, b) => b.media - a.media);
      universityPosition = sortedUni.findIndex(s => s === userEntry) + 1;
      universityTotal = sortedUni.length;
    }
    
    // Projected position among ELIGIBLE students (only they compete for spots)
    const { estimatedIdonei, estimatedPotenziali } = calculateEstimatedTotals(
      studentAggregates,
      getEnrollment,
      getTotalEnrollment,
      'national'
    );
    const estimatedEligible = estimatedIdonei + estimatedPotenziali;
    const totalEnrollment = getTotalEnrollment();
    
    // Calculate position among eligible students only
    const eligibleSorted = [...eligibleStudents, userEntry].sort((a, b) => b.media - a.media);
    const eligiblePosition = eligibleSorted.findIndex(s => s === userEntry) + 1;
    
    // Project to estimated eligible total
    const actualEligibleWithUser = eligibleStudents.length + 1;
    const eligibleRatio = actualEligibleWithUser > 0 ? estimatedEligible / actualEligibleWithUser : 1;
    const projectedPosition = Math.round(eligiblePosition * eligibleRatio);
    
    // Show total enrollment for context, but position is among eligibles
    const projectedTotal = totalEnrollment;
    const projectedEligibleTotal = estimatedEligible;
    
    // Check if projected position would mean admission
    const wouldBeAdmitted = userScores.allPassed && projectedPosition <= TOTAL_SPOTS;
    
    // University-specific admission analysis using simulation
    let uniAdmissionStatus: 'guaranteed' | 'at_risk' | 'unlikely' | null = null;
    let uniSpots: number | null = null;
    let projectedUniPosition: number | null = null;
    let displacedCount: number | null = null;
    let worstCasePosition: number | null = null;
    
    if (uni && wouldBeAdmitted && userScores.media) {
      // Run admission simulation with dynamic programming
      const simulation = simulateAdmission(
        studentAggregates,
        userScores.media,
        uni,
        eligibleRatio
      );
      
      if (simulation) {
        uniAdmissionStatus = simulation.status;
        uniSpots = simulation.realUniSpots;
        projectedUniPosition = simulation.userUniPosition;
        displacedCount = simulation.displacedAboveUser;
        worstCasePosition = simulation.userUniPosition + simulation.displacedAboveUser;
      }
    }
    
    return {
      generalPosition,
      generalTotal: sortedAll.length,
      universityPosition,
      universityTotal,
      projectedPosition,
      projectedTotal,
      wouldBeAdmitted,
      uniAdmissionStatus,
      uniSpots,
      projectedUniPosition,
      displacedCount,
      worstCasePosition,
    };
  }, [studentAggregates, userScores, uni, isLoading, getEnrollment, getTotalEnrollment]);

  const trackEvent = (eventName: string) => {
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track(eventName);
    }
  };

  useEffect(() => {
    trackEvent('Thank you page view');
  }, []);

  // Track admission status events
  useEffect(() => {
    if (!positions || userScores.completedExams === 0) return;
    
    // Track admission status
    if (userScores.fullyQualified) {
      if (positions.wouldBeAdmitted) {
        if (positions.uniAdmissionStatus === 'guaranteed') {
          trackEvent('Status: Ammesso nella sede');
        } else {
          trackEvent('Status: Ammesso ma non nella sede');
        }
      } else {
        trackEvent('Status: Fuori dal numero di posti');
      }
    } else if (userScores.allPassed && !userScores.hasFailedExam) {
      trackEvent('Status: Esami da completare');
    } else {
      trackEvent('Status: Non idoneo');
    }
    
    // Track motivational messages shown
    if (userScores.fullyQualified && positions.wouldBeAdmitted && positions.uniAdmissionStatus === 'guaranteed') {
      trackEvent('Motivational: Congratulazioni ammesso');
    } else if (userScores.fullyQualified && positions.wouldBeAdmitted && positions.uniAdmissionStatus !== 'guaranteed') {
      trackEvent('Motivational: Migliora per la sede');
    } else if (userScores.allPassed && !userScores.hasFailedExam) {
      trackEvent('Motivational: Esami da completare');
    } else if (userScores.hasFailedExam) {
      trackEvent('Motivational: Non arrenderti');
    }
  }, [positions, userScores]);

  const handleCopyLink = async () => {
    trackEvent('Share: Copy link');
    try {
      await navigator.clipboard.writeText(SURVEY_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsAppShare = () => {
    trackEvent('Share: WhatsApp');
    const url = `https://wa.me/?text=${encodeURIComponent(SHARE_MESSAGE)}`;
    window.open(url, '_blank');
  };

  const handleTelegramShare = () => {
    trackEvent('Share: Telegram');
    const url = `https://t.me/share/url?url=${encodeURIComponent(SURVEY_URL)}&text=${encodeURIComponent('Hai sostenuto gli esami del semestre filtro? Compila questo breve sondaggio anonimo per aiutare tutti a capire come stanno andando le graduatorie! 📊\n\n📈 Guarda le statistiche: ' + HOME_URL)}`;
    window.open(url, '_blank');
  };

  const hasScores = userScores.completedExams > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col">
      {/* Top Disclaimer */}
      <div className="bg-amber-100 border-b border-amber-200 px-4 py-2">
        <p className="text-center text-xs text-amber-700 flex items-center justify-center gap-1.5">
          <AlertTriangle className="h-3 w-3" />
          <span className="hidden sm:inline">sito non ufficiale - i dati potrebbero essere non aggiornati o incompleti</span>
          <span className="sm:hidden">sito non ufficiale - i dati potrebbero essere incompleti</span>
        </p>
      </div>


      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-xl border-purple-100">
          <CardContent className="pt-5 pb-5 px-5 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="h-6 w-6 text-purple-600" fill="currentColor" />
            </div>
            
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              Grazie per aver compilato il sondaggio!
            </h1>
            
            <p className="text-gray-600 mb-3 text-sm">
              <span className="font-semibold text-purple-700">Condividi il sondaggio con i tuoi compagni</span> per rendere i dati più utili e completi! 💜
            </p>

            <div className="flex gap-2 mb-4">
              <Button
                onClick={handleWhatsAppShare}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>

              <Button
                onClick={handleTelegramShare}
                size="icon"
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>

              <Button
                onClick={handleCopyLink}
                size="icon"
                variant="outline"
                className="border-purple-200 hover:bg-purple-50"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Position Estimates Section - Compact with dividers */}
            {hasScores && !isLoading && positions && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {/* Exam scores display */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`rounded-md px-2 py-1.5 text-center ${userScores.fisica && userScores.fisica >= 17.5 ? 'bg-green-50 border border-green-200' : userScores.fisica ? 'bg-red-50 border border-red-200' : 'bg-gray-100 border border-gray-200'}`}>
                      <p className="text-[9px] text-gray-500 font-medium">Fisica</p>
                      <p className={`text-base font-bold ${userScores.fisica && userScores.fisica >= 17.5 ? 'text-green-700' : userScores.fisica ? 'text-red-600' : 'text-gray-400'}`}>
                        {userScores.fisica ? userScores.fisica.toFixed(1) : '—'}
                      </p>
                    </div>
                    <div className={`rounded-md px-2 py-1.5 text-center ${userScores.chimica && userScores.chimica >= 17.5 ? 'bg-green-50 border border-green-200' : userScores.chimica ? 'bg-red-50 border border-red-200' : 'bg-gray-100 border border-gray-200'}`}>
                      <p className="text-[9px] text-gray-500 font-medium">Chimica</p>
                      <p className={`text-base font-bold ${userScores.chimica && userScores.chimica >= 17.5 ? 'text-green-700' : userScores.chimica ? 'text-red-600' : 'text-gray-400'}`}>
                        {userScores.chimica ? userScores.chimica.toFixed(1) : '—'}
                      </p>
                    </div>
                    <div className={`rounded-md px-2 py-1.5 text-center ${userScores.biologia && userScores.biologia >= 17.5 ? 'bg-green-50 border border-green-200' : userScores.biologia ? 'bg-red-50 border border-red-200' : 'bg-gray-100 border border-gray-200'}`}>
                      <p className="text-[9px] text-gray-500 font-medium">Biologia</p>
                      <p className={`text-base font-bold ${userScores.biologia && userScores.biologia >= 17.5 ? 'text-green-700' : userScores.biologia ? 'text-red-600' : 'text-gray-400'}`}>
                        {userScores.biologia ? userScores.biologia.toFixed(1) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Positions grid - only show projected for eligible students */}
                  <div className={`grid gap-1.5 ${
                    userScores.allPassed 
                      ? (uni && positions.universityPosition ? 'grid-cols-3' : 'grid-cols-2')
                      : (uni && positions.universityPosition ? 'grid-cols-2' : 'grid-cols-1')
                  }`}>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[9px] text-gray-500">
                        <Trophy className="h-2.5 w-2.5" />
                        <span>Generale</span>
                      </div>
                      <p className="text-base font-bold text-gray-700">
                        {positions.generalPosition}°<span className="text-[10px] font-normal text-gray-500">/{positions.generalTotal.toLocaleString()}</span>
                      </p>
                    </div>

                    {uni && positions.universityPosition && positions.universityTotal && (
                      <div className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-[9px] text-gray-500">
                          <MapPin className="h-2.5 w-2.5" />
                          <span>{formatUniversityName(uni)}</span>
                        </div>
                        <p className="text-base font-bold text-gray-700">
                          {positions.universityPosition}°<span className="text-[10px] font-normal text-gray-500">/{positions.universityTotal.toLocaleString()}</span>
                        </p>
                      </div>
                    )}

                    {/* Only show projected position for eligible students */}
                    {userScores.allPassed && (
                      <div className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-[9px] text-gray-500">
                          <Users className="h-2.5 w-2.5" />
                          <span>Proiettata</span>
                        </div>
                        <p className="text-base font-bold text-gray-700">
                          ~{positions.projectedPosition.toLocaleString()}°
                          {positions.projectedTotal && <span className="text-[10px] font-normal text-gray-500">/~{positions.projectedTotal.toLocaleString()}</span>}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator className="my-2" />

                  {/* Final status - all cases */}
                  {userScores.fullyQualified ? (
                    // Case: Fully qualified (all 3 exams ≥18) - Combined admission block
                    <>
                      <div className={`border-2 rounded-lg p-3 text-center ${
                        positions.wouldBeAdmitted 
                          ? (positions.uniAdmissionStatus === 'guaranteed'
                              ? 'bg-green-50 border-green-400'
                              : 'bg-amber-50 border-amber-400')
                          : 'bg-red-50 border-red-400'
                      }`}>
                        {positions.wouldBeAdmitted ? (
                          <>
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-semibold text-green-700">
                                Secondo le nostre stime sei ammesso
                              </span>
                            </div>
                            {uni && positions.uniSpots && (
                              <p className={`text-xs ${
                                positions.uniAdmissionStatus === 'guaranteed' 
                                  ? 'text-green-600'
                                  : 'text-amber-700'
                              }`}>
                                {positions.uniAdmissionStatus === 'guaranteed' 
                                  ? `probabilmente a ${formatUniversityName(uni)}`
                                  : `ma probabilmente non a ${formatUniversityName(uni)}`}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="text-sm font-semibold text-red-700">Fuori dal numero di posti ({TOTAL_SPOTS.toLocaleString()})</span>
                          </div>
                        )}
                      </div>
                      {/* Congratulations for guaranteed admission */}
                      {positions.wouldBeAdmitted && positions.uniAdmissionStatus === 'guaranteed' && (
                        <>
                          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-4 text-center mt-3">
                            <p className="text-sm font-medium text-green-800 leading-relaxed">
                              🎉 <strong className="text-green-900">Sembra che tu ce l'abbia fatta!</strong>
                            </p>
                            <p className="text-sm text-green-700 mt-2 leading-relaxed">
                              Secondo le nostre stime, dovresti essere ammesso. Inizia ora un percorso bellissimo e impegnativo — sarai il medico che avresti voluto incontrare. In bocca al lupo! 🩺💚
                            </p>
                            <p className="text-[10px] text-green-600/70 mt-2 italic">
                              Ricorda: questa è solo una stima basata sui dati raccolti. La graduatoria ufficiale potrebbe differire.
                            </p>
                          </div>
                          {/* Reminder for retake/survey */}
                          <div className="bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 rounded-xl p-3 text-center mt-3">
                            <p className="text-xs text-cyan-700 leading-relaxed">
                              {afterSecondExam ? (
                                <>📅 <strong>Hai sostenuto il secondo appello?</strong> Ti aspettiamo il <strong>23 dicembre</strong> (quando usciranno gli esiti) per aggiornare i tuoi dati — ogni risposta rende le stime più affidabili per tutti! 🤗💜</>
                              ) : (
                                <>📅 <strong>Vuoi alzare la media?</strong> Se deciderai di ritentare uno o più esami il 10 dicembre, ti aspettiamo il <strong>23 dicembre</strong> (quando usciranno gli esiti) per aggiornare i tuoi dati — ogni risposta rende le stime più affidabili per tutti! 🤗💜</>
                              )}
                            </p>
                          </div>
                        </>
                      )}
                      {/* Reminder for fuori dal numero di posti */}
                      {!positions.wouldBeAdmitted && (
                        <div className="bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 rounded-xl p-3 text-center mt-3">
                          <p className="text-xs text-cyan-700 leading-relaxed">
                            {afterSecondExam ? (
                              <>📅 <strong>Hai sostenuto il secondo appello?</strong> Torna il <strong>23 dicembre</strong> (quando usciranno gli esiti) per aggiornare i tuoi dati — ci aiuterai a tenere aggiornate le stime per tutti! 🤗</>
                            ) : (
                              <>📅 Se sosterrai il secondo appello, ti aspettiamo il <strong>23 dicembre</strong> (quando usciranno gli esiti) per aggiornare i tuoi dati — ci aiuterai a tenere aggiornate le stime per tutti! 🤗</>
                            )}
                          </p>
                        </div>
                      )}
                    </>
                  ) : userScores.allPassed && !userScores.hasFailedExam ? (
                    // Case: All taken exams are ≥18 but not all 3 done yet
                    <>
                      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="h-5 w-5 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-700">
                            Devi ancora sostenere {3 - userScores.completedExams} {userScores.completedExams === 2 ? 'esame' : 'esami'} per essere ammesso
                          </span>
                        </div>
                      </div>
                      {/* Motivational message for pending exams */}
                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-xl p-4 text-center mt-3">
                        <p className="text-sm font-medium text-purple-800 leading-relaxed">
                          {afterSecondExam ? (
                            <>💪 <strong className="text-purple-900">Esame sostenuto!</strong></>
                          ) : (
                            <>💪 <strong className="text-purple-900">Prossimo appello: 10 dicembre!</strong> (esiti il 23 dicembre)</>
                          )}
                        </p>
                        <p className="text-sm text-purple-700 mt-2 leading-relaxed">
                          {afterSecondExam ? (
                            <>Hai già dimostrato di avere le capacità per farcela — ora non ti resta che aspettare gli esiti del 23 dicembre. Tieni duro, sei quasi al traguardo! 🌟</>
                          ) : (
                            <>Hai già dimostrato di avere tutte le capacità per farcela. Ogni esame superato è una conquista enorme — sei più vicino di quanto pensi! 🌟</>
                          )}
                        </p>
                      </div>
                      {/* Reminder for December 23 survey */}
                      <div className="bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 rounded-xl p-3 text-center mt-3">
                        <p className="text-xs text-cyan-700 leading-relaxed">
                          {afterSecondExam ? (
                            <>📅 <strong>Hai sostenuto il secondo appello?</strong> Torna il <strong>23 dicembre</strong> (quando usciranno gli esiti) per aggiornare i tuoi dati — ci aiuterai a tenere aggiornate le stime per tutti! 🤗</>
                          ) : (
                            <>📅 Se sosterrai il secondo appello, ti aspettiamo il <strong>23 dicembre</strong> (quando usciranno gli esiti) per aggiornare i tuoi dati — ci aiuterai a tenere aggiornate le stime per tutti! 🤗</>
                          )}
                        </p>
                      </div>
                    </>
                  ) : (
                    // Case: Not qualified (at least one exam <18)
                    <>
                      <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-semibold text-red-700">Non idoneo (voto &lt;18 in almeno un esame)</span>
                        </div>
                      </div>
                      {/* Motivational message for failed exam */}
                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-xl p-4 text-center mt-3">
                        <p className="text-sm font-medium text-purple-800 leading-relaxed">
                          🔥 <strong className="text-purple-900">Non arrenderti!</strong>
                        </p>
                        <p className="text-sm text-purple-700 mt-2 leading-relaxed">
                          Il 10 dicembre hai una nuova occasione. Tantissimi studenti ce l'hanno fatta al secondo tentativo — questo percorso è difficile per tutti, ma tu hai la forza per superarlo. Credi in te stesso! 💜
                        </p>
                      </div>
                      {/* Reminder for December 23 survey */}
                      <div className="bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 rounded-xl p-3 text-center mt-3">
                        <p className="text-xs text-cyan-700 leading-relaxed">
                          {afterSecondExam ? (
                            <>📅 <strong>Hai sostenuto il secondo appello?</strong> Torna il <strong>23 dicembre</strong> (quando usciranno gli esiti) per aggiornare i tuoi dati — ci aiuterai a tenere aggiornate le stime per tutti! 🤗</>
                          ) : (
                            <>📅 Se sosterrai il secondo appello, ti aspettiamo il <strong>23 dicembre</strong> (quando usciranno gli esiti) per aggiornare i tuoi dati — ci aiuterai a tenere aggiornate le stime per tutti! 🤗</>
                          )}
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* Motivational message for eligible but not at preferred uni */}
                  {userScores.fullyQualified && positions.wouldBeAdmitted && uni && positions.uniAdmissionStatus !== 'guaranteed' && (
                    <>
                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-xl p-4 text-center mt-3">
                        <p className="text-sm font-medium text-purple-800 leading-relaxed">
                          {afterSecondExam ? (
                            <>🎯 <strong className="text-purple-900">Hai ritentato per {formatUniversityName(uni)}?</strong></>
                          ) : (
                            <>🎯 <strong className="text-purple-900">Vuoi entrare a {formatUniversityName(uni)}?</strong></>
                          )}
                        </p>
                        <p className="text-sm text-purple-700 mt-2 leading-relaxed">
                          {afterSecondExam ? (
                            <>Hai fatto la tua parte — aspetta gli esiti del 23 dicembre e incrocia le dita! Ogni punto guadagnato ti avvicina al tuo obiettivo. 🚀</>
                          ) : (
                            <>Il 10 dicembre puoi migliorare il tuo punteggio (esiti il 23 dicembre)! Ogni punto in più ti avvicina alla tua università dei sogni. Ce la puoi fare! 🚀</>
                          )}
                        </p>
                      </div>
                      {/* Reminder for December 23 survey */}
                      <div className="bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 rounded-xl p-3 text-center mt-3">
                        <p className="text-xs text-cyan-700 leading-relaxed">
                          {afterSecondExam ? (
                            <>📅 <strong>Hai sostenuto il secondo appello?</strong> Torna il <strong>23 dicembre</strong> (quando usciranno gli esiti) per aggiornare i tuoi dati — ci aiuterai a tenere aggiornate le stime per tutti! 🤗</>
                          ) : (
                            <>📅 Se sosterrai il secondo appello, ti aspettiamo il <strong>23 dicembre</strong> (quando usciranno gli esiti) per aggiornare i tuoi dati — ci aiuterai a tenere aggiornate le stime per tutti! 🤗</>
                          )}
                        </p>
                      </div>
                    </>
                  )}

                  <p className="text-[9px] text-gray-400 text-center">
                    * Stime basate sui sondaggi, non graduatoria ufficiale.
                  </p>
                </div>
                <Separator className="my-4" />
              </>
            )}

            {isLoading && hasScores && (
              <div className="mb-4 py-2">
                <p className="text-xs text-gray-500">Calcolo posizione...</p>
              </div>
            )}

            {formattedId && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                  <p className="text-xs text-blue-700">
                    ⏱️ I tuoi risultati saranno visibili sul sito entro <strong>5 minuti</strong>.
                  </p>
                </div>
            
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600 mb-1">Il tuo codice identificativo anonimo:</p>
                  <code className="block bg-white px-3 py-1.5 rounded-md text-base font-mono font-bold text-purple-700 border border-purple-200 mb-1.5">
                    {formattedId}
                  </code>
                  <p className="text-xs text-gray-500">
                    Se vuoi, salvalo per ritrovarti nella colonna "etichetta".
                  </p>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-gray-100">
              <Link 
                to="/" 
                className="text-sm text-purple-600 hover:text-purple-800 hover:underline"
                onClick={() => trackEvent('Share page: Go to dashboard')}
              >
                ← Vai alla dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-3xl mx-auto text-center space-y-1.5">
            <p className="text-xs text-gray-500">
              <strong>Disclaimer:</strong> Questo sito <strong>non è ufficiale</strong> e non è affiliato in alcun modo con il Ministero dell'Università e della Ricerca, Universitaly o qualsiasi università.
            </p>
            <p className="text-[10px] text-gray-500">
              I dati grezzi sono recuperati pubblicamente da{" "}
              <a 
                href="https://www.universitaly.it" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-gray-700 transition-colors"
              >
                universitaly.it
              </a>
              ; alcuni dati provengono da sondaggi svolti direttamente da noi o dai rappresentanti delle varie università.
              Non viene fornita alcuna garanzia di accuratezza, completezza o affidabilità dei dati presentati. 
              Il sito è realizzato senza alcun fine di lucro, esclusivamente a scopo informativo e di aggregazione.
            </p>
            <p className="text-[10px] text-gray-500">
              Per segnalazioni, errori o suggerimenti, scrivi a{" "}
              <a 
                href="mailto:semestrefiltro2025@atomicmail.io"
                className="underline hover:text-gray-700 transition-colors"
              >
                semestrefiltro2025@atomicmail.io
              </a>
              {" "}o apri un issue su{" "}
              <a 
                href="https://github.com/graduatoriasemestrefiltro/graduatoriasemestrefiltro.github.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline hover:text-gray-700 transition-colors"
              >
                <Github className="h-3 w-3" />
                GitHub
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GrazieSondaggio;
