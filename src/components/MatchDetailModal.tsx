import { Match, NationalTeam } from '../types';
import { getTeamById } from '../utils/simulator';
import { X, Shield, Calendar, CircleDot, Info, BarChart3, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import Flag from './Flag';

interface MatchDetailModalProps {
  match: Match;
  onClose: () => void;
}

export default function MatchDetailModal({ match, onClose }: MatchDetailModalProps) {
  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);

  // Fallback default stats if none was created
  const stats = match.stats || {
    possessionA: 50,
    possessionB: 50,
    shotsA: 10,
    shotsB: 10,
    foulsA: 12,
    foulsB: 12,
    cornersA: 5,
    cornersB: 5
  };

  const hasPenalties = match.penaltiesA !== undefined && match.penaltiesB !== undefined;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4" id="match-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="galaxy-card rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        id="match-modal-box"
      >
        {/* Modal Header */}
        <div className="p-4 md:p-5 bg-zinc-950/90 border-b border-white/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase font-bold">
              {match.groupLetter ? `Grupo ${match.groupLetter}` : (match.roundLabel || 'Mata-Mata')}
            </span>
            {match.roundLabel && match.groupLetter && (
              <span className="text-xs font-mono text-zinc-400">{match.roundLabel}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            id="btn-close-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable to prevent spilling */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
          
          {/* Big Score Board Section */}
          <div className="bg-gradient-to-b from-zinc-950/80 to-zinc-950/10 p-6 rounded-2xl border border-zinc-800/80 relative text-center">
            <div className="grid grid-cols-11 gap-2 items-center">
              {/* Team A column */}
              <div className="col-span-4 text-center">
                <div className="flex justify-center mb-2">
                  <Flag code={teamA.code} fallbackEmoji={teamA.flag} className="w-16 h-10 md:w-20 md:h-12 rounded shadow border border-zinc-700/60" />
                </div>
                <span className="text-sm md:text-md font-bold text-zinc-100 block truncate">{teamA.name}</span>
                <span className="text-[10px] font-mono text-zinc-500 block">ATA: {teamA.ratingAttack} • DEF: {teamA.ratingDefense}</span>
              </div>

              {/* Score column */}
              <div className="col-span-3 flex flex-col items-center justify-center">
                {match.played ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl md:text-4xl font-extrabold text-white font-mono">{match.scoreA}</span>
                      <span className="text-zinc-500 font-mono text-xl">:</span>
                      <span className="text-3xl md:text-4xl font-extrabold text-white font-mono">{match.scoreB}</span>
                    </div>

                    {/* Penalty shootout visualization */}
                    {hasPenalties && (
                      <div className="mt-2 text-[10px] font-mono text-amber-400 font-bold bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">
                        Pên: {match.penaltiesA} x {match.penaltiesB}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-xs font-mono font-medium text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">VS</span>
                    <span className="text-[10px] text-zinc-500 block mt-2">Não Iniciado</span>
                  </div>
                )}
              </div>

              {/* Team B column */}
              <div className="col-span-4 text-center">
                <div className="flex justify-center mb-2">
                  <Flag code={teamB.code} fallbackEmoji={teamB.flag} className="w-16 h-10 md:w-20 md:h-12 rounded shadow border border-zinc-700/60" />
                </div>
                <span className="text-sm md:text-md font-bold text-zinc-100 block truncate">{teamB.name}</span>
                <span className="text-[10px] font-mono text-zinc-500 block font-medium">ATA: {teamB.ratingAttack} • DEF: {teamB.ratingDefense}</span>
              </div>
            </div>
          </div>

          {/* Grid Layout: Events vs Match Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Live Minute-by-Minute Event Feed */}
            <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-xl p-4 flex flex-col h-[280px]">
              <h4 className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 shrink-0 border-b border-zinc-800 pb-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>Lances da Partida</span>
              </h4>

              <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                {!match.events || match.events.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                    Sem lances ou gols reportados.
                  </div>
                ) : (
                  match.events.map((ev, idx) => {
                    const isTeamAEvent = ev.teamId === match.teamAId;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex gap-3 text-xs items-start ${isTeamAEvent ? 'border-l-2 border-emerald-500/50 pl-2' : 'border-l-2 border-rose-500/50 pl-2'}`}
                        id={`event-${idx}`}
                      >
                        {/* Event icon indicator */}
                        <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0 w-8">{ev.minute}'</span>
                        
                        <div>
                          <div className="flex items-center gap-1.5">
                            {ev.type === 'goal' && (
                              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                                ⚽ GOOL!
                              </span>
                            )}
                            {ev.type === 'yellow_card' && (
                              <span className="bg-amber-500 w-2 h-3 rounded-sm inline-block shrink-0" title="Cartão Amarelo" />
                            )}
                            {ev.type === 'red_card' && (
                              <span className="bg-rose-500 w-2 h-3 rounded-sm inline-block shrink-0" title="Cartão Vermelho" />
                            )}
                            <span className="font-bold text-slate-200">{ev.playerName}</span>
                          </div>
                          
                          {ev.detail && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{ev.detail}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Match Stats Comparison list */}
            <div className="bg-slate-950/30 border border-slate-800/80 rounded-xl p-4 flex flex-col h-[280px]">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 shrink-0 border-b border-slate-850 pb-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                <span>Estatísticas Conjugadas</span>
              </h4>

              <div className="flex-1 space-y-3.5 flex flex-col justify-center">
                {/* Possession comparison */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>{stats.possessionA}%</span>
                    <span className="uppercase font-semibold text-slate-500">Posse de Bola</span>
                    <span>{stats.possessionB}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${stats.possessionA}%` }} />
                    <div className="bg-rose-500 h-full" style={{ width: `${stats.possessionB}%` }} />
                  </div>
                </div>

                {/* Shots comparison */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>{stats.shotsA}</span>
                    <span className="uppercase font-semibold text-slate-500">Finalizações</span>
                    <span>{stats.shotsB}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden flex">
                    const sum = stats.shotsA + stats.shotsB;
                    <div className="bg-emerald-500 h-full" style={{ width: `${stats.shotsA + stats.shotsB > 0 ? (stats.shotsA / (stats.shotsA + stats.shotsB)) * 100 : 50}%` }} />
                    <div className="bg-rose-500 h-full" style={{ width: `${stats.shotsA + stats.shotsB > 0 ? (stats.shotsB / (stats.shotsA + stats.shotsB)) * 100 : 50}%` }} />
                  </div>
                </div>

                {/* Corners comparison */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>{stats.cornersA}</span>
                    <span className="uppercase font-semibold text-slate-500">Escanteios</span>
                    <span>{stats.cornersB}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${stats.cornersA + stats.cornersB > 0 ? (stats.cornersA / (stats.cornersA + stats.cornersB)) * 100 : 50}%` }} />
                    <div className="bg-rose-500 h-full" style={{ width: `${stats.cornersA + stats.cornersB > 0 ? (stats.cornersB / (stats.cornersA + stats.cornersB)) * 100 : 50}%` }} />
                  </div>
                </div>

                {/* Fouls comparison */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>{stats.foulsA}</span>
                    <span className="uppercase font-semibold text-slate-500">Faltas Cometidas</span>
                    <span>{stats.foulsB}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${stats.foulsA + stats.foulsB > 0 ? (stats.foulsA / (stats.foulsA + stats.foulsB)) * 100 : 50}%` }} />
                    <div className="bg-rose-500 h-full" style={{ width: `${stats.foulsB / (stats.foulsA + stats.foulsB) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
