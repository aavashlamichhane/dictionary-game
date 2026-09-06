import nlp from 'compromise';

// Common English irregular verbs and their forms mapped to their base root
// [base, past, participle, 3rd-person, gerund]
const IRREGULAR_FAMILIES: [string, string, string, string, string][] = [
  ['take', 'took', 'taken', 'takes', 'taking'],
  ['go', 'went', 'gone', 'goes', 'going'],
  ['come', 'came', 'come', 'comes', 'coming'],
  ['see', 'saw', 'seen', 'sees', 'seeing'],
  ['run', 'ran', 'run', 'runs', 'running'],
  ['give', 'gave', 'given', 'gives', 'giving'],
  ['get', 'got', 'gotten', 'gets', 'getting'],
  ['make', 'made', 'made', 'makes', 'making'],
  ['know', 'knew', 'known', 'knows', 'knowing'],
  ['think', 'thought', 'thought', 'thinks', 'thinking'],
  ['say', 'said', 'said', 'says', 'saying'],
  ['tell', 'told', 'told', 'tells', 'telling'],
  ['find', 'found', 'found', 'finds', 'finding'],
  ['leave', 'left', 'left', 'leaves', 'leaving'],
  ['feel', 'felt', 'felt', 'feels', 'feeling'],
  ['bring', 'brought', 'brought', 'brings', 'bringing'],
  ['begin', 'began', 'begun', 'begins', 'beginning'],
  ['keep', 'kept', 'kept', 'keeps', 'keeping'],
  ['hold', 'held', 'held', 'holds', 'holding'],
  ['write', 'wrote', 'written', 'writes', 'writing'],
  ['stand', 'stood', 'stood', 'stands', 'standing'],
  ['hear', 'heard', 'heard', 'hears', 'hearing'],
  ['let', 'let', 'let', 'lets', 'letting'],
  ['mean', 'meant', 'meant', 'means', 'meaning'],
  ['set', 'set', 'set', 'sets', 'setting'],
  ['meet', 'met', 'met', 'meets', 'meeting'],
  ['pay', 'paid', 'paid', 'pays', 'paying'],
  ['sit', 'sat', 'sat', 'sits', 'sitting'],
  ['speak', 'spoke', 'spoken', 'speaks', 'speaking'],
  ['lie', 'lay', 'lain', 'lies', 'lying'],
  ['lead', 'led', 'led', 'leads', 'leading'],
  ['read', 'read', 'read', 'reads', 'reading'],
  ['grow', 'grew', 'grown', 'grows', 'growing'],
  ['lose', 'lost', 'lost', 'loses', 'losing'],
  ['fall', 'fell', 'fallen', 'falls', 'falling'],
  ['send', 'sent', 'sent', 'sends', 'sending'],
  ['build', 'built', 'built', 'builds', 'building'],
  ['understand', 'understood', 'understood', 'understands', 'understanding'],
  ['draw', 'drew', 'drawn', 'draws', 'drawing'],
  ['break', 'broke', 'broken', 'breaks', 'breaking'],
  ['spend', 'spent', 'spent', 'spends', 'spending'],
  ['cut', 'cut', 'cut', 'cuts', 'cutting'],
  ['rise', 'rose', 'risen', 'rises', 'rising'],
  ['drive', 'drove', 'driven', 'drives', 'driving'],
  ['buy', 'bought', 'bought', 'buys', 'buying'],
  ['wear', 'wore', 'worn', 'wears', 'wearing'],
  ['choose', 'chose', 'chosen', 'chooses', 'choosing'],
  ['seek', 'sought', 'sought', 'seeks', 'seeking'],
  ['throw', 'threw', 'thrown', 'throws', 'throwing'],
  ['catch', 'caught', 'caught', 'catches', 'catching'],
  ['deal', 'dealt', 'dealt', 'deals', 'dealing'],
  ['win', 'won', 'won', 'wins', 'winning'],
  ['forget', 'forgot', 'forgotten', 'forgets', 'forgetting'],
  ['sell', 'sold', 'sold', 'sells', 'selling'],
  ['fight', 'fought', 'fought', 'fights', 'fighting'],
  ['bear', 'bore', 'borne', 'bears', 'bearing'],
  ['teach', 'taught', 'taught', 'teaches', 'teaching'],
  ['eat', 'ate', 'eaten', 'eats', 'eating'],
  ['sing', 'sang', 'sung', 'sings', 'singing'],
  ['swim', 'swam', 'swum', 'swims', 'swimming'],
  ['sleep', 'slept', 'slept', 'sleeps', 'sleeping'],
  ['fly', 'flew', 'flown', 'flies', 'flying'],
  ['ride', 'rode', 'ridden', 'rides', 'riding'],
  ['strike', 'struck', 'struck', 'strikes', 'striking'],
  ['drink', 'drank', 'drunk', 'drinks', 'drinking'],
  ['hide', 'hid', 'hidden', 'hides', 'hiding'],
  ['shake', 'shook', 'shaken', 'shakes', 'shaking'],
  ['bite', 'bit', 'bitten', 'bites', 'biting'],
  ['blow', 'blew', 'blown', 'blows', 'blowing'],
  ['freeze', 'froze', 'frozen', 'freezes', 'freezing'],
  ['steal', 'stole', 'stolen', 'steals', 'stealing'],
  ['shine', 'shone', 'shone', 'shines', 'shining'],
  ['ring', 'rang', 'rung', 'rings', 'ringing'],
  ['wake', 'woke', 'woken', 'wakes', 'waking'],
  ['tear', 'tore', 'torn', 'tears', 'tearing'],
  ['swear', 'swore', 'sworn', 'swears', 'swearing'],
  ['shoot', 'shot', 'shot', 'shoots', 'shooting'],
  ['hang', 'hung', 'hung', 'hangs', 'hanging'],
  ['swing', 'swung', 'swung', 'swings', 'swinging'],
  ['dig', 'dug', 'dug', 'digs', 'digging'],
  ['spin', 'spun', 'spun', 'spins', 'spinning'],
  ['sink', 'sank', 'sunk', 'sinks', 'sinking'],
  ['spring', 'sprang', 'sprung', 'springs', 'springing'],
  ['shrink', 'shrank', 'shrunk', 'shrinks', 'shrinking'],
  ['stink', 'stank', 'stunk', 'stinks', 'stinking'],
  ['bleed', 'bled', 'bled', 'bleeds', 'bleeding'],
  ['feed', 'fed', 'fed', 'feeds', 'feeding'],
  ['sweep', 'swept', 'swept', 'sweeps', 'sweeping'],
  ['weep', 'wept', 'wept', 'weeps', 'weeping'],
  ['creep', 'crept', 'crept', 'creeps', 'creeping'],
  ['bend', 'bent', 'bent', 'bends', 'bending'],
  ['lend', 'lent', 'lent', 'lends', 'lending'],
  ['bind', 'bound', 'bound', 'binds', 'binding'],
  ['wind', 'wound', 'wound', 'winds', 'winding'],
  ['grind', 'ground', 'ground', 'grinds', 'grinding'],
  ['stick', 'stuck', 'stuck', 'sticks', 'sticking'],
  ['sting', 'stung', 'stung', 'stings', 'stinging'],
  ['cling', 'clung', 'clung', 'clings', 'clinging'],
  ['fling', 'flung', 'flung', 'flings', 'flinging'],
  ['wring', 'wrung', 'wrung', 'wrings', 'wringing'],
  ['split', 'split', 'split', 'splits', 'splitting'],
  ['spread', 'spread', 'spread', 'spreads', 'spreading'],
  ['burst', 'burst', 'burst', 'bursts', 'bursting'],
  ['hurt', 'hurt', 'hurt', 'hurts', 'hurting'],
  ['cost', 'cost', 'cost', 'costs', 'costing'],
  ['hit', 'hit', 'hit', 'hits', 'hitting'],
  ['fit', 'fit', 'fit', 'fits', 'fitting'],
  ['shut', 'shut', 'shut', 'shuts', 'shutting'],
  ['put', 'put', 'put', 'puts', 'putting'],
  ['beat', 'beat', 'beaten', 'beats', 'beating'],
  ['burn', 'burnt', 'burnt', 'burns', 'burning'],
  ['dream', 'dreamt', 'dreamt', 'dreams', 'dreaming'],
  ['learn', 'learnt', 'learnt', 'learns', 'learning'],
  ['smell', 'smelt', 'smelt', 'smells', 'smelling'],
  ['spell', 'spelt', 'spelt', 'spells', 'spelling'],
  ['spill', 'spilt', 'spilt', 'spills', 'spilling'],
  ['spoil', 'spoilt', 'spoilt', 'spoils', 'spoiling'],
  ['broadcast', 'broadcast', 'broadcast', 'broadcasts', 'broadcasting']
];

