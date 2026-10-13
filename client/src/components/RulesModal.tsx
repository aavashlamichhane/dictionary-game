import React from 'react';
import { X, CheckCircle, AlertTriangle, Flame, BookOpen, Clock, ShieldCheck } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-darkgreen/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[88vh] flex flex-col bg-beige-card border border-darkgreen/20 rounded-3xl shadow-warm-xl overflow-hidden">
        {/* Modal Editorial Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-darkgreen/15 bg-beige/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-midnight text-beige flex items-center justify-center shadow-warm-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-moss-muted block">
                Official Tournament Rules
              </span>
              <h2 className="text-xl font-serif font-black text-darkgreen leading-tight">
                The Codex of WordChain
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-darkgreen/60 hover:text-darkgreen hover:bg-beige-dark transition-all"
            title="Close Codex"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-darkgreen/85 leading-relaxed">
          {/* Rule 1: Chain Sequence */}
          <div className="bg-beige/70 border border-darkgreen/10 p-4 rounded-2xl space-y-2 shadow-warm-xs">
            <div className="flex items-center space-x-2.5 text-midnight font-bold">
              <span className="w-6 h-6 rounded-full bg-midnight/10 flex items-center justify-center text-xs font-mono">
                1
              </span>
              <h3 className="font-serif text-base font-bold text-darkgreen">
                The Continuous Letter Chain
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-darkgreen/80">
              Each submission must strictly begin with the <strong>final letter</strong> of the preceding word.
            </p>
            <div className="font-mono text-xs bg-beige-dark/60 p-2.5 rounded-xl border border-darkgreen/15 flex items-center justify-between text-darkgreen font-semibold">
              <span>
                appl<span className="text-midnight font-bold underline decoration-2">e</span>
              </span>
              <span className="text-darkgreen/40">→</span>
              <span>
                <span className="text-midnight font-bold underline decoration-2">e</span>lephan<span className="text-moss-dark font-bold underline decoration-2">t</span>
              </span>
              <span className="text-darkgreen/40">→</span>
              <span>
                <span className="text-moss-dark font-bold underline decoration-2">t</span>ree
              </span>
            </div>
          </div>

          {/* Rule 2: Absolute No Duplicates */}
          <div className="bg-beige/70 border border-darkgreen/10 p-4 rounded-2xl space-y-1.5 shadow-warm-xs">
            <div className="flex items-center space-x-2.5 text-moss-muted font-bold">
              <span className="w-6 h-6 rounded-full bg-moss/15 flex items-center justify-center text-xs font-mono text-moss-dark">
                2
              </span>
              <h3 className="font-serif text-base font-bold text-darkgreen">
                Absolute Non-Duplication
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-darkgreen/80">
              A word may only be inscribed once in a game. If <em>"falcon"</em> is played on Turn 1, it remains permanently retired from contention.
            </p>
          </div>

          {/* Rule 3: The Verb-Burn Rule (Featured Rule) */}
          <div className="bg-rosy-tint border-2 border-rosy/40 p-4 rounded-2xl space-y-2.5 shadow-warm-sm">
            <div className="flex items-center space-x-2.5">
              <div className="p-1 rounded-lg bg-rosy/20 text-rosy-dark">
                <Flame className="w-4 h-4 text-rosy-burn" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rosy-burn block">
                  Signature Tactical Rule
                </span>
                <h3 className="font-serif text-base font-black text-darkgreen">
                  The Verb-Burn Poison Rule
                </h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-darkgreen/90 font-medium">
              Submitting any verb form immediately burns the <strong>entire grammatical verb family</strong> for all players.
            </p>
            <div className="bg-beige-card border border-rosy/30 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-darkgreen">
                <span className="text-rosy-burn">⚡ Case in point:</span>
                <span>Playing <em>"took"</em> burns the root <em>take</em>:</span>
              </div>
              <p className="text-[11px] text-darkgreen/75 italic">
                Subsequent attempts to play <strong>takes</strong>, <strong>taking</strong>, <strong>taken</strong>, or <strong>take</strong> are rejected with strike penalties!
              </p>
            </div>
          </div>

          {/* Rule 4: Dictionary & WordNet Validation */}
          <div className="bg-beige/70 border border-darkgreen/10 p-4 rounded-2xl space-y-1.5 shadow-warm-xs">
            <div className="flex items-center space-x-2.5 text-midnight font-bold">
              <span className="w-6 h-6 rounded-full bg-midnight/10 flex items-center justify-center text-xs font-mono">
                4
              </span>
              <h3 className="font-serif text-base font-bold text-darkgreen">
                Server-side Lexicon Verification
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-darkgreen/80">
              Submissions are checked in real-time against a 275,000+ word dictionary and WordNet ontology. Pure slang, typos, and made-up words are immediately barred.
            </p>
          </div>

          {/* Rule 5: Turn Timers & Elimination */}
          <div className="bg-beige/70 border border-darkgreen/10 p-4 rounded-2xl space-y-1.5 shadow-warm-xs">
            <div className="flex items-center space-x-2.5 text-moss-muted font-bold">
              <span className="w-6 h-6 rounded-full bg-moss/15 flex items-center justify-center text-xs font-mono text-moss-dark">
                5
              </span>
              <h3 className="font-serif text-base font-bold text-darkgreen">
                Pacing, Strikes & Sudden Death
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-darkgreen/80">
              Each contender has a timed window (e.g. 15s). A timeout or illegal submission awards a strike (3 strikes = elimination) or causes sudden death defeat.
            </p>
          </div>
        </div>

        {/* Modal Editorial Footer */}
        <div className="px-6 py-4 border-t border-darkgreen/15 bg-beige/60 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-darkgreen/70 font-medium">
            <ShieldCheck className="w-4 h-4 text-moss-dark" />
            <span>Fair play verified by linguistic engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-midnight hover:bg-midnight-hover text-beige font-bold text-xs uppercase tracking-wider transition-all shadow-warm hover:shadow-warm-md active:scale-95"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
