import React, { useState, useEffect } from 'react';
import { Player, RoomState, WordEntry, Violation, ExportedGameData } from '@dict-game/shared';
import { Plus, Trash2, Play, Users, RotateCcw, Upload, AlertCircle, Smartphone, Shield } from 'lucide-react';
import { GameBoard } from '../components/GameBoard.js';
import { GameOverModal } from '../components/GameOverModal.js';
import { Header } from '../components/Header.js';
import { sounds } from '../utils/audio.js';
import { parseGameFile } from '../utils/gameStorage.js';

interface PassAndPlayProps {
  onBackToHome: () => void;
  onOpenRules: () => void;
}

const DEFAULT_AVATARS = ['🦊', '🦉', '🦁', '🐸', '🐼', '🐯', '🐙', '⚡'];
const DEFAULT_COLORS = ['#105666', '#839958', '#D3968C', '#0A3323', '#B86B52', '#466365', '#C29548', '#6D597A'];
const STARTING_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'w'];

export const PassAndPlay: React.FC<PassAndPlayProps> = ({ onBackToHome, onOpenRules }) => {
  const [inGame, setInGame] = useState(false);
  const [playerNames, setPlayerNames] = useState<string[]>(['Contender 1', 'Contender 2']);
  const [turnTimerSetting, setTurnTimerSetting] = useState(15);
  const [gameModeSetting, setGameModeSetting] = useState<'strikes' | 'sudden_death' | 'casual'>('strikes');
  
  // Game state
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [importedGame, setImportedGame] = useState<ExportedGameData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleAddPlayer = () => {
    if (playerNames.length < 8) {
      setPlayerNames([...playerNames, `Contender ${playerNames.length + 1}`]);
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

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const data = await parseGameFile(file);
      setImportedGame(data);
      sounds.playChime();
    } catch (err: any) {
      setImportError(err.message || 'Failed to import match file');
      sounds.playError();
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const clearImportedGame = () => {
    setImportedGame(null);
    setImportError(null);
  };

  const startMatch = () => {
    const players: Player[] = playerNames.map((name, i) => ({
      id: `local-player-${i}`,
      name: name.trim() || `Contender ${i + 1}`,
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

    const initialLetter =
      importedGame?.lastLetter ||
      STARTING_LETTERS[Math.floor(Math.random() * STARTING_LETTERS.length)];

    const importedBurnedWords: Record<string, any> = {};
    if (importedGame?.burnedWords) {
      for (const [w, rec] of Object.entries(importedGame.burnedWords)) {
        importedBurnedWords[w] = { ...rec, isImported: true };
      }
    }

    const importedBurnedVerbs: Record<string, any> = {};
    if (importedGame?.burnedVerbRoots) {
      for (const [v, rec] of Object.entries(importedGame.burnedVerbRoots)) {
        importedBurnedVerbs[v] = { ...rec, isImported: true };
      }
    }

    const importedChain = (importedGame?.chain || []).map((c) => ({
      ...c,
      isImported: true
    }));

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
      chain: importedChain,
      burnedWords: importedBurnedWords,
      burnedVerbRoots: importedBurnedVerbs,
      recentViolation: null,
      winner: null,
      turnCount: 0,
      importedMatchInfo: importedGame
        ? {
            totalImportedWords: Object.keys(importedBurnedWords).length,
            lastWord: importedGame.lastWord,
            lastLetter: importedGame.lastLetter,
            importedAt: importedGame.exportedAt
          }
        : null
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
            message: `Time expired! ${curr.name} failed to inscribe a word in time!`,
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
        message: `'${word}' is too short! Minimum requirement is ${roomState.settings.minWordLength} letters.`,
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

    // 3. Exact word already used or inflection in burnedWords?
    if (roomState.burnedWords[word]) {
      sounds.playError();
      const orig = roomState.burnedWords[word];
      if (orig.isFormOfRoot) {
        const violation: Violation = {
          type: 'VERB_FORM_BURNED',
          message: orig.isImported
            ? `Verb form infringement! '${word}' is an inflection of root verb '${orig.isFormOfRoot}', which was already burned in the imported dossier!`
            : `Verb form infringement! '${word}' is an inflection of root verb '${orig.isFormOfRoot}', which was burned when ${orig.playerName} played '${orig.word}' on Turn ${orig.turn}!`,
          offendingWord: word,
          playerId: curr.id,
          playerName: curr.name,
          turnNumber: turnCount,
          timestamp: Date.now(),
          originalTurn: orig.turn,
          originalPlayerName: orig.playerName,
          originalWord: orig.word,
          verbRoot: orig.isFormOfRoot
        };
        setRoomState((prev) => (prev ? handleLocalViolation(prev, curr, violation) : null));
        return;
      }

      const violation: Violation = {
        type: 'DUPLICATE_WORD',
        message: orig.isImported
          ? `Duplicate word! '${word}' was already inscribed in the imported previous game!`
          : `'${word}' was already used by ${orig.playerName} on Turn ${orig.turn}!`,
        offendingWord: word,
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
          message: `'${word}' is not recognized in the standard English dictionary!`,
          offendingWord: word,
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
            message: origVerb.isImported
              ? `Verb form infringement! Root verb '${root}' was already burned in the imported match dossier!`
              : `Verb form infringement! The root verb '${root}' was already burned when ${origVerb.playerName} played '${origVerb.originalWord}' on Turn ${origVerb.turn}!`,
            offendingWord: word,
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
                message: orig.isImported
                  ? `Verb form infringement! '${word}' is a form of '${root}', which was burned in the imported dossier!`
                  : `Verb form infringement! '${word}' is a form of '${root}', which was already played as '${orig.word}' by ${orig.playerName} on Turn ${orig.turn}!`,
                offendingWord: word,
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
    <div className="min-h-screen flex flex-col bg-beige text-darkgreen">
      <Header
        title="Pass & Play (Single Device)"
        onLeave={onBackToHome}
        onOpenRules={onOpenRules}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {!inGame ? (
          /* Table Setup View */
          <div className="max-w-lg mx-auto bg-beige-card border border-darkgreen/15 rounded-3xl p-6 sm:p-8 shadow-warm-lg space-y-6 animate-fade-in w-full">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-moss-tint border border-moss/25 text-moss-dark text-[10px] font-black uppercase tracking-widest">
                <Smartphone className="w-3 h-3 text-moss" />
                <span>Pass & Play Parlor Table</span>
              </div>
              <h2 className="text-2xl font-serif font-black text-darkgreen">
                Table Configuration
              </h2>
              <p className="text-xs text-darkgreen/70">
                Register contenders around the room. On each turn, pass the device to the active player!
              </p>
            </div>

            {/* Contenders Registration Roster */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-darkgreen/70">
                  Contenders ({playerNames.length})
                </label>
                <span className="text-[10px] text-darkgreen/50">2 to 8 contenders</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {playerNames.map((name, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="w-9 h-9 rounded-xl bg-beige border border-darkgreen/15 flex items-center justify-center text-base shrink-0 shadow-warm-xs">
                      {DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length]}
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(idx, e.target.value)}
                      placeholder={`Contender ${idx + 1}`}
                      maxLength={18}
                      className="flex-1 bg-beige/80 border border-darkgreen/20 rounded-xl px-3.5 py-2 text-sm font-bold text-darkgreen focus:outline-none focus:border-midnight shadow-inner-warm"
                    />
                    {playerNames.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(idx)}
                        className="p-2 text-darkgreen/40 hover:text-rosy-burn hover:bg-rosy-tint rounded-xl transition-all"
                        title="Remove contender"
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
                  className="w-full py-2.5 px-3 border border-dashed border-darkgreen/25 hover:border-darkgreen/40 bg-beige/40 hover:bg-beige rounded-xl text-xs font-bold text-darkgreen/70 hover:text-darkgreen transition-all flex items-center justify-center space-x-1.5 mt-1"
                >
                  <Plus className="w-4 h-4 text-midnight" />
                  <span>Add Another Contender</span>
                </button>
              )}
            </div>

            {/* Protocol Settings */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-darkgreen/70 block">
                  Turn Timer
                </label>
                <select
                  value={turnTimerSetting}
                  onChange={(e) => setTurnTimerSetting(Number(e.target.value))}
                  className="w-full bg-beige border border-darkgreen/20 rounded-xl px-3 py-2.5 text-darkgreen font-semibold text-xs focus:outline-none focus:border-midnight shadow-inner-warm"
                >
                  <option value={10}>10s (Fast)</option>
                  <option value={15}>15s (Standard)</option>
                  <option value={20}>20s (Deliberate)</option>
                  <option value={30}>30s (Leisurely)</option>
                  <option value={0}>Unlimited</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-darkgreen/70 block">
                  Elimination Mode
                </label>
                <select
                  value={gameModeSetting}
                  onChange={(e) => setGameModeSetting(e.target.value as any)}
                  className="w-full bg-beige border border-darkgreen/20 rounded-xl px-3 py-2.5 text-darkgreen font-semibold text-xs focus:outline-none focus:border-midnight shadow-inner-warm"
                >
                  <option value="strikes">3 Strikes</option>
                  <option value="sudden_death">Sudden Death</option>
                  <option value="casual">Casual (Points only)</option>
                </select>
              </div>
            </div>

            {/* Imported Dossier Section */}
            {importedGame ? (
              <div className="bg-rosy-tint border border-rosy/40 rounded-2xl p-3.5 flex items-start justify-between gap-3 text-left shadow-warm-xs">
                <div className="flex items-start space-x-2.5">
                  <div className="p-1.5 rounded-xl bg-rosy/20 text-rosy-dark mt-0.5 shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-black uppercase tracking-wider text-rosy-burn">
                        Continuing Match Dossier
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rosy/20 text-rosy-dark font-bold font-mono">
                        {Object.keys(importedGame.burnedWords || {}).length} Words Burned
                      </span>
                    </div>
                    <p className="text-[11px] text-darkgreen/80 mt-0.5 leading-snug">
                      Old words & verb forms remain poisoned.
                      {importedGame.lastWord && (
                        <span> Starts with letter <strong>"{importedGame.lastLetter?.toUpperCase() || ''}"</strong>.</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearImportedGame}
                  className="text-xs text-rosy-dark hover:text-darkgreen px-2.5 py-1 rounded-lg bg-beige hover:bg-beige-dark border border-rosy/30 transition-all font-semibold shrink-0"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div className="bg-beige/60 border border-dashed border-darkgreen/20 rounded-2xl p-3.5 flex items-center justify-between gap-2 text-left">
                <div className="flex items-center space-x-2.5">
                  <Upload className="w-4 h-4 text-midnight shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-darkgreen block">Continue Past Duel?</span>
                    <span className="text-[11px] text-darkgreen/65">Import a .json match dossier to ban previous words.</span>
                  </div>
                </div>

                <label className="cursor-pointer px-3 py-1.5 bg-beige hover:bg-beige-dark text-xs font-bold text-midnight border border-midnight/30 rounded-xl transition-all flex items-center space-x-1 shrink-0 shadow-warm-xs active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Importing...' : 'Import .json'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    disabled={isImporting}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-rosy-tint border border-rosy/50 rounded-xl text-rosy-dark text-xs flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-rosy-burn shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Launch Match Trigger */}
            <button
              onClick={startMatch}
              className="w-full py-4 px-6 rounded-3xl bg-midnight hover:bg-midnight-hover font-serif text-lg font-bold text-beige shadow-warm-lg hover:shadow-warm-xl transition-all transform active:scale-[0.99] flex items-center justify-center space-x-2.5 border border-midnight-dark"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Commence Pass & Play Duel</span>
            </button>
          </div>
        ) : (
          /* Active Local Game View */
          roomState && (
            <div>
              <GameBoard
                roomState={roomState}
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
