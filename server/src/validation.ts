import type { GameSettings, ExportedGameData } from '@dict-game/shared';

export function object(value: unknown): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object');
  return value as Record<string, any>;
}

export function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(label + ' is invalid');
  return value.trim();
}

export function settings(value: unknown): Partial<GameSettings> {
  const input = object(value ?? {});
  const result: Partial<GameSettings> = {};
  for (const [key, min, max] of [['turnTimeLimit', 0, 300], ['maxStrikes', 1, 10], ['minWordLength', 1, 30]] as const) {
    if (input[key] !== undefined) {
      if (!Number.isInteger(input[key]) || input[key] < min || input[key] > max) throw new Error('Invalid ' + key);
      result[key] = input[key];
    }
  }
  if (input.gameMode !== undefined) {
    if (!['strikes', 'sudden_death', 'casual'].includes(input.gameMode)) throw new Error('Invalid game mode');
    result.gameMode = input.gameMode;
  }
  return result;
}

export function profile(value: unknown) {
  const input = object(value);
  return { playerName: text(input.playerName, 'Player name', 40),
    avatar: input.avatar === undefined ? '🎮' : text(input.avatar, 'Avatar', 32),
    color: typeof input.color === 'string' && /^#[a-f0-9]{6}$/i.test(input.color) ? input.color : '#105666' };
}

export function importedGame(value: unknown): ExportedGameData {
  const data = object(value);
  if (data.version !== '1.0' || !Array.isArray(data.chain) || data.chain.length > 5000) throw new Error('Invalid match file');
  for (const name of ['burnedWords', 'burnedVerbRoots']) {
    const entries = Object.entries(object(data[name]));
    if (entries.length > 10000) throw new Error('Match file is too large');
    for (const [key, value] of entries) {
      if (!/^[a-z]{1,80}$/.test(key)) throw new Error('Invalid match word');
      const record = object(value);
      text(record.playerName, 'Player name', 100);
      text(record.playerId, 'Player ID', 100);
      if (!Number.isInteger(record.turn) || record.turn < 0) throw new Error('Invalid turn');
      text(name === 'burnedWords' ? record.word : record.originalWord, 'Word', 80);
      if (name === 'burnedVerbRoots') text(record.verbRoot, 'Verb root', 80);
      if (record.isFormOfRoot !== undefined) text(record.isFormOfRoot, 'Verb root', 80);
    }
  }
  for (const value of data.chain) {
    const entry = object(value);
    if (!/^[a-z]{1,80}$/.test(text(entry.word, 'Word', 80))) throw new Error('Invalid word');
    for (const field of ['playerId', 'playerName', 'playerColor']) text(entry[field], field, 100);
    if (!Number.isInteger(entry.turnNumber) || !Number.isFinite(entry.timestamp) || typeof entry.isVerb !== 'boolean') throw new Error('Invalid chain entry');
    for (const field of ['definition', 'partOfSpeech', 'verbRoot']) if (entry[field] !== undefined && typeof entry[field] !== 'string') throw new Error('Invalid chain field');
  }
  if (data.lastLetter !== undefined && (typeof data.lastLetter !== 'string' || !/^[a-z]$/.test(data.lastLetter))) throw new Error('Invalid starting letter');
  if (data.lastWord !== undefined) text(data.lastWord, 'Last word', 80);
  if (!Number.isFinite(data.exportedAt)) throw new Error('Invalid export timestamp');
  return data as unknown as ExportedGameData;
}
