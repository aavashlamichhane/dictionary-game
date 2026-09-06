import React, { useState } from 'react';
import { WordEntry } from '@dict-game/shared';
import { Book, Flame, ChevronDown, ChevronUp, Link as ChainIcon } from 'lucide-react';

interface WordChainProps {
  chain: WordEntry[];
}

export const WordChain: React.FC<WordChainProps> = ({ chain }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (chain.length === 0) {
    return (
      <div className="w-full bg-beige/60 border border-dashed border-darkgreen/20 rounded-2xl p-8 text-center text-darkgreen/60 space-y-1.5 shadow-inner-warm">
        <ChainIcon className="w-6 h-6 mx-auto text-darkgreen/30" />
        <p className="text-sm font-serif italic">The lexicon ledger is blank.</p>
        <p className="text-xs text-darkgreen/50">The opening contender will inscribe the first link in the chain.</p>
      </div>
    );
  }

  // Reverse so newest words appear on top
  const reversed = [...chain].reverse();

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-moss" />
          <span className="text-[11px] font-black uppercase tracking-widest text-darkgreen/70">
            Lexicon Ledger
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-midnight bg-midnight-tint px-2 py-0.5 rounded-full border border-midnight/20">
          {chain.length} {chain.length === 1 ? 'Word' : 'Words'} Inscribed
        </span>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {reversed.map((entry, idx) => {
          const isLatest = idx === 0;
          const isExpanded = expandedIndex === idx || isLatest;
          const firstLetter = entry.word.charAt(0).toUpperCase();
          const middle = entry.word.slice(1, -1);
          const lastLetter = entry.word.charAt(entry.word.length - 1).toUpperCase();

          return (
            <div
              key={`${entry.turnNumber}-${entry.word}`}
              className={`w-full rounded-2xl border transition-all duration-200 ${
                isLatest
                  ? 'bg-beige-light border-midnight/40 shadow-warm ring-1 ring-midnight/20'
                  : 'bg-beige/70 border-darkgreen/15 hover:border-darkgreen/30 hover:bg-beige'
              }`}
            >
              {/* Card Summary Row */}
              <div
                onClick={() => setExpandedIndex(isExpanded && !isLatest ? null : idx)}
                className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  {/* Player avatar with player color */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-base border font-bold shrink-0 shadow-warm-xs"
                    style={{
                      backgroundColor: `${entry.playerColor}20`,
                      borderColor: `${entry.playerColor}60`
                    }}
                  >
                    {entry.playerName.charAt(0).toUpperCase()}
                  </div>

                  {/* Word with letter highlights */}
                  <div className="min-w-0">
                    <div className="flex items-baseline space-x-2 flex-wrap gap-y-1">
                      <span className="text-lg sm:text-xl font-mono font-black tracking-wide text-darkgreen">
                        <span className="text-midnight font-bold underline decoration-2 underline-offset-2">
                          {firstLetter}
                        </span>
                        <span>{middle}</span>
                        <span className="text-moss-dark font-bold underline decoration-2 underline-offset-2">
                          {lastLetter}
                        </span>
                      </span>

                      {/* Verb-Burn Badge in Rosy Brown */}
                      {entry.isVerb && (
                        <span
                          className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rosy-tint text-rosy-burn border border-rosy/40 shadow-warm-xs"
                          title={`Root verb '${entry.verbRoot}' and conjugations burned`}
                        >
                          <Flame className="w-3 h-3 text-rosy-burn" />
                          <span>Verb Burned</span>
                        </span>
                      )}

                      {entry.isImported && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-beige-dark text-darkgreen/70 border border-darkgreen/20 font-mono">
                          Dossier
                        </span>
                      )}

                      {entry.partOfSpeech && !entry.isVerb && (
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-beige border border-darkgreen/15 text-darkgreen/65 font-mono">
                          {entry.partOfSpeech}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-darkgreen/65 flex items-center space-x-1.5 mt-0.5">
                      <span className="font-semibold text-darkgreen">{entry.playerName}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">Turn #{entry.turnNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Toggle expand */}
                <div className="flex items-center space-x-2 shrink-0">
                  {isLatest && (
                    <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-moss-tint text-moss-dark border border-moss/30 uppercase">
                      Latest
                    </span>
                  )}
                  <button className="text-darkgreen/50 hover:text-darkgreen p-1 transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Definition details */}
              {isExpanded && (
                <div className="px-4 pb-3.5 pt-2 text-xs text-darkgreen/85 border-t border-darkgreen/10 bg-beige/40 rounded-b-2xl space-y-2">
                  {entry.definition ? (
                    <div className="flex items-start space-x-2 pt-1">
                      <Book className="w-3.5 h-3.5 text-moss-dark shrink-0 mt-0.5" />
                      <p className="font-serif italic text-darkgreen leading-relaxed text-xs sm:text-sm">
                        "{entry.definition}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-darkgreen/50 font-serif italic pt-1">Definition verified in English lexicon.</p>
                  )}

                  {entry.isVerb && entry.verbRoot && (
                    <div className="text-rosy-burn text-[11px] font-medium flex items-center space-x-1.5 bg-rosy-tint px-3 py-1.5 rounded-xl border border-rosy/30">
                      <Flame className="w-3.5 h-3.5 text-rosy-burn shrink-0" />
                      <span>
                        Root verb burned: <strong className="font-black underline">{entry.verbRoot}</strong> (past tense, gerunds, and participles barred for all)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
