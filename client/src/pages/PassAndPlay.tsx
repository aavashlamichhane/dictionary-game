import React, { useState, useEffect } from 'react';
import { Player, RoomState, WordEntry, Violation } from '@dict-game/shared';
import { Plus, Trash2, Play, Users, RotateCcw } from 'lucide-react';
import { GameBoard } from '../components/GameBoard.js';
import { GameOverModal } from '../components/GameOverModal.js';
import { Header } from '../components/Header.js';
import { sounds } from '../utils/audio.js';

interface PassAndPlayProps {
  onBackToHome: () => void;
  onOpenRules: () => void;
}

const DEFAULT_AVATARS = ['🦊', '🐼', '🦁', '🐸', '🦉', '🐯', '🐙', '🚀'];
const DEFAULT_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#ef4444', '#84cc16'];
const STARTING_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'w'];

export const PassAndPlay: React.FC<PassAndPlayProps> = ({ onBackToHome, onOpenRules }) => {
  const [inGame, setInGame] = useState(false);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2']);
  const [turnTimerSetting, setTurnTimerSetting] = useState(15);
  const [gameModeSetting, setGameModeSetting] = useState<'strikes' | 'sudden_death' | 'casual'>('strikes');
  
  // Game state
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  const handleAddPlayer = () => {
    if (playerNames.length < 8) {
      setPlayerNames([...playerNames, `Player ${playerNames.length + 1}`]);
    }
  };

  const handleRemovePlayer = (idx: number) => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.filter((_, i) => i !== idx));
    }
  };

  const handleNameChange = (idx: number, name: string) => {
    const updated = [...playerNames];
    updated[idx] = name;
    setPlayerNames(updated);
  };

  const startMatch = () => {
    const players: Player[] = playerNames.map((name, i) => ({
      id: `local-player-${i}`,
      name: name.trim() || `Player ${i + 1}`,
      avatar: DEFAULT_AVATARS[i % DEFAULT_AVATARS.length],
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      isHost: i === 0,
      isReady: true,
      isConnected: true,
      strikes: 0,
      isEliminated: false,
      score: 0,
      wordsPlayedCount: 0
    }));

    const initialLetter = STARTING_LETTERS[Math.floor(Math.random() * STARTING_LETTERS.length)];

    const state: RoomState = {
      code: 'LOCAL-MATCH',
      status: 'playing',
      settings: {
        turnTimeLimit: turnTimerSetting,
        gameMode: gameModeSetting,
        maxStrikes: 3,
        minWordLength: 3
      },
      hostId: players[0].id,
      players,
      currentTurnIndex: 0,
      currentLetter: initialLetter,
      turnStartTime: Date.now(),
      timeRemaining: turnTimerSetting,
      chain: [],
      burnedWords: {},
      burnedVerbRoots: {},
      recentViolation: null,
      winner: null,
      turnCount: 0
    };

    setRoomState(state);
    setInGame(true);
    sounds.playChime();
  };

  // Timer interval for local game
  useEffect(() => {
    if (!inGame || !roomState || roomState.status !== 'playing' || roomState.settings.turnTimeLimit <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRoomState((prev) => {
        if (!prev || prev.status !== 'playing') return prev;

        const nextTime = prev.timeRemaining - 1;
        if (nextTime <= 3 && nextTime > 0) {
          sounds.playTick(true);
        } else if (nextTime > 0 && nextTime <= 5) {
          sounds.playTick(false);
        }

        if (nextTime <= 0) {
          // Timeout violation!
          sounds.playError();
          const curr = prev.players[prev.currentTurnIndex];
          const violation: Violation = {
            type: 'TIMEOUT',
            message: `Time's up! ${curr.name} ran out of time!`,
            playerId: curr.id,
            playerName: curr.name,
            turnNumber: prev.turnCount + 1,
            timestamp: Date.now()
          };

          return handleLocalViolation(prev, curr, violation);
        }

        return { ...prev, timeRemaining: nextTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [inGame, roomState?.status, roomState?.currentTurnIndex]);

  const handleLocalViolation = (state: RoomState, player: Player, violation: Violation): RoomState => {
    const updatedPlayers = state.players.map((p) => {
      if (p.id !== player.id) return p;
      if (state.settings.gameMode === 'sudden_death') {
        return { ...p, isEliminated: true };
      } else if (state.settings.gameMode === 'strikes') {
        const strikes = p.strikes + 1;
        return { ...p, strikes, isEliminated: strikes >= state.settings.maxStrikes };
      } else {
        return { ...p, score: Math.max(0, p.score - 5) };
      }
    });

    const active = updatedPlayers.filter((p) => !p.isEliminated);
    if (active.length <= 1 && updatedPlayers.length > 1) {
      sounds.playVictory();
      return {
        ...state,
        players: updatedPlayers,
        status: 'game_over',
        winner: active[0] || null,
        recentViolation: violation
      };
    }

    // Advance turn
    let nextIdx = (state.currentTurnIndex + 1) % updatedPlayers.length;
    let attempts = 0;
    while (updatedPlayers[nextIdx].isEliminated && attempts < updatedPlayers.length) {
      nextIdx = (nextIdx + 1) % updatedPlayers.length;
      attempts++;
    }

    return {
      ...state,
      players: updatedPlayers,
      currentTurnIndex: nextIdx,
      recentViolation: violation,
      timeRemaining: state.settings.turnTimeLimit,
      turnStartTime: Date.now()
    };
  };

  const handleSubmitWord = async (rawWord: string) => {
    if (!roomState || roomState.status !== 'playing') return;

    const word = rawWord.trim().toLowerCase();
    const curr = roomState.players[roomState.currentTurnIndex];
    const turnCount = roomState.turnCount + 1;

    // 1. Min length
    if (word.length < roomState.settings.minWordLength) {
      sounds.playError();
      const violation: Violation = {
        type: 'TOO_SHORT',
        message: `'${word}' is too short! Minimum length is ${roomState.settings.minWordLength} letters.`,
        playerId: curr.id,
        playerName: curr.name,
        turnNumber: turnCount,
        timestamp: Date.now()
      };
      setRoomState((prev) => (prev ? handleLocalViolation(prev, curr, violation) : null));
      return;
    }

    // 2. Starting letter
    const expectedLetter = roomState.currentLetter.toLowerCase();
    if (word.charAt(0) !== expectedLetter) {
      sounds.playError();
      const violation: Violation = {
        type: 'WRONG_START_LETTER',
        message: `'${word}' starts with '${word.charAt(0).toUpperCase()}', but must start with '${expectedLetter.toUpperCase()}'!`,
        playerId: curr.id,
        playerName: curr.name,
        turnNumber: turnCount,
        timestamp: Date.now()
      };
      setRoomState((prev) => (prev ? handleLocalViolation(prev, curr, violation) : null));
      return;
    }

    // 3. Exact word already used?
    if (roomState.burnedWords[word]) {
      sounds.playError();
      const orig = roomState.burnedWords[word];
      const violation: Violation = {
        type: 'DUPLICATE_WORD',
        message: `'${word}' was already used by ${orig.playerName} on Turn ${orig.turn}!`,
        playerId: curr.id,
        playerName: curr.name,
        turnNumber: turnCount,
        timestamp: Date.now(),
        originalTurn: orig.turn,
        originalPlayerName: orig.playerName,
        originalWord: orig.word
      };
      setRoomState((prev) => (prev ? handleLocalViolation(prev, curr, violation) : null));
      return;
    }

    // 4. Verify against backend dictionary API
    try {
      const res = await fetch(`/api/word/${encodeURIComponent(word)}`);
      const data = await res.json();

      if (!data.isValid) {
        sounds.playError();
        const violation: Violation = {
          type: 'INVALID_DICTIONARY_WORD',
          message: `'${word}' is not a valid English word in the dictionary!`,
          playerId: curr.id,
          playerName: curr.name,
          turnNumber: turnCount,
          timestamp: Date.now()
        };
        setRoomState((prev) => (prev ? handleLocalViolation(prev, curr, violation) : null));
        return;
      }

      // 5. Verb Form Lemmatization check
      if (data.isVerb && data.verbRoot) {
        const root = data.verbRoot.toLowerCase();
        if (roomState.burnedVerbRoots[root]) {
          sounds.playError();
          const origVerb = roomState.burnedVerbRoots[root];
          const violation: Violation = {
            type: 'VERB_FORM_BURNED',
            message: `Verb form violation! The root verb '${root}' was already burned when ${origVerb.playerName} played '${origVerb.originalWord}' on Turn ${origVerb.turn}!`,
            playerId: curr.id,
            playerName: curr.name,
            turnNumber: turnCount,
            timestamp: Date.now(),
            originalTurn: origVerb.turn,
            originalPlayerName: origVerb.playerName,
            originalWord: origVerb.originalWord,
            verbRoot: root
          };
          setRoomState((prev) => (prev ? handleLocalViolation(prev, curr, violation) : null));
          return;
        }

        // Check if any conjugated form was burned
        if (data.allVerbForms) {
          for (const form of data.allVerbForms) {
            if (roomState.burnedWords[form]) {
              sounds.playError();
              const orig = roomState.burnedWords[form];
              const violation: Violation = {
                type: 'VERB_FORM_BURNED',
                message: `Verb form violation! '${word}' is a form of '${root}', which was already played as '${orig.word}' by ${orig.playerName} on Turn ${orig.turn}!`,
                playerId: curr.id,
                playerName: curr.name,
                turnNumber: turnCount,
                timestamp: Date.now(),
                originalTurn: orig.turn,
                originalPlayerName: orig.playerName,
                originalWord: orig.word,
                verbRoot: root
              };
              setRoomState((prev) => (prev ? handleLocalViolation(prev, curr, violation) : null));
              return;
            }
          }
        }
      }

      // Accept word!
      sounds.playSuccess();
      const endingLetter = word.charAt(word.length - 1).toLowerCase();

      const newEntry: WordEntry = {
        word,
        playerId: curr.id,
        playerName: curr.name,
        playerColor: curr.color,
        turnNumber: turnCount,
        timestamp: Date.now(),
        definition: data.definition,
        partOfSpeech: data.partOfSpeech,
        verbRoot: data.verbRoot,
        isVerb: data.isVerb
      };

      setRoomState((prev) => {
        if (!prev) return null;

        const updatedBurnedWords = {
          ...prev.burnedWords,
          [word]: { turn: turnCount, playerId: curr.id, playerName: curr.name, word }
        };

        const updatedBurnedVerbRoots = { ...prev.burnedVerbRoots };
        if (data.isVerb && data.verbRoot) {
          const root = data.verbRoot.toLowerCase();
          updatedBurnedVerbRoots[root] = {
            turn: turnCount,
            playerId: curr.id,
            playerName: curr.name,
            originalWord: word,
            verbRoot: root
          };
          if (data.allVerbForms) {
            for (const f of data.allVerbForms) {
              if (!updatedBurnedWords[f]) {
                updatedBurnedWords[f] = { turn: turnCount, playerId: curr.id, playerName: curr.name, word: f };
              }
            }
          }
        }

        const updatedPlayers = prev.players.map((p) => {
          if (p.id !== curr.id) return p;
          const scoreBonus = ['x', 'z', 'q', 'j'].includes(endingLetter) ? 25 : 0;
          return {
            ...p,
            score: p.score + word.length * 10 + scoreBonus,
            wordsPlayedCount: p.wordsPlayedCount + 1
          };
        });

        // Advance to next active player
        let nextIdx = (prev.currentTurnIndex + 1) % updatedPlayers.length;
        let attempts = 0;
        while (updatedPlayers[nextIdx].isEliminated && attempts < updatedPlayers.length) {
          nextIdx = (nextIdx + 1) % updatedPlayers.length;
          attempts++;
        }

        return {
          ...prev,
          chain: [...prev.chain, newEntry],
          burnedWords: updatedBurnedWords,
          burnedVerbRoots: updatedBurnedVerbRoots,
          players: updatedPlayers,
          currentTurnIndex: nextIdx,
          currentLetter: endingLetter,
          recentViolation: null,
          turnCount,
          timeRemaining: prev.settings.turnTimeLimit,
          turnStartTime: Date.now()
        };
      });
    } catch {
      sounds.playError();
    }
  };

  const handleRestart = () => {
    startMatch();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        title="Pass & Play (1 Device)"
        onLeave={onBackToHome}
        onOpenRules={onOpenRules}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {!inGame ? (
          /* Setup View */
          <div className="max-w-lg mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
            <div className="text-center space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Single-Device Pass & Play
              </span>
              <h2 className="text-2xl font-black text-white">Player Setup</h2>
              <p className="text-xs text-slate-400">
                Add players around the table and pass the phone on each turn!
              </p>
            </div>

            {/* Players List Config */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Players ({playerNames.length})
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {playerNames.map((name, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-base shrink-0">
                      {DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length]}
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(idx, e.target.value)}
                      placeholder={`Player ${idx + 1}`}
                      maxLength={18}
                      className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                    {playerNames.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(idx)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {playerNames.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center space-x-1.5 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Player</span>
                </button>
              )}
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Timer</label>
                <select
                  value={turnTimerSetting}
                  onChange={(e) => setTurnTimerSetting(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value={10}>10s (Fast)</option>
                  <option value={15}>15s (Normal)</option>
                  <option value={20}>20s (Relaxed)</option>
                  <option value={30}>30s (Casual)</option>
                  <option value={0}>Unlimited</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Mode</label>
                <select
                  value={gameModeSetting}
                  onChange={(e) => setGameModeSetting(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="strikes">3 Strikes</option>
                  <option value="sudden_death">Sudden Death</option>
                  <option value="casual">Casual (No Out)</option>
                </select>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startMatch}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 font-black text-slate-950 text-base shadow-xl shadow-amber-950/40 transition-all transform active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Pass & Play Match</span>
            </button>
          </div>
        ) : (
          /* Active Game View */
          roomState && (
            <div>
              <GameBoard
                roomState={roomState}
                // In local pass & play, it is always the current player's turn!
                currentPlayer={roomState.players[roomState.currentTurnIndex]}
                onSubmitWord={handleSubmitWord}
              />

              {roomState.status === 'game_over' && (
                <GameOverModal
                  roomState={roomState}
                  isHost={true}
                  onRestart={handleRestart}
                  onLeave={onBackToHome}
                />
              )}
            </div>
          )
        )}
      </main>
    </div>
  );
};
