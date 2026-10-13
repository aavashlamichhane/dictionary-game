import { Server, Socket } from 'socket.io';
import {
  RoomState,
  Player,
  GameSettings,
  CreateRoomPayload,
  JoinRoomPayload,
  ClientToServerEvents,
  ServerToClientEvents,
  ExportedGameData
} from '@dict-game/shared';
import {
  generateRoomCode,
  createInitialRoom,
  applyImportedGame,
  clearImportedGame,
  processWordSubmission,
  handleTimeout,
  resetGame,
  getNextPlayerIndex,
  getActivePlayers
} from './gameEngine.js';

export class RoomManager {
  private submittingRooms = new Set<string>();
  private rooms = new Map<string, RoomState>();
  private socketToRoom = new Map<string, string>();
  private roomTimers = new Map<string, NodeJS.Timeout>();
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  public createRoom(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    payload: CreateRoomPayload
  ): RoomState {
    // Leave previous room if any
    this.leaveRoom(socket);

    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();
    const host: Player = {
      id: socket.id,
      name: payload.playerName.trim() || 'Host',
      avatar: payload.avatar || '👑',
      color: payload.color || '#3b82f6',
      isHost: true,
      isReady: true,
      isConnected: true,
      strikes: 0,
      isEliminated: false,
      score: 0,
      wordsPlayedCount: 0
    };

    const room = createInitialRoom(code, host, payload.settings, payload.importedGame);
    this.rooms.set(code, room);
    this.socketToRoom.set(socket.id, code);

    socket.join(code);
    return room;
  }

