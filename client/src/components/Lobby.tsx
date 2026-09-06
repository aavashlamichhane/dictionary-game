import React, { useState } from 'react';
import { RoomState, Player } from '@dict-game/shared';
import { Copy, Check, Users, Play, Crown, CheckCircle2, Circle, Settings2, Link2, Upload, AlertCircle, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio.js';
import { parseGameFile } from '../utils/gameStorage.js';

interface LobbyProps {
  roomState: RoomState;
  currentPlayer: Player;
  onUpdateSettings: (settings: any) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onImportGame: (gameData: any) => Promise<void>;
  onClearImportedGame: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomState,
  currentPlayer,
  onUpdateSettings,
  onToggleReady,
  onStartGame,
  onImportGame,
  onClearImportedGame
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const data = await parseGameFile(file);
      await onImportGame(data);
    } catch (err: any) {
      setImportError(err.message || 'Failed to import match file');
      sounds.playError();
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 sm:space-y-6 animate-fade-in">
      {/* Grand Parlor Room Accession Stamp */}
      <div className="bg-beige-card border border-darkgreen/15 rounded-3xl p-6 text-center shadow-warm-md space-y-4">
        <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-midnight-tint border border-midnight/20 text-midnight text-[10px] font-bold uppercase tracking-widest">
          <Sparkles className="w-3 h-3 text-midnight" />
          <span>Multiplayer Parlor Lobby</span>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-serif italic text-darkgreen/60 block">
            Room Accession Cipher
          </span>
          <span className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-darkgreen">
            {roomState.code}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-beige hover:bg-beige-dark border border-darkgreen/15 text-xs font-bold text-darkgreen transition-all shadow-warm-xs active:scale-95"
          >
            {copiedCode ? <Check className="w-4 h-4 text-moss-dark" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Cipher Copied!' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-midnight-tint hover:bg-midnight/15 border border-midnight/25 text-xs font-bold text-midnight transition-all shadow-warm-xs active:scale-95"
          >
            {copiedLink ? <Check className="w-4 h-4 text-midnight" /> : <Link2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
          </button>
        </div>
      </div>

      {/* Imported Match Dossier Banner */}
      {roomState.importedMatchInfo ? (
        <div className="bg-rosy-tint border border-rosy/40 rounded-3xl p-4 sm:p-5 flex items-start justify-between gap-3 shadow-warm-xs">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-2xl bg-rosy/20 text-rosy-dark mt-0.5 shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-rosy-burn">
                  Continuing Match Dossier
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rosy/20 text-rosy-dark font-bold font-mono">
                  {roomState.importedMatchInfo.totalImportedWords} Burned Words
                </span>
              </div>
              <p className="text-xs text-darkgreen/80 mt-1 leading-relaxed">
                All words and conjugated verb roots from the previous session remain strictly banned.
                {roomState.importedMatchInfo.lastWord && (
                  <span>
                    {' '}Terminal word was <strong>"{roomState.importedMatchInfo.lastWord}"</strong>. Game commences with letter <strong>"{roomState.currentLetter.toUpperCase()}"</strong>.
                  </span>
                )}
              </p>
            </div>
          </div>
          {isHost && (
            <button
              onClick={onClearImportedGame}
              className="text-xs text-rosy-dark hover:text-darkgreen px-3 py-1.5 rounded-xl bg-beige hover:bg-beige-dark border border-rosy/30 transition-all font-semibold shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      ) : isHost ? (
        <div className="bg-beige-card/70 border border-dashed border-darkgreen/20 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-warm-xs">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="p-2 rounded-2xl bg-beige border border-darkgreen/15 text-midnight shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-darkgreen block">Resume Previous Session?</span>
              <span className="text-[11px] text-darkgreen/65">Import a .json match dossier to carry forward banned words and verb roots.</span>
            </div>
          </div>

          <label className="cursor-pointer px-4 py-2 bg-beige hover:bg-beige-dark text-xs font-bold text-midnight border border-midnight/30 rounded-xl transition-all shadow-warm-xs flex items-center space-x-1.5 shrink-0 active:scale-95">
            <Upload className="w-3.5 h-3.5" />
            <span>{isImporting ? 'Importing...' : 'Import Match .json'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
      ) : null}

      {importError && (
        <div className="p-3.5 bg-rosy-tint border border-rosy/50 rounded-2xl text-rosy-dark text-xs flex items-center space-x-2 animate-shake">
          <AlertCircle className="w-4 h-4 text-rosy-burn shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* Contenders Roster */}
      <div className="bg-beige-card border border-darkgreen/15 rounded-3xl p-5 sm:p-6 shadow-warm-md space-y-4">
        <div className="flex items-center justify-between border-b border-darkgreen/10 pb-3">
          <div className="flex items-center space-x-2 text-darkgreen font-bold">
            <Users className="w-4 h-4 text-midnight" />
            <span className="text-xs font-black uppercase tracking-wider">
              Contenders in Parlor ({roomState.players.length}/8)
            </span>
          </div>
          <span className="text-[11px] text-darkgreen/60 font-medium">
            {roomState.players.length < 2 ? 'Awaiting second contender...' : 'Quorum reached'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {roomState.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                player.id === currentPlayer.id
                  ? 'bg-beige-light border-midnight/40 shadow-warm-xs'
                  : 'bg-beige/60 border-darkgreen/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-bold border shadow-warm-xs"
                  style={{
                    backgroundColor: `${player.color}18`,
                    borderColor: `${player.color}55`
                  }}
                >
                  {player.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-darkgreen text-sm">{player.name}</span>
                    {player.id === currentPlayer.id && (
                      <span className="text-[10px] bg-darkgreen/10 text-darkgreen px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </div>
                  {player.isHost && (
                    <span className="flex items-center space-x-1 text-[11px] text-moss-dark font-semibold">
                      <Crown className="w-3 h-3" />
                      <span>Match Host</span>
                    </span>
                  )}
                </div>
              </div>

              <div>
                {player.isHost ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-moss-tint text-moss-dark border border-moss/25">
                    Host
                  </span>
                ) : player.isReady ? (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-moss-dark bg-moss-tint px-2 py-1 rounded-lg border border-moss/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-moss" />
                    <span>Ready</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-[11px] font-medium text-darkgreen/50 bg-beige px-2 py-1 rounded-lg border border-darkgreen/10">
                    <Circle className="w-3 h-3 text-darkgreen/30" />
                    <span>Waiting</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Match Configuration Card */}
      <div className="bg-beige-card border border-darkgreen/15 rounded-3xl p-5 sm:p-6 shadow-warm-md space-y-4">
        <div className="flex items-center space-x-2 text-darkgreen font-bold border-b border-darkgreen/10 pb-3">
          <Settings2 className="w-4 h-4 text-midnight" />
          <span className="text-xs font-black uppercase tracking-wider">
            Match Protocol Rules
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Turn Timer Setting */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-darkgreen/70 block">
              Turn Inscription Time
            </label>
            {isHost ? (
              <select
                value={roomState.settings.turnTimeLimit}
                onChange={(e) => onUpdateSettings({ turnTimeLimit: Number(e.target.value) })}
                className="w-full bg-beige border border-darkgreen/20 rounded-xl px-3 py-2.5 text-darkgreen font-semibold text-xs focus:outline-none focus:border-midnight shadow-inner-warm"
              >
                <option value={10}>10s (Speed Duel)</option>
                <option value={15}>15s (Standard)</option>
                <option value={20}>20s (Deliberate)</option>
                <option value={30}>30s (Leisurely)</option>
                <option value={0}>Unlimited Time</option>
              </select>
            ) : (
              <div className="bg-beige/80 border border-darkgreen/15 rounded-xl px-3 py-2.5 text-darkgreen font-semibold text-xs">
                {roomState.settings.turnTimeLimit > 0
                  ? `${roomState.settings.turnTimeLimit} Seconds`
                  : 'Unlimited'}
              </div>
            )}
          </div>

          {/* Game Mode */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-darkgreen/70 block">
              Elimination Protocol
            </label>
            {isHost ? (
              <select
                value={roomState.settings.gameMode}
                onChange={(e) => onUpdateSettings({ gameMode: e.target.value })}
                className="w-full bg-beige border border-darkgreen/20 rounded-xl px-3 py-2.5 text-darkgreen font-semibold text-xs focus:outline-none focus:border-midnight shadow-inner-warm"
              >
                <option value="strikes">3 Strikes (Standard Elimination)</option>
                <option value="sudden_death">Sudden Death (1 error = Defeat)</option>
                <option value="casual">Casual (Points tally, no elimination)</option>
              </select>
            ) : (
              <div className="bg-beige/80 border border-darkgreen/15 rounded-xl px-3 py-2.5 text-darkgreen font-semibold text-xs capitalize">
                {roomState.settings.gameMode.replace('_', ' ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start / Ready Primary Trigger */}
      <div className="pt-1">
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={roomState.players.length < 1}
            className="w-full py-4 px-6 rounded-3xl bg-midnight hover:bg-midnight-hover font-serif text-lg font-bold text-beige shadow-warm-lg hover:shadow-warm-xl transition-all transform active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2.5 border border-midnight-dark"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Commence Word Battle</span>
          </button>
        ) : (
          <button
            onClick={onToggleReady}
            className={`w-full py-4 px-6 rounded-3xl font-bold text-base transition-all shadow-warm-md flex items-center justify-center space-x-2.5 border ${
              currentPlayer.isReady
                ? 'bg-beige hover:bg-beige-dark text-moss-dark border-moss/40'
                : 'bg-midnight hover:bg-midnight-hover text-beige border-midnight-dark'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{currentPlayer.isReady ? "Ready to Inscribe (Tap to Cancel)" : "Declare Readiness"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
