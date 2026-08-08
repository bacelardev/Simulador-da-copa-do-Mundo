import { useState } from 'react';
import TeamSquad from './components/TeamSquad';
import HeadToHead from './components/HeadToHead';
import TournamentSimulator from './components/TournamentSimulator';
import PlayerCaricatures from './components/PlayerCaricatures';
import { Trophy, Users, Swords, Play, Compass, Sparkles, Star, Shield, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ActiveTab = 'home' | 'squads' | 'h2h' | 'simulator';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  return (
    <div className="min-h-screen bg-[#09090b] galaxy-bg galaxy-grid-bg text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden" id="main-portal">
      {/* Ambient background glow orbs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Top Galaxy Sports Bar header */}
      <header className="border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-40 shadow-2xl" id="portal-header">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => setActiveTab('home')} id="logo-trigger">
            <div className="h-11 w-11 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.35)] border border-amber-300/40 group-hover:scale-105 transition-all">
              <Trophy className="h-5 w-5 text-zinc-950 fill-zinc-950/20" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                SIMULADOR DA <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 font-black">COPA DO MUNDO</span>
              </h1>
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase block mt-1 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-amber-400 inline" />
                Simulação de Elite FIFA 2026
              </span>
            </div>
          </div>

          {/* Luxury Tab Navigation list */}
          <nav className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-white/10 shadow-inner" id="nav-tabs-stack">
            {[
              { id: 'home', label: 'Início', icon: Compass },
              { id: 'squads', label: 'Relação & Escalações', icon: Users },
              { id: 'h2h', label: 'Histórico de Confrontos', icon: Swords },
              { id: 'simulator', label: 'Simular Copa', icon: Trophy }
            ].map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  id={`tab-btn-${tab.id}`}
                  className={`px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
                    active 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.45)] font-black' 
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-zinc-950' : 'text-amber-400/80'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 relative z-10" id="portal-body">
        <AnimatePresence mode="wait">
          
          {/* CASE 1: HOME PANEL */}
          {activeTab === 'home' && (
            <motion.div
              key="home-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-10"
              id="home-view"
            >
              {/* Grand Elegant Hero Section */}
              <div className="galaxy-card galaxy-card-glow rounded-3xl p-8 md:p-10 relative overflow-hidden" id="mega-hero-section">
                {/* Visual design elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="max-w-2xl relative space-y-5">
                  <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase font-black bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    Edição Especial Galaxy 2026
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                    Simule os Destinos da <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400">Copa do Mundo!</span>
                  </h2>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed font-normal">
                    Inspecione os esquemas táticos em 3D, compare estatísticas e o retrospecto entre as 16 maiores seleções do futebol mundial, dispute partidas simuladas em tempo real com súmulas dinâmicas e salve suas simulações na nuvem.
                  </p>

                  <div className="pt-3 flex flex-wrap items-center gap-4">
                    {/* Glowing highlight RGB ring container around SIMULAR COPA */}
                    <div 
                      onClick={() => setActiveTab('simulator')}
                      className="rgb-ring-wrapper active:scale-95 transition-all cursor-pointer shadow-2xl shrink-0"
                    >
                      <div className="rgb-ring-blur" />
                      <div className="rgb-ring-bg" />
                      <button
                        type="button"
                        className="relative z-10 px-8 py-3.5 font-black text-amber-300 bg-zinc-950 hover:bg-zinc-900 rounded-[14px] text-xs md:text-sm tracking-wider uppercase flex items-center gap-2.5 transition-all duration-300 cursor-pointer"
                        id="hero-btn-simulator"
                      >
                        <Trophy className="h-4 w-4 text-amber-400 animate-pulse" />
                        Simular Chaveamento
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveTab('squads')}
                      className="px-6 py-3.5 font-bold text-zinc-200 bg-zinc-900/90 border border-white/10 hover:border-amber-500/50 hover:text-white rounded-2xl text-xs md:text-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer h-[50px] shadow-lg"
                      id="hero-btn-squads"
                    >
                      <Users className="h-4 w-4 text-amber-400" />
                      Ver Elencos & Campinho
                    </button>
                  </div>
                </div>
              </div>

              {/* Bento Grid layout summarizing the key features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="bento-overview-grid">
                
                {/* Spotlight Block */}
                <div className="galaxy-card rounded-3xl p-6 flex flex-col justify-between hover:border-rose-500/40" id="bento-field-preview">
                  <div className="space-y-3">
                    <div className="p-3 bg-rose-500/15 rounded-2xl border border-rose-500/30 inline-block text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                      <Users className="h-5 w-5" />
                    </div>
                    <h4 className="font-extrabold text-slate-100 text-base">Campinho Tático 3D</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Esquemas táticos virtuais das 16 seleções de elite em gramado 3D, com ratings de jogadores e posições fiéis ao futebol internacional.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('squads')} 
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 self-start mt-5 cursor-pointer group"
                  >
                    <span>Abrir Prancheta</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>

                {/* Confrontation histories */}
                <div className="galaxy-card rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/40" id="bento-h2h-preview">
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-500/15 rounded-2xl border border-amber-500/30 inline-block text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <Swords className="h-5 w-5" />
                    </div>
                    <h4 className="font-extrabold text-slate-100 text-base">Histórico de Confrontos</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Série histórica de vitórias, gols marcados e os principais jogos de Copas passadas em um acervo completo de estatísticas.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('h2h')} 
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 self-start mt-5 cursor-pointer group"
                  >
                    <span>Acessar Biblioteca</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>

                {/* Simulated brackets */}
                <div className="galaxy-card rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/40" id="bento-sim-preview">
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-500/15 rounded-2xl border border-emerald-500/30 inline-block text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <h4 className="font-extrabold text-slate-100 text-base">Simulador na Nuvem</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Símulas detalhadas de jogos com narração minuto a minuto, disputa de pênaltis, prorrogação e sincronização direta no Firebase.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('simulator')} 
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 self-start mt-5 cursor-pointer group"
                  >
                    <span>Abrir Arena</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>

              </div>

              {/* Distraction/Fun Caricatures zone */}
              <PlayerCaricatures />

              {/* Interactive World Cup Fun Trivia section */}
              <div className="galaxy-card rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4" id="home-trivia-bar">
                <div className="p-3 bg-amber-500/15 rounded-2xl text-amber-400 border border-amber-500/30 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">Trívia da Copa</span>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    "Argentina e França se enfrentaram na lendária final de 2022 em Lusail, consagrando Messi após empate eletrizante em 3 a 3. Na aba de Histórico e Simulações você pode reprisar clássicos internacionais e reescrever a história!"
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* CASE 2: SQUADS TABS */}
          {activeTab === 'squads' && (
            <motion.div
              key="squads-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              id="squads-view"
            >
              <TeamSquad />
            </motion.div>
          )}

          {/* CASE 3: H2H TABS */}
          {activeTab === 'h2h' && (
            <motion.div
              key="h2h-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              id="h2h-view"
            >
              <HeadToHead />
            </motion.div>
          )}

          {/* CASE 4: TOURNAMENT SIMULATOR */}
          {activeTab === 'simulator' && (
            <motion.div
              key="simulator-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              id="simulator-view"
            >
              <TournamentSimulator />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Persistent footer */}
      <footer className="border-t border-white/10 bg-zinc-950/95 shrink-0 text-zinc-500 py-6 text-center mt-12 relative z-10" id="portal-footer">
        <p className="text-xs font-mono text-zinc-400">
          Simulador da Copa do Mundo • Desenvolvido em React, Tailwind CSS e Firebase
        </p>
        <p className="text-[10px] text-zinc-600 font-mono mt-1">
          Dados, estatísticas e bandeiras oficiais das seleções de elite • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
