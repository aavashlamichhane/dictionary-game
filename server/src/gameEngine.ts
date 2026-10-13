import {
  RoomState,
  Player,
  WordEntry,
  Violation,
  GameSettings,
  ExportedGameData
} from '@dict-game/shared';
import { verifyWord } from './dictionary.js';
import { analyzeVerb } from './lemmatizer.js';

const STARTING_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'w'];

export function getRandomStartingLetter(): string {
  const index = Math.floor(Math.random() * STARTING_LETTERS.length);
  return STARTING_LETTERS[index];
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WORD-${code}`;
}

export function applyImportedGame(room: RoomState, gameData: ExportedGameData): void {
  // Mark all records as imported
  const importedBurnedWords: Record<string, any> = {};
  for (const [w, rec] of Object.entries(gameData.burnedWords || {})) {
    importedBurnedWords[w] = { ...rec, isImported: true };
  }

  const importedBurnedVerbs: Record<string, any> = {};
  for (const [v, rec] of Object.entries(gameData.burnedVerbRoots || {})) {
    importedBurnedVerbs[v] = { ...rec, isImported: true };
  }

  const importedChain: WordEntry[] = (gameData.chain || []).map((c) => ({
    ...c,
    isImported: true
  }));

  room.burnedWords = { ...importedBurnedWords, ...room.burnedWords };
  room.burnedVerbRoots = { ...importedBurnedVerbs, ...room.burnedVerbRoots };
  room.chain = [...importedChain, ...room.chain];

  const lastWord = gameData.lastWord || (importedChain.length > 0 ? importedChain[importedChain.length - 1].word : undefined);
  const lastLetter = gameData.lastLetter || (lastWord ? lastWord.charAt(lastWord.length - 1).toLowerCase() : undefined);

  if (lastLetter) {
    room.currentLetter = lastLetter;
  }

  room.importedMatchInfo = {
    totalImportedWords: Object.keys(importedBurnedWords).length,
    lastWord,
    lastLetter,
    importedAt: gameData.exportedAt || Date.now()
  };
}

export function clearImportedGame(room: RoomState): void {
  // Filter out any imported records
  const cleanBurnedWords: Record<string, any> = {};
  for (const [w, rec] of Object.entries(room.burnedWords)) {
    if (!rec.isImported) cleanBurnedWords[w] = rec;
  }

  const cleanBurnedVerbs: Record<string, any> = {};
  for (const [v, rec] of Object.entries(room.burnedVerbRoots)) {
    if (!rec.isImported) cleanBurnedVerbs[v] = rec;
  }

  room.burnedWords = cleanBurnedWords;
  room.burnedVerbRoots = cleanBurnedVerbs;
  room.chain = room.chain.filter((c) => !c.isImported);
  room.importedMatchInfo = null;
  room.currentLetter = getRandomStartingLetter();
}

export function createInitialRoom(
  code: string,
  host: Player,
  settings: Partial<GameSettings> = {},
  importedGame?: ExportedGameData
): RoomState {
  const defaultSettings: GameSettings = {
    turnTimeLimit: 15,
    gameMode: 'strikes',
    maxStrikes: 3,
    minWordLength: 3,
    ...settings
  };

  const room: RoomState = {
    code,
    status: 'lobby',
    settings: defaultSettings,
    hostId: host.id,
    players: [host],
    currentTurnIndex: 0,
    currentLetter: getRandomStartingLetter(),
    turnStartTime: 0,
    timeRemaining: defaultSettings.turnTimeLimit,
    chain: [],
    burnedWords: {},
    burnedVerbRoots: {},
    recentViolation: null,
    winner: null,
    turnCount: 0,
    importedMatchInfo: null
  };

  if (importedGame) {
    applyImportedGame(room, importedGame);
  }

  return room;
}

export function getActivePlayers(room: RoomState): Player[] {
  return room.players.filter((p) => !p.isEliminated && p.isConnected);
}

export function getNextPlayerIndex(room: RoomState, fromIndex: number): number {
  const total = room.players.length;
  if (total === 0) return 0;
  
  let next = (fromIndex + 1) % total;
  let attempts = 0;
  while ((room.players[next].isEliminated || !room.players[next].isConnected) && attempts < total) {
    next = (next + 1) % total;
    attempts++;
  }
  return next;
}

export interface WordValidationResult {
  accepted: boolean;
  wordEntry?: WordEntry;
  violation?: Violation;
  nextLetter?: string;
  isGameOver?: boolean;
}

export async function processWordSubmission(
  room: RoomState,
  player: Player,
  rawWord: string
): Promise<WordValidationResult> {
  const turnIndex = room.currentTurnIndex;
  const word = rawWord.trim().toLowerCase();
  const turnNumber = ++room.turnCount;

  // 1. Min length check
  if (word.length < room.settings.minWordLength) {
    return handleViolation(room, player, {
      type: 'TOO_SHORT',
      message: `Word '${word}' is too short! Minimum length is ${room.settings.minWordLength} letters.`,
      offendingWord: word,
      playerId: player.id,
      playerName: player.name,
      turnNumber: room.turnCount,
      timestamp: Date.now()
    });
  }

  // 2. Starting letter check
  const expectedLetter = room.currentLetter.toLowerCase();
  if (word.charAt(0) !== expectedLetter) {
    return handleViolation(room, player, {
      type: 'WRONG_START_LETTER',
      message: `Word '${word}' starts with '${word.charAt(0).toUpperCase()}', but must start with '${expectedLetter.toUpperCase()}'!`,
      offendingWord: word,
      playerId: player.id,
      playerName: player.name,
      turnNumber: room.turnCount,
      timestamp: Date.now()
    });
  }

  // 3. Exact word or burned verb form in burnedWords?
  if (Object.hasOwn(room.burnedWords, word)) {
    const orig = room.burnedWords[word];
    if (orig.isFormOfRoot) {
      return handleViolation(room, player, {
        type: 'VERB_FORM_BURNED',
        message: orig.isImported
          ? `Verb form violation! '${word}' is an inflection of root verb '${orig.isFormOfRoot}', which was already burned in the imported previous game!`
          : `Verb form violation! '${word}' is an inflection of root verb '${orig.isFormOfRoot}', which was already burned when ${orig.playerName} played '${orig.word}' on Turn ${orig.turn}!`,
        offendingWord: word,
        playerId: player.id,
        playerName: player.name,
        turnNumber: room.turnCount,
        timestamp: Date.now(),
        originalTurn: orig.turn,
        originalPlayerName: orig.playerName,
        originalWord: orig.word,
        verbRoot: orig.isFormOfRoot
      });
    }

    return handleViolation(room, player, {
      type: 'DUPLICATE_WORD',
      message: orig.isImported
        ? `Duplicate word! '${word}' was already used in the imported previous game!`
        : `Word '${word}' was already used by ${orig.playerName} on Turn ${orig.turn}!`,
      offendingWord: word,
      playerId: player.id,
      playerName: player.name,
      turnNumber: room.turnCount,
      timestamp: Date.now(),
      originalTurn: orig.turn,
      originalPlayerName: orig.playerName,
      originalWord: orig.word
    });
  }

  // 4. Verify in English dictionary
  const verified = await verifyWord(word, room.settings.minWordLength);
  if (room.turnCount !== turnNumber || room.status !== 'playing' || !player.isConnected || room.currentTurnIndex !== turnIndex || room.players[turnIndex]?.id !== player.id) return { accepted: false };
  if (!verified.isValid) {
    return handleViolation(room, player, {
      type: 'INVALID_DICTIONARY_WORD',
      message: `'${word}' is not a valid English word in the dictionary!`,
      offendingWord: word,
      playerId: player.id,
      playerName: player.name,
      turnNumber: room.turnCount,
      timestamp: Date.now()
    });
  }

  // 5. Verb Form Lemmatization check
  const verbInfo = analyzeVerb(word);
  if (verbInfo.isVerb && verbInfo.verbRoot) {
    const root = verbInfo.verbRoot.toLowerCase();
    // Check if root already burned
    if (Object.hasOwn(room.burnedVerbRoots, root)) {
      const origVerb = room.burnedVerbRoots[root];
      return handleViolation(room, player, {
        type: 'VERB_FORM_BURNED',
        message: origVerb.isImported
          ? `Verb form violation! Root verb '${root}' was already burned in the imported previous game!`
          : `Verb form violation! The root verb '${root}' was already burned when ${origVerb.playerName} played '${origVerb.originalWord}' on Turn ${origVerb.turn}!`,
        offendingWord: word,
        playerId: player.id,
        playerName: player.name,
        turnNumber: room.turnCount,
        timestamp: Date.now(),
        originalTurn: origVerb.turn,
        originalPlayerName: origVerb.playerName,
        originalWord: origVerb.originalWord,
        verbRoot: root
      });
    }

    // Check if any conjugated form was already entered
    for (const form of verbInfo.allForms) {
      if (Object.hasOwn(room.burnedWords, form)) {
        const orig = room.burnedWords[form];
        return handleViolation(room, player, {
          type: 'VERB_FORM_BURNED',
          message: orig.isImported
            ? `Verb form violation! '${word}' is a form of '${root}', which was already burned in the imported previous game!`
            : `Verb form violation! '${word}' is a form of '${root}', which was already played as '${orig.word}' by ${orig.playerName} on Turn ${orig.turn}!`,
          offendingWord: word,
          playerId: player.id,
          playerName: player.name,
          turnNumber: room.turnCount,
          timestamp: Date.now(),
          originalTurn: orig.turn,
          originalPlayerName: orig.playerName,
          originalWord: orig.word,
          verbRoot: root
        });
      }
    }
  }

  // Word is 100% VALID! Accept it.
  const endingLetter = word.charAt(word.length - 1).toLowerCase();

  const wordEntry: WordEntry = {
    word,
    playerId: player.id,
    playerName: player.name,
    playerColor: player.color,
    turnNumber: room.turnCount,
    timestamp: Date.now(),
    definition: verified.definition,
    partOfSpeech: verified.partOfSpeech,
    verbRoot: verified.verbRoot,
    isVerb: verified.isVerb
  };

  room.chain.push(wordEntry);

  // Burn exact word
  room.burnedWords[word] = {
    turn: room.turnCount,
    playerId: player.id,
    playerName: player.name,
    word
  };

  // Burn verb root and forms
  if (verified.isVerb && verified.verbRoot) {
    const root = verified.verbRoot.toLowerCase();
    room.burnedVerbRoots[root] = {
      turn: room.turnCount,
      playerId: player.id,
      playerName: player.name,
      originalWord: word,
      verbRoot: root
    };
    for (const f of verified.allVerbForms) {
      if (!room.burnedWords[f]) {
        room.burnedWords[f] = {
          turn: room.turnCount,
          playerId: player.id,
          playerName: player.name,
          word, // original word played
          isFormOfRoot: root
        };
      }
    }
  }

  // Update player score & stats
  player.score += word.length * 10;
  // Tricky letter bonus (X, Z, Q, J)
  if (['x', 'z', 'q', 'j'].includes(endingLetter)) {
    player.score += 25;
  }
  player.wordsPlayedCount++;

  room.recentViolation = null;
  room.currentLetter = endingLetter;
  room.currentTurnIndex = getNextPlayerIndex(room, room.currentTurnIndex);
  room.turnStartTime = Date.now();
  room.timeRemaining = room.settings.turnTimeLimit;

  return {
    accepted: true,
    wordEntry,
    nextLetter: endingLetter
  };
}

export function handleViolation(room: RoomState, player: Player, violation: Violation): WordValidationResult {
  room.recentViolation = violation;

  if (room.settings.gameMode === 'sudden_death') {
    player.isEliminated = true;
  } else if (room.settings.gameMode === 'strikes') {
    player.strikes++;
    if (player.strikes >= room.settings.maxStrikes) {
      player.isEliminated = true;
    }
  } else {
    // casual mode: small score deduction
    player.score = Math.max(0, player.score - 5);
  }

  // Check if game over
  const remaining = getActivePlayers(room);
  if (remaining.length <= 1 && room.players.length > 1) {
    room.status = 'game_over';
    room.winner = remaining[0] || null;
    return {
      accepted: false,
      violation,
      isGameOver: true
    };
  }

  // Advance turn to next non-eliminated player, keep same currentLetter
  room.currentTurnIndex = getNextPlayerIndex(room, room.currentTurnIndex);
  room.turnStartTime = Date.now();
  room.timeRemaining = room.settings.turnTimeLimit;

  return {
    accepted: false,
    violation,
    nextLetter: room.currentLetter
  };
}

export function handleTimeout(room: RoomState): WordValidationResult {
  const currentPlayer = room.players[room.currentTurnIndex];
  if (!currentPlayer) {
    return { accepted: false };
  }

  room.turnCount++;
  const violation: Violation = {
    type: 'TIMEOUT',
    message: `Time's up! ${currentPlayer.name} ran out of time!`,
    playerId: currentPlayer.id,
    playerName: currentPlayer.name,
    turnNumber: room.turnCount,
    timestamp: Date.now()
  };

  return handleViolation(room, currentPlayer, violation);
}

