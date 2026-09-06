import React from 'react';
import { useSocket } from '../hooks/useSocket.js';
import { Header } from '../components/Header.js';
import { Lobby } from '../components/Lobby.js';
import { GameBoard } from '../components/GameBoard.js';
import { GameOverModal } from '../components/GameOverModal.js';
import { AlertCircle, Loader2 } from 'lucide-react';

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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Connecting to room...</p>
        {error && (
          <div className="mt-4 p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  const isHost = currentPlayer.isHost;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        roomCode={room.code}
        isConnected={isConnected}
        onLeave={onLeave}
        onOpenRules={onOpenRules}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {error && (
          <div className="mb-4 p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-rose-200 text-sm flex items-center space-x-2 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
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
