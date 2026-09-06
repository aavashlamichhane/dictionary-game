import React from 'react';
import { X, CheckCircle, AlertTriangle, Flame, BookOpen, Clock } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📜</span>
            <h2 className="text-xl font-bold text-slate-100">WordChain Rules</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-slate-300">
          {/* Rule 1 */}
          <div className="flex items-start space-x-3 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 mt-0.5">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 mb-1">1. The Word Chain</h3>
              <p>
                Each player must enter a word that starts with the <strong>exact last letter</strong> of the previous player's word.
              </p>
              <div className="mt-2 font-mono text-xs bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-2 text-slate-300">
                <span>appl<span className="text-emerald-400 font-bold">e</span></span>
                <span className="text-slate-500">→</span>
                <span><span className="text-emerald-400 font-bold">e</span>lephan<span className="text-teal-400 font-bold">t</span></span>
                <span className="text-slate-500">→</span>
                <span><span className="text-teal-400 font-bold">t</span>ree</span>
              </div>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex items-start space-x-3 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 mb-1">2. Absolute No-Repeat Rule</h3>
              <p>
                No word can be repeated twice in the entire game. If someone played <em>"tiger"</em> on Turn 2, nobody can ever say <em>"tiger"</em> again.
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="flex items-start space-x-3 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/30">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-rose-300 mb-1">3. The Verb-Burn Rule (Special Rule!)</h3>
              <p className="text-rose-200/90">
                If any form of a verb is played, <strong>all forms of that verb are burned forever</strong>.
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-rose-200/80">
                <li>If Alice plays <strong>"take"</strong>, no one can say <strong>took</strong>, <strong>taken</strong>, <strong>takes</strong>, or <strong>taking</strong>.</li>
                <li>If Bob plays <strong>"swam"</strong>, the root verb <strong>swim</strong> and all forms (<strong>swimming</strong>, <strong>swum</strong>, <strong>swims</strong>) are burned immediately!</li>
              </ul>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="flex items-start space-x-3 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 mb-1">4. Valid English Dictionary Words</h3>
              <p>
                Every word must exist in the standard English dictionary with an established meaning. Slang, random letter combos, or gibberish are instantly rejected.
              </p>
            </div>
          </div>

          {/* Rule 5 */}
          <div className="flex items-start space-x-3 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 mb-1">5. Turn Timers & Strikes</h3>
              <p>
                You have limited time (e.g. 15s) to submit your word. If the timer runs out or you commit a rule violation, you get a <strong>strike</strong> (or immediate elimination in Sudden Death mode)!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
