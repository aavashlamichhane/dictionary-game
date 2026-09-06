import React from 'react';
import { Violation } from '@dict-game/shared';
import { AlertTriangle, Flame, Clock, XCircle, X } from 'lucide-react';

interface ViolationBannerProps {
  violation: Violation | null;
  onDismiss?: () => void;
}

export const ViolationBanner: React.FC<ViolationBannerProps> = ({ violation, onDismiss }) => {
  if (!violation) return null;

  const getIcon = () => {
    switch (violation.type) {
      case 'VERB_FORM_BURNED':
        return <Flame className="w-5 h-5 text-rosy-burn shrink-0 animate-bounce" />;
      case 'TIMEOUT':
        return <Clock className="w-5 h-5 text-rosy-burn shrink-0" />;
      case 'DUPLICATE_WORD':
        return <AlertTriangle className="w-5 h-5 text-rosy-dark shrink-0" />;
      default:
        return <XCircle className="w-5 h-5 text-rosy-burn shrink-0" />;
    }
  };

  const getBadgeTitle = () => {
    switch (violation.type) {
      case 'VERB_FORM_BURNED':
        return 'Verb Form Burned';
      case 'DUPLICATE_WORD':
        return 'Duplicate Inscription';
      case 'WRONG_START_LETTER':
        return 'Initial Letter Mismatch';
      case 'INVALID_DICTIONARY_WORD':
        return 'Unrecognized Lexicon Entry';
      case 'TIMEOUT':
        return 'Inscription Window Expired';
      case 'TOO_SHORT':
        return 'Insufficient Letter Count';
      default:
        return 'Rule Infringement';
    }
  };

  return (
    <div className="w-full bg-rosy-tint border-2 border-rosy/50 rounded-2xl p-4 shadow-warm-sm animate-shake mb-4 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3.5">
          <div className="p-2 rounded-xl bg-rosy/20 mt-0.5">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rosy/25 text-rosy-burn border border-rosy/40">
                {getBadgeTitle()}
              </span>
              <span className="text-xs text-darkgreen/60 font-mono font-semibold">
                Turn #{violation.turnNumber}
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-darkgreen leading-snug">
              {violation.message}
            </p>

            {/* Inscription Accountability Context */}
            {violation.originalWord && violation.originalPlayerName && (
              <div className="mt-2 text-xs text-darkgreen/80 bg-beige-card border border-rosy/35 px-3 py-1.5 rounded-xl flex items-center space-x-2 shadow-warm-xs">
                <span>📍 Inscribed previously:</span>
                <span className="font-bold text-darkgreen font-mono uppercase tracking-wide">
                  "{violation.originalWord}"
                </span>
                <span>by</span>
                <span className="font-bold text-midnight">{violation.originalPlayerName}</span>
                <span>on Turn #{violation.originalTurn}</span>
              </div>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-darkgreen/50 hover:text-darkgreen p-1 hover:bg-beige rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
