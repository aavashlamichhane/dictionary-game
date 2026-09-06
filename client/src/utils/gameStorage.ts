import { RoomState, ExportedGameData } from '@dict-game/shared';

export function exportGameFile(room: RoomState): void {
  const lastEntry = room.chain.length > 0 ? room.chain[room.chain.length - 1] : undefined;
  const lastWord = lastEntry?.word;
  const lastLetter = lastWord ? lastWord.charAt(lastWord.length - 1).toLowerCase() : room.currentLetter;

  const exportData: ExportedGameData = {
    version: '1.0',
    exportedAt: Date.now(),
    roomCode: room.code,
    gameMode: room.settings.gameMode,
    totalWords: Object.keys(room.burnedWords).length,
    lastWord,
    lastLetter,
    chain: room.chain,
    burnedWords: room.burnedWords,
    burnedVerbRoots: room.burnedVerbRoots
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const codeStr = room.code ? room.code.replace(/[^a-zA-Z0-9_-]/g, '') : 'game';
  const filename = `wordchain-${codeStr}-${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseGameFile(file: File): Promise<ExportedGameData> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.json')) {
      return reject(new Error('Please select a valid WordChain .json file.'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.burnedWords || typeof parsed.burnedWords !== 'object') {
          return reject(new Error('Invalid file: Missing burned words data.'));
        }

        if (!parsed.burnedVerbRoots || typeof parsed.burnedVerbRoots !== 'object') {
          return reject(new Error('Invalid file: Missing burned verbs data.'));
        }

        const data: ExportedGameData = {
          version: '1.0',
          exportedAt: parsed.exportedAt || Date.now(),
          roomCode: parsed.roomCode,
          gameMode: parsed.gameMode,
          totalWords: Object.keys(parsed.burnedWords).length,
          lastWord: parsed.lastWord,
          lastLetter: parsed.lastLetter,
          chain: Array.isArray(parsed.chain) ? parsed.chain : [],
          burnedWords: parsed.burnedWords,
          burnedVerbRoots: parsed.burnedVerbRoots
        };

        resolve(data);
      } catch {
        reject(new Error('Failed to parse JSON file. The file may be corrupt.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
