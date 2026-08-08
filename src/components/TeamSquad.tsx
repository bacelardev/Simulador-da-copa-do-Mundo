import { useState } from 'react';
import { NationalTeam, Player } from '../types';
import { TEAMS_DATA } from '../data/teams';
import { Star, Shield, Zap, CircleDot, Search, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Flag from './Flag';

// Relative positioning coordinates (bottom% and left%) for each player in 11 positions based on formation
const STADIUM_POSITIONS: { [formation: string]: { top: string; left: string; role: string }[] } = {
  '4-3-3': [
    { top: '85%', left: '50%', role: 'Goleiro' }, // 0: GK
    { top: '65%', left: '15%', role: 'Lateral Direito' }, // 1: DF-R
    { top: '68%', left: '38%', role: 'Zagueiro Direito' }, // 2: DF-C1
    { top: '68%', left: '62%', role: 'Zagueiro Esquerdo' }, // 3: DF-C2
    { top: '65%', left: '85%', role: 'Lateral Esquerdo' }, // 4: DF-L
    { top: '45%', left: '50%', role: 'Volante' }, // 5: MF-C
    { top: '40%', left: '25%', role: 'Meio-Campista Direito' }, // 6: MF-R
    { top: '18%', left: '20%', role: 'Ponta Direita' }, // 7: FW-R (Rodrygo or other)
    { top: '15%', left: '50%', role: 'Centroavante' }, // 8: FW-C
    { top: '18%', left: '80%', role: 'Ponta Esquerda' }, // 9: FW-L
    { top: '40%', left: '75%', role: 'Meio-Campista Esquerdo' } // 10: MF-L
  ],
  '4-2-3-1': [
    { top: '85%', left: '50%', role: 'Goleiro' }, // 0
    { top: '65%', left: '15%', role: 'Lateral Direito' }, // 1
    { top: '68%', left: '36%', role: 'Zagueiro Direito' }, // 2
    { top: '68%', left: '64%', role: 'Zagueiro Esquerdo' }, // 3
    { top: '65%', left: '85%', role: 'Lateral Esquerdo' }, // 4
    { top: '50%', left: '33%', role: 'Volante Defensivo' }, // 5
    { top: '50%', left: '67%', role: 'Volante Defensivo' }, // 6
    { top: '30%', left: '18%', role: 'Meia Direito' }, // 7
    { top: '28%', left: '50%', role: 'Meia Armador' }, // 8
    { top: '30%', left: '82%', role: 'Meia Esquerdo' }, // 9
    { top: '12%', left: '50%', role: 'Centroavante' } // 10
  ],
  '3-5-2': [
    { top: '85%', left: '50%', role: 'Goleiro' }, // 0
    { top: '68%', left: '25%', role: 'Zagueiro Direito' }, // 1
    { top: '70%', left: '50%', role: 'Zagueiro Central' }, // 2
    { top: '68%', left: '75%', role: 'Zagueiro Esquerdo' }, // 3
    { top: '45%', left: '12%', role: 'Ala Direito' }, // 4
    { top: '52%', left: '35%', role: 'Volante central' }, // 5
    { top: '52%', left: '65%', role: 'Volante central' }, // 6
    { top: '45%', left: '88%', role: 'Ala Esquerdo' }, // 7
    { top: '34%', left: '50%', role: 'Meia Armador' }, // 8
    { top: '16%', left: '32%', role: 'Atacante Esquerdo' }, // 9
    { top: '16%', left: '68%', role: 'Atacante Direito' } // 10
  ]
};

export default function TeamSquad() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('brazil');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const team = TEAMS_DATA.find(t => t.id === selectedTeamId) || TEAMS_DATA[0];

  const positions = STADIUM_POSITIONS[team.formation] || STADIUM_POSITIONS['4-3-3'];

  // Filter teams list
  const filteredTeams = TEAMS_DATA.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="team-squad-container">
      {/* Side list of National Teams */}
      <div className="lg:col-span-4 galaxy-card rounded-3xl p-5 flex flex-col h-[700px]" id="teams-list-card">
        <h3 className="text-lg font-extrabold text-slate-100 mb-3 flex items-center justify-between">
          <span>Elites do Mundo</span>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">{TEAMS_DATA.length} Seleções</span>
        </h3>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por seleção..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 text-zinc-100 rounded-2xl border border-white/10 focus:outline-none focus:border-amber-500/60 text-sm placeholder:text-zinc-500 transition-colors"
          />
        </div>

        {/* Scrollable grid of teams */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredTeams.length === 0 ? (
            <div className="text-center text-zinc-500 text-sm py-8">Nenhuma seleção encontrada.</div>
          ) : (
            filteredTeams.map((t) => {
              const active = t.id === selectedTeamId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTeamId(t.id);
                    setSelectedPlayer(null);
                  }}
                  id={`btn-team-select-${t.id}`}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                    active 
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)] text-amber-400 font-bold' 
                      : 'bg-zinc-900/80 border-white/5 hover:bg-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Flag code={t.code} fallbackEmoji={t.flag} className="w-8 h-5 rounded shadow shrink-0 border border-white/10" />
                    <div>
                      <span className="font-bold block text-sm group-hover:text-amber-300 transition-colors">{t.name}</span>
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">{t.code} • Formação: {t.formation}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-zinc-950/90 px-2.5 py-1 rounded-xl border border-white/10">
                    <Zap className="h-3 w-3 text-amber-400 fill-amber-400/20" />
                    <span className="text-xs font-bold font-mono text-slate-100">{t.ratingOverall}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Roster pitch visualization & lineup details */}
      <div className="lg:col-span-8 flex flex-col gap-6" id="squad-details-card">
        {/* National Team Hero Card header */}
        <div className="galaxy-card rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          {/* Subtle color stripe backgrounds simulating flags */}
          <div 
            className="absolute top-0 left-0 w-2 h-full opacity-70"
            style={{ backgroundColor: team.primaryColor }}
          />
          <div 
            className="absolute top-0 left-2 w-1.5 h-full opacity-45"
            style={{ backgroundColor: team.secondaryColor }}
          />

          <div className="flex items-center gap-4 pl-3">
            <Flag code={team.code} fallbackEmoji={team.flag} className="w-16 h-10 md:w-20 md:h-12 rounded-xl shadow-lg border border-white/10 shrink-0" />
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                {team.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Copa do Mundo FIFA • Código: <span className="text-amber-400 font-bold">{team.code}</span> • Tática: <span className="text-emerald-400 font-bold">{team.formation}</span>
              </p>
            </div>
          </div>

          {/* Overall Team Ratings radar representation */}
          <div className="grid grid-cols-4 gap-2 w-full md:w-auto self-stretch md:self-auto uppercase font-mono text-[10px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-center px-1">
              <span className="text-rose-500 block font-semibold mb-0.5">ATA</span>
              <span className="text-sm font-bold text-slate-100">{team.ratingAttack}</span>
            </div>
            <div className="text-center px-1 border-l border-slate-800">
              <span className="text-cyan-400 block font-semibold mb-0.5">MEI</span>
              <span className="text-sm font-bold text-slate-100">{team.ratingMidfield}</span>
            </div>
            <div className="text-center px-1 border-l border-slate-800">
              <span className="text-emerald-400 block font-semibold mb-0.5">DEF</span>
              <span className="text-sm font-bold text-slate-100">{team.ratingDefense}</span>
            </div>
            <div className="text-center px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold">
              <span className="block font-semibold mb-0.5">OVER</span>
              <span className="text-sm font-bold">{team.ratingOverall}</span>
            </div>
          </div>
        </div>

        {/* View switcher: Tactical Field vs Squad List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Field Tactical Board */}
          <div className="galaxy-card rounded-3xl p-5 flex flex-col items-center">
            <h4 className="text-slate-100 text-sm font-extrabold mb-3 flex items-center gap-2 self-start">
              <CircleDot className="h-4 w-4 text-emerald-400" />
              <span>Esquema Tático ({team.formation})</span>
            </h4>

            {/* Stadium Representation */}
            <div 
              className="relative w-full aspect-[3/4] max-w-[340px] rounded-xl overflow-hidden border-2 border-slate-800/80"
              style={{
                background: 'radial-gradient(ellipse at center, #14532d 0%, #064e3b 100%)',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)'
              }}
              id="football-pitch"
            >
              {/* Grass stripes overlay */}
              <div className="absolute inset-0 flex flex-col">
                <div className="h-1/5 bg-emerald-950/20" />
                <div className="h-1/5 bg-transparent" />
                <div className="h-1/5 bg-emerald-950/20" />
                <div className="h-1/5 bg-transparent" />
                <div className="h-1/5 bg-emerald-950/20" />
              </div>

              {/* Pitch Markings */}
              {/* Outer border padding offset */}
              <div className="absolute inset-3 border border-white/20 pointer-events-none rounded">
                {/* Center Line */}
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20" />
                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/25" />
                {/* Center Dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/35 rounded-full" />
                {/* Penalty Box Top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-12 border-b border-x border-white/20" />
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-14 h-5 rounded-b-full border-b border-x border-white/20 border-t-transparent" />
                {/* Penalty Box Bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-12 border-t border-x border-white/20" />
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-14 h-5 rounded-t-full border-t border-x border-white/20 border-b-transparent" />
              </div>

              {/* Draw starting players on pitch */}
              {team.players.slice(0, 11).map((player, idx) => {
                const pos = positions[idx] || { top: '50%', left: '50%', role: 'Titular' };
                const isSelected = selectedPlayer?.id === player.id;
                
                return (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
                    style={{ top: pos.top, left: pos.left, zIndex: isSelected ? 30 : 10 }}
                    id={`pitch-player-${player.id}`}
                  >
                    {/* Jersey Circle Icon */}
                    <div 
                      className={`h-7 w-7 md:h-8 md:w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-md transition-all ${
                        isSelected 
                          ? 'scale-110 ring-4 ring-amber-500/40 border-amber-400' 
                          : 'border-slate-100 hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: team.primaryColor,
                        color: team.primaryColor === '#FFFFFF' ? '#0F172A' : '#0F172A',
                        textShadow: '0px 1px 1px rgba(255,255,255,0.4)'
                      }}
                    >
                      {player.number}
                    </div>

                    {/* Name Tag */}
                    <div className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-tight whitespace-nowrap border truncate max-w-[85px] transition-all ${
                      isSelected 
                        ? 'bg-amber-500 border-amber-400 text-slate-950 font-semibold' 
                        : 'bg-slate-950/80 border-slate-800/80 text-white group-hover:bg-slate-900 group-hover:text-amber-300'
                    }`}>
                      {player.name.split(' ').pop()}
                    </div>

                    {/* Miniature rating indicator */}
                    {player.isStar && (
                      <span className="absolute -top-1 -right-1 text-amber-400 drop-shadow-md">
                        <Star className="h-2 w-2 fill-amber-400" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 mt-3 text-center italic flex items-center gap-1">
              <Info className="h-3 w-3 text-slate-500 shrink-0" />
              <span>Clique em um jogador no campo para ver seus dados</span>
            </p>
          </div>

          {/* Player details / Squad Table list */}
          <div className="galaxy-card rounded-3xl p-5 flex flex-col justify-between" id="roster-view">
            <div>
              <h4 className="text-slate-100 text-sm font-extrabold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <span>Relação de Titulares</span>
              </h4>

              {/* Sourced list */}
              <div className="space-y-1.5 overflow-y-auto max-h-[360px] custom-scrollbar pr-1">
                {team.players.map((player) => {
                  const isCurSel = selectedPlayer?.id === player.id;
                  let posColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                  if (player.position === 'Goleiro') posColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                  if (player.position === 'Defensor') posColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                  if (player.position === 'Meio-Campista') posColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                  return (
                    <div
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      id={`list-player-${player.id}`}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isCurSel 
                          ? 'bg-slate-800 border-amber-500/50' 
                          : 'bg-slate-950/40 border-slate-850 hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Shirt Number */}
                        <span className="font-mono text-slate-400 font-bold w-5 text-right">{player.number}</span>
                        
                        {/* Player name */}
                        <div className="truncate">
                          <span className={`block font-semibold truncate text-slate-100 ${isCurSel ? 'text-amber-400' : ''}`}>
                            {player.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">{player.club}</span>
                        </div>
                      </div>

                      {/* Info indicators */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono border ${posColor}`}>
                          {player.position}
                        </span>
                        
                        {/* Rating */}
                        <span className="font-mono font-bold text-slate-300 w-5 text-right">{player.rating}</span>
                        
                        {player.isStar && (
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual player inspection sheet */}
            <div className="mt-4 pt-3 border-t border-slate-800" id="player-profile-panel">
              <AnimatePresence mode="wait">
                {selectedPlayer ? (
                  <motion.div
                    key={selectedPlayer.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100">{selectedPlayer.name}</span>
                          {selectedPlayer.isStar && (
                            <span className="text-xs bg-amber-500/10 text-amber-500 px-1.5 rounded flex items-center gap-0.5 border border-amber-500/20 font-bold font-mono">
                              <Star className="h-2.5 w-2.5 fill-amber-500" /> STAR
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">Clube: {selectedPlayer.club}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">
                          Função Tática: {selectedPlayer.position} • Camisa: {selectedPlayer.number}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-mono block uppercase">Habilidade</span>
                        <span className="text-2xl font-black font-mono text-amber-400">{selectedPlayer.rating}</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center text-slate-500 text-[11px] py-4">
                    Nenhum jogador selecionado. Clique em alguém para ver os detalhes e habilidades.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
