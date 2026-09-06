import {
  RoomState,
  Player,
  WordEntry,
  Violation,
  GameSettings
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

export function createInitialRoom(
  code: string,
  host: Player,
  settings: Partial<GameSettings> = {}
): RoomState {
  const defaultSettings: GameSettings = {
    turnTimeLimit: 15,
    gameMode: 'strikes',
    maxStrikes: 3,
    minWordLength: 3,
    ...settings
  };

  return {
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
    turnCount: 0
  };
}

export function getActivePlayers(room: RoomState): Player[] {
  return room.players.filter((p) => !p.isEliminated && p.isConnected);
}

export function getNextPlayerIndex(room: RoomState, fromIndex: number): number {
  const total = room.players.length;
  if (total === 0) return 0;
  
  let next = (fromIndex + 1) % total;
  let attempts = 0;
  while (room.players[next].isEliminated && attempts < total) {
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
  const word = rawWord.trim().toLowerCase();
  room.turnCount++;

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

  // 3. Exact word already used?
  if (room.burnedWords[word]) {
    const orig = room.burnedWords[word];
    return handleViolation(room, player, {
      type: 'DUPLICATE_WORD',
      message: `Word '${word}' was already used by ${orig.playerName} on Turn ${orig.turn}!`,
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
    if (room.burnedVerbRoots[root]) {
      const origVerb = room.burnedVerbRoots[root];
      return handleViolation(room, player, {
        type: 'VERB_FORM_BURNED',
        message: `Verb form violation! The root verb '${root}' was already burned when ${origVerb.playerName} played '${origVerb.originalWord}' on Turn ${origVerb.turn}!`,
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
      if (room.burnedWords[form]) {
        const orig = room.burnedWords[form];
        return handleViolation(room, player, {
          type: 'VERB_FORM_BURNED',
          message: `Verb form violation! '${word}' is a form of '${root}', which was already played as '${orig.word}' by ${orig.playerName} on Turn ${orig.turn}!`,
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
          word: f
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
  room.chain = [];
  room.burnedWords = {};
  room.burnedVerbRoots = {};
  room.recentViolation = null;
  room.winner = null;
  room.turnCount = 0;
  room.currentLetter = getRandomStartingLetter();
  room.turnStartTime = Date.now();
  room.timeRemaining = room.settings.turnTimeLimit;

  for (const p of room.players) {
    p.strikes = 0;
    p.isEliminated = false;
    p.score = 0;
    p.wordsPlayedCount = 0;
  }

  room.currentTurnIndex = 0;
}
