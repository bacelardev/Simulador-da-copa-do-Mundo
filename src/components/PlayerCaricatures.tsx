import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, ThumbsUp, HelpCircle, Trophy, Shuffle } from 'lucide-react';

import messiCaricature from '../assets/images/messi_caricature_1781215372082.jpg';
import neymarCaricature from '../assets/images/neymar_caricature_1781215361105.jpg';
import ronaldoCaricature from '../assets/images/ronaldo_caricature_1781215382269.jpg';

const CARICATURES = [
  {
    id: 'messi',
    name: 'Lionel Messi',
    team: 'Argentina',
    emoji: '🐐',
    image: messiCaricature,
    quotes: [
      "¡Hola! Vi que estás simulando... ¿Me vas a poner de enganche otra vez?",
      "No sé qué diga el simulador, pero para mí, la Copa de Lusail fue perfecta.",
      "Oye, si simulas el Mundial, asegúrate de que Argentina gane en los penales, ¿eh?",
      "Prefiero caminar un ratito en la cancha y definirlo en el momento justo.",
      "La pelota siempre al diez. No te preocupes por el cansancio, yo resuelvo."
    ],
    prediction: "O óbvio é a Argentina repetir a dose, mas olho no futebol do Marrocos, é um rival duro!",
    skill: "Passe Milimétrico, Visão Divina, Caminhada Fria",
    clube: "Inter Miami CF",
    funFact: "Gosta de tomar mate e jogar videogame após as partidas da seleção."
  },
  {
    id: 'neymar',
    name: 'Neymar Jr',
    team: 'Brasil',
    emoji: '👑',
    image: neymarCaricature,
    quotes: [
      "E aí, rapaziada! No meu simulador o hexa já chegou e eu sou o camisa 10 e camisa de ouro!",
      "Só não me dá carrinho duro nos lances reais, hein! Deixa eu rabiscar!",
      "Habilidade aqui tem de sobra. Coloca o Brasil super ofensivo que o show é garantido!",
      "Ousadia e alegria! Se cair no simulador, o juiz pinta pênalti na hora!",
      "Toca em mim que eu driblo três e cavo a falta perfeita."
    ],
    prediction: "Brasil com certeza! Comigo criando e os guri brilhando na frente, o hexa vem!",
    skill: "Drible Elástico, Ousadia e Alegria, Queda Artística",
    clube: "Al-Hilal",
    funFact: "Sempre escuta um samba animado no vestiário antes de entrar em campo."
  },
  {
    id: 'ronaldo',
    name: 'Cristiano Ronaldo',
    team: 'Portugal',
    emoji: '⚡',
    image: ronaldoCaricature,
    quotes: [
      "SIIIIUUUU! Eu sou o melhor simulador do mundo, o número um, óbvio!",
      "Trabalho duro e dedicação impecável. Meu overall deveria ser pelo menos 99!",
      "Simule com Portugal, e sinta o poder da determinação de uma máquina!",
      "Eu não sigo os recordes, os recordes e as simulações de Copa me seguem!",
      "Concentração máxima até o último minuto de acréscimo. Robô nunca falha!"
    ],
    prediction: "Portugal vencerá! Minha liderança, gols de cabeça e ambição levarão a taça!",
    skill: "Salto Gravitacional, Chute de Chapa, SIIIUUU!",
    clube: "Al-Nassr FC",
    funFact: "Evita refrigerante e ama água de coco para manter a forma física de aço."
  }
];

