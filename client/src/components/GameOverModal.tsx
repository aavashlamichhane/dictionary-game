import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player, RoomState } from '@dict-game/shared';
import { Trophy, RotateCcw, Home, Skull, CheckCircle, Download, Award, Sparkles } from 'lucide-react';
import { exportGameFile } from '../utils/gameStorage.js';

interface GameOverModalProps {
  roomState: RoomState;
  isHost: boolean;
  onRestart: () => void;
  onLeave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  roomState,
  isHost,
  onRestart,
  onLeave
}) => {
  const winner = roomState.winner;

  useEffect(() => {
    // Elegant celebratory confetti in curated tournament colors
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#105666', '#839958', '#D3968C', '#0A3323', '#EDE8BD']
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 50,
        origin: { x: 0 },
        colors: ['#105666', '#839958', '#D3968C']
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 50,
        origin: { x: 1 },
        colors: ['#105666', '#839958', '#D3968C']
      });
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-darkgreen/65 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-beige-card border-2 border-darkgreen/20 rounded-3xl p-6 sm:p-8 shadow-warm-xl text-center space-y-6">
        {/* Victory Proclamation */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-midnight text-beige border-2 border-midnight-dark flex items-center justify-center mb-3 shadow-warm-md">
            <Trophy className="w-10 h-10 text-moss-light animate-gentle-float" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-widest text-moss-dark">
            Tournament Concluded
          </span>
          <h2 className="text-3xl font-serif font-black text-darkgreen mt-0.5">
            Match Decided
          </h2>

          {winner ? (
            <div className="mt-3 bg-beige/80 border border-darkgreen/15 rounded-2xl p-4 w-full shadow-warm-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-midnight block">
                Victorious Contender
              </span>
              <p className="text-2xl font-serif font-black text-darkgreen mt-1 flex items-center justify-center space-x-2.5">
                <span className="text-2xl">{winner.avatar}</span>
                <span>{winner.name}</span>
              </p>
              <p className="text-xs text-darkgreen/75 mt-1">
                Final Score: <strong className="text-midnight font-bold font-mono">{winner.score} pts</strong> • Inscriptions:{' '}
                <strong className="text-moss-dark font-bold font-mono">{winner.wordsPlayedCount}</strong>
              </p>
            </div>
          ) : (
            <p className="text-darkgreen/70 text-sm mt-2 font-serif italic">
              All contenders conceded or were eliminated!
            </p>
          )}
        </div>

        {/* Ledger Statistics Dossier */}
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="bg-beige/70 p-3.5 rounded-2xl border border-darkgreen/15 shadow-warm-xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-darkgreen/60">Chain Length</span>
            <p className="text-2xl font-mono font-black text-midnight mt-0.5">{roomState.chain.length}</p>
          </div>
          <div className="bg-beige/70 p-3.5 rounded-2xl border border-darkgreen/15 shadow-warm-xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-darkgreen/60">Total Turns</span>
            <p className="text-2xl font-mono font-black text-moss-dark mt-0.5">{roomState.turnCount}</p>
          </div>
        </div>

        {/* Contender Standings Ledger */}
        <div className="space-y-2 text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-darkgreen/70 px-1">
            Official Standings
          </span>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {[...roomState.players]
              .sort((a, b) => b.score - a.score)
              .map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-sm transition-all ${
                    p.id === winner?.id
                      ? 'bg-beige-dark border-midnight/40 shadow-warm-xs'
                      : 'bg-beige/60 border-darkgreen/10'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-mono font-black text-darkgreen/50 w-5">
                      #{idx + 1}
                    </span>
                    <span className="text-base">{p.avatar}</span>
                    <span className="font-bold text-darkgreen">{p.name}</span>
                    {p.isEliminated ? (
                      <span className="flex items-center space-x-1 text-[10px] text-rosy-burn bg-rosy-tint px-2 py-0.5 rounded-full border border-rosy/30 font-bold uppercase">
                        <Skull className="w-2.5 h-2.5" />
                        <span>Out</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[10px] text-moss-dark bg-moss-tint px-2 py-0.5 rounded-full border border-moss/30 font-bold uppercase">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>Survived</span>
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-midnight">{p.score} pts</span>
                    <span className="text-[10px] text-darkgreen/60 block">{p.wordsPlayedCount} words</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Match Export Dossier Button */}
        <button
          onClick={() => exportGameFile(roomState)}
          className="w-full py-2.5 px-4 rounded-xl bg-beige hover:bg-beige-dark border border-darkgreen/20 text-xs font-bold text-midnight transition-all shadow-warm-xs flex items-center justify-center space-x-2 active:scale-95"
        >
          <Download className="w-4 h-4 text-midnight" />
          <span>Export Match Dossier (.json to continue later)</span>
        </button>

        {/* Action Triggers */}
        <div className="flex items-center space-x-3 pt-1">
          <button
            onClick={onLeave}
            className="flex-1 py-3 px-4 rounded-2xl bg-beige hover:bg-beige-dark border border-darkgreen/20 font-bold text-darkgreen text-xs uppercase tracking-wider transition-all shadow-warm-xs flex items-center justify-center space-x-2 active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Return to Parlor</span>
          </button>

          {isHost ? (
            <button
              onClick={onRestart}
              className="flex-1 py-3 px-4 rounded-2xl bg-midnight hover:bg-midnight-hover font-bold text-beige text-xs uppercase tracking-wider transition-all shadow-warm-md flex items-center justify-center space-x-2 active:scale-95 border border-midnight-dark"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Commence Rematch</span>
            </button>
          ) : (
            <div className="flex-1 py-3 px-4 rounded-2xl bg-beige/60 border border-darkgreen/15 text-xs text-darkgreen/60 flex items-center justify-center font-serif italic">
              Awaiting Host rematch...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
