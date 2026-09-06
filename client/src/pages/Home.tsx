import React, { useState, useEffect } from 'react';
import { Users, Smartphone, HelpCircle, ArrowRight, Sparkles, Flame } from 'lucide-react';
import { sounds } from '../utils/audio.js';

interface HomeProps {
  onCreateRoom: (name: string, avatar: string, color: string) => void;
  onJoinRoom: (code: string, name: string, avatar: string, color: string) => void;
  onStartPassAndPlay: () => void;
  onOpenRules: () => void;
  initialRoomCode?: string;
}

const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🦉', '🐯', '🦄', '🐲', '🐙', '🚀', '⚡', '🔥'];
const COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16'  // lime
];

export const Home: React.FC<HomeProps> = ({
  onCreateRoom,
  onJoinRoom,
  onStartPassAndPlay,
  onOpenRules,
  initialRoomCode = ''
}) => {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('wordchain_player_name') || '');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [mode, setMode] = useState<'main' | 'create' | 'join'>('main');

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setMode('join');
    }
  }, [initialRoomCode]);

  const savePlayerProfile = () => {
    if (playerName.trim()) {
      localStorage.setItem('wordchain_player_name', playerName.trim());
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    savePlayerProfile();
    sounds.playChime();
    onCreateRoom(playerName.trim(), selectedAvatar, selectedColor);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    savePlayerProfile();
    sounds.playChime();
    onJoinRoom(roomCode.trim(), playerName.trim(), selectedAvatar, selectedColor);
  };

  return (
    <div className="w-full max-w-lg mx-auto py-6 sm:py-10 px-4 space-y-8 animate-fade-in">
      {/* Hero Branding */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Multiplayer Word Chain</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
          Word<span className="text-emerald-400">Chain</span>
        </h1>

        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          Chain words by their letters. <strong className="text-rose-400">Strict rule:</strong> if any verb form is played (e.g.{' '}
          <em>"took"</em>), its entire verb family is burned!
        </p>
      </div>

      {/* Profile Setup: Avatar, Name, Color */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Your Player Profile
        </span>

        {/* Avatar Picker */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {AVATARS.map((av) => (
            <button
              key={av}
              type="button"
              onClick={() => setSelectedAvatar(av)}
              className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center shrink-0 border transition-all ${
                selectedAvatar === av
                  ? 'bg-slate-800 border-emerald-500 scale-110 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {av}
            </button>
          ))}
        </div>

        {/* Player Name Input */}
        <div>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your nickname..."
            maxLength={18}
            className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-slate-100 font-bold placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Color Palette */}
        <div className="flex items-center space-x-2.5 pt-1">
          <span className="text-xs text-slate-400 mr-1">Color:</span>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${
                selectedColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Game Mode Selector */}
      {mode === 'main' && (
        <div className="space-y-3.5">
          {/* Create Room Button */}
          <button
            onClick={() => setMode('create')}
            disabled={!playerName.trim()}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 font-black text-slate-950 text-base shadow-xl shadow-emerald-950/40 transition-all transform active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-slate-950/10 rounded-xl">
                <Users className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <span className="block leading-tight">Create Online Room</span>
                <span className="text-xs font-medium text-emerald-950">Host a multiplayer game across devices</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-950" />
          </button>

          {/* Join Room Button */}
          <button
            onClick={() => setMode('join')}
            disabled={!playerName.trim()}
            className="w-full p-4 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 font-bold text-white text-base shadow-lg transition-all transform active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-slate-700/40 rounded-xl">
                <Users className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <span className="block leading-tight">Join With Room Code</span>
                <span className="text-xs font-medium text-slate-400">Enter a code from a friend</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </button>

          {/* Pass and Play Button */}
          <button
            onClick={onStartPassAndPlay}
            className="w-full p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 font-bold text-slate-200 text-base shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-slate-800 rounded-xl">
                <Smartphone className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="block leading-tight">Pass & Play (1 Device)</span>
                <span className="text-xs font-medium text-slate-400">Pass this device between players</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </button>

          {/* How to Play Rules */}
          <button
            onClick={onOpenRules}
            className="w-full py-3 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center space-x-2"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>How to Play & Verb-Burn Rules</span>
          </button>
        </div>
      )}

      {/* Create Room Form Mode */}
      {mode === 'create' && (
        <form onSubmit={handleCreateSubmit} className="space-y-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Create Multiplayer Room</span>
          </h3>
          <p className="text-xs text-slate-400">
            You'll get a room code to invite your friends. You can set timers and game modes in the lobby.
          </p>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setMode('main')}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!playerName.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-950 text-sm transition-colors shadow-lg shadow-emerald-950/40"
            >
              Create Lobby
            </button>
          </div>
        </form>
      )}

      {/* Join Room Form Mode */}
      {mode === 'join' && (
        <form onSubmit={handleJoinSubmit} className="space-y-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-teal-400" />
            <span>Join Multiplayer Room</span>
          </h3>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. WORD-8K"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-slate-100 font-mono font-bold placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors uppercase tracking-wider text-lg"
              autoFocus
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setMode('main')}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!playerName.trim() || !roomCode.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 font-bold text-slate-950 text-sm transition-colors shadow-lg shadow-teal-950/40 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Join Game
            </button>
          </div>
        </form>
      )}

      {/* Verb Burn Quick Hint */}
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start space-x-2.5">
        <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <p>
          <strong>Remember the verb rule:</strong> Saying <em>"ran"</em> burns <em>"run"</em> and <em>"running"</em> for all players!
        </p>
      </div>
    </div>
  );
};
