import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, ArrowLeft, Wifi, WifiOff, Feather } from 'lucide-react';
import { sounds } from '../utils/audio.js';

interface HeaderProps {
  roomCode?: string;
  isConnected?: boolean;
  onLeave?: () => void;
  onOpenRules: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  isConnected,
  onLeave,
  onOpenRules,
  title
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());

  const handleToggleSound = () => {
    const next = sounds.toggle();
    setSoundEnabled(next);
  };

  return (
    <header className="w-full bg-beige-card/95 backdrop-blur-md border-b border-darkgreen/15 sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-warm-xs transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Left: Leave / Brand Monogram */}
        <div className="flex items-center space-x-3">
          {onLeave && (
            <button
              onClick={onLeave}
              className="p-2 rounded-xl bg-beige hover:bg-beige-dark border border-darkgreen/15 text-darkgreen transition-all shadow-warm-xs hover:shadow-warm active:scale-95 flex items-center justify-center"
              title="Return to Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-darkgreen text-beige flex items-center justify-center shadow-warm-sm border border-darkgreen/20">
              <Feather className="w-4 h-4 text-moss-light" />
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <h1 className="text-xl font-serif font-black tracking-tight text-darkgreen leading-none">
                  WordChain
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest text-moss-muted bg-moss-tint px-1.5 py-0.5 rounded border border-moss/20">
                  Verb-Burn
                </span>
              </div>
              <p className="text-[11px] text-darkgreen/70 font-medium tracking-wide">
                {title || 'The Lexical Strategy Battle'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Vintage Stamped Room Code */}
        {roomCode && (
          <div className="hidden sm:flex items-center space-x-2 bg-beige-dark/50 border border-darkgreen/20 px-3.5 py-1 rounded-lg shadow-inner-warm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-darkgreen/60">
              ROOM
            </span>
            <span className="font-mono text-sm font-bold text-midnight tracking-wider">
              {roomCode}
            </span>
          </div>
        )}

        {/* Right: Status & Tactile Actions */}
        <div className="flex items-center space-x-2">
          {isConnected !== undefined && (
            <div
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                isConnected
                  ? 'bg-moss-tint text-darkgreen border-moss/40'
                  : 'bg-rosy-tint text-rosy-dark border-rosy/40'
              }`}
              title={isConnected ? 'Connected to live room' : 'Offline / Reconnecting'}
            >
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-moss animate-pulse" />
                  <span className="text-[11px] font-bold tracking-wider hidden md:inline uppercase">
                    Live
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rosy-dark" />
                  <span className="text-[11px] font-bold tracking-wider hidden md:inline uppercase">
                    Offline
                  </span>
                </>
              )}
            </div>
          )}

          {/* Rules Modal Button */}
          <button
            onClick={onOpenRules}
            className="p-2 rounded-xl bg-beige hover:bg-beige-dark border border-darkgreen/15 text-darkgreen/80 hover:text-darkgreen transition-all shadow-warm-xs hover:shadow-warm active:scale-95"
            title="Rules & Verb-Burn Codex"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Audio Synthesizer Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border transition-all shadow-warm-xs hover:shadow-warm active:scale-95 ${
              soundEnabled
                ? 'bg-midnight text-beige border-midnight'
                : 'bg-beige hover:bg-beige-dark text-darkgreen/50 border-darkgreen/15'
            }`}
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