export function resetGame(room: RoomState): void {
  room.status = 'playing';

  // Retain imported chain and burned words if an imported match exists!
  if (room.importedMatchInfo) {
    const importedBurnedWords: Record<string, any> = {};
    for (const [w, rec] of Object.entries(room.burnedWords)) {
      if (rec.isImported) importedBurnedWords[w] = rec;
    }
    const importedBurnedVerbs: Record<string, any> = {};
    for (const [v, rec] of Object.entries(room.burnedVerbRoots)) {
      if (rec.isImported) importedBurnedVerbs[v] = rec;
    }
    room.burnedWords = importedBurnedWords;
    room.burnedVerbRoots = importedBurnedVerbs;
    room.chain = room.chain.filter((c) => c.isImported);
    if (room.importedMatchInfo.lastLetter) {
      room.currentLetter = room.importedMatchInfo.lastLetter;
    } else {
      room.currentLetter = getRandomStartingLetter();
    }
  } else {
    room.chain = [];
    room.burnedWords = {};
    room.burnedVerbRoots = {};
    room.currentLetter = getRandomStartingLetter();
  }

  room.recentViolation = null;
  room.winner = null;
  room.turnCount = 0;
  room.turnStartTime = Date.now();
  room.timeRemaining = room.settings.turnTimeLimit;

  for (const p of room.players) {
    p.strikes = 0;
    p.isEliminated = !p.isConnected;
    p.score = 0;
    p.wordsPlayedCount = 0;
  }

  room.currentTurnIndex = Math.max(0, room.players.findIndex(p => p.isConnected));
}
