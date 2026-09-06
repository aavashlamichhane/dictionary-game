import React, { useState } from 'react';
import { WordEntry } from '@dict-game/shared';
import { Book, Flame, ChevronDown, ChevronUp } from 'lucide-react';

interface WordChainProps {
  chain: WordEntry[];
}

export const WordChain: React.FC<WordChainProps> = ({ chain }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (chain.length === 0) {
    return (
      <div className="w-full bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-500">
        <p className="text-sm">No words in the chain yet. The first player sets the chain in motion!</p>
      </div>
    );
  }

  // Reverse so newest words appear on top
  const reversed = [...chain].reverse();

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Word Chain History ({chain.length} words)
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
              className={`w-full rounded-xl border transition-all duration-200 ${
                isLatest
                  ? 'bg-slate-800/90 border-emerald-500/50 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Card Summary Row */}
              <div
                onClick={() => setExpandedIndex(isExpanded && !isLatest ? null : idx)}
                className="p-3.5 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Player avatar with player color */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg border font-bold shrink-0"
                    style={{
                      backgroundColor: `${entry.playerColor}22`,
                      borderColor: entry.playerColor
                    }}
                  >
                    {entry.playerName.charAt(0).toUpperCase()}
                  </div>

                  {/* Word with letter highlights */}
                  <div className="min-w-0">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-lg font-black tracking-wide font-mono text-white">
                        <span className="text-teal-400">{firstLetter}</span>
                        <span>{middle}</span>
                        <span className="text-emerald-400 underline decoration-2 underline-offset-4">
                          {lastLetter}
                        </span>
                      </span>

                      {entry.isVerb && (
                        <span
                          className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          title={`Root verb '${entry.verbRoot}' burned`}
                        >
                          <Flame className="w-3 h-3" />
                          <span>Verb</span>
                        </span>
                      )}

                      {entry.partOfSpeech && !entry.isVerb && (
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {entry.partOfSpeech}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <span className="font-semibold text-slate-300">{entry.playerName}</span>
                      <span>•</span>
                      <span>Turn #{entry.turnNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Toggle expand */}
                <div className="flex items-center space-x-2 shrink-0">
                  {isLatest && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      LATEST
                    </span>
                  )}
                  <button className="text-slate-500 hover:text-slate-300 p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Definition details */}
              {isExpanded && (
                <div className="px-4 pb-3.5 pt-1 text-xs text-slate-300 border-t border-slate-800/80 bg-slate-950/40 rounded-b-xl">
                  {entry.definition ? (
                    <div className="flex items-start space-x-2 pt-2">
                      <Book className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <p className="italic text-slate-300">"{entry.definition}"</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic pt-1">Definition verified in English dictionary.</p>
                  )}

                  {entry.isVerb && entry.verbRoot && (
                    <div className="mt-2 text-rose-300 text-[11px] font-medium flex items-center space-x-1.5 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-900/60">
                      <Flame className="w-3 h-3 text-rose-400" />
                      <span>
                        Root verb burned: <strong>{entry.verbRoot}</strong> (all past/participle/gerund forms blocked)
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
