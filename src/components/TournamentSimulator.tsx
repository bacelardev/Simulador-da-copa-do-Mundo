import { useState, useEffect, useRef, MouseEvent } from 'react';
import { TournamentState, Match, Group } from '../types';
import { TEAMS_DATA } from '../data/teams';
import { 
  initializeTournament, 
  simulateMatch, 
  processAllGroupStandings, 
  generateR32,
  generateOitavas,
  generateQuartas, 
  generateSemifinais, 
  generateFinalAndThird,
  getTeamById,
  OFFICIAL_GROUPS_CONFIG,
  findTeamIdByExactOrSimilarName
} from '../utils/simulator';
import MatchDetailModal from './MatchDetailModal';
import LiveMatchSimulatorModal from './LiveMatchSimulatorModal';
import { Trophy, HelpCircle, ArrowRight, Play, RefreshCw, Layers, Sparkles, CheckCircle2, Network, GitCommit, GitMerge, Check, X, Info, Activity, ShieldAlert, ZoomIn, ZoomOut, Maximize2, RotateCw, Smartphone, Cloud, CloudUpload, CloudDownload, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Flag from './Flag';
import ConfettiEffect from './ConfettiEffect';
import { 
  saveTournamentProgress, 
  subscribeSavedTournaments, 
  deleteSavedTournament, 
  saveMatchResult, 
  SavedTournament 
} from '../services/firebaseService';

export default function TournamentSimulator() {
  const [chosenMode, setChosenMode] = useState<'classic' | 'official' | null>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('tournament_mode') as 'classic' | 'official') || null;
    }
    return null;
  });

  const [state, setState] = useState<TournamentState>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('tournament_mode') as 'classic' | 'official' || 'classic';
      return initializeTournament(savedMode);
    }
    return initializeTournament();
  });
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeBracketTab, setActiveBracketTab] = useState<'r32' | 'oitavas' | 'quartas' | 'semis' | 'finais'>('r32');
  const [viewMode, setViewMode] = useState<'symmetric_bracket' | 'visual_cards'>('symmetric_bracket');
  const [zoom, setZoom] = useState<number>(0.75);

  // Scroller ref & Drag-to-pan state for bracket responsiveness
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  // Screen orientation lock & landscape mode state
  const [isLandscapeLocked, setIsLandscapeLocked] = useState(false);
  const [orientationToast, setOrientationToast] = useState<string | null>(null);

  // Firebase Cloud Sync & Storage state
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [savedTournaments, setSavedTournaments] = useState<SavedTournament[]>([]);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'idle'>('idle');
  const [customSaveName, setCustomSaveName] = useState('');
  const [cloudToast, setCloudToast] = useState<string | null>(null);

  const toggleLandscapeOrientation = async () => {
    if (typeof window === 'undefined') return;

    try {
      if (isLandscapeLocked || document.fullscreenElement) {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
        if (screen.orientation && 'unlock' in screen.orientation) {
          try {
            screen.orientation.unlock();
          } catch (e) {
            console.log('Unlock error:', e);
          }
        }
        setIsLandscapeLocked(false);
        setOrientationToast('Modo vertical (Retrato) restaurado.');
        setTimeout(() => setOrientationToast(null), 3000);
      } else {
        // Request fullscreen first (required by mobile browser security policies for orientation locking)
        if (document.documentElement.requestFullscreen) {
          try {
            await document.documentElement.requestFullscreen();
          } catch (e) {
            console.log('Fullscreen request bypassed:', e);
          }
        }

        let locked = false;
        if (screen.orientation && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape');
            locked = true;
          } catch (err) {
            console.log('Screen orientation lock notice:', err);
          }
        }

        setIsLandscapeLocked(true);
        if (locked) {
          setOrientationToast('📱 Tela travada na horizontal! Aproveite a visão ampla do torneio.');
        } else {
          setOrientationToast('📱 Rotação ativada! Vire o seu celular/tablet de lado para visualizar melhor.');
        }
        setTimeout(() => setOrientationToast(null), 4000);
      }
    } catch (err) {
      console.warn('Orientation toggle error:', err);
      setOrientationToast('📱 Vire o seu celular/tablet de lado para a visualização horizontal.');
      setTimeout(() => setOrientationToast(null), 4000);
    }
  };

  const fitToScreen = () => {
    if (scrollerRef.current) {
      const width = scrollerRef.current.clientWidth - 20;
      if (width > 0) {
        const targetZoom = Math.min(1.0, Math.max(0.22, width / 1850));
        setZoom(Number(targetZoom.toFixed(2)));
        setTimeout(() => {
          if (scrollerRef.current) {
            const container = scrollerRef.current;
            const scaled = 1850 * targetZoom;
            const view = container.clientWidth;
            if (scaled > view) {
              container.scrollTo({ left: (scaled - view) / 2, behavior: 'smooth' });
            } else {
              container.scrollTo({ left: 0, behavior: 'smooth' });
            }
          }
        }, 60);
      }
    } else if (typeof window !== 'undefined') {
      const width = window.innerWidth - 32;
      const targetZoom = Math.min(1.0, Math.max(0.22, width / 1850));
      setZoom(Number(targetZoom.toFixed(2)));
    }
  };

  const scrollToPosition = (position: 'left' | 'center' | 'right' | 'col', colIndex?: number) => {
    if (!scrollerRef.current) return;
    const container = scrollerRef.current;
    const scaledWidth = 1850 * zoom;
    const viewportWidth = container.clientWidth;

    if (position === 'left') {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (position === 'center') {
      const target = (scaledWidth / 2) - (viewportWidth / 2);
      container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    } else if (position === 'right') {
      container.scrollTo({ left: scaledWidth - viewportWidth, behavior: 'smooth' });
    } else if (position === 'col' && colIndex !== undefined) {
      const colCenters = [117, 304, 491, 678, 925, 1172, 1359, 1546, 1733];
      const targetX = (colCenters[colIndex] * zoom) - (viewportWidth / 2);
      container.scrollTo({ left: Math.max(0, targetX), behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!scrollerRef.current) return;
    // Don't activate drag if clicking interactive buttons or links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;

    setIsDragging(true);
    setDragStartX(e.pageX - scrollerRef.current.offsetLeft);
    setScrollLeftStart(scrollerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !scrollerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollerRef.current.offsetLeft;
    const walk = (x - dragStartX) * 1.5;
    scrollerRef.current.scrollLeft = scrollLeftStart - walk;
  };

  // Live simulation & elimination auto-run states
  const [liveSimPendingMatch, setLiveSimPendingMatch] = useState<Match | null>(null);
  const [eliminationNotice, setEliminationNotice] = useState<{
    show: boolean;
    teamName: string;
  } | null>(null);

  // Accompanied favorite team tracking state
  const [favoriteTeamId, setFavoriteTeamId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accompanied_team_id') || null;
    }
    return null;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'name'>('rating');
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);

  const handleSelectFavorite = (id: string | null) => {
    setFavoriteTeamId(id);
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('accompanied_team_id', id);
      } else {
        localStorage.removeItem('accompanied_team_id');
      }
    }
  };

  // Auto-adjust starting zoom & center scroll
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) setZoom(0.45);      // Mobile screens
      else if (width < 1024) setZoom(0.6); // Tablet/Laptop small
      else if (width < 1440) setZoom(0.72); // Normal desktop
      else setZoom(0.85);                  // Large monitors
    }
  }, []);

  // Auto-center bracket view on mount or zoom/viewMode change
  useEffect(() => {
    if (viewMode === 'symmetric_bracket' && scrollerRef.current) {
      const timer = setTimeout(() => {
        if (!scrollerRef.current) return;
        const container = scrollerRef.current;
        const scaledWidth = 1850 * zoom;
        const viewportWidth = container.clientWidth;
        if (scaledWidth > viewportWidth) {
          container.scrollLeft = Math.max(0, (scaledWidth - viewportWidth) / 2);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [viewMode, zoom]);

  // Synchronize bracket tab with current round of the tournament
  useEffect(() => {
    if (state.currentRound === 'r32') setActiveBracketTab('r32');
    else if (state.currentRound === 'oitavas') setActiveBracketTab('oitavas');
    else if (state.currentRound === 'quartas') setActiveBracketTab('quartas');
    else if (state.currentRound === 'semifinal') setActiveBracketTab('semis');
    else if (state.currentRound === 'final_stages') setActiveBracketTab('finais');
  }, [state.currentRound]);

  // Subscribe to Firebase Firestore real-time saved tournaments
  useEffect(() => {
    const unsubscribe = subscribeSavedTournaments((list) => {
      setSavedTournaments(list);
    });
    return () => unsubscribe();
  }, []);

  // Auto-sync active tournament progress to Firebase Firestore
  useEffect(() => {
    if (!state) return;
    const timer = setTimeout(async () => {
      try {
        setCloudSyncStatus('saving');
        const tourneyId = 'sim_torneio_ativo';
        const defaultName = chosenMode === 'official' ? 'Copa do Mundo (Grupos Oficiais)' : 'Copa do Mundo (Sorteio Clássico)';
        await saveTournamentProgress(tourneyId, defaultName, state);
        setCloudSyncStatus('synced');
      } catch (err) {
        console.warn('Firebase auto-save notice:', err);
        setCloudSyncStatus('idle');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [state, chosenMode]);

  const handleSaveToCloudManual = async () => {
    try {
      setCloudSyncStatus('saving');
      const saveId = `torneio_${Date.now()}`;
      const name = customSaveName.trim() || (chosenMode === 'official' ? 'Copa 2026 (Oficial)' : 'Copa 2026 (Clássico)');
      await saveTournamentProgress(saveId, name, state);
      setCustomSaveName('');
      setCloudSyncStatus('synced');
      setCloudToast('☁️ Torneio salvo na nuvem com sucesso!');
      setTimeout(() => setCloudToast(null), 3000);
    } catch (e) {
      console.error(e);
      setCloudToast('❌ Erro ao salvar na nuvem.');
      setTimeout(() => setCloudToast(null), 3000);
    }
  };

  const handleLoadCloudTournament = (tourney: SavedTournament) => {
    if (tourney.state) {
      setState(tourney.state);
      setCloudToast(`☁️ Torneio "${tourney.name}" carregado!`);
      setCloudModalOpen(false);
      setTimeout(() => setCloudToast(null), 3000);
    }
  };

  const handleDeleteCloudTournament = async (id: string) => {
    try {
      await deleteSavedTournament(id);
      setCloudToast('🗑️ Salve removido do Firebase.');
      setTimeout(() => setCloudToast(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const resetTournament = () => {
    setChosenMode(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tournament_mode');
    }
    setState(initializeTournament('classic'));
    handleSelectFavorite(null);
  };

  // Utility to commit match results to a tournament state cleanly
  const commitMatchResults = (m: Match, playedMatch: Match, targetState: TournamentState): TournamentState => {
    let newState = { ...targetState };
    
    if (newState.currentRound === 'group') {
      const updatedMatches = newState.groupMatches.map(gm => gm.id === m.id ? playedMatch : gm);
      const updatedGroups = processAllGroupStandings(newState.groups, updatedMatches);
      newState = {
        ...newState,
        groupMatches: updatedMatches,
        groups: updatedGroups
      };
    } else if (newState.currentRound === 'r32') {
      const updatedMatches = newState.r32Matches.map(rm => rm.id === m.id ? playedMatch : rm);
      newState = { ...newState, r32Matches: updatedMatches };
    } else if (newState.currentRound === 'oitavas') {
      const updatedMatches = newState.oitavasMatches.map(om => om.id === m.id ? playedMatch : om);
      newState = { ...newState, oitavasMatches: updatedMatches };
    } else if (newState.currentRound === 'quartas') {
      const updatedMatches = newState.quartasMatches.map(qm => qm.id === m.id ? playedMatch : qm);
      newState = { ...newState, quartasMatches: updatedMatches };
    } else if (newState.currentRound === 'semifinal') {
      const updatedMatches = newState.semifinalMatches.map(sm => sm.id === m.id ? playedMatch : sm);
      newState = { ...newState, semifinalMatches: updatedMatches };
    } else if (newState.currentRound === 'final_stages') {
      let fMatch = newState.finalMatch;
      let tMatch = newState.thirdPlaceMatch;

      if (m.id === 'M_FINAL') {
        fMatch = playedMatch;
      } else if (m.id === 'M_3RD') {
        tMatch = playedMatch;
      }

      // Check if both are played to determine final podium
      let champ: string | null = newState.championId;
      let runner: string | null = newState.runnerUpId;
      let third: string | null = newState.thirdPlaceId;

      if (fMatch && fMatch.played) {
        if (fMatch.scoreA! > fMatch.scoreB!) {
          champ = fMatch.teamAId;
          runner = fMatch.teamBId;
        } else if (fMatch.scoreB! > fMatch.scoreA!) {
          champ = fMatch.teamBId;
          runner = fMatch.teamAId;
        } else {
          champ = fMatch.penaltiesA! > fMatch.penaltiesB! ? fMatch.teamAId : fMatch.teamBId;
          runner = champ === fMatch.teamAId ? fMatch.teamBId : fMatch.teamAId;
        }
      }

      if (tMatch && tMatch.played) {
        if (tMatch.scoreA! > tMatch.scoreB!) {
          third = tMatch.teamAId;
        } else if (tMatch.scoreB! > tMatch.scoreA!) {
          third = tMatch.teamBId;
        } else {
          third = tMatch.penaltiesA! > tMatch.penaltiesB! ? tMatch.teamAId : tMatch.teamBId;
        }
      }

      newState = {
        ...newState,
        finalMatch: fMatch,
        thirdPlaceMatch: tMatch,
        championId: champ,
        runnerUpId: runner,
        thirdPlaceId: third
      };
    }

    if (playedMatch.played && playedMatch.teamAId && playedMatch.teamBId) {
      const teamA = getTeamById(playedMatch.teamAId);
      const teamB = getTeamById(playedMatch.teamBId);
      if (teamA && teamB) {
        saveMatchResult({
          homeTeam: teamA.name,
          awayTeam: teamB.name,
          homeScore: playedMatch.scoreA ?? 0,
          awayScore: playedMatch.scoreB ?? 0,
          phase: targetState.currentRound,
          penalties: playedMatch.penaltiesA !== undefined ? `${playedMatch.penaltiesA}-${playedMatch.penaltiesB}` : undefined,
          winnerCode: playedMatch.scoreA! > playedMatch.scoreB! ? teamA.code : (playedMatch.scoreB! > playedMatch.scoreA! ? teamB.code : undefined)
        });
      }
    }
    
    return newState;
  };

  // Helper function to auto-simulate all remaining unplayed matches of the tournament until the final
  const autoSimulateRemainingTournament = (startingState: TournamentState): TournamentState => {
    let tempState = { ...startingState };
    let iterations = 0;

    // Advance rounds automatically until the champion is set
    while (!tempState.championId && iterations < 12) {
      iterations++;
      const round = tempState.currentRound;

      if (round === 'group') {
        const updatedMatches = tempState.groupMatches.map(m => m.played ? m : simulateMatch(m, true));
        const updatedGroups = processAllGroupStandings(tempState.groups, updatedMatches);
        const r32 = generateR32(updatedGroups);
        tempState = {
          ...tempState,
          groupMatches: updatedMatches,
          groups: updatedGroups,
          currentRound: 'r32',
          r32Matches: r32
        };
      } else if (round === 'r32') {
        const updatedR32 = tempState.r32Matches.map(m => m.played ? m : simulateMatch(m, false));
        const oitavas = generateOitavas(updatedR32);
        tempState = {
          ...tempState,
          r32Matches: updatedR32,
          currentRound: 'oitavas',
          oitavasMatches: oitavas
        };
      } else if (round === 'oitavas') {
        const updatedOitavas = tempState.oitavasMatches.map(m => m.played ? m : simulateMatch(m, false));
        const quartas = generateQuartas(updatedOitavas);
        tempState = {
          ...tempState,
          oitavasMatches: updatedOitavas,
          currentRound: 'quartas',
          quartasMatches: quartas
        };
      } else if (round === 'quartas') {
        const updatedQuartas = tempState.quartasMatches.map(m => m.played ? m : simulateMatch(m, false));
        const semis = generateSemifinais(updatedQuartas);
        tempState = {
          ...tempState,
          quartasMatches: updatedQuartas,
          currentRound: 'semifinal',
          semifinalMatches: semis
        };
      } else if (round === 'semifinal') {
        const updatedSemis = tempState.semifinalMatches.map(m => m.played ? m : simulateMatch(m, false));
        const { final, third } = generateFinalAndThird(updatedSemis);
        tempState = {
          ...tempState,
          semifinalMatches: updatedSemis,
          currentRound: 'final_stages',
          finalMatch: final,
          thirdPlaceMatch: third
        };
      } else if (round === 'final_stages') {
        const finalM = tempState.finalMatch ? (tempState.finalMatch.played ? tempState.finalMatch : simulateMatch(tempState.finalMatch, false)) : null;
        const thirdM = tempState.thirdPlaceMatch ? (tempState.thirdPlaceMatch.played ? tempState.thirdPlaceMatch : simulateMatch(tempState.thirdPlaceMatch, false)) : null;

        let champ: string | null = null;
        let runner: string | null = null;
        let third: string | null = null;

        if (finalM) {
          if (finalM.scoreA! > finalM.scoreB!) {
            champ = finalM.teamAId;
            runner = finalM.teamBId;
          } else if (finalM.scoreB! > finalM.scoreA!) {
            champ = finalM.teamBId;
            runner = finalM.teamAId;
          } else {
            champ = finalM.penaltiesA! > finalM.penaltiesB! ? finalM.teamAId : finalM.teamBId;
            runner = champ === finalM.teamAId ? finalM.teamBId : finalM.teamAId;
          }
        }

        if (thirdM) {
          if (thirdM.scoreA! > thirdM.scoreB!) {
            third = thirdM.teamAId;
          } else if (thirdM.scoreB! > thirdM.scoreA!) {
            third = thirdM.teamBId;
          } else {
            third = thirdM.penaltiesA! > thirdM.penaltiesB! ? thirdM.teamAId : thirdM.teamBId;
          }
        }

        tempState = {
          ...tempState,
          finalMatch: finalM,
          thirdPlaceMatch: thirdM,
          championId: champ,
          runnerUpId: runner,
          thirdPlaceId: third
        };
      }
    }
    return tempState;
  };

  const handleLiveSimComplete = (playedMatch: Match) => {
    const originalMatch = liveSimPendingMatch!;
    const updatedState = commitMatchResults(originalMatch, playedMatch, state);
    
    // Check if the favorite team lost
    const isFavA = originalMatch.teamAId === favoriteTeamId;
    const isFavB = originalMatch.teamBId === favoriteTeamId;
    let didFavLose = false;

    if (isFavA || isFavB) {
      const scoreA = playedMatch.scoreA ?? 0;
      const scoreB = playedMatch.scoreB ?? 0;
      if (isFavA) {
        if (scoreB > scoreA) {
          didFavLose = true;
        } else if (scoreA === scoreB) {
          if (playedMatch.penaltiesB! > playedMatch.penaltiesA!) {
            didFavLose = true;
          }
        }
      } else {
        if (scoreA > scoreB) {
          didFavLose = true;
        } else if (scoreA === scoreB) {
          if (playedMatch.penaltiesA! > playedMatch.penaltiesB!) {
            didFavLose = true;
          }
        }
      }
    }

    setLiveSimPendingMatch(null);

    if (didFavLose) {
      // Favorite team is eliminated! Show notification overlay & auto-simulate remaining
      const favTeam = getTeamById(favoriteTeamId!);
      setEliminationNotice({
        show: true,
        teamName: favTeam.name
      });
      const finalState = autoSimulateRemainingTournament(updatedState);
      setState(finalState);
    } else {
      // Won! Keep moving normally
      setState(updatedState);
    }
  };

  // Simulate a single match in the group stage or ko bracket
  const handleSimulateSingleMatch = (m: Match) => {
    if (m.played) {
      setSelectedMatch(m);
      return;
    }

    // Intercept unplayed matches of the favorite team from knockout stages onwards
    const isKnockout = state.currentRound !== 'group';
    const hasFav = favoriteTeamId && favoriteTeamId !== 'skip_tracking' && (m.teamAId === favoriteTeamId || m.teamBId === favoriteTeamId);

    if (isKnockout && hasFav) {
      const preSimMatch = simulateMatch(m, false);
      setLiveSimPendingMatch(preSimMatch);
      return;
    }

    const playedMatch = simulateMatch(m, state.currentRound === 'group');
    const updated = commitMatchResults(m, playedMatch, state);
    setState(updated);
  };

  // Simulate all matches of a given round or phase
  const handleSimulateGroupStage = () => {
    const updatedMatches = state.groupMatches.map(m => m.played ? m : simulateMatch(m, true));
    const updatedGroups = processAllGroupStandings(state.groups, updatedMatches);
    setState({
      ...state,
      groupMatches: updatedMatches,
      groups: updatedGroups
    });
  };

  // Run advancing from Group Stage to Round of 32 (16avos de Final)
  const handleAdvanceToR32 = () => {
    const allPlayed = state.groupMatches.every(m => m.played);
    let updatedMatches = state.groupMatches;
    let updatedGroups = state.groups;

    if (!allPlayed) {
      updatedMatches = state.groupMatches.map(m => m.played ? m : simulateMatch(m, true));
      updatedGroups = processAllGroupStandings(state.groups, updatedMatches);
    }

    const r32 = generateR32(updatedGroups);
    setState({
      ...state,
      groupMatches: updatedMatches,
      groups: updatedGroups,
      currentRound: 'r32',
      r32Matches: r32
    });
  };

  // Simulating all Round of 32 matches
  const handleSimulateR32 = () => {
    const updatedR32 = state.r32Matches.map(m => m.played ? m : simulateMatch(m, false));
    setState({
      ...state,
      r32Matches: updatedR32
    });
  };

  // Advancing to Round of 16 (Oitavas de Final)
  const handleAdvanceToOitavas = () => {
    let currentR32 = state.r32Matches;
    const allR32Played = currentR32.every(m => m.played);
    if (!allR32Played) {
      currentR32 = currentR32.map(m => m.played ? m : simulateMatch(m, false));
    }

    const oitavas = generateOitavas(currentR32);
    setState({
      ...state,
      r32Matches: currentR32,
      currentRound: 'oitavas',
      oitavasMatches: oitavas
    });
  };

  // Simulating all Round of 16 matches
  const handleSimulateOitavas = () => {
    const updatedOitavas = state.oitavasMatches.map(m => m.played ? m : simulateMatch(m, false));
    setState({
      ...state,
      oitavasMatches: updatedOitavas
    });
  };

  // Advancing to Quarterfinals
  const handleAdvanceToQuartas = () => {
    let currentOitavas = state.oitavasMatches;
    const allOitavasPlayed = currentOitavas.every(m => m.played);
    if (!allOitavasPlayed) {
      currentOitavas = currentOitavas.map(m => m.played ? m : simulateMatch(m, false));
    }

    const quartas = generateQuartas(currentOitavas);
    setState({
      ...state,
      oitavasMatches: currentOitavas,
      currentRound: 'quartas',
      quartasMatches: quartas
    });
  };

  // Simulating all Quarterfinals matches
  const handleSimulateQuartas = () => {
    const updatedQuartas = state.quartasMatches.map(m => m.played ? m : simulateMatch(m, false));
    setState({
      ...state,
      quartasMatches: updatedQuartas
    });
  };

  // Advancing to Semifinals
  const handleAdvanceToSemis = () => {
    let currentQuartas = state.quartasMatches;
    const allQuartasPlayed = currentQuartas.every(m => m.played);
    if (!allQuartasPlayed) {
      currentQuartas = currentQuartas.map(m => m.played ? m : simulateMatch(m, false));
    }

    const semis = generateSemifinais(currentQuartas);
    setState({
      ...state,
      quartasMatches: currentQuartas,
      currentRound: 'semifinal',
      semifinalMatches: semis
    });
  };

  // Simulating all Semifinals matches
  const handleSimulateSemis = () => {
    const updatedSemis = state.semifinalMatches.map(m => m.played ? m : simulateMatch(m, false));
    setState({
      ...state,
      semifinalMatches: updatedSemis
    });
  };

  // Advancing to finals
  const handleAdvanceToFinals = () => {
    let currentSemis = state.semifinalMatches;
    const allSemisPlayed = currentSemis.every(m => m.played);
    if (!allSemisPlayed) {
      currentSemis = currentSemis.map(m => m.played ? m : simulateMatch(m, false));
    }

    const { final, third } = generateFinalAndThird(currentSemis);
    setState({
      ...state,
      semifinalMatches: currentSemis,
      currentRound: 'final_stages',
      finalMatch: final,
      thirdPlaceMatch: third
    });
  };

  const handleSimulateFinalStg = () => {
    let finalM = state.finalMatch ? (state.finalMatch.played ? state.finalMatch : simulateMatch(state.finalMatch, false)) : null;
    let thirdM = state.thirdPlaceMatch ? (state.thirdPlaceMatch.played ? state.thirdPlaceMatch : simulateMatch(state.thirdPlaceMatch, false)) : null;

    let champ: string | null = null;
    let runner: string | null = null;
    let third: string | null = null;

    if (finalM) {
      if (finalM.scoreA! > finalM.scoreB!) {
        champ = finalM.teamAId;
        runner = finalM.teamBId;
      } else if (finalM.scoreB! > finalM.scoreA!) {
        champ = finalM.teamBId;
        runner = finalM.teamAId;
      } else {
        champ = finalM.penaltiesA! > finalM.penaltiesB! ? finalM.teamAId : finalM.teamBId;
        runner = champ === finalM.teamAId ? finalM.teamBId : finalM.teamAId;
      }
    }

    if (thirdM) {
      if (thirdM.scoreA! > thirdM.scoreB!) {
        third = thirdM.teamAId;
      } else if (thirdM.scoreB! > thirdM.scoreA!) {
        third = thirdM.teamBId;
      } else {
        third = thirdM.penaltiesA! > thirdM.penaltiesB! ? thirdM.teamAId : thirdM.teamBId;
      }
    }

    setState({
      ...state,
      finalMatch: finalM,
      thirdPlaceMatch: thirdM,
      championId: champ,
      runnerUpId: runner,
      thirdPlaceId: third
    });
  };

  // Helper to determine active matches for the current tab
  const getMatchesForTab = () => {
    if (activeBracketTab === 'r32') return state.r32Matches;
    if (activeBracketTab === 'oitavas') return state.oitavasMatches;
    if (activeBracketTab === 'quartas') return state.quartasMatches;
    if (activeBracketTab === 'semis') return state.semifinalMatches;
    if (activeBracketTab === 'finais') {
      const list = [];
      if (state.finalMatch) list.push(state.finalMatch);
      if (state.thirdPlaceMatch) list.push(state.thirdPlaceMatch);
      return list;
    }
    return [];
  };

  // Helper to calculate vertex degree (total played matches of the team)
  const getVertexDegree = (teamId: string) => {
    let playedCount = 0;
    state.groupMatches.forEach(m => {
      if ((m.teamAId === teamId || m.teamBId === teamId) && m.played) playedCount++;
    });
    const allKO = [
      ...state.r32Matches,
      ...state.oitavasMatches,
      ...state.quartasMatches,
      ...state.semifinalMatches,
      state.finalMatch,
      state.thirdPlaceMatch
    ];
    allKO.forEach(m => {
      if (m && (m.teamAId === teamId || m.teamBId === teamId) && m.played) {
        playedCount++;
      }
    });
    return playedCount;
  };

  // Helper to trace match and vertex node progression in Spanning Tree
  const getGraphProgression = (matchId: string, teamId: string) => {
    const steps: { label: string; matchId: string; status: 'active' | 'eliminated' | 'pending' | 'won' }[] = [];
    
    let k = 0;
    if (matchId.startsWith('R32_')) {
      k = parseInt(matchId.replace('R32_', ''), 10);
      const oitIdx = Math.ceil(k / 2);
      const qIdx = Math.ceil(k / 4);
      const sIdx = Math.ceil(k / 8);
      
      steps.push({ label: `R32_${k}`, matchId: `R32_${k}`, status: 'pending' });
      steps.push({ label: `OIT_${oitIdx}`, matchId: `OIT_${oitIdx}`, status: 'pending' });
      steps.push({ label: `Q_${qIdx}`, matchId: `Q_${qIdx}`, status: 'pending' });
      steps.push({ label: `S${sIdx}`, matchId: sIdx === 1 ? 'S1' : 'S2', status: 'pending' });
      steps.push({ label: 'FINAL', matchId: 'M_FINAL', status: 'pending' });
    } 
    else if (matchId.startsWith('OIT_')) {
      k = parseInt(matchId.replace('OIT_', ''), 10);
      const qIdx = Math.ceil(k / 2);
      const sIdx = Math.ceil(k / 4);
      
      steps.push({ label: `OIT_${k}`, matchId: `OIT_${k}`, status: 'pending' });
      steps.push({ label: `Q_${qIdx}`, matchId: `Q_${qIdx}`, status: 'pending' });
      steps.push({ label: `S${sIdx}`, matchId: sIdx === 1 ? 'S1' : 'S2', status: 'pending' });
      steps.push({ label: 'FINAL', matchId: 'M_FINAL', status: 'pending' });
    } 
    else if (matchId.startsWith('Q_')) {
      k = parseInt(matchId.replace('Q_', ''), 10);
      const sIdx = Math.ceil(k / 2);
      
      steps.push({ label: `Q_${k}`, matchId: `Q_${k}`, status: 'pending' });
      steps.push({ label: `S${sIdx}`, matchId: sIdx === 1 ? 'S1' : 'S2', status: 'pending' });
      steps.push({ label: 'FINAL', matchId: 'M_FINAL', status: 'pending' });
    } 
    else if (matchId === 'S1' || matchId === 'S2') {
      steps.push({ label: matchId, matchId: matchId, status: 'pending' });
      steps.push({ label: 'FINAL', matchId: 'M_FINAL', status: 'pending' });
    }
    else if (matchId === 'M_FINAL') {
      steps.push({ label: 'FINAL', matchId: 'M_FINAL', status: 'pending' });
    }
    else if (matchId === 'M_3RD') {
      steps.push({ label: '3º LUGAR', matchId: 'M_3RD', status: 'pending' });
    }

    let hasFailed = false;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (hasFailed) {
        step.status = 'eliminated';
        continue;
      }
      
      let stepMatch: Match | undefined;
      if (step.matchId.startsWith('R32_')) {
        stepMatch = state.r32Matches.find(m => m.id === step.matchId);
      } else if (step.matchId.startsWith('OIT_')) {
        stepMatch = state.oitavasMatches.find(m => m.id === step.matchId);
      } else if (step.matchId.startsWith('Q_')) {
        stepMatch = state.quartasMatches.find(m => m.id === step.matchId);
      } else if (step.matchId === 'S1' || step.matchId === 'S2') {
        stepMatch = state.semifinalMatches.find(m => m.id === step.matchId);
      } else if (step.matchId === 'M_FINAL') {
        stepMatch = state.finalMatch || undefined;
      } else if (step.matchId === 'M_3RD') {
        stepMatch = state.thirdPlaceMatch || undefined;
      }
      
      if (!stepMatch) {
        step.status = 'pending';
      } else if (!stepMatch.played) {
        const isPart = stepMatch.teamAId === teamId || stepMatch.teamBId === teamId;
        step.status = isPart ? 'won' : 'pending';
      } else {
        const isPart = stepMatch.teamAId === teamId || stepMatch.teamBId === teamId;
        if (!isPart) {
          step.status = 'pending';
        } else {
          let isWinner = false;
          if (stepMatch.scoreA! > stepMatch.scoreB!) {
            isWinner = stepMatch.teamAId === teamId;
          } else if (stepMatch.scoreB! > stepMatch.scoreA!) {
            isWinner = stepMatch.teamBId === teamId;
          } else if (stepMatch.penaltiesA !== undefined && stepMatch.penaltiesB !== undefined) {
            isWinner = stepMatch.teamAId === teamId 
              ? (stepMatch.penaltiesA > stepMatch.penaltiesB) 
              : (stepMatch.penaltiesB > stepMatch.penaltiesA);
          }
          
          if (isWinner) {
            step.status = 'won';
          } else {
            step.status = 'eliminated';
            hasFailed = true;
          }
        }
      }
    }
    
    return steps;
  };

  // Helper for bento-grid stats box about active Graph theory parameters
  const getGraphMetrics = () => {
    const activeMatches = getMatchesForTab();
    const totalVertices = activeMatches.length * 2;
    const activatedEdges = activeMatches.filter(m => m.played).length;
    
    const currentTabTeams = new Set<string>();
    activeMatches.forEach(m => {
      currentTabTeams.add(m.teamAId);
      currentTabTeams.add(m.teamBId);
    });
    
    let sumDegrees = 0;
    currentTabTeams.forEach(tid => {
      sumDegrees += getVertexDegree(tid);
    });
    const avgDegree = currentTabTeams.size > 0 ? (sumDegrees / currentTabTeams.size).toFixed(1) : "0.0";
    
    let diameter = 0;
    if (activeBracketTab === 'r32') diameter = 10;
    else if (activeBracketTab === 'oitavas') diameter = 8;
    else if (activeBracketTab === 'quartas') diameter = 6;
    else if (activeBracketTab === 'semis') diameter = 4;
    else if (activeBracketTab === 'finais') diameter = 2;
    
    return {
      totalVertices,
      activatedEdges,
      avgDegree,
      diameter,
      density: totalVertices > 0 ? ((activatedEdges / (totalVertices * (totalVertices - 1) / 2)) * 100).toFixed(1) + '%' : '0%'
    };
  };

  const getMatchWinnerId = (m: Match): string | null => {
    if (!m || !m.played) return null;
    if (m.scoreA! > m.scoreB!) return m.teamAId;
    if (m.scoreB! > m.scoreA!) return m.teamBId;
    return m.penaltiesA! > m.penaltiesB! ? m.teamAId : m.teamBId;
  };

  const getMatchLoserId = (m: Match): string | null => {
    if (!m || !m.played) return null;
    if (m.scoreA! > m.scoreB!) return m.teamBId;
    if (m.scoreB! > m.scoreA!) return m.teamAId;
    return m.penaltiesA! > m.penaltiesB! ? m.teamBId : m.teamAId;
  };

  const getPlayoffTeam = (round: 'r32' | 'oitavas' | 'quartas' | 'semis' | 'final' | 'third', index: number, slot: 'A' | 'B'): { team: any | null, label: string } => {
    if (round === 'r32') {
      const m = state.r32Matches[index];
      if (!m) return { team: null, label: 'A definir' };
      const teamId = slot === 'A' ? m.teamAId : m.teamBId;
      return { team: teamId ? getTeamById(teamId) : null, label: 'A definir' };
    }
    
    if (round === 'oitavas') {
      const m = state.oitavasMatches[index];
      if (m) {
        const teamId = slot === 'A' ? m.teamAId : m.teamBId;
        return { team: teamId ? getTeamById(teamId) : null, label: slot === 'A' ? `Venc. 32_M${index * 2 + 1}` : `Venc. 32_M${index * 2 + 2}` };
      }
      const parentIdx = index * 2 + (slot === 'A' ? 0 : 1);
      const parentMatch = state.r32Matches[parentIdx];
      if (parentMatch && parentMatch.played) {
        const winnerId = getMatchWinnerId(parentMatch);
        return { team: winnerId ? getTeamById(winnerId) : null, label: `Venc. R32_${parentIdx + 1}` };
      }
      return { team: null, label: `Venc. M${parentIdx + 1}` };
    }
    
    if (round === 'quartas') {
      const m = state.quartasMatches[index];
      if (m) {
        const teamId = slot === 'A' ? m.teamAId : m.teamBId;
        return { team: teamId ? getTeamById(teamId) : null, label: slot === 'A' ? `Venc. OIT_${index * 2 + 1}` : `Venc. OIT_${index * 2 + 2}` };
      }
      const parentIdx = index * 2 + (slot === 'A' ? 0 : 1);
      const parentMatch = state.oitavasMatches[parentIdx];
      if (parentMatch && parentMatch.played) {
        const winnerId = getMatchWinnerId(parentMatch);
        return { team: winnerId ? getTeamById(winnerId) : null, label: `Venc. Oitavas` };
      }
      return { team: null, label: `Venc. Oitavas` };
    }
    
    if (round === 'semis') {
      const m = state.semifinalMatches[index];
      if (m) {
        const teamId = slot === 'A' ? m.teamAId : m.teamBId;
        return { team: teamId ? getTeamById(teamId) : null, label: slot === 'A' ? `Venc. Q_${index * 2 + 1}` : `Venc. Q_${index * 2 + 2}` };
      }
      const parentIdx = index * 2 + (slot === 'A' ? 0 : 1);
      const parentMatch = state.quartasMatches[parentIdx];
      if (parentMatch && parentMatch.played) {
        const winnerId = getMatchWinnerId(parentMatch);
        return { team: winnerId ? getTeamById(winnerId) : null, label: `Venc. Quartas` };
      }
      return { team: null, label: `Venc. Quartas` };
    }
    
    if (round === 'final') {
      const m = state.finalMatch;
      if (m) {
        const teamId = slot === 'A' ? m.teamAId : m.teamBId;
        return { team: teamId ? getTeamById(teamId) : null, label: slot === 'A' ? 'Venc. Semi 1' : 'Venc. Semi 2' };
      }
      const parentIdx = slot === 'A' ? 0 : 1;
      const parentMatch = state.semifinalMatches[parentIdx];
      if (parentMatch && parentMatch.played) {
        const winnerId = getMatchWinnerId(parentMatch);
        return { team: winnerId ? getTeamById(winnerId) : null, label: `Venc. Semi ${parentIdx + 1}` };
      }
      return { team: null, label: slot === 'A' ? 'Venc. Semi 1' : 'Venc. Semi 2' };
    }
    
    if (round === 'third') {
      const m = state.thirdPlaceMatch;
      if (m) {
        const teamId = slot === 'A' ? m.teamAId : m.teamBId;
        return { team: teamId ? getTeamById(teamId) : null, label: slot === 'A' ? 'Perd. Semi 1' : 'Perd. Semi 2' };
      }
      const parentIdx = slot === 'A' ? 0 : 1;
      const parentMatch = state.semifinalMatches[parentIdx];
      if (parentMatch && parentMatch.played) {
        const loserId = getMatchLoserId(parentMatch);
        return { team: loserId ? getTeamById(loserId) : null, label: `Perd. Semi ${parentIdx + 1}` };
      }
      return { team: null, label: slot === 'A' ? 'Perd. Semi 1' : 'Perd. Semi 2' };
    }
    
    return { team: null, label: 'A definir' };
  };

  const renderSymmetricMatchBox = (round: 'r32' | 'oitavas' | 'quartas' | 'semis' | 'final' | 'third', index: number) => {
    const resA = getPlayoffTeam(round, index, 'A');
    const resB = getPlayoffTeam(round, index, 'B');
    
    let matchObj: Match | null = null;
    if (round === 'r32') matchObj = state.r32Matches[index];
    else if (round === 'oitavas') matchObj = state.oitavasMatches[index];
    else if (round === 'quartas') matchObj = state.quartasMatches[index];
    else if (round === 'semis') matchObj = state.semifinalMatches[index];
    else if (round === 'final') matchObj = state.finalMatch;
    else if (round === 'third') matchObj = state.thirdPlaceMatch;

    const isPlayed = matchObj?.played || false;
    
    let isWinnerA = false;
    let isWinnerB = false;
    if (isPlayed && matchObj) {
      if (matchObj.scoreA! > matchObj.scoreB!) {
        isWinnerA = true;
      } else if (matchObj.scoreB! > matchObj.scoreA!) {
        isWinnerB = true;
      } else if (matchObj.penaltiesA !== undefined && matchObj.penaltiesB !== undefined) {
        isWinnerA = matchObj.penaltiesA > matchObj.penaltiesB;
        isWinnerB = !isWinnerA;
      }
    }

    const isPlayable = matchObj && !isPlayed && resA.team && resB.team;
    
    const isFavA = resA.team?.id === favoriteTeamId;
    const isFavB = resB.team?.id === favoriteTeamId;
    const hasFavorite = isFavA || isFavB;

    const handleClick = () => {
      if (matchObj) {
        if (isPlayed) {
          setSelectedMatch(matchObj);
        } else if (isPlayable) {
          handleSimulateSingleMatch(matchObj);
        }
      }
    };

    const cardClass = hasFavorite
      ? isPlayable
        ? 'ring-2 ring-yellow-400 border-yellow-400 bg-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.22)] scale-[1.03]'
        : 'border-yellow-500/50 bg-slate-900/90 shadow-[0_0_12px_rgba(251,191,36,0.12)] scale-[1.01]'
      : isPlayable 
        ? 'ring-2 ring-amber-500/20 hover:ring-amber-500/50 hover:border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.05)] scale-[1.01]' 
        : isPlayed
          ? 'hover:bg-slate-900 shadow-md border-slate-750'
          : 'opacity-70 border-slate-850/40 bg-slate-950/20';

    return (
      <div 
        onClick={handleClick}
        className={`w-[160px] rounded-xl border transition-all select-none overflow-hidden relative cursor-pointer ${cardClass}`}
      >
        {(isPlayable || (hasFavorite && !isPlayed)) && (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 animate-pulse pointer-events-none" />
        )}

        {/* Team A Row */}
        <div className={`p-2 py-2 flex items-center justify-between text-xs transition-colors ${
          isWinnerB ? 'opacity-40' : ''
        } ${isFavA ? 'bg-amber-500/10' : ''}`}>
          <div className="flex items-center gap-2 min-w-0">
            {resA.team ? (
              <>
                <Flag code={resA.team.code} fallbackEmoji={resA.team.flag} className="w-4.5 h-3 rounded shadow-xs shrink-0" />
                <span className={`font-black font-sans uppercase tracking-tight truncate flex items-center gap-0.5 ${
                  isFavA ? 'text-amber-300 font-black' : isWinnerA ? 'text-amber-400 font-extrabold' : 'text-slate-200'
                }`}>
                  {isFavA && <span className="text-amber-450 text-[10px]">★</span>}
                  {resA.team.code}
                </span>
              </>
            ) : (
              <span className="text-[10px] font-mono text-slate-500 truncate">{resA.label}</span>
            )}
          </div>
          {isPlayed && matchObj && (
            <div className="flex items-center gap-1 shrink-0 font-mono font-bold text-xs">
              <span className={isWinnerA ? 'text-amber-400 font-extrabold' : 'text-slate-400'}>
                {matchObj.scoreA}
              </span>
              {matchObj.penaltiesA !== undefined && (
                <span className="text-[9px] text-amber-500 font-semibold">({matchObj.penaltiesA})</span>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-850/60" />

        {/* Team B Row */}
        <div className={`p-2 py-2 flex items-center justify-between text-xs transition-colors ${
          isWinnerA ? 'opacity-40' : ''
        } ${isFavB ? 'bg-amber-500/10' : ''}`}>
          <div className="flex items-center gap-2 min-w-0">
            {resB.team ? (
              <>
                <Flag code={resB.team.code} fallbackEmoji={resB.team.flag} className="w-4.5 h-3 rounded shadow-xs shrink-0" />
                <span className={`font-black font-sans uppercase tracking-tight truncate flex items-center gap-0.5 ${
                  isFavB ? 'text-amber-300 font-black' : isWinnerB ? 'text-amber-400 font-extrabold' : 'text-slate-200'
                }`}>
                  {isFavB && <span className="text-amber-450 text-[10px]">★</span>}
                  {resB.team.code}
                </span>
              </>
            ) : (
              <span className="text-[10px] font-mono text-slate-500 truncate">{resB.label}</span>
            )}
          </div>
          {isPlayed && matchObj && (
            <div className="flex items-center gap-1 shrink-0 font-mono font-bold text-xs">
              <span className={isWinnerB ? 'text-amber-400 font-extrabold' : 'text-slate-400'}>
                {matchObj.scoreB}
              </span>
              {matchObj.penaltiesB !== undefined && (
                <span className="text-[9px] text-amber-500 font-semibold">({matchObj.penaltiesB})</span>
              )}
            </div>
          )}
        </div>

        {isPlayable && (
          <div className="bg-amber-500 py-1 text-center text-[8px] font-mono font-bold uppercase text-slate-950 flex items-center justify-center gap-0.5 animate-pulse">
            <Play className="h-2 w-2 fill-slate-950 shrink-0" />
            Jogar
          </div>
        )}
      </div>
    );
  };

  // Statistics references checking played status
  const r32PlayedCount = state.r32Matches.filter(m => m.played).length;
  const oitavasPlayedCount = state.oitavasMatches.filter(m => m.played).length;
  const quartasPlayedCount = state.quartasMatches.filter(m => m.played).length;
  const semisPlayedCount = state.semifinalMatches.filter(m => m.played).length;
  const finalsPlayedCount = (state.finalMatch?.played ? 1 : 0) + (state.thirdPlaceMatch?.played ? 1 : 0);

  const renderBracketManagerTray = () => {
    let label = "";
    let action: (() => void) | null = null;
    let colorClass = "";
    
    if (state.currentRound === 'r32' && r32PlayedCount === 16) {
      label = "Avançar para Oitavas de Final";
      action = handleAdvanceToOitavas;
      colorClass = "bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black";
    } else if (state.currentRound === 'oitavas' && oitavasPlayedCount === 8) {
      label = "Avançar para Quartas de Final";
      action = handleAdvanceToQuartas;
      colorClass = "bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black";
    } else if (state.currentRound === 'quartas' && quartasPlayedCount === 4) {
      label = "Avançar para Semifinais";
      action = handleAdvanceToSemis;
      colorClass = "bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black";
    } else if (state.currentRound === 'semifinal' && semisPlayedCount === 2) {
      label = "Avançar para Grande Final";
      action = handleAdvanceToFinals;
      colorClass = "bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black";
    } else if (state.currentRound === 'final_stages' && finalsPlayedCount === 0) {
      label = "Simular Finais de Copa";
      action = handleSimulateFinalStg;
      colorClass = "bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black";
    }

    if (!action) return null;

    return (
      <div className="flex justify-center mt-6">
        <button
          onClick={action}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all animate-bounce cursor-pointer ${colorClass}`}
        >
          <Trophy className="h-4.5 w-4.5 animate-pulse" />
          {label}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Get active teams of the tournament (48 teams where code !== 'ITA')
  const selectableTeams = TEAMS_DATA.filter(t => t.code !== 'ITA');
  
  const filteredTeams = selectableTeams
    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.code.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return b.ratingOverall - a.ratingOverall;
      }
      return a.name.localeCompare(b.name);
    });

  if (chosenMode === null) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto animate-fade-in" id="simulator-mode-selection">
        {/* Onboarding Header */}
        <div className="galaxy-card galaxy-card-glow rounded-3xl p-8 md:p-10 text-center max-w-3xl mx-auto relative overflow-hidden" id="mode-header-banner">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="mx-auto h-14 w-14 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-300/40 mb-5">
            <Trophy className="h-7 w-7 text-slate-950" />
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            Formato do <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Mundial</span>
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mt-3 max-w-xl mx-auto">
            Selecione como quer disputar e simular os caminhos da glória. Simule a Copa do Mundo real de 2026 com os grupos oficiais ou o Mundial Clássico com chaves aleatórias!
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-4" id="mode-choices-grid">
          
          {/* Choice 1: Official World Cup */}
          <div
            onClick={() => {
              setChosenMode('official');
              if (typeof window !== 'undefined') {
                localStorage.setItem('tournament_mode', 'official');
              }
              setState(initializeTournament('official'));
            }}
            className="group galaxy-card hover:border-amber-500/60 rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-xl relative overflow-hidden active:scale-[0.98]"
            id="choice-mode-official"
          >
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-300" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-amber-500/15 rounded-2xl border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Trophy className="h-5 w-5" />
                </div>
                <span className="text-[9px] uppercase font-mono font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                  Oficial 2026
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-100 group-hover:text-amber-400 transition-colors uppercase tracking-tight">
                  Copa do Mundo Oficial 2026
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dispute a Copa de 2026 com os grupos oficiais (Brasil no Grupo C com Marrocos, Argentina no Grupo J com Argélia e Áustria, etc.) e acompanhe sua seleção preferida em cruzamentos e tabelas reais!
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-400 group-hover:text-amber-300 transition-colors">
              <span>Jogar Formato Oficial</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Choice 2: Classic Shuffled World Cup */}
          <div
            onClick={() => {
              setChosenMode('classic');
              if (typeof window !== 'undefined') {
                localStorage.setItem('tournament_mode', 'classic');
              }
              setState(initializeTournament('classic'));
            }}
            className="group galaxy-card hover:border-amber-500/60 rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-xl relative overflow-hidden active:scale-[0.98]"
            id="choice-mode-classic"
          >
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-300" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-950 rounded-2xl border border-white/10 text-slate-300">
                  <Play className="h-5 w-5" />
                </div>
                <span className="text-[9px] uppercase font-mono font-black bg-slate-950 text-slate-400 px-2.5 py-1 rounded-full border border-white/10">
                  Aleatório / Shuffled
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-100 group-hover:text-amber-400 transition-colors uppercase tracking-tight">
                  Mundial Clássico Shuffled
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  As 48 seleções participantes são divididas em 12 grupos de forma 100% aleatória e mista. Descubra cruzamentos inéditos, rivalidades novas e zebras históricas a cada simulação!
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-500 group-hover:text-amber-400 transition-colors">
              <span>Sorteares e Jogar Aleatório</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (favoriteTeamId === null) {
    const getOfficialGroupLetter = (teamName: string): string | null => {
      for (const [letter, teams] of Object.entries(OFFICIAL_GROUPS_CONFIG)) {
        if (teams.some(name => findTeamIdByExactOrSimilarName(name) === findTeamIdByExactOrSimilarName(teamName))) {
          return letter;
        }
      }
      return null;
    };

    return (
      <div className="space-y-8 max-w-6xl mx-auto animate-fade-in" id="team-selection-root">
        {/* Back and Mode Badge bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => {
              setChosenMode(null);
              if (typeof window !== 'undefined') {
                localStorage.removeItem('tournament_mode');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors self-start bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            <span>← Alterar Formato do Torneio</span>
          </button>
          
          <div className="flex items-center gap-2 bg-slate-900/40 px-3.5 py-1.5 rounded-xl border border-slate-900 self-start sm:self-auto font-mono text-[10px]">
            <span className="text-slate-500 uppercase tracking-widest font-bold">Modo Ativo:</span>
            <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
              {chosenMode === 'official' ? 'Copa Oficial 2026 🏆' : 'Mundial Clássico Shuffled 🎲'}
            </span>
          </div>
        </div>

        {/* Onboarding Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden text-center max-w-3xl mx-auto" id="selection-header-banner">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg border border-amber-350/20 mb-4">
            <Trophy className="h-6 w-6 text-slate-950 fill-slate-950/10" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
            Escolha uma Seleção para <span className="text-amber-500">Acompanhar</span>!
          </h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed mt-2.5 max-w-xl mx-auto">
            Acompanhe o caminho rumo ao ouro sob os holofotes. Sua seleção favorita receberá <strong>destaque visual especial</strong> em todas as tabelas, cruzamentos de mata-mata, cronogramas de jogos no campinho e súmulas!
          </p>
        </div>

        {/* Search & Sort Panel */}
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850/85 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Pesquisar por seleção..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2 text-xs font-semibold outline-none transition-all pl-9"
            />
            <div className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</div>
          </div>

          {/* Sort Controller */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Ordenar por:</span>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
              <button
                type="button"
                onClick={() => setSortBy('rating')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  sortBy === 'rating' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Força (OVR)
              </button>
              <button
                type="button"
                onClick={() => setSortBy('name')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  sortBy === 'name' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ordem A-Z
              </button>
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              onClick={() => handleSelectFavorite(team.id)}
              className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 rounded-2xl p-4 flex flex-col items-center text-center justify-between cursor-pointer transition-all shadow-sm relative group active:scale-95"
            >
              {/* Micro badge showing overall rating */}
              <div className="absolute top-2.4 right-2 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold group-hover:text-amber-400 transition-colors">
                ⭐ <span className="text-slate-300">{team.ratingOverall}</span>
              </div>

              {/* Flag Icon */}
              <div className="my-2.5 relative">
                <div className="absolute inset-0 bg-amber-500/10 rounded-full filter blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <Flag code={team.code} fallbackEmoji={team.flag} className="w-14 h-9 rounded shadow-md border border-slate-800 relative z-10 transition-transform group-hover:scale-105" />
              </div>

              {/* Team Info */}
              <div className="space-y-1 mt-1 mb-3">
                <h4 className="text-xs font-black text-slate-100 uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                  {team.name}
                </h4>
                <div className="flex flex-col items-center gap-1 font-mono text-[8px] text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span>{team.code}</span>
                    <span>•</span>
                    <span>OVR: {team.ratingOverall}</span>
                  </div>
                  {chosenMode === 'official' && (
                    <span className="text-amber-400 font-extrabold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded mt-0.5">
                      Grupo {getOfficialGroupLetter(team.name)}
                    </span>
                  )}
                </div>
              </div>

              {/* Follow Button */}
              <button
                type="button"
                className="w-full py-1.5 bg-slate-950 text-amber-500 border border-slate-800 group-hover:border-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 font-black text-[9.5px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Acompanhar
              </button>
            </div>
          ))}
        </div>

        {/* Continue without selecting helper */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => handleSelectFavorite('skip_tracking')}
            className="text-xs font-bold text-slate-500 hover:text-slate-350 transition-colors underline cursor-pointer"
          >
            Apenas simular sem destacar nenhum time
          </button>
        </div>
      </div>
    );
  }

  const isKnockoutRound = state.currentRound !== 'group';

  return (
    <div className="space-y-8" id="tournament-simulator-container">
      {/* Master Action Banner - Fixed/Sticky on Group Stage, Unfixed on Knockouts */}
      <div 
        className={`${
          isKnockoutRound 
            ? 'bg-slate-900 border border-slate-800 shadow-lg' 
            : 'sticky top-[73px] z-30 bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl'
        } rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all`} 
        id="simulation-actions-bar"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/25">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 uppercase tracking-tight text-sm">Painel de Simulação</h3>
              <p className="text-xs text-zinc-400 mt-0.5" id="simulation-phase-info">
                Fase Atual: {state.currentRound === 'group' && <span className="text-amber-400 font-bold">Fase de Grupos (48 seleções)</span>}
                {state.currentRound === 'r32' && <span className="text-amber-400 font-bold">16avos de Final (Matamata)</span>}
                {state.currentRound === 'oitavas' && <span className="text-amber-400 font-bold">Oitavas de Final</span>}
                {state.currentRound === 'quartas' && <span className="text-amber-400 font-bold">Quartas de Final</span>}
                {state.currentRound === 'semifinal' && <span className="text-amber-400 font-bold">Semifinais</span>}
                {state.currentRound === 'final_stages' && <span className="text-amber-500 font-bold">Finais (Final & 3º Lugar)</span>}
              </p>
            </div>
          </div>

          {/* Followed Team Mini Widget Badge */}
          {favoriteTeamId && favoriteTeamId !== 'skip_tracking' && (
            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/25 shrink-0 shadow-sm shadow-amber-500/5">
              <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-extrabold">Acompanhando:</span>
              <Flag code={getTeamById(favoriteTeamId).code} fallbackEmoji={getTeamById(favoriteTeamId).flag} className="w-4 h-2.5 rounded shadow-sm shrink-0" />
              <span className="text-xs font-extrabold text-amber-400">{getTeamById(favoriteTeamId).name}</span>
              <button
                onClick={() => handleSelectFavorite(null)}
                className="text-[9px] text-slate-400 hover:text-red-400 font-bold uppercase ml-1.5 transition-colors cursor-pointer"
                title="Mudar seleção acompanhada"
              >
                (Trocar)
              </button>
            </div>
          )}
        </div>

        {/* Unified actions depending on phase */}
        <div className="flex flex-wrap items-center gap-2.5">
          {state.currentRound === 'group' && (
            <>
              <button
                onClick={handleSimulateGroupStage}
                className="px-4 py-2 text-xs font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white rounded-xl text-slate-300 shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-sim-group-all"
              >
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                Simular Todos os Grupos
              </button>
              <button
                onClick={handleAdvanceToR32}
                className="px-4 py-2 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-advance-r32"
              >
                Avançar para os 16avos
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {state.currentRound === 'r32' && (
            <>
              <button
                onClick={handleSimulateR32}
                className="px-4 py-2 text-xs font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white rounded-xl text-slate-300 shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-sim-r32"
              >
                <Play className="h-3.5 w-3.5 text-teal-400" />
                Simular Todos os 16 Jogos
              </button>
              <button
                onClick={handleAdvanceToOitavas}
                className="px-4 py-2 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-advance-oitavas"
              >
                Avançar as Oitavas
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {state.currentRound === 'oitavas' && (
            <>
              <button
                onClick={handleSimulateOitavas}
                className="px-4 py-2 text-xs font-bold bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded-xl text-zinc-300 shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-sim-oitavas"
              >
                <Play className="h-3.5 w-3.5 text-amber-400" />
                Simular Oitavas
              </button>
              <button
                onClick={handleAdvanceToQuartas}
                className="px-4 py-2 text-xs font-black bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-advance-quartas"
              >
                Avançar p/ Quartas
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {state.currentRound === 'quartas' && (
            <>
              <button
                onClick={handleSimulateQuartas}
                className="px-4 py-2 text-xs font-bold bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded-xl text-zinc-300 shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-sim-quartas"
              >
                <Play className="h-3.5 w-3.5 text-amber-400" />
                Simular Quartas
              </button>
              <button
                onClick={handleAdvanceToSemis}
                className="px-4 py-2 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-advance-semis"
              >
                Avançar paras Semifinais
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {state.currentRound === 'semifinal' && (
            <>
              <button
                onClick={handleSimulateSemis}
                className="px-4 py-2 text-xs font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white rounded-xl text-slate-300 shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-sim-semis"
              >
                <Play className="h-3.5 w-3.5 text-rose-400" />
                Simular Semifinais
              </button>
              <button
                onClick={handleAdvanceToFinals}
                className="px-4 py-2 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-advance-finals"
              >
                Avançar paras Finais
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {state.currentRound === 'final_stages' && (
            <>
              <button
                onClick={handleSimulateFinalStg}
                className="px-5 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-sim-finals"
              >
                <Trophy className="h-3.5 w-3.5 fill-slate-950" />
                Simular Finais
              </button>
            </>
          )}

          <button
            onClick={() => setCloudModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 hover:text-amber-300 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            id="btn-cloud-saves"
            title="Gerenciar Salves e Progresso na Nuvem (Firebase)"
          >
            <Cloud className="h-3.5 w-3.5 text-amber-400" />
            <span>Nuvem Firebase ☁️</span>
            {cloudSyncStatus === 'saving' ? (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={resetTournament}
            className="px-3.5 py-2 text-xs font-bold bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/20 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            id="btn-reset-tournament"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reiniciar Sorteio
          </button>
        </div>
      </div>

      {/* RENDER CONTENT BASED ON ACTIVE STAGE */}
      <AnimatePresence mode="wait">
        
        {/* CASE A: GROUP STAGES INTERFACES (12 Groups A-L) */}
        {state.currentRound === 'group' && (
          <motion.div
            key="groups-stage"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            id="groups-standings-list"
          >
            {state.groups.map((group) => (
              <div key={group.letter} className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-md flex flex-col justify-between" id={`group-card-${group.letter}`}>
                <div>
                  {/* Header info */}
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <h4 className="text-sm font-black tracking-tight text-slate-200">
                      GRUPO <span className="text-amber-500 text-lg font-mono ml-0.5">{group.letter}</span>
                    </h4>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Classificam-se 2</span>
                  </div>

                  {/* Standing tables */}
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-850 text-[9px] uppercase font-mono text-slate-500">
                          <th className="py-1">Seleção</th>
                          <th className="py-1 text-center w-6">P</th>
                          <th className="py-1 text-center w-6">J</th>
                          <th className="py-1 text-center w-6">SG</th>
                          <th className="py-1 text-center w-6">GP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.teams.map((tStat, idx) => {
                          const team = getTeamById(tStat.teamId);
                          const isQualifying = idx < 2;
                          const isFavorite = team.id === favoriteTeamId;

                          return (
                            <tr 
                              key={tStat.teamId} 
                              id={`row-${group.letter}-${team.id}`}
                              className={`border-b border-slate-850/30 hover:bg-slate-950/20 transition-colors ${
                                isFavorite 
                                  ? 'bg-amber-500/15 border-l-2 border-l-amber-500 font-extrabold text-amber-300' 
                                  : isQualifying 
                                    ? 'text-slate-100 font-medium' 
                                    : 'text-slate-500 opacity-60'
                              }`}
                            >
                              <td className="py-1.5 flex items-center gap-1.5 pl-1">
                                <span className={`font-mono text-[9.5px] w-3 text-center ${isFavorite ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                                  {isFavorite ? '★' : idx + 1}
                                </span>
                                <Flag code={team.code} fallbackEmoji={team.flag} className="w-4.5 h-3 rounded-xs shrink-0" />
                                <span className={`truncate max-w-[85px] ${isFavorite ? 'text-amber-300 font-black' : ''}`}>{team.name}</span>
                              </td>
                              <td className={`py-1.5 text-center font-extrabold font-mono ${isFavorite ? 'text-amber-400' : isQualifying ? 'text-emerald-400' : ''}`}>{tStat.points}</td>
                              <td className="py-1.5 text-center font-mono">{tStat.played}</td>
                              <td className="py-1.5 text-center font-mono">{tStat.gd > 0 ? `+${tStat.gd}` : tStat.gd}</td>
                              <td className="py-1.5 text-center font-mono">{tStat.gf}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Group Matches list (sub-panel) */}
                <div className="pt-2 border-t border-slate-850 space-y-1 mt-auto">
                  <div className="grid grid-cols-1 gap-1.5">
                    {state.groupMatches
                      .filter(m => m.groupLetter === group.letter)
                      .map((m) => {
                        const tA = getTeamById(m.teamAId);
                        const tB = getTeamById(m.teamBId);
                        const isFavA = tA.id === favoriteTeamId;
                        const isFavB = tB.id === favoriteTeamId;
                        const isMatchFav = isFavA || isFavB;

                        return (
                          <div
                            key={m.id}
                            onClick={() => handleSimulateSingleMatch(m)}
                            id={`match-btn-${m.id}`}
                            className={`p-1.5 rounded-lg border text-[10px] flex items-center justify-between cursor-pointer transition-all ${
                              m.played 
                                ? isMatchFav
                                  ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 text-amber-250 shadow-[0_0_8px_rgba(245,158,11,0.05)] font-bold'
                                  : 'bg-slate-950/40 border-slate-850/80 hover:bg-slate-950/70 text-slate-300' 
                                : isMatchFav
                                  ? 'bg-amber-500/[0.04] border-amber-500/50 hover:border-amber-400 text-amber-300 ring-1 ring-amber-500/20'
                                  : 'bg-slate-900 border-slate-800/60 hover:border-amber-500/30 text-slate-400'
                            }`}
                          >
                            <span className={`truncate max-w-[65px] font-medium ${isFavA ? 'text-amber-400 font-black' : 'text-slate-300'}`}>
                              {isFavA && '★ '}{tA.name}
                            </span>
                            
                            {m.played ? (
                              <span className={`font-mono font-black px-1 py-0.5 rounded bg-slate-950 border shrink-0 ${isMatchFav ? 'border-amber-500/40 text-amber-400' : 'border-slate-850 text-slate-100'}`}>
                                {m.scoreA} : {m.scoreB}
                              </span>
                            ) : (
                              <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded shrink-0 ${isMatchFav ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'bg-amber-500/5 border border-amber-500/10 text-amber-500/80'}`}>vs</span>
                            )}

                            <span className={`truncate max-w-[65px] font-medium text-right ${isFavB ? 'text-amber-400 font-black' : 'text-slate-300'}`}>
                              {tB.name}{isFavB && ' ★'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

              </div>
            ))}
          </motion.div>
        )}

        {/* CASE B: SINGLE-ELIMINATION MATAMATA */}
        {state.currentRound !== 'group' && (
          <motion.div
            key="bracket-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Visual Round Tabs for pristine structure */}
            <div className="flex flex-wrap border-b border-slate-800/80 pb-px gap-1.5" id="bracket-navigation-tabs">
              <button
                onClick={() => setActiveBracketTab('r32')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 cursor-pointer ${
                  activeBracketTab === 'r32'
                    ? 'bg-slate-900 border-slate-800 text-amber-500 outline-none pb-3 -mb-px'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 pb-2.5'
                }`}
              >
                <span>16avos de Final</span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono ${activeBracketTab === 'r32' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                  {r32PlayedCount}/16
                </span>
                {state.r32Matches.length > 0 && state.r32Matches.every(m => m.played) && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/15 shrink-0" />
                )}
              </button>

              <button
                onClick={() => setActiveBracketTab('oitavas')}
                disabled={state.oitavasMatches.length === 0}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                  state.oitavasMatches.length === 0 ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${
                  activeBracketTab === 'oitavas'
                    ? 'bg-slate-900 border-slate-800 text-amber-500 outline-none pb-3 -mb-px'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 pb-2.5'
                }`}
              >
                <span>Oitavas</span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono ${activeBracketTab === 'oitavas' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                  {oitavasPlayedCount}/8
                </span>
                {state.oitavasMatches.length > 0 && state.oitavasMatches.every(m => m.played) && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/15 shrink-0" />
                )}
              </button>

              <button
                onClick={() => setActiveBracketTab('quartas')}
                disabled={state.quartasMatches.length === 0}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                  state.quartasMatches.length === 0 ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${
                  activeBracketTab === 'quartas'
                    ? 'bg-slate-900 border-slate-800 text-amber-500 outline-none pb-3 -mb-px'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 pb-2.5'
                }`}
              >
                <span>Quartas</span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono ${activeBracketTab === 'quartas' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                  {quartasPlayedCount}/4
                </span>
                {state.quartasMatches.length > 0 && state.quartasMatches.every(m => m.played) && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/15 shrink-0" />
                )}
              </button>

              <button
                onClick={() => setActiveBracketTab('semis')}
                disabled={state.semifinalMatches.length === 0}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                  state.semifinalMatches.length === 0 ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${
                  activeBracketTab === 'semis'
                    ? 'bg-slate-900 border-slate-800 text-amber-500 outline-none pb-3 -mb-px'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 pb-2.5'
                }`}
              >
                <span>Semifinal</span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono ${activeBracketTab === 'semis' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                  {semisPlayedCount}/2
                </span>
                {state.semifinalMatches.length > 0 && state.semifinalMatches.every(m => m.played) && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/15 shrink-0" />
                )}
              </button>

              <button
                onClick={() => setActiveBracketTab('finais')}
                disabled={!state.finalMatch}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                  !state.finalMatch ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${
                  activeBracketTab === 'finais'
                    ? 'bg-slate-900 border-slate-800 text-amber-500 outline-none pb-3 -mb-px'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 pb-2.5'
                }`}
              >
                <span>Finais & Disputa 3º</span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono ${activeBracketTab === 'finais' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                  {finalsPlayedCount}/2
                </span>
                {finalsPlayedCount === 2 && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/15 shrink-0" />
                )}
              </button>
            {/* View Mode Switcher for Symmetrical Bracket vs Traditional Cards */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850">
              <div className="flex items-start gap-2.5">
                <Trophy className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Visualização do Torneio</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Alterne entre o Chaveamento Oficial da Copa ou as partidas de cada fase isolada.</p>
                </div>
              </div>
              <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl w-full sm:w-auto self-stretch sm:self-auto shrink-0 flex-wrap gap-1">
                <button
                  onClick={() => setViewMode('symmetric_bracket')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'symmetric_bracket'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Chaveamento Copa
                </button>
                <button
                  onClick={() => setViewMode('visual_cards')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'visual_cards'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Rodada Isolada
                </button>
              </div>
            </div>

            {/* Render Matches of the Active Tab */}
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl" id="bracket-graphics-grid">
              
              {viewMode === 'symmetric_bracket' ? (
                <div className="space-y-6">
                  {/* Title and stats bar */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-850 pb-4 gap-4">
                    <div>
                      <span className="text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded border border-amber-500/25">
                        Chaveamento Simétrico (Árvore de Grafos)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 font-sans">Navegue pelas conexões, ajuste o zoom e dispute as partidas clicando nos confrontos.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      {/* Premium Zoom & Screen Orientation controls */}
                      <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 shadow-sm">
                        <button 
                          onClick={() => setZoom(prev => Math.max(0.25, Number((prev - 0.05).toFixed(2))))} 
                          className="p-1 hover:text-white hover:bg-slate-900 rounded transition text-slate-400 cursor-pointer"
                          title="Diminuir zoom (Z-)"
                        >
                          <ZoomOut className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[10px] font-mono text-slate-300 w-12 text-center select-none font-semibold">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button 
                          onClick={() => setZoom(prev => Math.min(1.2, Number((prev + 0.05).toFixed(2))))} 
                          className="p-1 hover:text-white hover:bg-slate-900 rounded transition text-slate-400 cursor-pointer"
                          title="Aumentar zoom (Z+)"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={fitToScreen} 
                          className="p-1 text-[9px] font-black text-amber-400 uppercase tracking-widest hover:text-amber-300 transition border-l border-slate-800 pl-2 ml-1 cursor-pointer flex items-center gap-1"
                          title="Ajustar automaticamente à largura da tela"
                        >
                          <Maximize2 className="h-3 w-3" />
                          Ajustar
                        </button>
                      </div>

                      {/* Landscape Orientation Lock button */}
                      <button
                        onClick={toggleLandscapeOrientation}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition border flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isLandscapeLocked
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                            : 'bg-slate-950 text-amber-400 hover:text-amber-300 border-amber-500/30 hover:border-amber-500/60'
                        }`}
                        title="Girar a tela para a horizontal (Modo Paisagem)"
                      >
                        <RotateCw className={`h-3.5 w-3.5 ${isLandscapeLocked ? 'animate-spin' : ''}`} />
                        <span>{isLandscapeLocked ? 'Horizontal Ativo' : 'Girar Tela 🔄'}</span>
                      </button>

                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
                        <span>16avos: <strong className="text-slate-200">{r32PlayedCount}/16</strong></span>
                        <span>Oitavas: <strong className="text-slate-200">{oitavasPlayedCount}/8</strong></span>
                        <span>Quartas: <strong className="text-slate-200">{quartasPlayedCount}/4</strong></span>
                        <span>Semis: <strong className="text-slate-200">{semisPlayedCount}/2</strong></span>
                        <span>Finais: <strong className="text-slate-200">{finalsPlayedCount}/2</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Orientation Toast Banner */}
                  {orientationToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-amber-500/15 border border-amber-500/40 text-amber-300 p-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-amber-400 shrink-0 rotate-90" />
                        <span>{orientationToast}</span>
                      </div>
                      <button
                        onClick={() => setOrientationToast(null)}
                        className="text-amber-400 hover:text-amber-200 p-1 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </motion.div>
                  )}

                  {/* Mobile Tip & Quick Switcher Banner */}
                  <div className="sm:hidden text-[11px] bg-slate-950/90 p-2.5 rounded-2xl border border-amber-500/25 text-slate-300 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4 text-amber-400 shrink-0 rotate-90" />
                      <span>Arraste com o dedo ou gire a tela para a horizontal:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={toggleLandscapeOrientation}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg border transition shrink-0 cursor-pointer flex items-center gap-1 ${
                          isLandscapeLocked
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/35 hover:bg-amber-500/25'
                        }`}
                      >
                        <RotateCw className="h-3 w-3" />
                        {isLandscapeLocked ? 'Vertical' : 'Girar Tela 🔄'}
                      </button>
                      <button
                        onClick={() => setViewMode('visual_cards')}
                        className="text-[10px] font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 hover:text-white transition shrink-0 cursor-pointer"
                      >
                        Ver Cards
                      </button>
                    </div>
                  </div>

                  {/* Quick Stage Shortcuts / Navigation Pills */}
                  <div className="flex items-center justify-between gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 text-xs overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-mono text-slate-500 uppercase font-extrabold mr-1 hidden sm:inline">Navegação:</span>
                      <button
                        type="button"
                        onClick={() => scrollToPosition('left')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition border border-slate-800 shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        ⬅️ Esquerda
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToPosition('col', 0)}
                        className="px-2 py-1 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-semibold transition border border-slate-800/80 shrink-0 cursor-pointer"
                      >
                        1/16
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToPosition('col', 1)}
                        className="px-2 py-1 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-semibold transition border border-slate-800/80 shrink-0 cursor-pointer"
                      >
                        Oitavas
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToPosition('col', 2)}
                        className="px-2 py-1 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-semibold transition border border-slate-800/80 shrink-0 cursor-pointer"
                      >
                        Quartas
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToPosition('center')}
                        className="px-3 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 rounded-lg text-[10px] font-extrabold transition border border-amber-500/35 shrink-0 cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        🏆 Final
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToPosition('col', 6)}
                        className="px-2 py-1 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-semibold transition border border-slate-800/80 shrink-0 cursor-pointer"
                      >
                        Quartas
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToPosition('col', 7)}
                        className="px-2 py-1 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-semibold transition border border-slate-800/80 shrink-0 cursor-pointer"
                      >
                        Oitavas
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToPosition('col', 8)}
                        className="px-2 py-1 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-semibold transition border border-slate-800/80 shrink-0 cursor-pointer"
                      >
                        1/16
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToPosition('right')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition border border-slate-800 shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        Direita ➡️
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={fitToScreen}
                      className="px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-extrabold shrink-0 transition flex items-center gap-1 cursor-pointer hidden sm:flex"
                      title="Ajustar ao tamanho da janela"
                    >
                      <Maximize2 className="h-3 w-3" />
                      Tela Toda
                    </button>
                  </div>

                  {/* Symmetrical tree layout */}
                  <div 
                    ref={scrollerRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className={`w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800 rounded-3xl touch-pan-x flex flex-col items-center justify-center ${
                      isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
                    }`} 
                    id="symmetric-bracket-scroller"
                  >
                    <div 
                      style={{ 
                        width: `${1850 * zoom}px`, 
                        height: `${880 * zoom}px`, 
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                      className="mx-auto rounded-3xl border border-slate-850/80 bg-slate-950/60 transition-all duration-200 shadow-inner shrink-0"
                    >
                      <div 
                        className="flex items-center justify-between gap-3 py-8 px-8 absolute top-0 left-0"
                        style={{
                          width: '1850px',
                          height: '880px',
                          transform: `scale(${zoom})`,
                          transformOrigin: 'top left',
                        }}
                      >
                      
                      {/* Decorative elements */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.04)_0%,transparent_70%)] pointer-events-none" />
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-slate-800/40 to-transparent pointer-events-none" />

                      {/* COL 1: 1/16 LEFT (R32 Matches 1-8 / idx 0-7) */}
                      <div className="flex flex-col justify-around h-full shrink-0 w-[170px]">
                        <span className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500 text-center block -mt-1 mb-1 font-sans">1/16 Final</span>
                        {renderSymmetricMatchBox('r32', 0)}
                        {renderSymmetricMatchBox('r32', 1)}
                        {renderSymmetricMatchBox('r32', 2)}
                        {renderSymmetricMatchBox('r32', 3)}
                        {renderSymmetricMatchBox('r32', 4)}
                        {renderSymmetricMatchBox('r32', 5)}
                        {renderSymmetricMatchBox('r32', 6)}
                        {renderSymmetricMatchBox('r32', 7)}
                      </div>

                      {/* COL 2: OITAVAS LEFT (Oitavas Matches 1-4 / idx 0-3) */}
                      <div className="flex flex-col justify-around h-full shrink-0 w-[170px] py-4">
                        <span className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500 text-center block -mt-1 mb-1 font-sans">Oitavas</span>
                        {renderSymmetricMatchBox('oitavas', 0)}
                        {renderSymmetricMatchBox('oitavas', 1)}
                        {renderSymmetricMatchBox('oitavas', 2)}
                        {renderSymmetricMatchBox('oitavas', 3)}
                      </div>

                      {/* COL 3: QUARTAS LEFT (Quartas Matches 1-2 / idx 0-1) */}
                      <div className="flex flex-col justify-around h-full shrink-0 w-[170px] py-12">
                        <span className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500 text-center block -mt-1 mb-1 font-sans">Quartas</span>
                        {renderSymmetricMatchBox('quartas', 0)}
                        {renderSymmetricMatchBox('quartas', 1)}
                      </div>

                      {/* COL 4: SEMI LEFT (Semi Match 1 / idx 0) */}
                      <div className="flex flex-col justify-around h-full shrink-0 w-[170px] py-28">
                        <span className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500 text-center block -mt-1 mb-1 font-sans">Semifinal</span>
                        {renderSymmetricMatchBox('semis', 0)}
                      </div>

                      {/* COL 5: CENTER (BRAND, GRAND FINAL, 3RD PLACE, TROPHY) */}
                      <div className="flex flex-col items-center justify-center gap-6 w-[290px] shrink-0 h-full text-center py-2">
                        {/* Title group */}
                        <div className="space-y-0.5 select-none font-sans">
                          <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400 font-mono">COPA DO MUNDO 2026</span>
                          <h3 className="text-xl font-black text-white leading-none tracking-tighter">
                            WORLD'S <span className="text-emerald-400 font-extrabold">GAME</span>
                          </h3>
                        </div>

                        {/* Grande Final match card */}
                        <div className="space-y-2 p-2.5 bg-slate-900/90 border border-amber-500/40 rounded-2xl shadow-xl w-[190px] relative">
                          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent pointer-events-none" />
                          <span className="text-[9px] font-black font-mono uppercase tracking-widest text-amber-500 block text-center select-none font-sans">Grande Final</span>
                          <div className="flex justify-center">
                            {renderSymmetricMatchBox('final', 0)}
                          </div>
                        </div>

                        {/* Disputa do Bronze match card */}
                        <div className="space-y-2 p-2.5 bg-slate-900/90 border border-purple-500/20 rounded-2xl shadow-md w-[190px] relative">
                          <span className="text-[9px] font-black font-mono uppercase tracking-widest text-purple-400 block text-center select-none font-sans">3º Lugar</span>
                          <div className="flex justify-center">
                            {renderSymmetricMatchBox('third', 0)}
                          </div>
                        </div>

                        {/* Gold Cup Trophy SVG */}
                        <div className="relative h-20 w-20 flex items-center justify-center mt-1">
                          <div className="absolute inset-0 bg-indigo-500/10 rounded-full filter blur-md pointer-events-none" />
                          <svg className="h-14 w-14 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.25)] hover:scale-105 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="8" y="20" width="8" height="2" rx="0.5" fill="#E2E8F0" />
                            <path d="M9 17H15V20H9V17Z" fill="#94A3B8" />
                            <path d="M11 13H13V17H11V13Z" fill="#F59E0B" />
                            <path d="M5 5V10C5 12.5 7 13.5 10 13.9V14H14V13.9C17 13.5 19 12.5 19 10V5H5Z" fill="#FBDF51" />
                            <path d="M5 6H3V9C3 10.5 4 11.5 5 11.8V6Z" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
                            <path d="M19 6H21V9C21 10.5 20 11.5 19 11.8V6Z" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
                            <circle cx="12" cy="8" r="1.5" fill="#FFFFFF" className="animate-pulse" />
                          </svg>
                        </div>
                      </div>

                      {/* COL 6: SEMI RIGHT (Semi Match 2 / idx 1) */}
                      <div className="flex flex-col justify-around h-full shrink-0 w-[170px] py-28">
                        <span className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500 text-center block -mt-1 mb-1 font-sans">Semifinal</span>
                        {renderSymmetricMatchBox('semis', 1)}
                      </div>

                      {/* COL 7: QUARTAS RIGHT (Quartas Matches 3-4 / idx 2-3) */}
                      <div className="flex flex-col justify-around h-full shrink-0 w-[170px] py-12">
                        <span className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500 text-center block -mt-1 mb-1 font-sans">Quartas</span>
                        {renderSymmetricMatchBox('quartas', 2)}
                        {renderSymmetricMatchBox('quartas', 3)}
                      </div>

                      {/* COL 8: OITAVAS RIGHT (Oitavas Matches 5-8 / idx 4-7) */}
                      <div className="flex flex-col justify-around h-full shrink-0 w-[170px] py-4">
                        <span className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500 text-center block -mt-1 mb-1 font-sans">Oitavas</span>
                        {renderSymmetricMatchBox('oitavas', 4)}
                        {renderSymmetricMatchBox('oitavas', 5)}
                        {renderSymmetricMatchBox('oitavas', 6)}
                        {renderSymmetricMatchBox('oitavas', 7)}
                      </div>

                      {/* COL 9: 1/16 RIGHT (R32 Matches 9-16 / idx 8-15) */}
                      <div className="flex flex-col justify-around h-full shrink-0 w-[170px]">
                        <span className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500 text-center block -mt-1 mb-1 font-sans">1/16 Final</span>
                        {renderSymmetricMatchBox('r32', 8)}
                        {renderSymmetricMatchBox('r32', 9)}
                        {renderSymmetricMatchBox('r32', 10)}
                        {renderSymmetricMatchBox('r32', 11)}
                        {renderSymmetricMatchBox('r32', 12)}
                        {renderSymmetricMatchBox('r32', 13)}
                        {renderSymmetricMatchBox('r32', 14)}
                        {renderSymmetricMatchBox('r32', 15)}
                      </div>

                    </div>
                  </div>
                </div>

                  {/* Flow guidance Tray at bottom */}
                  {renderBracketManagerTray()}
                </div>
              ) : (
                <>
                  {activeBracketTab === 'r32' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold font-mono uppercase bg-teal-500/10 text-teal-400 px-2.5 py-1 rounded border border-teal-500/25">16avos de Final (16 Jogos)</span>
                        <span className="text-[10px] text-slate-500 font-mono">{r32PlayedCount}/16 Jogados</span>
                      </div>
                      {state.r32Matches.length === 0 ? (
                        <div className="text-slate-500 text-xs italic p-4 text-center">Defina a Fase de Grupos para gerar os confrontos de 16avos de Final.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {state.r32Matches.map((m) => (
                            <BracketMatchCard key={m.id} match={m} onSim={handleSimulateSingleMatch} favoriteTeamId={favoriteTeamId} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeBracketTab === 'oitavas' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded border border-amber-500/25">Oitavas de Final</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{oitavasPlayedCount}/8 Jogados</span>
                      </div>
                      {state.oitavasMatches.length === 0 ? (
                        <div className="text-zinc-500 text-sm italic p-6 text-center bg-zinc-950/20 rounded-xl border border-zinc-800">Conclua todos os confrontos de 16avos de final para gerar os jogos desta etapa.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {state.oitavasMatches.map((m) => (
                            <BracketMatchCard key={m.id} match={m} onSim={handleSimulateSingleMatch} favoriteTeamId={favoriteTeamId} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeBracketTab === 'quartas' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded border border-amber-500/25">Quartas de Final</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{quartasPlayedCount}/4 Jogados</span>
                      </div>
                      {state.quartasMatches.length === 0 ? (
                        <div className="text-slate-500 text-sm italic p-6 text-center bg-slate-950/20 rounded-xl border border-slate-800">Conclua todos os confrontos de oitavas de final para gerar os jogos desta etapa.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                          {state.quartasMatches.map((m) => (
                            <BracketMatchCard key={m.id} match={m} onSim={handleSimulateSingleMatch} favoriteTeamId={favoriteTeamId} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeBracketTab === 'semis' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold font-mono uppercase bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded border border-rose-500/25">Semifinais</span>
                        <span className="text-[10px] text-slate-500 font-mono">{semisPlayedCount}/2 Jogados</span>
                      </div>
                      {state.semifinalMatches.length === 0 ? (
                        <div className="text-slate-500 text-sm italic p-6 text-center bg-slate-950/20 rounded-xl border border-slate-800">Conclua todos os confrontos de quartas para gerar os jogos desta etapa.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                          {state.semifinalMatches.map((m) => (
                            <BracketMatchCard key={m.id} match={m} onSim={handleSimulateSingleMatch} favoriteTeamId={favoriteTeamId} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeBracketTab === 'finais' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <div>
                          <span className="text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded inline-block mb-2 border border-amber-500/25">Grande Final</span>
                          {state.finalMatch ? (
                            <BracketMatchCard match={state.finalMatch} onSim={handleSimulateSingleMatch} highlight favoriteTeamId={favoriteTeamId} />
                          ) : (
                            <div className="text-slate-500 text-xs italic bg-slate-950/20 p-4 border border-slate-800 rounded-xl">Aguardando definição das semifinais.</div>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-bold font-mono uppercase bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded inline-block mb-2 border border-purple-500/25">Decisão de 3º Lugar</span>
                          {state.thirdPlaceMatch ? (
                            <BracketMatchCard match={state.thirdPlaceMatch} onSim={handleSimulateSingleMatch} favoriteTeamId={favoriteTeamId} />
                          ) : (
                            <div className="text-slate-500 text-xs italic bg-slate-950/20 p-4 border border-slate-800 rounded-xl">Aguardando definição das semifinais.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>

            </div>

            {/* GRAND CHAMPION PODIUM CARD RENDERING */}
            {state.championId && (
              <>
                {/* Cannon blast confetti starts when accompanied team wins! */}
                {favoriteTeamId && favoriteTeamId !== 'skip_tracking' && state.championId === favoriteTeamId && (
                  <ConfettiEffect active={true} />
                )}

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-slate-900 border-2 rounded-3xl p-6 relative overflow-hidden shadow-2xl text-center flex flex-col items-center ${
                    favoriteTeamId && favoriteTeamId !== 'skip_tracking' && state.championId === favoriteTeamId
                      ? 'border-yellow-400 ring-4 ring-yellow-500/20'
                      : 'border-amber-500/80'
                  }`}
                  id="champion-gild-card"
                >
                  {/* Shiny star decorations */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-pulse" />
                  <div className="absolute top-2 right-2 text-amber-400/40 animate-ping">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  {favoriteTeamId && favoriteTeamId !== 'skip_tracking' && state.championId === favoriteTeamId && (
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                  )}

                  <Trophy className="h-16 w-16 text-yellow-500 animate-bounce mb-3 fill-yellow-500/15 filter drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
                  
                  {favoriteTeamId && favoriteTeamId !== 'skip_tracking' && state.championId === favoriteTeamId ? (
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-extrabold block bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 mb-2">
                       🎉 A SELEÇÃO QUE VOCÊ ACOMPANHA É A CAMPEÃ! 🎉
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-extrabold block mb-2">
                      Campeão da Copa do Mundo!
                    </span>
                  )}
                  
                  <h2 className="text-3xl md:text-4xl font-black text-white mt-1.5 tracking-tight flex items-center justify-center gap-4">
                    <Flag code={getTeamById(state.championId).code} fallbackEmoji={getTeamById(state.championId).flag} className="w-10 h-6 md:w-14 md:h-9 rounded shadow" />
                    <span className="text-yellow-400">{getTeamById(state.championId).name.toUpperCase()}</span>
                    <Flag code={getTeamById(state.championId).code} fallbackEmoji={getTeamById(state.championId).flag} className="w-10 h-6 md:w-14 md:h-9 rounded shadow" />
                  </h2>

                  <p className="text-xs text-slate-400 mt-2 max-w-md">
                    {favoriteTeamId && favoriteTeamId !== 'skip_tracking' && state.championId === favoriteTeamId ? (
                      `PARABÉNS! A seleção de ${getTeamById(state.championId).name} que você acompanhou desde a fase de grupos superou todos os desafios e conquistou a glória eterna no templo do futebol!`
                    ) : (
                      `A equipe de ${getTeamById(state.championId).name} entra de vez no panteão dos lendários campeões do futebol com uma campanha histórica! Estrelas e tática triunfaram no palco principal.`
                    )}
                  </p>

                {/* Second and third places listings */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800/80 w-full max-w-sm uppercase font-mono text-[10px]">
                  <div>
                    <span className="text-slate-500 block font-semibold">Vice-Campeão</span>
                    {state.runnerUpId && (
                      <span className="text-slate-200 font-bold flex items-center gap-1.5 text-xs mt-1 justify-center">
                        <Flag code={getTeamById(state.runnerUpId).code} fallbackEmoji={getTeamById(state.runnerUpId).flag} className="w-5 h-3.5 rounded-sm shrink-0 shadow-sm" /> {getTeamById(state.runnerUpId).name}
                      </span>
                    )}
                  </div>
                  <div className="border-l border-slate-800">
                    <span className="text-slate-500 block font-semibold">Terceiro Lugar</span>
                    {state.thirdPlaceId && (
                      <span className="text-slate-300 font-bold flex items-center gap-1.5 text-xs mt-1 justify-center">
                        <Flag code={getTeamById(state.thirdPlaceId).code} fallbackEmoji={getTeamById(state.thirdPlaceId).flag} className="w-5 h-3.5 rounded-sm shrink-0 shadow-sm" /> {getTeamById(state.thirdPlaceId).name}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}

          </motion.div>
        )}

      </AnimatePresence>

      {/* DETAILED DRILLDOWN MODAL POPUP */}
      <AnimatePresence>
        {selectedMatch && (
          <MatchDetailModal 
            match={selectedMatch} 
            onClose={() => setSelectedMatch(null)} 
          />
        )}
      </AnimatePresence>

      {/* INTERACTIVE TIMELINE SIMULATION MODAL */}
      <AnimatePresence>
        {liveSimPendingMatch && (
          <LiveMatchSimulatorModal
            match={liveSimPendingMatch}
            favoriteTeamId={favoriteTeamId}
            onClose={() => setLiveSimPendingMatch(null)}
            onComplete={handleLiveSimComplete}
          />
        )}
      </AnimatePresence>

      {/* FAVORITE ELIMINATED EXPLANATION NOTICE POPUP */}
      <AnimatePresence>
        {eliminationNotice && eliminationNotice.show && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-center shadow-2xl relative overflow-hidden"
              id="elimination-alert-modal"
            >
              {/* Highlight background light */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full filter blur-3xl pointer-events-none" />
              
              <div className="text-4xl mb-4 text-rose-500">
                💔
              </div>

              <h3 className="text-lg font-extrabold text-white uppercase tracking-tight font-mono">
                Sua Seleção foi Eliminada!
              </h3>
              
              <p className="text-xs text-rose-400 font-mono mt-1 font-bold">
                {eliminationNotice.teamName} está fora da disputa
              </p>

              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Como sua seleção foi desclassificada nas etapas do mata-mata, <strong className="text-amber-400">todos os demais jogos restantes foram simulados automaticamente</strong> até a Grande Final.
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setEliminationNotice(null)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-755 hover:text-white text-slate-300 font-bold uppercase tracking-wider text-[11px] rounded-xl border border-slate-700 transition cursor-pointer"
                  id="dismiss-elimination-btn"
                >
                  Ver Resultados do Torneio
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* FIREBASE CLOUD SAVES MODAL */}
        {cloudModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 text-left shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
              id="cloud-saves-modal"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-400">
                    <Cloud className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      Armazenamento na Nuvem <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">Firebase Firestore</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Salve seu progresso da Copa 2026 em tempo real e acesse de qualquer lugar.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCloudModalOpen(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="space-y-6 overflow-y-auto pr-1 custom-scrollbar">
                {/* Save Current State Form */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <CloudUpload className="h-4 w-4 text-amber-400" />
                    Salvar Torneio Atual na Nuvem
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Minha Copa do Mundo - Brasil Campeão"
                      value={customSaveName}
                      onChange={(e) => setCustomSaveName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleSaveToCloudManual}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <CloudUpload className="h-4 w-4" />
                      Salvar na Nuvem
                    </button>
                  </div>
                </div>

                {/* Saved Tournaments List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CloudDownload className="h-4 w-4 text-amber-400" />
                      Torneios Salvos no Firebase ({savedTournaments.length})
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Sincronização em tempo real</span>
                  </h4>

                  {savedTournaments.length === 0 ? (
                    <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-800/80 text-slate-500 text-xs">
                      Nenhum salve manual encontrado ainda. Salve seu torneio acima para ter backups ilimitados na nuvem!
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {savedTournaments.map((tourney) => (
                        <div
                          key={tourney.id}
                          className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-100 truncate flex items-center gap-2">
                              {tourney.name}
                              {tourney.id === 'sim_torneio_ativo' && (
                                <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                  Auto-save Ativo
                                </span>
                              )}
                            </h5>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-3">
                              <span>Fase: <strong className="text-amber-400">{tourney.currentRound || 'Grupos'}</strong></span>
                              <span>Atualizado: {new Date(tourney.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleLoadCloudTournament(tourney)}
                              className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Carregar este torneio"
                            >
                              <CloudDownload className="h-3.5 w-3.5" />
                              Carregar
                            </button>

                            {tourney.id !== 'sim_torneio_ativo' && (
                              <button
                                onClick={() => handleDeleteCloudTournament(tourney.id)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                                title="Excluir salve"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado ao Banco de Dados Firestore
                </span>
                <button
                  onClick={() => setCloudModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CLOUD TOAST NOTIFICATION */}
        {cloudToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-slate-900 border border-amber-500/40 text-amber-300 px-4 py-3 rounded-2xl shadow-2xl z-50 text-xs font-bold flex items-center gap-2"
          >
            <Cloud className="h-4 w-4 text-amber-400" />
            <span>{cloudToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* Internal helper card representation for knockout matches */
function BracketMatchCard({ 
  match, 
  onSim, 
  highlight, 
  favoriteTeamId 
}: { 
  match: Match; 
  onSim: (m: Match) => void; 
  highlight?: boolean; 
  favoriteTeamId?: string | null; 
  key?: string | number | null;
}) {
  const tA = getTeamById(match.teamAId);
  const tB = getTeamById(match.teamBId);

  const isFavA = tA.id === favoriteTeamId;
  const isFavB = tB.id === favoriteTeamId;
  const hasFavorite = isFavA || isFavB;

  const isPlayed = match.played;
  let hasWinnerA = false;
  let hasWinnerB = false;

  if (isPlayed) {
    if (match.scoreA! > match.scoreB!) {
      hasWinnerA = true;
    } else if (match.scoreB! > match.scoreA!) {
      hasWinnerB = true;
    } else if (match.penaltiesA !== undefined && match.penaltiesB !== undefined) {
      hasWinnerA = match.penaltiesA > match.penaltiesB;
      hasWinnerB = !hasWinnerA;
    }
  }

  const cardBorderClass = highlight || hasFavorite
    ? 'bg-amber-500/[0.04] border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.12)] hover:border-amber-400 ring-1 ring-amber-500/20'
    : isPlayed 
      ? 'bg-slate-950/30 border-slate-800/80 hover:border-slate-700' 
      : 'bg-slate-900/60 border-slate-850 hover:border-amber-500/30 text-slate-400';

  return (
    <div 
      onClick={() => onSim(match)}
      id={`bracket-card-${match.id}`}
      className={`p-3.5 rounded-xl border text-xs cursor-pointer select-none transition-all flex flex-col justify-between hover:scale-[1.01] ${cardBorderClass}`}
    >
      <div className="space-y-2">
        {/* Team A Line */}
        <div className={`flex justify-between items-center p-1 rounded transition-colors ${isFavA ? 'bg-amber-500/10' : ''}`} id={`teamline-a-${match.id}`}>
          <div className="flex items-center gap-2 min-w-0">
            <Flag code={tA.code} fallbackEmoji={tA.flag} className="w-5 h-3.5 rounded-sm shrink-0 shadow-sm" />
            <span className={`truncate text-sm flex items-center gap-0.5 ${isFavA ? 'text-amber-350 font-black' : hasWinnerA ? 'text-white font-extrabold' : 'text-slate-300'}`}>
              {isFavA && <span className="text-amber-400">★</span>}
              {tA.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isPlayed && (
              <span className={`font-mono text-xs font-bold ${isFavA ? 'text-amber-300' : hasWinnerA ? 'text-amber-400' : 'text-slate-500'}`}>
                {match.scoreA}
              </span>
            )}
            {isPlayed && match.penaltiesA !== undefined && (
              <span className="text-[9px] font-mono text-amber-500/80">({match.penaltiesA})</span>
            )}
          </div>
        </div>

        {/* Team B Line */}
        <div className={`flex justify-between items-center p-1 rounded transition-colors ${isFavB ? 'bg-amber-500/10' : ''}`} id={`teamline-b-${match.id}`}>
          <div className="flex items-center gap-2 min-w-0">
            <Flag code={tB.code} fallbackEmoji={tB.flag} className="w-5 h-3.5 rounded-sm shrink-0 shadow-sm" />
            <span className={`truncate text-sm flex items-center gap-0.5 ${isFavB ? 'text-amber-350 font-black' : hasWinnerB ? 'text-white font-bold' : 'text-slate-300'}`}>
              {isFavB && <span className="text-amber-400">★</span>}
              {tB.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isPlayed && (
              <span className={`font-mono text-xs font-bold ${isFavB ? 'text-amber-300' : hasWinnerB ? 'text-amber-400' : 'text-slate-500'}`}>
                {match.scoreB}
              </span>
            )}
            {isPlayed && match.penaltiesB !== undefined && (
              <span className="text-[9px] font-mono text-amber-500/80">({match.penaltiesB})</span>
            )}
          </div>
        </div>
      </div>

      {/* Detail hint footer */}
      <div className="mt-2 text-[9px] text-slate-500 flex justify-between items-center uppercase font-mono self-stretch shrink-0 pt-2 border-t border-slate-850">
        <span>{match.roundLabel || 'Eliminatória'}</span>
        {isPlayed ? (
          <span className="text-emerald-500 font-semibold hover:text-emerald-400">Ver Lances</span>
        ) : (
          <span className="text-amber-500/70 font-bold hover:text-amber-400">Simular</span>
        )}
      </div>
    </div>
  );
}
