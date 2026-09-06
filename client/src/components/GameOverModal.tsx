import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player, RoomState } from '@dict-game/shared';
import { Trophy, RotateCcw, Home, Skull, CheckCircle } from 'lucide-react';

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
    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Trophy & Winner */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center mb-3">
            <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
          </div>

          <h2 className="text-3xl font-black text-white">Game Over!</h2>

          {winner ? (
            <div className="mt-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-amber-400">Winner</span>
              <p className="text-2xl font-bold text-slate-100 mt-0.5 flex items-center justify-center space-x-2">
                <span>{winner.avatar}</span>
                <span>{winner.name}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Score: <strong className="text-emerald-400">{winner.score} pts</strong> • Words:{' '}
                <strong className="text-teal-400">{winner.wordsPlayedCount}</strong>
              </p>
            </div>
          ) : (
            <p className="text-slate-400 text-sm mt-2">No winners this round!</p>
          )}
        </div>

        {/* Chain Stats */}
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Chain Length</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">{roomState.chain.length}</p>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Total Turns</span>
            <p className="text-2xl font-extrabold text-teal-400 mt-0.5">{roomState.turnCount}</p>
          </div>
        </div>

        {/* Player Leaderboard */}
        <div className="space-y-2 text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Player Standings
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {[...roomState.players]
              .sort((a, b) => b.score - a.score)
              .map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-sm ${
                    p.id === winner?.id
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : 'bg-slate-800/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-bold text-slate-500 w-4">#{idx + 1}</span>
                    <span>{p.avatar}</span>
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    {p.isEliminated ? (
                      <span className="flex items-center space-x-1 text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/80">
                        <Skull className="w-2.5 h-2.5" />
                        <span>Out</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/80">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>Survived</span>
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400">{p.score} pts</span>
                    <span className="text-xs text-slate-500 block">{p.wordsPlayedCount} words</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onLeave}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Leave</span>
          </button>

          {isHost ? (
            <button
              onClick={onRestart}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-950 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          ) : (
            <div className="flex-1 py-3 px-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 flex items-center justify-center">
              Waiting for host to restart...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
