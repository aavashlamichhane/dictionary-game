import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  RoomState,
  Player,
  GameSettings,
  Violation,
  WordEntry,
  ServerToClientEvents,
  ClientToServerEvents
} from '@dict-game/shared';
import { sounds } from '../utils/audio.js';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentAcceptedWord, setRecentAcceptedWord] = useState<WordEntry | null>(null);

  useEffect(() => {
    // Determine socket server URL: in Vite dev it proxies /socket.io, or points to window.location.origin
    const socket: TypedSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('room:joined', (data) => {
      setCurrentPlayer(data.player);
      setRoom(data.roomState);
      setError(null);
      sounds.playChime();
    });

    socket.on('room:updated', (updatedRoom) => {
      setRoom(updatedRoom);
      // Update currentPlayer reference if it exists
      if (socket.id) {
        const found = updatedRoom.players.find((p) => p.id === socket.id);
        if (found) setCurrentPlayer(found);
      }
    });

    socket.on('room:error', (data) => {
      setError(data.message);
      sounds.playError();
    });

    socket.on('game:word_accepted', (data) => {
      setRecentAcceptedWord(data.wordEntry);
      sounds.playSuccess();
    });

    socket.on('game:violation', (_violation: Violation) => {
      sounds.playError();
    });

    socket.on('game:tick', (data) => {
      setRoom((prev) => {
        if (!prev) return null;
        return { ...prev, timeRemaining: data.timeRemaining };
      });
      if (data.timeRemaining <= 3 && data.timeRemaining > 0) {
        sounds.playTick(true);
      } else if (data.timeRemaining > 0 && data.timeRemaining <= 5) {
        sounds.playTick(false);
      }
    });

    socket.on('game:over', (data) => {
      setRoom(data.roomState);
      sounds.playVictory();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback(
    (playerName: string, avatar: string, color: string, settings?: Partial<GameSettings>): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) return reject(new Error('Not connected'));
        setError(null);

        socketRef.current.emit(
          'room:create',
          { playerName, avatar, color, settings },
          (response) => {
            if (response.success && response.roomCode) {
              resolve(response.roomCode);
            } else {
              const err = response.error || 'Failed to create room';
              setError(err);
              reject(new Error(err));
            }
          }
        );
      });
    },
    []
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string, avatar: string, color: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) return reject(new Error('Not connected'));
        setError(null);

        socketRef.current.emit(
          'room:join',
          { roomCode, playerName, avatar, color },
          (response) => {
            if (response.success) {
              resolve();
            } else {
              const err = response.error || 'Failed to join room';
              setError(err);
              reject(new Error(err));
            }
          }
        );
      });
    },
    []
  );

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('room:leave');
      setRoom(null);
      setCurrentPlayer(null);
      setError(null);
      setRecentAcceptedWord(null);
    }
  }, []);

  const updateSettings = useCallback((settings: Partial<GameSettings>) => {
    if (socketRef.current) {
      socketRef.current.emit('room:update_settings', settings);
    }
  }, []);

  const toggleReady = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('room:toggle_ready');
    }
  }, []);

  const startGame = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('room:start_game');
    }
  }, []);

  const submitWord = useCallback((word: string) => {
    if (socketRef.current) {
      socketRef.current.emit('game:submit_word', { word });
    }
  }, []);

  const restartGame = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('game:restart');
    }
  }, []);

  const importGame = useCallback((gameData: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Not connected'));
      setError(null);
      socketRef.current.emit('room:import_game', { gameData }, (response) => {
        if (response.success) {
          sounds.playChime();
          resolve();
        } else {
          const err = response.error || 'Failed to import game';
          setError(err);
          reject(new Error(err));
        }
      });
    });
  }, []);

  const clearImportedGame = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('room:clear_imported_game');
    }
  }, []);

  return {
    isConnected,
    room,
    currentPlayer,
    error,
    recentAcceptedWord,
    createRoom,
    joinRoom,
    leaveRoom,
    updateSettings,
    toggleReady,
    startGame,
    submitWord,
    restartGame,
    importGame,
    clearImportedGame
  };
}