// Lookup map from any form to its base root and all its forms
const IRREGULAR_MAP = new Map<string, { root: string; allForms: Set<string> }>();

for (const family of IRREGULAR_FAMILIES) {
  const root = family[0];
  const allForms = new Set<string>(family);
  for (const form of family) {
    IRREGULAR_MAP.set(form.toLowerCase(), { root, allForms });
  }
}

export interface VerbAnalysis {
  isVerb: boolean;
  verbRoot?: string;
  allForms: string[];
}

export function analyzeVerb(rawWord: string): VerbAnalysis {
  const word = rawWord.trim().toLowerCase();

  // 1. Check irregular lookup table first for deterministic mapping
  if (IRREGULAR_MAP.has(word)) {
    const entry = IRREGULAR_MAP.get(word)!;
    return {
      isVerb: true,
      verbRoot: entry.root,
      allForms: Array.from(entry.allForms)
    };
  }

  // 2. Use compromise NLP for regular verbs & inflections
  const doc = nlp(word);
  const isTaggedVerb = doc.has('#Verb');
  const infinitive = doc.verbs().toInfinitive().text().trim().toLowerCase();

  if (isTaggedVerb && infinitive) {
    // If infinitive is in irregular map, map back
    if (IRREGULAR_MAP.has(infinitive)) {
      const entry = IRREGULAR_MAP.get(infinitive)!;
      return {
        isVerb: true,
        verbRoot: entry.root,
        allForms: Array.from(entry.allForms)
      };
    }

    // Regular verb conjugation
    const conjugated = doc.verbs().conjugate()[0] as Record<string, string> | undefined;
    const forms = new Set<string>([infinitive, word]);
    if (conjugated) {
      if (conjugated.Infinitive) forms.add(conjugated.Infinitive.toLowerCase());
      if (conjugated.PastTense) forms.add(conjugated.PastTense.toLowerCase());
      if (conjugated.PresentTense) forms.add(conjugated.PresentTense.toLowerCase());
      if (conjugated.Gerund) forms.add(conjugated.Gerund.toLowerCase());
      if (conjugated.Participle) forms.add(conjugated.Participle.toLowerCase());
    }

    return {
      isVerb: true,
      verbRoot: infinitive,
      allForms: Array.from(forms)
    };
  }

  // 3. Fallback check for common regular suffixes (-ed, -ing, -s, -es)
  if (word.endsWith('ed') && word.length > 4) {
    const candidateBase = word.endsWith('ied')
      ? word.slice(0, -3) + 'y'
      : word.endsWith('eed')
      ? word.slice(0, -1)
      : word.slice(0, -2);
    
    const candidateDoc = nlp(candidateBase);
    if (candidateDoc.has('#Verb')) {
      return {
        isVerb: true,
        verbRoot: candidateBase,
        allForms: [candidateBase, word]
      };
    }
  }

  if (word.endsWith('ing') && word.length > 5) {
    const candidateBase = word.slice(0, -3);
    const candidateDoc = nlp(candidateBase);
    if (candidateDoc.has('#Verb')) {
      return {
        isVerb: true,
        verbRoot: candidateBase,
        allForms: [candidateBase, word]
      };
    }
  }

  return {
    isVerb: false,
    allForms: [word]
  };
}
