export type GameMode = 'sudden_death' | 'strikes' | 'casual';

export interface GameSettings {
  turnTimeLimit: number; // in seconds: 0 for unlimited, 10, 15, 20, 30
  gameMode: GameMode;
  maxStrikes: number; // default 3
  minWordLength: number; // default 3
}

export interface Player {
  id: string;
  name: string;
  avatar: string; // Emoji
  color: string; // Hex or theme color name
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  strikes: number;
  isEliminated: boolean;
  score: number;
  wordsPlayedCount: number;
}

export interface WordEntry {
  word: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  turnNumber: number;
  timestamp: number;
  definition?: string;
  partOfSpeech?: string;
  verbRoot?: string;
  isVerb: boolean;
  isImported?: boolean; // Word imported from a previous match
}

export type ViolationType =
  | 'WRONG_START_LETTER'
  | 'DUPLICATE_WORD'
  | 'VERB_FORM_BURNED'
  | 'INVALID_DICTIONARY_WORD'
  | 'TIMEOUT'
  | 'TOO_SHORT';

export interface Violation {
  type: ViolationType;
  message: string;
  offendingWord?: string;
  playerId: string;
  playerName: string;
  turnNumber: number;
  timestamp: number;
  // If duplicate or verb form burned:
  originalTurn?: number;
  originalPlayerName?: string;
  originalWord?: string;
  verbRoot?: string;
}

export type RoomStatus = 'lobby' | 'playing' | 'game_over';

export interface BurnedWordRecord {
  turn: number;
  playerId: string;
  playerName: string;
  word: string; // The actual word that was played
  isFormOfRoot?: string; // If burned via root verb family
  isImported?: boolean; // Carried over from imported previous match
}

export interface BurnedVerbRecord {
  turn: number;
  playerId: string;
  playerName: string;
  originalWord: string;
  verbRoot: string;
  isImported?: boolean;
}

export interface ImportedMatchInfo {
  totalImportedWords: number;
  lastWord?: string;
  lastLetter?: string;
  importedAt: number;
}

export interface ExportedGameData {
  version: '1.0';
  exportedAt: number;
  roomCode?: string;
  gameMode?: GameMode;
  totalWords: number;
  lastWord?: string;
  lastLetter?: string;
  chain: WordEntry[];
  burnedWords: Record<string, BurnedWordRecord>;
  burnedVerbRoots: Record<string, BurnedVerbRecord>;
}

export interface RoomState {
  code: string;
  status: RoomStatus;
  settings: GameSettings;
  hostId: string;
  players: Player[];
  currentTurnIndex: number;
  currentLetter: string;
  turnStartTime: number;
  timeRemaining: number;
  chain: WordEntry[];
  burnedWords: Record<string, BurnedWordRecord>;
  burnedVerbRoots: Record<string, BurnedVerbRecord>;
  recentViolation: Violation | null;
  winner: Player | null;
  turnCount: number;
  importedMatchInfo?: ImportedMatchInfo | null;
}

export interface CreateRoomPayload {
  playerName: string;
  avatar: string;
  color: string;
  settings?: Partial<GameSettings>;
  importedGame?: ExportedGameData;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
  avatar: string;
  color: string;
}

export interface SubmitWordPayload {
  word: string;
}

// Socket events contract
export interface ServerToClientEvents {
  'room:joined': (data: { player: Player; roomState: RoomState }) => void;
  'room:updated': (roomState: RoomState) => void;
  'room:error': (data: { message: string }) => void;
  'game:word_accepted': (data: { wordEntry: WordEntry; nextLetter: string; nextPlayer: Player }) => void;
  'game:violation': (violation: Violation) => void;
  'game:over': (data: { winner: Player | null; reason: string; roomState: RoomState }) => void;
  'game:tick': (data: { timeRemaining: number }) => void;
}

export interface ClientToServerEvents {
  'room:create': (payload: CreateRoomPayload, callback: (response: { success: boolean; roomCode?: string; error?: string }) => void) => void;
  'room:join': (payload: JoinRoomPayload, callback: (response: { success: boolean; error?: string }) => void) => void;
  'room:leave': () => void;
  'room:update_settings': (settings: Partial<GameSettings>) => void;
  'room:toggle_ready': () => void;
  'room:start_game': () => void;
  'room:import_game': (payload: { gameData: ExportedGameData }, callback: (response: { success: boolean; error?: string }) => void) => void;
  'room:clear_imported_game': () => void;
  'game:submit_word': (payload: SubmitWordPayload) => void;
  'game:restart': () => void;
}
