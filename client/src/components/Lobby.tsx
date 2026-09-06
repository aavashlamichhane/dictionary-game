import React, { useState } from 'react';
import { RoomState, Player } from '@dict-game/shared';
import { Copy, Check, Users, Play, Crown, CheckCircle2, Circle, Settings2, Link2 } from 'lucide-react';
import { sounds } from '../utils/audio.js';

interface LobbyProps {
  roomState: RoomState;
  currentPlayer: Player;
  onUpdateSettings: (settings: any) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomState,
  currentPlayer,
  onUpdateSettings,
  onToggleReady,
  onStartGame
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isHost = currentPlayer.isHost;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    sounds.playChime();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${roomState.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    sounds.playChime();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Room Code Card */}
      <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/80 rounded-3xl p-6 text-center shadow-xl">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
          Room Lobby
        </span>
        <div className="mt-2 flex items-center justify-center space-x-3">
          <span className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-white">
            {roomState.code}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied Link!' : 'Copy Invite Link'}</span>
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2 text-slate-300 font-bold">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Players in Room ({roomState.players.length}/8)</span>
          </div>
          <span className="text-xs text-slate-400">
            {roomState.players.length < 2 ? 'Need at least 2 players' : 'Ready to begin'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {roomState.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                player.id === currentPlayer.id
                  ? 'bg-slate-800/80 border-emerald-500/40'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border shadow-inner"
                  style={{
                    backgroundColor: `${player.color}22`,
                    borderColor: player.color
                  }}
                >
                  {player.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-100 text-sm">{player.name}</span>
                    {player.id === currentPlayer.id && (
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                        You
                      </span>
                    )}
                  </div>
                  {player.isHost && (
                    <span className="flex items-center space-x-1 text-[11px] text-amber-400 font-medium">
                      <Crown className="w-3 h-3" />
                      <span>Host</span>
                    </span>
                  )}
                </div>
              </div>

              <div>
                {player.isHost ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Host
                  </span>
                ) : player.isReady ? (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ready</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-[11px] font-medium text-slate-500 bg-slate-800 px-2 py-1 rounded-md">
                    <Circle className="w-3.5 h-3.5" />
                    <span>Waiting</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Settings Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-slate-300 font-bold border-b border-slate-800/80 pb-3">
          <Settings2 className="w-5 h-5 text-teal-400" />
          <span>Match Settings</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Turn Timer Setting */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Turn Time Limit
            </label>
            {isHost ? (
              <select
                value={roomState.settings.turnTimeLimit}
                onChange={(e) => onUpdateSettings({ turnTimeLimit: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value={10}>10 seconds (Speed)</option>
                <option value={15}>15 seconds (Standard)</option>
                <option value={20}>20 seconds (Relaxed)</option>
                <option value={30}>30 seconds (Casual)</option>
                <option value={0}>Unlimited</option>
              </select>
            ) : (
              <div className="bg-slate-800/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium">
                {roomState.settings.turnTimeLimit > 0
                  ? `${roomState.settings.turnTimeLimit} seconds`
                  : 'Unlimited'}
              </div>
            )}
          </div>

          {/* Game Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Elimination Mode
            </label>
            {isHost ? (
              <select
                value={roomState.settings.gameMode}
                onChange={(e) => onUpdateSettings({ gameMode: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="strikes">3 Strikes (Standard)</option>
                <option value="sudden_death">Sudden Death (1 mistake = out)</option>
                <option value="casual">Casual (Points only, no elimination)</option>
              </select>
            ) : (
              <div className="bg-slate-800/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium capitalize">
                {roomState.settings.gameMode.replace('_', ' ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start / Ready Button Area */}
      <div className="pt-2">
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={roomState.players.length < 1}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 font-black text-slate-950 text-lg shadow-xl shadow-emerald-950/40 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>Start Game</span>
          </button>
        ) : (
          <button
            onClick={onToggleReady}
            className={`w-full py-4 px-6 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center space-x-2 ${
              currentPlayer.isReady
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
            }`}
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>{currentPlayer.isReady ? "I'm Ready (Tap to cancel)" : "Ready Up!"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
