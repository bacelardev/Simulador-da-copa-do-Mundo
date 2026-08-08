import { useState, useEffect, useRef } from 'react';
import { Match, MatchEvent, NationalTeam } from '../types';
import { getTeamById } from '../utils/simulator';
import { X, Play, Pause, FastForward, Trophy, Clock, Check, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Flag from './Flag';

interface LiveMatchSimulatorModalProps {
  match: Match;
  favoriteTeamId: string | null;
  onClose: () => void;
  onComplete: (updatedMatch: Match) => void;
}

interface PenaltyKick {
  round: number;
  teamIndex: 'A' | 'B';
  teamName: string;
  code: string;
  success: boolean;
  scoreA: number;
  scoreB: number;
  finished: boolean;
}

export default function LiveMatchSimulatorModal({ 
  match, 
  favoriteTeamId, 
  onClose, 
  onComplete 
 }: LiveMatchSimulatorModalProps) {
  // Local mutable copy of match state to support interactive real-time results manipulation
  const [liveMatch, setLiveMatch] = useState<Match>(match);

  const teamA = getTeamById(liveMatch.teamAId);
  const teamB = getTeamById(liveMatch.teamBId);
  const isFavA = teamA.id === favoriteTeamId;
  const isFavB = teamB.id === favoriteTeamId;

  // Simulation controls
  const [minute, setMinute] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2 | 4 | 99>(2); // Ticking multipliers, 99 = Instant
  const [isRegulationFinished, setIsRegulationFinished] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'stats'>('simulation');

  // Penalties tracking
  const [isShootoutPhase, setIsShootoutPhase] = useState(false);
  const [penaltyKicks, setPenaltyKicks] = useState<PenaltyKick[]>([]);
  const [currentPenaltyIndex, setCurrentPenaltyIndex] = useState(-1);
  const [isShootoutFinished, setIsShootoutFinished] = useState(false);

  // Goal overlay feedback
  const [goalOverlay, setGoalOverlay] = useState<{
    show: boolean;
    teamName: string;
    flag: string;
    minute: number;
    scorer: string;
  } | null>(null);

  // Technical substitutions/controls state
  const [substitutionState, setSubstitutionState] = useState<'idle' | 'choosing' | 'applied'>('idle');
  const [subOutPlayer, setSubOutPlayer] = useState<string>('');
  const [subInPlayer, setSubInPlayer] = useState<string>('');
  const [subResult, setSubResult] = useState<'up' | 'down' | null>(null);
  const [selectedInstruction, setSelectedInstruction] = useState<'ofensivo' | 'equilibrado' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Stats
  const rawStats = liveMatch.stats || {
    possessionA: 50,
    possessionB: 50,
    shotsA: 10,
    shotsB: 10,
    foulsA: 12,
    foulsB: 12,
    cornersA: 5,
    cornersB: 5
  };

  // Safe accessor for live scores
  const getLiveScore = () => {
    let scoreA = 0;
    let scoreB = 0;
    
    // Sum goals occurring up to the current minute
    const pastGoals = (liveMatch.events || []).filter(
      ev => ev.type === 'goal' && ev.minute <= minute
    );
    
    pastGoals.forEach(g => {
      if (g.teamId === liveMatch.teamAId) scoreA++;
      if (g.teamId === liveMatch.teamBId) scoreB++;
    });

    return { scoreA, scoreB };
  };

  const { scoreA: liveScoreA, scoreB: liveScoreB } = getLiveScore();

  // Load events
  const allEvents = liveMatch.events || [];
  const currentEvents = allEvents.filter(ev => ev.minute <= minute);

  // Initiate tactical selection
  const handleInitiateSubstitution = () => {
    const favTeamObj = isFavA ? teamA : teamB;
    
    // Select random active mid/attacker from team to go out
    const activeForwardMid = favTeamObj.players.filter(p => p.position === 'Atacante' || p.position === 'Meio-Campista');
    const randomOut = activeForwardMid[Math.floor(Math.random() * activeForwardMid.length)]?.name || 'Titular';
    
    // Select names from squad reserves
    const reserves = [
      'G. Martinelli', 'Endrick', 'João Neves', 'Alex Baena', 'Cole Palmer',
      'Xavi Simons', 'F. Chiesa', 'O. Dembélé', 'L. Sané', 'Gonçalo Ramos',
      'Morata', 'J. Grealish', 'D. Zapata', 'D. Vlahović', 'N. Jackson'
    ];
    const randomIn = reserves[Math.floor(Math.random() * reserves.length)];
    
    setSubOutPlayer(randomOut);
    setSubInPlayer(randomIn);
    setSubstitutionState('choosing');
  };

  // Apply chosen tactical instruction
  const handleApplySubstitution = (instruction: 'ofensivo' | 'equilibrado') => {
    setSelectedInstruction(instruction);
    
    // Probabilistic output: 50% chance of great success (+1 victory level), 50% chance of failure (-1 level)
    const success = Math.random() < 0.50;
    const result = success ? 'up' : 'down';
    setSubResult(result);
    setSubstitutionState('applied');
    
    const favTeamObj = isFavA ? teamA : teamB;
    const oppTeamObj = isFavA ? teamB : teamA;
    
    const nextMatch = { ...liveMatch };
    
    // 1. Inject Substitution Event
    const subEvent: MatchEvent = {
      minute: minute,
      type: 'substitution',
      teamId: favTeamObj.id,
      playerName: `${subOutPlayer} 🔄 ${subInPlayer}`,
      detail: instruction === 'ofensivo' 
        ? `Substituição Tática: Opção por ataque total sob orientação técnica. Sai ${subOutPlayer}, entra o atacante ${subInPlayer}!` 
        : `Substituição Tática: Opção por posse e rigor defensivo. Sai ${subOutPlayer}, entra o volante ${subInPlayer}!`
    };
    
    const updatedEvents = [...(nextMatch.events || []), subEvent];
    
    // 2. Adjust scores, generate goal event and update stats
    if (success) {
      // Sobe 1 ponto -> Favorite team scores a goal!
      if (isFavA) {
        nextMatch.scoreA = (nextMatch.scoreA ?? 0) + 1;
      } else {
        nextMatch.scoreB = (nextMatch.scoreB ?? 0) + 1;
      }
      
      const goalMin = Math.min(89, minute + 2);
      const goalEvent: MatchEvent = {
        minute: goalMin,
        type: 'goal',
        teamId: favTeamObj.id,
        playerName: subInPlayer,
        detail: `⚡ GOL DA SUBSTITUIÇÃO! O recém-entrado ${subInPlayer} aproveita o rebote fantástico pós-instrução e marca!`
      };
      
      updatedEvents.push(goalEvent);
      
      if (nextMatch.stats) {
        if (isFavA) {
          nextMatch.stats.shotsA += 2;
          nextMatch.stats.possessionA = Math.min(65, nextMatch.stats.possessionA + 5);
          nextMatch.stats.possessionB = 100 - nextMatch.stats.possessionA;
        } else {
          nextMatch.stats.shotsB += 2;
          nextMatch.stats.possessionB = Math.min(65, nextMatch.stats.possessionB + 5);
          nextMatch.stats.possessionA = 100 - nextMatch.stats.possessionB;
        }
      }
      
      // Goal flash
      setGoalOverlay({
        show: true,
        teamName: favTeamObj.name,
        flag: favTeamObj.flag,
        minute: goalMin,
        scorer: `${subInPlayer} (Suplente)`
      });
      setTimeout(() => {
        setGoalOverlay(null);
      }, 2000);
      
    } else {
      // Desce 1 ponto -> Opponent team scores a goal!
      if (isFavA) {
        nextMatch.scoreB = (nextMatch.scoreB ?? 0) + 1;
      } else {
        nextMatch.scoreA = (nextMatch.scoreA ?? 0) + 1;
      }
      
      const goalMin = Math.min(89, minute + 3);
      const oppStar = oppTeamObj.players.find(p => p.isStar)?.name || oppTeamObj.players[0].name;
      const goalEvent: MatchEvent = {
        minute: goalMin,
        type: 'goal',
        teamId: oppTeamObj.id,
        playerName: oppStar,
        detail: `⚽ GOL CONTRA-ATAQUE! Erro na transição tática deixa espaço ladeado e ${oppStar} chuta no ângulo!`
      };
      
      updatedEvents.push(goalEvent);
      
      if (nextMatch.stats) {
        if (isFavA) {
          nextMatch.stats.shotsB += 2;
          nextMatch.stats.possessionB = Math.min(65, nextMatch.stats.possessionB + 5);
          nextMatch.stats.possessionA = 100 - nextMatch.stats.possessionB;
        } else {
          nextMatch.stats.shotsA += 2;
          nextMatch.stats.possessionA = Math.min(65, nextMatch.stats.possessionA + 5);
          nextMatch.stats.possessionB = 100 - nextMatch.stats.possessionA;
        }
      }
      
      // Show opponent goal flash
      setGoalOverlay({
        show: true,
        teamName: oppTeamObj.name,
        flag: oppTeamObj.flag,
        minute: goalMin,
        scorer: oppStar
      });
      setTimeout(() => {
        setGoalOverlay(null);
      }, 2000);
    }
    
    updatedEvents.sort((a, b) => a.minute - b.minute);
    nextMatch.events = updatedEvents;
    
    // 3. Recalculate penalties if scores are now drawn or no longer drawn
    const finalScoreA = nextMatch.scoreA ?? 0;
    const finalScoreB = nextMatch.scoreB ?? 0;
    
    if (finalScoreA === finalScoreB) {
      const gkRatingA = teamA.players.find(p => p.position === 'Goleiro')?.rating || 80;
      const gkRatingB = teamB.players.find(p => p.position === 'Goleiro')?.rating || 80;
      const edge = (gkRatingA - gkRatingB) * 0.04 + (teamA.ratingOverall - teamB.ratingOverall) * 0.04;
      const probAWins = 0.5 + Math.max(-0.2, Math.min(0.2, edge));
      
      let pA = 0;
      let pB = 0;
      if (Math.random() < probAWins) {
        pA = 4 + Math.floor(Math.random() * 2);
        pB = pA - 1 - Math.floor(Math.random() * 2);
        if (pB < 0) pB = 0;
      } else {
        pB = 4 + Math.floor(Math.random() * 2);
        pA = pB - 1 - Math.floor(Math.random() * 2);
        if (pA < 0) pA = 0;
      }
      nextMatch.penaltiesA = pA;
      nextMatch.penaltiesB = pB;
      
      if (isShootoutPhase) {
        const sequence = generatePenaltyShootout(pA, pB);
        setPenaltyKicks(sequence);
      }
    } else {
      nextMatch.penaltiesA = undefined;
      nextMatch.penaltiesB = undefined;
      if (isShootoutPhase) {
        setIsShootoutPhase(false);
        setIsShootoutFinished(true);
      }
    }
    
    setLiveMatch(nextMatch);
  };

  // Ticker Interval
  useEffect(() => {
    if (!isPlaying || isRegulationFinished || isShootoutPhase || speed === 99) return;

    let delay = 400; // base speed 400ms per minute (1x)
    if (speed === 2) delay = 200;
    if (speed === 4) delay = 80;

    const intervalId = setInterval(() => {
      setMinute(prev => {
        const nextMin = prev + 1;
        
        // Find if a goal is scored at this specific minute
        const goalEvent = allEvents.find(ev => ev.type === 'goal' && ev.minute === nextMin);
        if (goalEvent) {
          const scoringTeam = goalEvent.teamId === liveMatch.teamAId ? teamA : teamB;
          setGoalOverlay({
            show: true,
            teamName: scoringTeam.name,
            flag: scoringTeam.flag,
            minute: nextMin,
            scorer: goalEvent.playerName
          });
          
          // Flash goal then auto hide after 1.8 seconds
          setTimeout(() => {
            setGoalOverlay(null);
          }, 1800);
        }

        if (nextMin >= 90) {
          clearInterval(intervalId);
          setIsRegulationFinished(true);
          return 90;
        }
        return nextMin;
      });
    }, delay);

    return () => clearInterval(intervalId);
  }, [isPlaying, isRegulationFinished, isShootoutPhase, speed, allEvents, teamA, teamB, liveMatch.teamAId, liveMatch.teamBId]);

  // Handle Regulation Finish & Penalty generation
  useEffect(() => {
    if (isRegulationFinished) {
      const finalScoreA = liveMatch.scoreA ?? 0;
      const finalScoreB = liveMatch.scoreB ?? 0;
      
      if (finalScoreA === finalScoreB && liveMatch.penaltiesA !== undefined && liveMatch.penaltiesB !== undefined) {
        // Tied in knockout -> generate penalty shoot-out steps
        const sequence = generatePenaltyShootout(liveMatch.penaltiesA, liveMatch.penaltiesB);
        setPenaltyKicks(sequence);
        setIsShootoutPhase(true);
        setCurrentPenaltyIndex(0);
      } else {
        setIsShootoutFinished(true);
      }
    }
  }, [isRegulationFinished, liveMatch]);

  // Penalty Shootout Ticker
  useEffect(() => {
    if (!isShootoutPhase || currentPenaltyIndex < 0 || currentPenaltyIndex >= penaltyKicks.length || speed === 99) return;

    const delay = 2000 / (speed === 1 ? 1 : speed === 2 ? 2.5 : 4.5); // moderate shootout speed

    const timer = setTimeout(() => {
      setCurrentPenaltyIndex(prev => {
        const nextIdx = prev + 1;
        if (nextIdx >= penaltyKicks.length) {
          setIsShootoutFinished(true);
        }
        return nextIdx;
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [isShootoutPhase, currentPenaltyIndex, penaltyKicks.length, speed]);

  // Generate a realistic sequence of Penalty shootout steps leading to final scores
  const generatePenaltyShootout = (finalA: number, finalB: number): PenaltyKick[] => {
    const list: PenaltyKick[] = [];
    let accA = 0;
    let accB = 0;

    // Helper to distribute penalty scores
    const genPicks = (totalSuccess: number, len: number): boolean[] => {
      const arr = Array(len).fill(false);
      let count = 0;
      while (count < totalSuccess) {
        const idx = Math.floor(Math.random() * len);
        if (!arr[idx]) {
          arr[idx] = true;
          count++;
        }
      }
      return arr;
    };

    // Standard 5-round kicks
    const kicksCountA = Math.min(5, finalA);
    const kicksCountB = Math.min(5, finalB);

    const successA5 = genPicks(kicksCountA, 5);
    const successB5 = genPicks(kicksCountB, 5);

    // sudden-deaths
    const suddenCount = Math.max(0, Math.max(finalA, finalB) - 5);
    const successSuddenA: boolean[] = [];
    const successSuddenB: boolean[] = [];

    if (suddenCount > 0) {
      for (let i = 0; i < suddenCount - 1; i++) {
        // Sudden death matches goals until final round
        successSuddenA.push(true);
        successSuddenB.push(true);
      }
      // Final round: winner scores, loser misses
      if (finalA > finalB) {
        successSuddenA.push(true);
        successSuddenB.push(false);
      } else {
        successSuddenA.push(false);
        successSuddenB.push(true);
      }
    }

    const allSuccessA = [...successA5, ...successSuddenA];
    const allSuccessB = [...successB5, ...successSuddenB];

    const maxRounds = allSuccessA.length;

    for (let r = 1; r <= maxRounds; r++) {
      const idx = r - 1;
      
      // Team A kicks
      const winA = allSuccessA[idx];
      if (winA) accA++;
      list.push({
        round: r,
        teamIndex: 'A',
        teamName: teamA.name,
        code: teamA.code,
        success: winA,
        scoreA: accA,
        scoreB: accB,
        finished: false
      });

      // Check early mathematical winning stopping (standard 5-rounds rules)
      if (r <= 5) {
        const remainingKicksB = 5 - r + 1; // B has this round + remaining rounds
        const remainingKicksA = 5 - r;
        
        // If A leading cannot be reached by B
        if (accA > accB + remainingKicksB) {
          list[list.length - 1].finished = true;
          break;
        }
        // If B trailing cannot surpass A
        if (accB > accA + remainingKicksA) {
          list[list.length - 1].finished = true;
          break;
        }
      }

      // Team B kicks
      const winB = allSuccessB[idx];
      if (winB) accB++;
      list.push({
        round: r,
        teamIndex: 'B',
        teamName: teamB.name,
        code: teamB.code,
        success: winB,
        scoreA: accA,
        scoreB: accB,
        finished: false
      });

      // Check early stopping again
      if (r <= 5) {
        const remainingKicksA = 5 - r;
        const remainingKicksB = 5 - r;
        if (accA > accB + remainingKicksB) {
          list[list.length - 1].finished = true;
          break;
        }
        if (accB > accA + remainingKicksA) {
          list[list.length - 1].finished = true;
          break;
        }
      }
    }

    // Mark the last element as finished
    if (list.length > 0) {
      list[list.length - 1].finished = true;
    }

    return list;
  };

  // Instant fast forward skip simulation
  const handleInstantComplete = () => {
    setMinute(90);
    setIsRegulationFinished(true);
    
    const finalScoreA = liveMatch.scoreA ?? 0;
    const finalScoreB = liveMatch.scoreB ?? 0;
    if (finalScoreA === finalScoreB && liveMatch.penaltiesA !== undefined && liveMatch.penaltiesB !== undefined) {
      const sequence = generatePenaltyShootout(liveMatch.penaltiesA, liveMatch.penaltiesB);
      setPenaltyKicks(sequence);
      setIsShootoutPhase(true);
      setCurrentPenaltyIndex(sequence.length - 1);
    }
    
    setIsShootoutFinished(true);
    setSpeed(99);
  };

  const handleFinish = () => {
    onComplete(liveMatch);
  };

  // Display scores taking current state into account
  const currentScoreA = isRegulationFinished ? (liveMatch.scoreA ?? 0) : liveScoreA;
  const currentScoreB = isRegulationFinished ? (liveMatch.scoreB ?? 0) : liveScoreB;

  const currentShootout = isShootoutPhase && penaltyKicks.length > 0 && currentPenaltyIndex >= 0
    ? penaltyKicks[Math.min(currentPenaltyIndex, penaltyKicks.length - 1)]
    : null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-3 overflow-y-auto" id="live-simulation-modal">
      <motion.div 
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="galaxy-card rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[92vh] max-h-[800px]"
        id="live-sim-box"
      >
        {/* Header Ribbon */}
        <div className="px-5 py-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest font-black text-red-500">
              Simulação de Jogo Ao Vivo
            </span>
            <span className="text-zinc-600 text-xs">•</span>
            <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-amber-400">
              {match.roundLabel || 'Mata-Mata'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === 'simulation' ? 'bg-amber-500 text-zinc-950 font-black' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Campo & Lances
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === 'stats' ? 'bg-amber-500 text-zinc-950 font-black' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Dados Conjugados
            </button>
          </div>
        </div>

        {/* Dynamic Display of GOL flash banner! */}
        <AnimatePresence>
          {goalOverlay && goalOverlay.show && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 z-40 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="relative mb-2">
                <div className="absolute inset-0 bg-amber-500/30 filter blur-3xl opacity-100 rounded-full w-28 h-28" />
                <span className="text-6xl md:text-7xl block relative z-10 animate-bounce">⚽</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black italic text-emerald-400 leading-none uppercase tracking-tighter drop-shadow-[5px_5px_0_rgba(16,185,129,0.15)]">
                GOOOOOOOOL!
              </h2>
              
              <p className="text-sm font-mono text-slate-400 uppercase tracking-widest mt-2">{goalOverlay.minute}' minutos</p>

              <div className="mt-6 flex items-center justify-center gap-3 bg-slate-900 p-4 px-6 border border-slate-800 rounded-2xl max-w-md shadow-lg">
                <span className="text-2xl">{goalOverlay.flag}</span>
                <div className="text-left">
                  <h4 className="text-xs font-mono uppercase tracking-widest font-black text-cyan-400">{goalOverlay.teamName}</h4>
                  <p className="text-sm font-black text-white">{goalOverlay.scorer}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Container (Live Match Pitch View) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar bg-gradient-to-b from-slate-950/60 to-slate-900/10">
          
          {/* Main scoreboard design */}
          <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
            <div className="grid grid-cols-11 gap-2 items-center relative z-10">
              
              {/* Team A stats overall */}
              <div className="col-span-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="relative">
                    {isFavA && (
                      <div className="absolute -top-3.5 -left-3.5 bg-amber-400 text-slate-950 p-1 rounded-full text-[9px] font-black border border-slate-950 rotate-[-12deg]" title="Favorito">
                        ★ FAV
                      </div>
                    )}
                    <Flag code={teamA.code} fallbackEmoji={teamA.flag} className={`w-14 h-9 sm:w-20 sm:h-12 rounded border shadow ${isFavA ? 'ring-2 ring-amber-500/60 border-amber-500' : 'border-slate-800/80'}`} />
                  </div>
                </div>
                <span className={`text-xs sm:text-sm font-extrabold block truncate ${isFavA ? 'text-amber-300 font-black' : 'text-slate-100'}`}>
                  {teamA.name}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block uppercase mt-0.5">OVR: {teamA.ratingOverall} • ATA: {teamA.ratingAttack}</span>
              </div>

              {/* Central Clock and score numbers */}
              <div className="col-span-3 text-center flex flex-col items-center justify-center">
                {/* Live minute indicator */}
                <span className="text-[10px] font-mono bg-slate-900 px-3 py-1 border border-slate-800 text-slate-300 rounded-full font-bold uppercase flex items-center gap-1 mb-2 tracking-widest leading-none">
                  <Clock className="w-3 h-3 text-amber-500 animate-spin" style={{ animationDuration: isPlaying ? '3s' : '0s' }} />
                  {minute === 90 
                    ? isShootoutPhase 
                      ? "PÊNALTIS" 
                      : "FIM" 
                    : `${minute}' MIN`
                  }
                </span>

                <div className="flex items-center gap-3">
                  <span className={`text-3xl sm:text-5xl font-black font-mono leading-none ${isFavA ? 'text-amber-400' : 'text-slate-100'}`}>{currentScoreA}</span>
                  <span className="text-slate-600 font-black text-xl sm:text-2xl font-mono">:</span>
                  <span className={`text-3xl sm:text-5xl font-black font-mono leading-none ${isFavB ? 'text-amber-400' : 'text-slate-100'}`}>{currentScoreB}</span>
                </div>

                {isShootoutPhase && currentShootout && (
                  <div className="mt-3 flex flex-col items-center bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl">
                    <span className="text-[8px] font-mono font-black uppercase text-amber-400 tracking-widest">Penalidades</span>
                    <span className="text-[15px] font-mono font-black text-white mt-0.5">
                      {currentShootout.scoreA} x {currentShootout.scoreB}
                    </span>
                  </div>
                )}
              </div>

              {/* Team B stats overall */}
              <div className="col-span-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="relative">
                    {isFavB && (
                      <div className="absolute -top-3.5 -right-3.5 bg-amber-400 text-slate-950 p-1 rounded-full text-[9px] font-black border border-slate-950 rotate-[12deg]" title="Favorito">
                        ★ FAV
                      </div>
                    )}
                    <Flag code={teamB.code} fallbackEmoji={teamB.flag} className={`w-14 h-9 sm:w-20 sm:h-12 rounded border shadow ${isFavB ? 'ring-2 ring-amber-500/60 border-amber-500' : 'border-slate-800/80'}`} />
                  </div>
                </div>
                <span className={`text-xs sm:text-sm font-extrabold block truncate ${isFavB ? 'text-amber-300 font-black' : 'text-slate-100'}`}>
                  {teamB.name}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block uppercase mt-0.5">OVR: {teamB.ratingOverall} • ATA: {teamB.ratingAttack}</span>
              </div>
              
            </div>
          </div>

          {/* Symmetrical / Segmented horizontal timeline progress */}
          <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-3.5">
            <div className="flex justify-between items-center text-[9px] uppercase font-mono font-bold text-slate-500">
              <span>Fim do 1º Tempo</span>
              <span className="text-amber-500 font-black tracking-widest uppercase">REGULAR PROGRESS ({minute}/90')</span>
              <span>Fim do 2º Tempo</span>
            </div>

            {/* Soccer field conceptual track */}
            <div className="relative h-7 bg-slate-950 border border-slate-850 rounded-xl overflow-visible">
              {/* Half-way marker */}
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-800 pointer-events-none" />
              
              {/* Visual filling progress */}
              <div 
                className="h-full bg-gradient-to-r from-emerald-600/10 via-emerald-500/25 to-emerald-400/20 rounded-l-xl transition-all duration-300"
                style={{ width: `${(minute / 90) * 100}%` }}
              />

              {/* Goal pins along the tracker */}
              {allEvents.map((ev, idx) => {
                if (ev.type !== 'goal') return null;
                const pos = (ev.minute / 90) * 100;
                
                // Show only if it already occurred
                const isOccurred = ev.minute <= minute;

                return (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: isOccurred ? 1 : 0 }}
                    key={idx}
                    className="absolute -top-1 w-6 h-6 flex items-center justify-center transform -translate-x-1/2 z-20 cursor-help"
                    style={{ left: `${pos}%` }}
                    title={`${ev.playerName} (${ev.minute}')`}
                  >
                    <span className="text-sm filter drop-shadow bg-slate-900 border border-slate-850 rounded-full w-5 h-5 flex items-center justify-center">⚽</span>
                  </motion.div>
                );
              })}

              {/* Glowing Slider Soccer Ball marker */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 z-10 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_12px_#f59e0b] -translate-x-1/2 border border-slate-950 text-[10px]"
                style={{ left: `${(minute / 90) * 100}%` }}
              >
                🏃‍♂️
              </div>
            </div>

            {/* Legend guide */}
            <div className="flex justify-center gap-4 text-[9.5px] font-mono text-slate-500">
              <span className="flex items-center gap-1 font-bold">⚽ Marcador de Gol</span>
              <span className="flex items-center gap-1">🏃‍♂️ Posição Atual do Jogo</span>
            </div>
          </div>

          {/* CONTROLE TÉCNICO PANEL */}
          {!isRegulationFinished && favoriteTeamId && favoriteTeamId !== 'skip_tracking' && (
            <div className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden animate-fade-in" id="controle-tecnico-panel">
              {/* Background visual subtle board grid */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="relative z-10 flex flex-col gap-4">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users-round"><path d="M14 19a6 6 0 0 0-12 0"/><circle cx="8" cy="9" r="4"/><path d="M22 19a6 6 0 0 0-6-6 5.91 5.91 0 0 0-1 .07"/><circle cx="16" cy="7" r="3.5"/></svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-widest text-slate-200 font-extrabold flex items-center gap-1.5 flex-wrap">
                        Área Técnica de {isFavA ? teamA.name : teamB.name}
                        <span className="bg-amber-400 text-slate-950 text-[9px] font-mono font-black px-1.5 py-0.5 rounded border border-slate-950">Controle Técnico</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Adote uma postura e determine se sobe +1 ou desce -1 a chance de vitória de seu time! (Disponível entre os minutos 10 e 80)
                      </p>
                    </div>
                  </div>
                </div>

                {/* State Content Area (Generous Full Width) */}
                <div className="w-full">
                  {substitutionState === 'idle' && (
                    <div className="flex justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={handleInitiateSubstitution}
                        disabled={minute < 10 || minute > 80}
                        className={`w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-550 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-xl transition shadow shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer ${
                          (minute < 10 || minute > 80) ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                        id="start-tactical-substitution"
                      >
                        <span>🔄 Fazer Substituição Aleatória</span>
                      </button>
                    </div>
                  )}

                  {substitutionState === 'choosing' && (
                    <div className="w-full flex flex-col md:flex-row items-stretch md:items-center gap-4">
                      {/* Outgoing & Incoming player info */}
                      <div className="flex-1 bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
                        <div className="text-left font-mono">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">Sai de Campo (Titular):</span>
                          <span className="text-xs font-black text-rose-400">🔴 {subOutPlayer}</span>
                        </div>
                        <span className="text-lg text-slate-600 animate-pulse px-2">➡️</span>
                        <div className="text-right font-mono">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">Entra (Reserva):</span>
                          <span className="text-xs font-black text-emerald-400">🟢 {subInPlayer}</span>
                        </div>
                      </div>

                      {/* Instruction Choice buttons with comfortable widths */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApplySubstitution('ofensivo')}
                          className="px-5 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold uppercase text-[10px] tracking-wider rounded-xl transition flex flex-col items-center justify-center text-center cursor-pointer min-w-[170px] animate-fade-in"
                        >
                          <span>🔥 Postura Ofensiva</span>
                          <span className="text-[8px] font-medium text-rose-300/70 lowercase mt-0.5">Pressão alta [+1 / -1]</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApplySubstitution('equilibrado')}
                          className="px-5 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold uppercase text-[10px] tracking-wider rounded-xl transition flex flex-col items-center justify-center text-center cursor-pointer min-w-[170px] animate-fade-in"
                        >
                          <span>🛡️ Cadenciar Jogo</span>
                          <span className="text-[8px] font-medium text-amber-300/70 lowercase mt-0.5">Rigor tático [+1 / -1]</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {substitutionState === 'applied' && (
                    <div className="w-full animate-fade-in">
                      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                        subResult === 'up' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-0.5 shrink-0">{subResult === 'up' ? '📈' : '📉'}</span>
                          <div>
                            <span className="font-extrabold uppercase font-mono tracking-wider text-[11px] block">
                              {subResult === 'up' 
                                ? 'Substituição Brilhante! (+1 Chance de Vitória)' 
                                : 'Alteração Desastrosa! (-1 Chance de Vitória)'}
                            </span>
                            <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                              {subResult === 'up' 
                                ? `A entrada de ${subInPlayer} surtiu efeito imediato marcando o gol de vantagem!` 
                                : `A saída de ${subOutPlayer} desestruturou o posicionamento e permitiu o gol adversário.`}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-[9px] font-black uppercase bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 shrink-0 self-end sm:self-auto">
                          {selectedInstruction === 'ofensivo' ? 'Foco Ofensivo' : 'Rigor Defensivo'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Conditional tab displaying: Simulation Feed or Conjugated Stats */}
          {activeTab === 'simulation' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Live comments feed and cards */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col h-[280px]">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-black border-b border-slate-850 pb-2 mb-3 flex items-center gap-1.5 shrink-0">
                  <Activity className="h-4 w-4 text-amber-500 animate-pulse" />
                  <span>Crônica de Lances ({currentEvents.length})</span>
                </h4>

                <div 
                  ref={containerRef}
                  className="flex-1 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar"
                >
                  {currentEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs italic text-center">
                      Estágio de aquecimento. A bota rolará a qualquer segundo!
                    </div>
                  ) : (
                    currentEvents.map((ev, idx) => {
                      const isEvTeamA = ev.teamId === match.teamAId;
                      const teamIcon = isEvTeamA ? teamA.flag : teamB.flag;
                      const hasFavInvolved = ev.teamId === favoriteTeamId;
                      
                      return (
                        <div 
                          key={idx} 
                          className={`p-2.5 rounded-xl border flex gap-3 text-xs items-start transition-all ${
                            ev.type === 'goal'
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : hasFavInvolved
                                ? 'bg-amber-500/[0.04] border-amber-550/20'
                                : 'bg-slate-950/30 border-slate-850/60'
                          }`}
                          id={`live-event-${idx}`}
                        >
                          <span className="font-mono text-xs font-black text-slate-400 shrink-0 w-8 text-right bg-slate-900 border border-slate-850/50 px-1.5 py-0.5 rounded">
                            {ev.minute}'
                          </span>

                          <span className="text-sm shrink-0 mt-0.5">{teamIcon}</span>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-1.5">
                              {ev.type === 'goal' && (
                                <span className="text-[10px] font-black uppercase text-emerald-400 mr-1 animate-pulse">⚽ GOL!</span>
                              )}
                              {ev.type === 'yellow_card' && (
                                <span className="bg-amber-500 w-2 h-3.5 rounded-sm inline-block shrink-0" title="Cartão Amarelo" />
                              )}
                              {ev.type === 'red_card' && (
                                <span className="bg-rose-500 w-2 h-3.5 rounded-sm inline-block shrink-0 animate-pulse" title="Cartão Vermelho direto" />
                              )}
                              <span className="font-black text-slate-200">{ev.playerName}</span>
                            </div>

                            {ev.detail && (
                              <p className="text-[10.5px] text-slate-400 leading-relaxed">{ev.detail}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Penalty shoot-out visual steps list */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col h-[280px]">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-black border-b border-slate-850 pb-2 mb-3 flex items-center gap-1.5 shrink-0">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span>Cobranças Alternada</span>
                </h4>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {!isShootoutPhase ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center italic p-4 space-y-2">
                      <HelpCircle className="h-6 w-6 text-slate-600" />
                      <p>Caso a partida empatar no tempo regulamentar, a disputa por pênaltis será listada aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {penaltyKicks.slice(0, currentPenaltyIndex + 1).map((k, idx) => {
                        const isFavTeam = (k.teamIndex === 'A' && isFavA) || (k.teamIndex === 'B' && isFavB);
                        return (
                          <div 
                            key={idx}
                            className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                              k.success 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                            } ${isFavTeam ? 'ring-1 ring-amber-500/30' : ''}`}
                          >
                            <span className="font-semibold font-mono text-[9px] uppercase tracking-wider text-slate-500">
                              Round {k.round} ({k.teamIndex})
                            </span>
                            
                            <span className={`font-black ${isFavTeam ? 'text-amber-400' : 'text-slate-200'}`}>
                              {k.teamName}
                            </span>
                            
                            <span className="font-mono font-black uppercase text-[10px] tracking-wide shrink-0">
                              {k.success ? '⚽ GOL SUCESSO' : '❌ ERRO DEFENDA'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Conjugated Match stats graphs */
            <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 flex flex-col space-y-5 justify-center">
              {/* Possession comparison */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className={`${isFavA ? 'text-amber-400 font-bold' : ''}`}>{rawStats.possessionA}% {teamA.name}</span>
                  <span className="uppercase font-bold text-slate-500 tracking-wider">Posse de Bola</span>
                  <span className={`${isFavB ? 'text-amber-400 font-bold' : ''}`}>{rawStats.possessionB}% {teamB.name}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 border border-slate-850 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${rawStats.possessionA}%` }} />
                  <div className="bg-sky-500 h-full" style={{ width: `${rawStats.possessionB}%` }} />
                </div>
              </div>

              {/* Shots comparison */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className={`${isFavA ? 'text-amber-400 font-bold' : ''}`}>{rawStats.shotsA} remates</span>
                  <span className="uppercase font-bold text-slate-500 tracking-wider">Chutes a Gol</span>
                  <span className={`${isFavB ? 'text-amber-400 font-bold' : ''}`}>{rawStats.shotsB} remates</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 border border-slate-850 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${rawStats.shotsA + rawStats.shotsB > 0 ? (rawStats.shotsA / (rawStats.shotsA + rawStats.shotsB)) * 100 : 50}%` }} />
                  <div className="bg-sky-500 h-full" style={{ width: `${rawStats.shotsA + rawStats.shotsB > 0 ? (rawStats.shotsB / (rawStats.shotsA + rawStats.shotsB)) * 100 : 50}%` }} />
                </div>
              </div>

              {/* Corners comparison */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className={`${isFavA ? 'text-amber-400 font-bold' : ''}`}>{rawStats.cornersA} cantos</span>
                  <span className="uppercase font-bold text-slate-500 tracking-wider">Escanteios</span>
                  <span className={`${isFavB ? 'text-amber-400 font-bold' : ''}`}>{rawStats.cornersB} cantos</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 border border-slate-850 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${rawStats.cornersA + rawStats.cornersB > 0 ? (rawStats.cornersA / (rawStats.cornersA + rawStats.cornersB)) * 100 : 50}%` }} />
                  <div className="bg-sky-500 h-full" style={{ width: `${rawStats.cornersA + rawStats.cornersB > 0 ? (rawStats.cornersB / (rawStats.cornersA + rawStats.cornersB)) * 100 : 50}%` }} />
                </div>
              </div>

              {/* Fouls comparison */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className={`${isFavA ? 'text-amber-400 font-bold' : ''}`}>{rawStats.foulsA} infrações</span>
                  <span className="uppercase font-bold text-slate-500 tracking-wider">Faltas</span>
                  <span className={`${isFavB ? 'text-amber-400 font-bold' : ''}`}>{rawStats.foulsB} infrações</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 border border-slate-850 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${rawStats.foulsA + rawStats.foulsB > 0 ? (rawStats.foulsA / (rawStats.foulsA + rawStats.foulsB)) * 100 : 50}%` }} />
                  <div className="bg-sky-500 h-full" style={{ width: `${rawStats.foulsB / (rawStats.foulsA + rawStats.foulsB) * 100}%` }} />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer controls & speeds */}
        <div className="p-4 bg-slate-950 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Leftside current status actions */}
          <div className="flex items-center gap-3 shrink-0">
            {(!isRegulationFinished || (isShootoutPhase && !isShootoutFinished)) ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 text-xs uppercase cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4.5 w-4.5" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4.5 w-4.5 fill-slate-950" />
                      <span>Retomar</span>
                    </>
                  )}
                </button>
                
                {/* Speed Controls */}
                <div className="flex items-center bg-slate-900 border border-slate-850 p-1 rounded-xl">
                  <button
                    onClick={() => setSpeed(1)}
                    className={`px-2 py-1 text-[9.5px] uppercase font-mono font-bold rounded-lg transition-all ${
                      speed === 1 ? 'bg-slate-800 text-amber-500 font-black' : 'text-slate-500'
                    }`}
                  >
                    1X
                  </button>
                  <button
                    onClick={() => setSpeed(2)}
                    className={`px-2 py-1 text-[9.5px] uppercase font-mono font-bold rounded-lg transition-all ${
                      speed === 2 ? 'bg-slate-800 text-amber-500 font-black' : 'text-slate-500'
                    }`}
                  >
                    2X
                  </button>
                  <button
                    onClick={() => setSpeed(4)}
                    className={`px-2 py-1 text-[9.5px] uppercase font-mono font-bold rounded-lg transition-all ${
                      speed === 4 ? 'bg-slate-800 text-amber-500 font-black' : 'text-slate-500'
                    }`}
                  >
                    4X
                  </button>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Simulação Finalizada!</span>
              </div>
            )}
          </div>

          {/* Rightside complete skipping action */}
          <div className="flex items-center gap-2">
            {!isRegulationFinished || (isShootoutPhase && !isShootoutFinished) ? (
              <button
                type="button"
                onClick={handleInstantComplete}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold uppercase tracking-wider text-[10.5px] rounded-xl border border-slate-800 flex items-center gap-1.5 cursor-pointer"
                id="skip-simulation-btn"
              >
                <FastForward className="h-4 w-4" />
                <span>Pular para o Fim</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-550 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black uppercase tracking-wider text-[11px] rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer"
                id="finish-live-simulation-btn"
              >
                Confirmar e Avançar
              </button>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}

function Activity(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
