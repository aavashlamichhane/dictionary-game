import React from 'react';
import { useSocket } from '../hooks/useSocket.js';
import { Header } from '../components/Header.js';
import { Lobby } from '../components/Lobby.js';
import { GameBoard } from '../components/GameBoard.js';
import { GameOverModal } from '../components/GameOverModal.js';
import { AlertCircle, Loader2, Sparkles, Feather } from 'lucide-react';

interface OnlineGameProps {
  socketHook: ReturnType<typeof useSocket>;
  onLeave: () => void;
  onOpenRules: () => void;
}

export const OnlineGame: React.FC<OnlineGameProps> = ({
  socketHook,
  onLeave,
  onOpenRules
}) => {
  const {
    isConnected,
    room,
    currentPlayer,
    error,
    updateSettings,
    toggleReady,
    startGame,
    submitWord,
    restartGame,
    importGame,
    clearImportedGame
  } = socketHook;

  if (!room || !currentPlayer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-beige text-darkgreen animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-midnight text-beige flex items-center justify-center shadow-warm-md mb-4 animate-gentle-float">
          <Feather className="w-8 h-8 text-moss-light" />
        </div>
        <div className="flex items-center space-x-2 text-darkgreen font-serif text-lg font-bold">
          <Loader2 className="w-5 h-5 text-midnight animate-spin" />
          <span>Entering Parlor Room...</span>
        </div>
        <p className="text-xs text-darkgreen/60 mt-1 font-medium">Synchronizing lexicon state with server</p>
        {error && (
          <div className="mt-6 p-4 bg-rosy-tint border border-rosy/40 rounded-2xl text-rosy-burn text-xs flex items-center space-x-2.5 shadow-warm-xs max-w-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}
      </div>
    );
  }

  const isHost = currentPlayer.isHost;

  return (
    <div className="min-h-screen flex flex-col bg-beige text-darkgreen">
      <Header
        roomCode={room.code}
        isConnected={isConnected}
        onLeave={onLeave}
        onOpenRules={onOpenRules}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {error && (
          <div className="mb-4 p-4 bg-rosy-tint border border-rosy/50 rounded-2xl text-rosy-burn text-sm flex items-center space-x-2.5 animate-shake shadow-warm-xs">
            <AlertCircle className="w-5 h-5 text-rosy-burn shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {room.status === 'lobby' && (
          <Lobby
            roomState={room}
            currentPlayer={currentPlayer}
            onUpdateSettings={updateSettings}
            onToggleReady={toggleReady}
            onStartGame={startGame}
            onImportGame={importGame}
            onClearImportedGame={clearImportedGame}
          />
        )}

        {(room.status === 'playing' || room.status === 'game_over') && (
          <div>
            <GameBoard
              roomState={room}
              currentPlayer={currentPlayer}
              onSubmitWord={submitWord}
            />

            {room.status === 'game_over' && (
              <GameOverModal
                roomState={room}
                isHost={isHost}
                onRestart={restartGame}
                onLeave={onLeave}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};
