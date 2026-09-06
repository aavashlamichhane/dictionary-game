import React from 'react';
import { Violation } from '@dict-game/shared';
import { AlertTriangle, Flame, Clock, XCircle } from 'lucide-react';

interface ViolationBannerProps {
  violation: Violation | null;
  onDismiss?: () => void;
}

export const ViolationBanner: React.FC<ViolationBannerProps> = ({ violation, onDismiss }) => {
  if (!violation) return null;

  const getIcon = () => {
    switch (violation.type) {
      case 'VERB_FORM_BURNED':
        return <Flame className="w-6 h-6 text-rose-400 shrink-0 animate-bounce" />;
      case 'TIMEOUT':
        return <Clock className="w-6 h-6 text-amber-400 shrink-0" />;
      case 'DUPLICATE_WORD':
        return <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />;
      default:
        return <XCircle className="w-6 h-6 text-rose-400 shrink-0" />;
    }
  };

  const getBadgeTitle = () => {
    switch (violation.type) {
      case 'VERB_FORM_BURNED':
        return '🔥 VERB FORM BURNED';
      case 'DUPLICATE_WORD':
        return '⚠️ DUPLICATE WORD';
      case 'WRONG_START_LETTER':
        return '❌ WRONG START LETTER';
      case 'INVALID_DICTIONARY_WORD':
        return '📖 NOT IN DICTIONARY';
      case 'TIMEOUT':
        return '⏰ TIME EXPIRED';
      case 'TOO_SHORT':
        return '📏 TOO SHORT';
      default:
        return 'RULE VIOLATION';
    }
  };

  return (
    <div className="w-full bg-rose-950/60 border-2 border-rose-500/70 rounded-2xl p-4 shadow-lg shadow-rose-950/40 animate-shake mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3.5">
          {getIcon()}
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {getBadgeTitle()}
              </span>
              <span className="text-xs text-rose-300/70 font-mono">
                Turn #{violation.turnNumber}
              </span>
            </div>

            <p className="mt-1.5 text-sm font-medium text-rose-100 leading-snug">
              {violation.message}
            </p>

            {/* Accountability context */}
            {violation.originalWord && violation.originalPlayerName && (
              <div className="mt-2 text-xs text-rose-300/80 bg-rose-950/70 border border-rose-800/60 px-3 py-1.5 rounded-lg flex items-center space-x-2">
                <span>📍 Previously used:</span>
                <span className="font-bold text-white uppercase tracking-wide">
                  "{violation.originalWord}"
                </span>
                <span>by</span>
                <span className="font-bold text-amber-300">{violation.originalPlayerName}</span>
                <span>on Turn #{violation.originalTurn}</span>
              </div>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-rose-400 hover:text-rose-200 text-sm font-semibold p-1 hover:bg-rose-900/50 rounded-lg transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
