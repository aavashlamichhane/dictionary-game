import React, { useState, useEffect, useRef } from 'react';
import { RoomState, Player } from '@dict-game/shared';
import { Send, Clock, Skull, AlertCircle, CheckCircle2, Sparkles, Feather } from 'lucide-react';
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

  // Timer calculations
  const maxTime = roomState.settings.turnTimeLimit || 15;
  const timeRemaining = roomState.timeRemaining;
  const progressPercent = maxTime > 0 ? Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100)) : 100;
  const isTimeUrgent = maxTime > 0 && timeRemaining <= 5;
  const isTimeCritical = maxTime > 0 && timeRemaining <= 3;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 sm:space-y-6 animate-fade-in">
      {/* Contenders Gallery Ribbon */}
      <div className="bg-beige-card border border-darkgreen/15 rounded-2xl p-3 shadow-warm-xs flex items-center justify-between overflow-x-auto gap-2 scrollbar-none">
        {roomState.players.map((p) => {
          const isActive = p.id === activePlayer?.id;
          return (
            <div
              key={p.id}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
                isActive
                  ? 'bg-beige-dark border-midnight shadow-warm ring-2 ring-midnight/30'
                  : p.isEliminated
                  ? 'bg-beige/40 border-darkgreen/10 opacity-45 line-through'
                  : 'bg-beige/70 border-darkgreen/10'
              }`}
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-bold border shadow-warm-xs"
                style={{
                  backgroundColor: `${p.color}20`,
                  borderColor: `${p.color}60`
                }}
              >
                {p.avatar}
              </div>

              <div className="text-left">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-darkgreen">{p.name}</span>
                  {p.isEliminated && <Skull className="w-3 h-3 text-rosy-dark" />}
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] text-darkgreen/70">
                  <span className="font-mono text-midnight font-bold">{p.score} pts</span>
                  {roomState.settings.gameMode === 'strikes' && p.strikes > 0 && (
                    <span className="text-rosy-dark font-bold tracking-tight">
                      {'✕'.repeat(p.strikes)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Violation Alert Banner */}
      <ViolationBanner violation={roomState.recentViolation} />

      {/* Central Lexicon Arena */}
      <div className="bg-beige-card border border-darkgreen/20 rounded-3xl p-6 sm:p-8 shadow-warm-lg space-y-6 relative overflow-hidden">
        {/* Arena Header: Active Contender & Keystone Letter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* Active Player Status */}
          <div className="flex items-center space-x-3.5 text-center sm:text-left">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold border shadow-warm-sm transition-transform ${
                isMyTurn ? 'ring-4 ring-midnight/25 scale-105 animate-pulse-fast' : ''
              }`}
              style={{
                backgroundColor: `${activePlayer?.color || '#105666'}20`,
                borderColor: activePlayer?.color || '#105666'
              }}
            >
              {activePlayer?.avatar}
            </div>
            <div>
              <div className="flex items-center space-x-1.5 justify-center sm:justify-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-moss-dark">
                  {isMyTurn ? 'Your Turn to Inscribe' : `Contender Turn`}
                </span>
                {isMyTurn && (
                  <span className="w-2 h-2 rounded-full bg-moss animate-ping" />
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-darkgreen leading-tight">
                {isMyTurn ? 'Inscribe your word' : `${activePlayer?.name}'s Inscription`}
              </h2>
            </div>
          </div>

          {/* Monumental Keystone Letter Block */}
          <div className="flex items-center space-x-3 bg-beige/90 border border-darkgreen/20 px-4 py-2.5 rounded-2xl shadow-inner-warm">
            <div className="text-right">
              <span className="text-[9px] font-bold uppercase tracking-widest text-darkgreen/60 block">
                Required
              </span>
              <span className="text-xs font-serif italic text-darkgreen/80">
                Starting Letter
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-midnight flex items-center justify-center text-3xl font-serif font-black text-beige shadow-warm border border-midnight-dark">
              {currentLetter}
            </div>
          </div>
        </div>

        {/* Turn Countdown Tension Bar */}
        {roomState.settings.turnTimeLimit > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center space-x-1.5 text-darkgreen/70">
                <Clock className="w-3.5 h-3.5 text-moss-dark" />
                <span className="uppercase tracking-wider text-[10px]">Time Remaining</span>
              </span>
              <span
                className={`font-mono text-sm font-bold ${
                  isTimeCritical
                    ? 'text-rosy-burn animate-bounce'
                    : isTimeUrgent
                    ? 'text-rosy-dark font-black'
                    : 'text-midnight'
                }`}
              >
                {timeRemaining}s
              </span>
            </div>
            <div className="w-full h-2.5 bg-beige-dark/80 rounded-full overflow-hidden p-0.5 border border-darkgreen/15">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  isTimeCritical
                    ? 'bg-rosy-burn'
                    : isTimeUrgent
                    ? 'bg-rosy'
                    : 'bg-moss'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Word Inscription Input Form */}
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
                  ? `Inscribe word starting with "${currentLetter}"...`
                  : `Waiting for ${activePlayer?.name} to inscribe...`
              }
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              className={`w-full py-4 pl-5 pr-32 rounded-2xl text-lg sm:text-xl font-mono font-bold tracking-wide focus:outline-none transition-all ${
                isMyTurn
                  ? 'bg-beige/90 border-2 border-midnight text-darkgreen placeholder:text-darkgreen/35 shadow-inner-warm ring-2 ring-midnight/15'
                  : 'bg-beige/40 border border-darkgreen/15 text-darkgreen/40 placeholder:text-darkgreen/30 cursor-not-allowed'
              }`}
            />

            <button
              type="submit"
              disabled={!isMyTurn || wordInput.trim().length < (roomState.settings.minWordLength || 3)}
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-midnight hover:bg-midnight-hover disabled:bg-beige-dark text-beige font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-warm hover:shadow-warm-md active:scale-95 border border-midnight-dark"
            >
              <span>Inscribe</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Real-Time Typographic Feedback */}
          {isMyTurn && wordInput.length > 0 && (
            <div className="flex items-center justify-between text-xs px-2 pt-0.5">
              <div className="flex items-center space-x-1.5">
                {wordInput.charAt(0).toUpperCase() === currentLetter ? (
                  <span className="text-moss-dark font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-moss" />
                    <span>Valid initial letter "{currentLetter}"</span>
                  </span>
                ) : (
                  <span className="text-rosy-burn font-bold flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Must begin with "{currentLetter}"</span>
                  </span>
                )}
              </div>
              <span className="font-mono text-darkgreen/70 font-semibold">{wordInput.length} letters</span>
            </div>
          )}
        </form>
      </div>

      {/* Word Chain Ledger Stream */}
      <div className="bg-beige-card border border-darkgreen/15 rounded-3xl p-5 sm:p-6 shadow-warm-md">
        <WordChain chain={roomState.chain} />
      </div>
    </div>
  );
};
