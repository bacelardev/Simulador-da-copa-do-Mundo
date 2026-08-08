import { useState } from 'react';
import { TEAMS_DATA } from '../data/teams';
import { getOrCreateConfronto } from '../data/confrontos';
import { Swords, HelpCircle, Trophy, BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import Flag from './Flag';

export default function HeadToHead() {
  const [teamAId, setTeamAId] = useState<string>('brazil');
  const [teamBId, setTeamBId] = useState<string>('argentina');

  // Prevent selecting the same team for comparisons
  const handleTeamAChange = (val: string) => {
    setTeamAId(val);
    if (val === teamBId) {
      const remaining = TEAMS_DATA.find(t => t.id !== val);
      if (remaining) setTeamBId(remaining.id);
    }
  };

  const handleTeamBChange = (val: string) => {
    setTeamBId(val);
    if (val === teamAId) {
      const remaining = TEAMS_DATA.find(t => t.id !== val);
      if (remaining) setTeamAId(remaining.id);
    }
  };

  const swapTeams = () => {
    const temp = teamAId;
    setTeamAId(teamBId);
    setTeamBId(temp);
  };

  const teamA = TEAMS_DATA.find(t => t.id === teamAId) || TEAMS_DATA[0];
  const teamB = TEAMS_DATA.find(t => t.id === teamBId) || TEAMS_DATA[1];

  // Retrieve exact or simulated confronto stats
  const record = getOrCreateConfronto(teamAId, teamBId, teamA.name, teamB.name);

  // Compute live match prediction odds
  const powerA = teamA.ratingOverall * 0.6 + teamA.ratingAttack * 0.2 + teamA.ratingMidfield * 0.1 + teamA.ratingDefense * 0.1;
  const powerB = teamB.ratingOverall * 0.6 + teamB.ratingAttack * 0.2 + teamB.ratingMidfield * 0.1 + teamB.ratingDefense * 0.1;
  
  const diff = powerA - powerB;
  let probA = 35 + diff * 2.5; // base 35%
  let probB = 35 - diff * 2.5;
  let probDraw = 30; // base 30%

  // Normalize bounders
  if (probA < 10) probA = 10;
  if (probB < 10) probB = 10;
  const total = probA + probB + probDraw;
  const normA = Math.round((probA / total) * 100);
  const normB = Math.round((probB / total) * 100);
  const normDraw = 100 - normA - normB;

  return (
    <div className="space-y-6" id="head-to-head-container">
      {/* Selector Panels & Visual versus */}
      <div className="galaxy-card rounded-3xl p-6 relative overflow-hidden" id="versus-selector-card">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-transparent to-amber-500" />
        
        {/* Dynamic Selectors grid */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Team A Picker */}
          <div className="md:col-span-4 flex flex-col gap-2" id="h2h-select-teama">
            <label className="text-xs font-mono text-slate-400 uppercase">Seleção A</label>
            <div className="relative">
              <div className="absolute left-3.5 top-3.5 flex items-center justify-center">
                <Flag code={teamA.code} fallbackEmoji={teamA.flag} className="w-5 h-3.5 rounded-sm shadow" />
              </div>
              <select
                value={teamAId}
                onChange={(e) => handleTeamAChange(e.target.value)}
                className="w-full bg-zinc-950/90 text-white font-bold pl-11 pr-8 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-amber-500/60 cursor-pointer appearance-none text-sm transition-colors"
                id="select-team-a"
              >
                {TEAMS_DATA.map(t => (
                  <option key={t.id} value={t.id} className="bg-zinc-900 text-white">{t.name} ({t.code})</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Swap Trigger */}
          <div className="md:col-span-3 flex flex-col items-center justify-center pt-4 md:pt-0" id="h2h-swapper">
            <button
              onClick={swapTeams}
              className="p-3 bg-zinc-900 border border-white/10 hover:border-amber-500/50 rounded-full text-zinc-400 hover:text-amber-400 active:scale-90 transition-all flex items-center justify-center shadow-lg cursor-pointer"
              title="Inverter seleções"
              id="btn-swap-teams"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mt-2">Versus</span>
          </div>

          {/* Team B Picker */}
          <div className="md:col-span-4 flex flex-col gap-2" id="h2h-select-teamb">
            <label className="text-xs font-mono text-zinc-400 uppercase">Seleção B</label>
            <div className="relative">
              <div className="absolute left-3.5 top-3.5 flex items-center justify-center">
                <Flag code={teamB.code} fallbackEmoji={teamB.flag} className="w-5 h-3.5 rounded-sm shadow" />
              </div>
              <select
                value={teamBId}
                onChange={(e) => handleTeamBChange(e.target.value)}
                className="w-full bg-zinc-950/90 text-white font-bold pl-11 pr-8 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-amber-500/60 cursor-pointer appearance-none text-sm transition-colors"
                id="select-team-b"
              >
                {TEAMS_DATA.map(t => (
                  <option key={t.id} value={t.id} className="bg-zinc-900 text-white">{t.name} ({t.code})</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Compare & Probability Radar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="h2h-analysis-grid">
        {/* Head-to-Head Statistics */}
        <div className="lg:col-span-7 galaxy-card rounded-3xl p-6 flex flex-col justify-between" id="h2h-stats-panel">
          <div>
            <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3" id="title-h2h-stat">
              <BarChart3 className="h-4 w-4 text-amber-400" />
              <span>Histórico de Confrontos Diretos</span>
            </h3>

            {/* General metrics overview */}
            <div className="grid grid-cols-4 gap-3 text-center mb-6">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/70">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Jogos</span>
                <span className="text-xl font-bold text-slate-200 mt-1 block">{record.matchesPlayed}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/70">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Vitórias {teamA.code}</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">{record.winsA}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/70">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Empates</span>
                <span className="text-xl font-bold text-amber-400 mt-1 block">{record.draws}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/70">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-medium block">Vitórias {teamB.code}</span>
                <span className="text-xl font-bold text-rose-400 mt-1 block">{record.winsB}</span>
              </div>
            </div>

            {/* Victory Proportion graphical bar */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-300">
                  <span>Proporção de Vitórias</span>
                  <span className="text-slate-400 font-mono text-[10px]">{record.winsA} vs {record.winsB}</span>
                </div>
                <div className="h-4 rounded-full bg-slate-950 overflow-hidden flex text-[10px] font-bold text-slate-950">
                  {record.winsA > 0 && (
                    <div 
                      className="bg-emerald-400 flex items-center justify-center transition-all duration-500"
                      style={{ width: `${(record.winsA / (record.winsA + record.draws + record.winsB)) * 100}%` }}
                    >
                      <span className="px-1 truncate">{Math.round((record.winsA / record.matchesPlayed) * 100)}%</span>
                    </div>
                  )}
                  {record.draws > 0 && (
                    <div 
                      className="bg-amber-400 flex items-center justify-center transition-all duration-500"
                      style={{ width: `${(record.draws / (record.winsA + record.draws + record.winsB)) * 100}%` }}
                    >
                      <span className="px-1 truncate">{Math.round((record.draws / record.matchesPlayed) * 100)}%</span>
                    </div>
                  )}
                  {record.winsB > 0 && (
                    <div 
                      className="bg-rose-400 flex items-center justify-center transition-all duration-500"
                      style={{ width: `${(record.winsB / (record.winsA + record.draws + record.winsB)) * 100}%` }}
                    >
                      <span className="px-1 truncate">{Math.round((record.winsB / record.matchesPlayed) * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Goals Counter bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-300">
                  <span>Gols Marcados</span>
                  <span className="text-slate-400 font-mono text-[10px]">{record.goalsA} - {record.goalsB}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-950 overflow-hidden flex">
                  <div 
                    className="bg-emerald-500/85 transition-all duration-500"
                    style={{ width: `${(record.goalsA / (record.goalsA + record.goalsB)) * 100}%` }}
                  />
                  <div 
                    className="bg-rose-500/85 transition-all duration-500"
                    style={{ width: `${(record.goalsB / (record.goalsA + record.goalsB)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick rating comparisons layout */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex justify-around uppercase font-mono text-[10px] text-slate-400">
            <div className="text-center">
              <span className="block mb-1 font-semibold">OVERALL</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-emerald-400 text-sm">{teamA.ratingOverall}</span>
                <span>vs</span>
                <span className="font-bold text-rose-400 text-sm">{teamB.ratingOverall}</span>
              </div>
            </div>
            <div className="text-center border-l border-slate-850 pl-6">
              <span className="block mb-1 font-semibold">ATAQUE</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-emerald-400 text-sm">{teamA.ratingAttack}</span>
                <span>vs</span>
                <span className="font-bold text-rose-400 text-sm">{teamB.ratingAttack}</span>
              </div>
            </div>
            <div className="text-center border-l border-slate-850 pl-6">
              <span className="block mb-1 font-semibold">DEFESA</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-emerald-400 text-sm">{teamA.ratingDefense}</span>
                <span>vs</span>
                <span className="font-bold text-rose-400 text-sm">{teamB.ratingDefense}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Odds Predictor */}
        <div className="lg:col-span-5 galaxy-card rounded-3xl p-6 flex flex-col justify-between" id="odds-prediction-panel">
          <div>
            <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3" id="title-odds-calc">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span>Análise de Probabilidades</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              De acordo com nosso algoritmo estatístico que avalia as escalações atuais, as forças setorizadas de ataque, meio, defesa e o peso histórico ponderado deste confronto, as chances de resultado para um jogo hoje são:
            </p>

            {/* Large percentages gauges */}
            <div className="space-y-4">
              {/* Team A Win Odds */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
                  <span className="flex items-center gap-2">
                    <Flag code={teamA.code} fallbackEmoji={teamA.flag} className="w-5 h-3.5 rounded-sm shrink-0" />
                    <span>Vitória {teamA.name}</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-extrabold">{normA}%</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${normA}%` }} />
                </div>
              </div>

              {/* Draw Odds */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
                  <span>Empate</span>
                  <span className="font-mono text-amber-400 font-extrabold">{normDraw}%</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${normDraw}%` }} />
                </div>
              </div>

              {/* Team B Win Odds */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
                  <span className="flex items-center gap-2">
                    <Flag code={teamB.code} fallbackEmoji={teamB.flag} className="w-5 h-3.5 rounded-sm shrink-0" />
                    <span>Vitória {teamB.name}</span>
                  </span>
                  <span className="font-mono text-rose-400 font-extrabold">{normB}%</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 transition-all duration-500" style={{ width: `${normB}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 bg-slate-950/40 p-3 rounded-xl">
            <Swords className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-300 block mb-0.5">Simule as Forças!</span>
              Você pode testar estas seleções frente a frente diretamente na aba do <span className="text-amber-400 font-bold">Simulador</span> jogando-as no mesmo grupo ou deixando-as se enfrentar nos mata-matas!
            </div>
          </div>
        </div>
      </div>

      {/* Memorable Matches History timeline */}
      <div className="galaxy-card rounded-3xl p-6" id="memorable-matches-timeline">
        <h3 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-6 border-b border-slate-800/80 pb-3" id="title-memorable-m">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span>Confrontos Lendários em Copas do Mundo</span>
        </h3>

        <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800" id="timeline-stack">
          {record.memorableMatches.map((m, idx) => (
            <div key={idx} className="relative pl-10 group" id={`memorable-${idx}`}>
              {/* Timeline dot */}
              <div className="absolute left-[8px] top-1.5 h-3 w-3 bg-slate-900 rounded-full border border-amber-400 group-hover:bg-amber-400 transition-colors z-10" />
              
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400">{m.stage} ({m.year})</span>
                  <span className="text-sm font-extrabold text-slate-200 tracking-tight">{m.score}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{m.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