export default function PlayerCaricatures() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [votes, setVotes] = useState<{ [key: string]: number }>({
    messi: 147,
    neymar: 112,
    ronaldo: 154
  });
  const [shake, setShake] = useState(false);

  const activePlayer = CARICATURES[selectedIdx];

  // Synthesize a clean soccer-field cartoon sound on click using Web Audio API
  const playCuteSound = (type: 'kick' | 'whistle') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'kick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.16);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {
      // Ignored if browser permissions block context
    }
  };

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    setQuoteIndex(0);
    playCuteSound('kick');
  };

  const throwRandomQuote = () => {
    const nextIdx = (quoteIndex + 1) % activePlayer.quotes.length;
    setQuoteIndex(nextIdx);
    setShake(true);
    playCuteSound('kick');
    setTimeout(() => setShake(false), 300);
  };

  const handleVote = () => {
    const pId = activePlayer.id;
    setVotes(prev => ({
      ...prev,
      [pId]: prev[pId] + 1
    }));
    playCuteSound('whistle');
  };

  return (
    <div className="galaxy-card rounded-3xl p-6 md:p-8 relative overflow-hidden" id="caricatures-section">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/15 text-amber-400 text-[10px] font-mono font-black uppercase tracking-widest border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-spin" /> Distração & Craques
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
            Área de Descontração dos Craques 🎨
          </h3>
          <p className="text-xs text-zinc-400">
            Cutuque as caricaturas 3D exclusivas dos maiores astros da copa, veja seus palpites e mostre sua torcida clicando nos cards!
          </p>
        </div>

        {/* Mini tabs selectors */}
        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 self-start md:self-auto">
          {CARICATURES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => handleSelect(i)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedIdx === i 
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{p.emoji}</span>
              <span>{p.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage with Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Aspect Ratio 1:1 responsive portrait card (Columns 1-4) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-center relative overflow-hidden group">
          <div className="absolute top-2 left-2 bg-zinc-900 text-zinc-400 text-[9px] font-mono px-2 py-0.5 rounded-md border border-zinc-800">
            {activePlayer.clube}
          </div>

          <motion.div
            animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="w-40 h-40 md:w-48 md:h-48 relative rounded-full overflow-hidden border-4 border-amber-500/30 group-hover:border-amber-500/60 transition-all shadow-xl bg-zinc-900"
          >
            <img
              src={activePlayer.image}
              alt={`Caricatura de ${activePlayer.name}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="mt-4 space-y-1">
            <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center justify-center gap-1.5">
              {activePlayer.name}
              <span className="text-sm">{activePlayer.emoji}</span>
            </h4>
            <span className="text-xs text-amber-400 font-extrabold font-mono tracking-widest block uppercase">
              SELEÇÃO: {activePlayer.team}
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-900 w-full flex items-center justify-center gap-4">
            <button
              onClick={handleVote}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 hover:border-amber-500/30 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>Apoiar ({votes[activePlayer.id]} Votos)</span>
            </button>
          </div>
        </div>

        {/* Dynamic chat dialogue bubble & mini predicted charts (Columns 5-12) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          
          {/* Conversation speech bubble */}
          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl relative flex-1 flex flex-col justify-between">
            <div className="absolute -left-3 top-10 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-slate-850 border-b-[8px] border-b-transparent hidden lg:block" />
            <div className="absolute -left-2.5 top-10 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-slate-950 border-b-[8px] border-b-transparent hidden lg:block" />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-black tracking-widest text-slate-500 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-amber-400" /> Balão de Conversa do Craque
                </span>
                
                <button
                  onClick={throwRandomQuote}
                  className="px-2.5 py-1 text-[9px] font-extrabold uppercase font-mono bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 rounded-lg transition flex items-center gap-1 cursor-pointer border border-amber-500/30"
                  id={`shuffle-quote-${activePlayer.id}`}
                >
                  <Shuffle className="h-3 w-3" /> Cutucar Craque!
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-base font-extrabold italic text-slate-200 leading-relaxed md:text-lg pl-3 border-l-4 border-amber-500"
                >
                  "{activePlayer.quotes[quoteIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="border-t border-slate-900 mt-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono font-black text-slate-500 block">Habilidades Pro:</span>
                <span className="text-xs text-amber-400 font-extrabold">{activePlayer.skill}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono font-black text-slate-500 block">Curiosidade de Vestiário:</span>
                <span className="text-xs text-slate-300 italic">{activePlayer.funFact}</span>
              </div>
            </div>
          </div>

          {/* Golden forecasting insight card block */}
          <div className="bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3.5">
            <div className="h-10 w-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20 shrink-0">
              <Trophy className="h-5 w-5 fill-amber-500/10" />
            </div>
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-[9px] font-mono uppercase font-black text-amber-400 tracking-wider">Palpite do Craque p/ a Taça:</span>
              <p className="text-xs font-semibold text-slate-300">
                "{activePlayer.prediction}"
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
