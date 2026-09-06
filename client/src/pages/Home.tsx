import React, { useState, useEffect } from 'react';
import { Users, Smartphone, HelpCircle, ArrowRight, Sparkles, Flame, Shield, Compass, KeyRound } from 'lucide-react';
import { sounds } from '../utils/audio.js';

interface HomeProps {
  onCreateRoom: (name: string, avatar: string, color: string) => void;
  onJoinRoom: (code: string, name: string, avatar: string, color: string) => void;
  onStartPassAndPlay: () => void;
  onOpenRules: () => void;
  initialRoomCode?: string;
}

const AVATARS = ['🦊', '🦉', '🦁', '🐸', '🐼', '🐯', '🐙', '🦄', '🦅', '🐺', '♟️', '⚡'];
const CURATED_PALETTE = [
  '#105666', // Midnight Green
  '#839958', // Moss Green
  '#D3968C', // Rosy Brown
  '#0A3323', // Dark Green
  '#B86B52', // Terracotta
  '#466365', // Slate Teal
  '#C29548', // Ochre
  '#6D597A'  // Antique Plum
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
  const [selectedColor, setSelectedColor] = useState(CURATED_PALETTE[0]);
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
    <div className="w-full max-w-xl mx-auto py-4 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Editorial Masthead & Brand Statement */}
      <div className="text-center space-y-2.5 sm:space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-moss-tint border border-moss/30 text-darkgreen text-[11px] font-bold tracking-widest uppercase shadow-warm-xs">
          <Sparkles className="w-3.5 h-3.5 text-moss-dark" />
          <span>The Real-Time Lexicon Duel</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tight text-darkgreen">
          Word<span className="italic text-midnight font-normal font-serif">Chain</span>
        </h1>

        <p className="text-xs sm:text-sm text-darkgreen/80 max-w-md mx-auto leading-relaxed">
          Inscribe words linked by terminal letters. <span className="font-semibold text-rosy-burn">Beware the Verb-Burn:</span> play any verb, and its entire grammatical family is permanently poisoned.
        </p>
      </div>

      {/* The Contender Passport / Profile Slate */}
      <div className="bg-beige-card border border-darkgreen/15 rounded-3xl p-5 sm:p-6 shadow-warm-md space-y-4 transition-all">
        <div className="flex items-center justify-between border-b border-darkgreen/10 pb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-midnight" />
            <span className="text-xs font-black uppercase tracking-widest text-darkgreen/70">
              Contender Passport
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-moss-dark">
            Profile Settings
          </span>
        </div>

        {/* Avatar Strip */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-darkgreen/60 block">
            Select Seal Avatar
          </span>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-none">
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setSelectedAvatar(av)}
                className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center shrink-0 border transition-all ${
                  selectedAvatar === av
                    ? 'bg-beige-dark border-midnight scale-110 shadow-warm ring-2 ring-midnight/30'
                    : 'bg-beige/60 border-darkgreen/10 hover:border-darkgreen/30 hover:bg-beige'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Player Name Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-darkgreen/60 block">
            Contender Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Inscribe your nickname..."
            maxLength={18}
            className="w-full px-4 py-3 bg-beige/80 border border-darkgreen/20 rounded-2xl text-darkgreen font-bold text-sm sm:text-base placeholder:text-darkgreen/40 focus:outline-none focus:border-midnight focus:ring-2 focus:ring-midnight/20 transition-all shadow-inner-warm"
          />
        </div>

        {/* Palette Swatch Picker */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-darkgreen/70">Insignia Hue:</span>
          <div className="flex items-center space-x-2">
            {CURATED_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`w-6 h-6 rounded-full transition-transform border border-darkgreen/20 ${
                  selectedColor === c
                    ? 'scale-125 ring-2 ring-darkgreen ring-offset-2 ring-offset-beige-card shadow-warm-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mode Selection Grid / Bespoke Cards */}
      {mode === 'main' && (
        <div className="space-y-3.5">
          {/* Primary Action: Host Duel */}
          <button
            onClick={() => setMode('create')}
            disabled={!playerName.trim()}
            className="w-full p-5 rounded-3xl bg-midnight hover:bg-midnight-hover border border-midnight-dark text-beige shadow-warm-lg hover:shadow-warm-xl transition-all transform active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between group text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-midnight-dark/60 border border-beige/20 flex items-center justify-center text-beige">
                <Users className="w-6 h-6 text-moss-light" />
              </div>
              <div>
                <span className="block font-serif text-lg font-bold tracking-tight text-beige">
                  Host an Online Match
                </span>
                <span className="text-xs text-beige/80 font-normal">
                  Create a parlor room & invite friends across devices
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-beige/15 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-beige" />
            </div>
          </button>

          {/* Secondary Actions: Two-Column Bespoke Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Join Match */}
            <button
              onClick={() => setMode('join')}
              disabled={!playerName.trim()}
              className="p-4 rounded-3xl bg-beige-card hover:bg-beige-light border border-darkgreen/15 text-darkgreen shadow-warm-sm hover:shadow-warm transition-all transform active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex flex-col justify-between text-left space-y-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2.5 rounded-xl bg-midnight-tint border border-midnight/20 text-midnight">
                  <KeyRound className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-darkgreen/40" />
              </div>
              <div>
                <span className="block font-bold text-sm text-darkgreen">
                  Enter Room Code
                </span>
                <span className="text-[11px] text-darkgreen/65 font-medium">
                  Join a friend's established match
                </span>
              </div>
            </button>

            {/* Pass and Play */}
            <button
              onClick={onStartPassAndPlay}
              className="p-4 rounded-3xl bg-beige-card hover:bg-beige-light border border-darkgreen/15 text-darkgreen shadow-warm-sm hover:shadow-warm transition-all transform active:scale-[0.99] flex flex-col justify-between text-left space-y-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2.5 rounded-xl bg-moss-tint border border-moss/20 text-moss-dark">
                  <Smartphone className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-darkgreen/40" />
              </div>
              <div>
                <span className="block font-bold text-sm text-darkgreen">
                  Pass & Play (1 Device)
                </span>
                <span className="text-[11px] text-darkgreen/65 font-medium">
                  Pass this phone or laptop around
                </span>
              </div>
            </button>
          </div>

          {/* Codex of Rules CTA Banner */}
          <button
            onClick={onOpenRules}
            className="w-full py-3.5 px-4 rounded-2xl bg-beige/60 hover:bg-beige-dark/70 border border-darkgreen/15 text-xs font-bold text-darkgreen/80 hover:text-darkgreen transition-all flex items-center justify-center space-x-2 shadow-warm-xs"
          >
            <Compass className="w-4 h-4 text-midnight" />
            <span>Consult the WordChain Codex & Verb-Burn Rules</span>
          </button>
        </div>
      )}

      {/* Host Room Form Drawer */}
      {mode === 'create' && (
        <form onSubmit={handleCreateSubmit} className="space-y-4 bg-beige-card border border-darkgreen/20 p-6 rounded-3xl shadow-warm-lg animate-fade-in">
          <div className="flex items-center space-x-3 pb-2 border-b border-darkgreen/10">
            <div className="p-2 rounded-xl bg-midnight text-beige">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-darkgreen">
                Create Online Match
              </h3>
              <p className="text-xs text-darkgreen/70">
                You will receive a room code and instant invite link.
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setMode('main')}
              className="flex-1 py-3 px-4 rounded-2xl bg-beige hover:bg-beige-dark border border-darkgreen/20 text-darkgreen font-bold text-xs uppercase tracking-wider transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!playerName.trim()}
              className="flex-1 py-3 px-4 rounded-2xl bg-midnight hover:bg-midnight-hover font-bold text-beige text-xs uppercase tracking-wider transition-all shadow-warm-md active:scale-95 disabled:opacity-40"
            >
              Open Parlor Lobby
            </button>
          </div>
        </form>
      )}

      {/* Join Room Form Drawer */}
      {mode === 'join' && (
        <form onSubmit={handleJoinSubmit} className="space-y-4 bg-beige-card border border-darkgreen/20 p-6 rounded-3xl shadow-warm-lg animate-fade-in">
          <div className="flex items-center space-x-3 pb-2 border-b border-darkgreen/10">
            <div className="p-2 rounded-xl bg-moss text-beige">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-darkgreen">
                Join Active Match
              </h3>
              <p className="text-xs text-darkgreen/70">
                Enter the room code shared by the match host.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-darkgreen/70 block">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="WORD-XXXX"
              className="w-full px-4 py-3.5 bg-beige/80 border border-darkgreen/20 rounded-2xl text-darkgreen font-mono font-black placeholder:text-darkgreen/35 focus:outline-none focus:border-midnight focus:ring-2 focus:ring-midnight/20 transition-all uppercase tracking-widest text-center text-xl shadow-inner-warm"
              autoFocus
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setMode('main')}
              className="flex-1 py-3 px-4 rounded-2xl bg-beige hover:bg-beige-dark border border-darkgreen/20 text-darkgreen font-bold text-xs uppercase tracking-wider transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!playerName.trim() || !roomCode.trim()}
              className="flex-1 py-3 px-4 rounded-2xl bg-midnight hover:bg-midnight-hover font-bold text-beige text-xs uppercase tracking-wider transition-all shadow-warm-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enter Room
            </button>
          </div>
        </form>
      )}

      {/* Editorial Verb-Burn Quick Tactical Highlight */}
      <div className="p-4 rounded-2xl bg-rosy-tint border border-rosy/40 text-xs text-darkgreen flex items-start space-x-3 shadow-warm-xs">
        <div className="p-1 rounded-lg bg-rosy/20 text-rosy-dark shrink-0 mt-0.5">
          <Flame className="w-4 h-4 text-rosy-burn" />
        </div>
        <p className="leading-relaxed">
          <strong className="text-rosy-burn font-bold">Linguistic Strategy Note:</strong> Conjugations matter. Inscribing <em>"ran"</em> poisons both <em>"run"</em> and <em>"running"</em> for all contenders.
        </p>
      </div>
    </div>
  );
};