  public joinRoom(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    payload: JoinRoomPayload
  ): { success: boolean; error?: string; room?: RoomState } {
    this.leaveRoom(socket);

    const code = payload.roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: `Room ${code} does not exist.` };
    }

    if (room.status === 'playing') {
      // Check if reconnecting player with same name
      const existing = room.players.find(
        (p) => p.name.toLowerCase() === payload.playerName.trim().toLowerCase()
      );
      if (existing && !existing.isConnected) {
        existing.id = socket.id;
        existing.isConnected = true;
        this.socketToRoom.set(socket.id, code);
        socket.join(code);
        this.broadcastRoomUpdate(code);
        return { success: true, room };
      }
      return { success: false, error: 'Game is currently in progress.' };
    }

    if (room.players.length >= 8) {
      return { success: false, error: 'Room is full (max 8 players).' };
    }

    // Check duplicate name in lobby
    const nameExists = room.players.some(
      (p) => p.name.toLowerCase() === payload.playerName.trim().toLowerCase()
    );
    const finalName = nameExists
      ? `${payload.playerName.trim()} (${room.players.length + 1})`
      : payload.playerName.trim();

    const player: Player = {
      id: socket.id,
      name: finalName || `Player ${room.players.length + 1}`,
      avatar: payload.avatar || '🎮',
      color: payload.color || '#10b981',
      isHost: false,
      isReady: false,
      isConnected: true,
      strikes: 0,
      isEliminated: false,
      score: 0,
      wordsPlayedCount: 0
    };

    room.players.push(player);
    this.socketToRoom.set(socket.id, code);
    socket.join(code);

    this.broadcastRoomUpdate(code);
    return { success: true, room };
  }

  public leaveRoom(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;

    this.socketToRoom.delete(socket.id);
    socket.leave(code);

    const room = this.rooms.get(code);
    if (!room) return;

    const playerIndex = room.players.findIndex((p) => p.id === socket.id);
    if (playerIndex === -1) return;

    const leavingPlayer = room.players[playerIndex];

    if (room.status === 'lobby') {
      // Remove player
      room.players.splice(playerIndex, 1);
      // If room empty, clean up
      if (room.players.length === 0) {
        this.destroyRoom(code);
        return;
      }
      // If host left, assign new host
      if (leavingPlayer.isHost && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }
    } else {
      // In game: mark disconnected & eliminate
      leavingPlayer.isConnected = false;
      leavingPlayer.isEliminated = true;

      // Check if it was their turn
      if (room.currentTurnIndex === playerIndex) {
        this.stopTimer(code);
        const next = getNextPlayerIndex(room, room.currentTurnIndex);
        room.currentTurnIndex = next;
        this.startTimer(code);
      }

      if (!room.players.some(p => p.isConnected)) { this.destroyRoom(code); return; }
      if (leavingPlayer.isHost) {
        leavingPlayer.isHost = false;
        const host = room.players.find(p => p.isConnected)!;
        host.isHost = true; room.hostId = host.id;
      }
      const active = getActivePlayers(room);
      if (active.length <= 1 && room.players.length > 1) {
        room.status = 'game_over';
        room.winner = active[0] || null;
        this.stopTimer(code);
        this.io.to(code).emit('game:over', {
          winner: room.winner,
          reason: 'All other players disconnected or were eliminated!',
          roomState: room
        });
      }
    }

    this.broadcastRoomUpdate(code);
  }

  public importGame(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    gameData: ExportedGameData
  ): { success: boolean; error?: string } {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return { success: false, error: 'Not in a room' };
    const room = this.rooms.get(code);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== socket.id) return { success: false, error: 'Only the host can import a previous game' };
    if (room.status !== 'lobby') return { success: false, error: 'Cannot import during an active match' };

    applyImportedGame(room, gameData);
    this.broadcastRoomUpdate(code);
    return { success: true };
  }

  public clearImportedGame(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.hostId !== socket.id || room.status !== 'lobby') return;

    clearImportedGame(room);
    this.broadcastRoomUpdate(code);
  }

  public updateSettings(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    settings: Partial<GameSettings>
  ): void {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.hostId !== socket.id || room.status !== 'lobby') return;

    room.settings = { ...room.settings, ...settings };
    this.broadcastRoomUpdate(code);
  }

  public toggleReady(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.status !== 'lobby') return;

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.isReady = !player.isReady;
      this.broadcastRoomUpdate(code);
    }
  }

  public startGame(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.hostId !== socket.id || room.status !== 'lobby') return;

    if (room.players.filter(p => p.isConnected).length < 2 || room.players.some(p => p.isConnected && !p.isReady)) {
      socket.emit('room:error', { message: 'At least two ready players are required' }); return;
    }
    room.status = 'playing';
    resetGame(room);
    this.broadcastRoomUpdate(code);
    this.startTimer(code);
  }

  public async submitWord(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    word: string
  ): Promise<void> {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.status !== 'playing') return;

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      // Not player's turn
      return;
    }

    if (this.submittingRooms.has(code)) return;
    this.submittingRooms.add(code);
    this.stopTimer(code);
    let result;
    try { result = await processWordSubmission(room, currentPlayer, word); }
    catch (err) { this.startTimer(code); throw err; }
    finally { this.submittingRooms.delete(code); }
    if (this.rooms.get(code) !== room) return;

    if (result.accepted && result.wordEntry) {
      this.io.to(code).emit('game:word_accepted', {
        wordEntry: result.wordEntry,
        nextLetter: result.nextLetter || room.currentLetter,
        nextPlayer: room.players[room.currentTurnIndex]
      });
    } else if (result.violation) {
      this.io.to(code).emit('game:violation', result.violation);
    }

    if (result.isGameOver) {
      this.stopTimer(code);
      this.io.to(code).emit('game:over', {
        winner: room.winner,
        reason: `${currentPlayer.name} was eliminated!`,
        roomState: room
      });
    } else {
      this.startTimer(code);
    }

    this.broadcastRoomUpdate(code);
  }

  public restartGame(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room || room.hostId !== socket.id || room.status === 'lobby' || this.submittingRooms.has(code) || room.players.filter(p => p.isConnected).length < 2) return;

    resetGame(room);
    this.broadcastRoomUpdate(code);
    this.startTimer(code);
  }

  public getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code);
  }

  public close(): void {
    for (const code of this.rooms.keys()) this.destroyRoom(code);
    this.socketToRoom.clear();
  }

  private startTimer(code: string): void {
    this.stopTimer(code);
    const room = this.rooms.get(code);
    if (!room || room.status !== 'playing' || room.settings.turnTimeLimit <= 0) return;

    room.timeRemaining = room.settings.turnTimeLimit;
    room.turnStartTime = Date.now();

    const timer = setInterval(() => {
      const currentRoom = this.rooms.get(code);
      if (!currentRoom || currentRoom.status !== 'playing') {
        this.stopTimer(code);
        return;
      }

      currentRoom.timeRemaining--;
      this.io.to(code).emit('game:tick', { timeRemaining: currentRoom.timeRemaining });

      if (currentRoom.timeRemaining <= 0) {
        this.stopTimer(code);
        const result = handleTimeout(currentRoom);
        if (result.violation) {
          this.io.to(code).emit('game:violation', result.violation);
        }

        if (result.isGameOver) {
          this.io.to(code).emit('game:over', {
            winner: currentRoom.winner,
            reason: 'Turn time limit expired!',
            roomState: currentRoom
          });
        } else {
          this.startTimer(code);
        }

        this.broadcastRoomUpdate(code);
      }
    }, 1000);

    this.roomTimers.set(code, timer);
  }

  private stopTimer(code: string): void {
    const timer = this.roomTimers.get(code);
    if (timer) {
      clearInterval(timer);
      this.roomTimers.delete(code);
    }
  }

  private destroyRoom(code: string): void {
    this.stopTimer(code);
    this.rooms.delete(code);
  }

  private broadcastRoomUpdate(code: string): void {
    const room = this.rooms.get(code);
    if (room) {
      this.io.to(code).emit('room:updated', room);
    }
  }
}
