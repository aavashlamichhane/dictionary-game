import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
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
    <header className="w-full bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Left: Back / Title */}
        <div className="flex items-center space-x-3">
          {onLeave && (
            <button
              onClick={onLeave}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Leave Room"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔤</span>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent leading-none">
                WordChain
              </h1>
              {title && <span className="text-xs text-slate-400 font-medium">{title}</span>}
            </div>
          </div>
        </div>

        {/* Center: Room Code Badge */}
        {roomCode && (
          <div className="hidden sm:flex items-center space-x-2 bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-full text-xs font-mono font-semibold text-emerald-400">
            <span className="text-slate-400">ROOM:</span>
            <span>{roomCode}</span>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {isConnected !== undefined && (
            <div
              className="flex items-center space-x-1 text-xs px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/60"
              title={isConnected ? 'Connected to server' : 'Disconnected'}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 hidden md:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400 hidden md:inline">Offline</span>
                </>
              )}
            </div>
          )}

          <button
            onClick={onOpenRules}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="How to Play & Rules"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
