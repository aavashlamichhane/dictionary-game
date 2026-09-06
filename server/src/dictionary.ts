import { createRequire } from 'module';
import wordnet from 'wordnet';
import { analyzeVerb } from './lemmatizer.js';

const require = createRequire(import.meta.url);
const wordsArray: string[] = require('an-array-of-english-words');

const wordSet = new Set<string>();
for (const w of wordsArray) {
  wordSet.add(w.toLowerCase().trim());
}

let wordnetReady = false;
wordnet.init()
  .then(() => {
    wordnetReady = true;
    console.log('✅ WordNet initialized successfully.');
  })
  .catch((err: any) => {
    console.error('⚠️ WordNet init failed, running with wordlist fallback:', err);
  });

const definitionCache = new Map<string, { definition: string; partOfSpeech?: string }>();

export function isValidWord(word: string, minLength: number = 3): boolean {
  if (!word) return false;
  const clean = word.toLowerCase().trim();
  if (clean.length < minLength) return false;
  if (!/^[a-z]+$/.test(clean)) return false;
  return wordSet.has(clean);
}

export async function lookupDefinition(word: string, verbRoot?: string): Promise<{ definition?: string; partOfSpeech?: string }> {
  const clean = word.toLowerCase().trim();
  if (definitionCache.has(clean)) {
    return definitionCache.get(clean)!;
  }

  if (!wordnetReady) {
    return {};
  }

  let results: any[] | null = null;
  // Try original word first
  try {
    results = await wordnet.lookup(clean);
  } catch {
    results = null;
  }

  // If no result and there is a verb root (e.g. "took" -> "take"), try root
  if ((!results || results.length === 0) && verbRoot && verbRoot !== clean) {
    try {
      results = await wordnet.lookup(verbRoot);
    } catch {
      results = null;
    }
  }

  if (results && results.length > 0) {
    const first = results[0];
    const entry = {
      definition: first.glossary,
      partOfSpeech: first.meta?.synsetType
    };
    definitionCache.set(clean, entry);
    return entry;
  }

  return {};
}

export interface WordVerificationResult {
  isValid: boolean;
  word: string;
  definition?: string;
  partOfSpeech?: string;
  isVerb: boolean;
  verbRoot?: string;
  allVerbForms: string[];
}

export async function verifyWord(rawWord: string, minLength: number = 3): Promise<WordVerificationResult> {
  const word = rawWord.toLowerCase().trim();
  const valid = isValidWord(word, minLength);

  if (!valid) {
    return {
      isValid: false,
      word,
      isVerb: false,
      allVerbForms: []
    };
  }

  const verbInfo = analyzeVerb(word);
  const defInfo = await lookupDefinition(word, verbInfo.verbRoot);

  return {
    isValid: true,
    word,
    definition: defInfo.definition,
    partOfSpeech: defInfo.partOfSpeech || (verbInfo.isVerb ? 'verb' : undefined),
    isVerb: verbInfo.isVerb,
    verbRoot: verbInfo.verbRoot,
    allVerbForms: verbInfo.allForms
  };
}
