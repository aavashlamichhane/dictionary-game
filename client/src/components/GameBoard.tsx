import React, { useState, useEffect, useRef } from 'react';
import { RoomState, Player } from '@dict-game/shared';
import { Send, Clock, Skull, AlertCircle } from 'lucide-react';
import { ViolationBanner } from './ViolationBanner.js';
import { WordChain } from './WordChain.js';

interface GameBoardProps {
  roomState: RoomState;
  currentPlayer: Player;
  onSubmitWord: (word: string) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  roomState,
  currentPlayer,
  onSubmitWord
}) => {
  const [wordInput, setWordInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activePlayer = roomState.players[roomState.currentTurnIndex];
  const isMyTurn = activePlayer?.id === currentPlayer.id;
  const currentLetter = roomState.currentLetter.toUpperCase();

  // Auto-focus input when it becomes user's turn
  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMyTurn, roomState.currentTurnIndex]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = wordInput.trim().toLowerCase();
    if (!clean || !isMyTurn) return;

    onSubmitWord(clean);
    setWordInput('');
  };

  // Timer percentage
  const maxTime = roomState.settings.turnTimeLimit || 15;
  const timeRemaining = roomState.timeRemaining;
  const progressPercent = maxTime > 0 ? Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100)) : 100;
  const isTimeUrgent = maxTime > 0 && timeRemaining <= 5;
  const isTimeCritical = maxTime > 0 && timeRemaining <= 3;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Top Player Roster Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center justify-between overflow-x-auto gap-2">
        {roomState.players.map((p) => {
          const isActive = p.id === activePlayer?.id;
          return (
            <div
              key={p.id}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-800 border-emerald-500 shadow-md shadow-emerald-950/40 ring-2 ring-emerald-500/50'
                  : p.isEliminated
                  ? 'bg-slate-950/40 border-slate-900 opacity-40'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border"
                style={{
                  backgroundColor: `${p.color}22`,
                  borderColor: p.color
                }}
              >
                {p.avatar}
              </div>

              <div className="text-left">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-slate-200">{p.name}</span>
                  {p.isEliminated && <Skull className="w-3 h-3 text-rose-500" />}
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                  <span className="font-mono text-emerald-400 font-bold">{p.score} pts</span>
                  {roomState.settings.gameMode === 'strikes' && p.strikes > 0 && (
                    <span className="text-rose-400 font-bold">
                      {'⚠️'.repeat(p.strikes)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Violation Alert Banner if recent violation occurred */}
      <ViolationBanner violation={roomState.recentViolation} />

      {/* Central Action Arena */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Turn Status & Required Letter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Active Turn Indicator */}
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold border shadow-lg ${
                isMyTurn ? 'ring-4 ring-emerald-500/30 animate-pulse-fast' : ''
              }`}
              style={{
                backgroundColor: `${activePlayer?.color || '#10b981'}22`,
                borderColor: activePlayer?.color || '#10b981'
              }}
            >
              {activePlayer?.avatar}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isMyTurn ? '🌟 Your Turn!' : `${activePlayer?.name}'s Turn`}
              </span>
              <p className="text-xl sm:text-2xl font-black text-white">
                {isMyTurn ? 'Enter a word' : `Waiting for ${activePlayer?.name}...`}
              </p>
            </div>
          </div>

          {/* Huge Required Letter Box */}
          <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 px-5 py-3 rounded-2xl shadow-inner">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Must Start With
              </span>
              <span className="text-xs text-slate-400">Letter</span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-3xl font-black text-slate-950 shadow-md">
              {currentLetter}
            </div>
          </div>
        </div>

        {/* Turn Countdown Timer (if enabled) */}
        {roomState.settings.turnTimeLimit > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center space-x-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Time Remaining</span>
              </span>
              <span
                className={`font-mono text-sm ${
                  isTimeCritical
                    ? 'text-rose-400 animate-ping'
                    : isTimeUrgent
                    ? 'text-amber-400 font-bold'
                    : 'text-emerald-400'
                }`}
              >
                {timeRemaining}s
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  isTimeCritical
                    ? 'bg-rose-500'
                    : isTimeUrgent
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Word Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value.replace(/[^a-zA-Z]/g, ''))}
              disabled={!isMyTurn}
              placeholder={
                isMyTurn
                  ? `Type a word starting with "${currentLetter}"...`
                  : `Waiting for ${activePlayer?.name}...`
              }
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              className={`w-full py-4 pl-5 pr-28 rounded-2xl text-lg sm:text-xl font-bold font-mono tracking-wide focus:outline-none transition-all ${
                isMyTurn
                  ? 'bg-slate-800/90 border-2 border-emerald-500/70 text-white placeholder:text-slate-500 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-950/60 border border-slate-800 text-slate-500 placeholder:text-slate-600 cursor-not-allowed'
              }`}
            />

            <button
              type="submit"
              disabled={!isMyTurn || wordInput.trim().length < (roomState.settings.minWordLength || 3)}
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-md shadow-emerald-950/30"
            >
              <span>Submit</span>
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Typing helper & hints */}
          {isMyTurn && wordInput.length > 0 && (
            <div className="flex items-center justify-between text-xs px-2 text-slate-400">
              <div className="flex items-center space-x-1.5">
                {wordInput.charAt(0).toUpperCase() === currentLetter ? (
                  <span className="text-emerald-400 font-semibold">✓ Correct starting letter</span>
                ) : (
                  <span className="text-rose-400 font-semibold flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Must start with "{currentLetter}"</span>
                  </span>
                )}
              </div>
              <span className="font-mono">{wordInput.length} letters</span>
            </div>
          )}
        </form>
      </div>

      {/* Word Chain History Component */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <WordChain chain={roomState.chain} />
      </div>
    </div>
  );
};
