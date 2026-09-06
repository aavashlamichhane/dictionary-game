import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ClientToServerEvents,
  ServerToClientEvents
} from '@dict-game/shared';
import { RoomManager } from './roomManager.js';
import { verifyWord } from './dictionary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);

// REST API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = roomManager.getRoom(code);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({
    code: room.code,
    status: room.status,
    playerCount: room.players.length,
    hostName: room.players.find(p => p.isHost)?.name
  });
});

app.get('/api/word/:word', async (req, res) => {
  const word = req.params.word;
  const result = await verifyWord(word);
  res.json(result);
});

// Production client serving
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Socket.io connections
io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  socket.on('room:create', (payload, callback) => {
    try {
      const room = roomManager.createRoom(socket, payload);
      const host = room.players[0];
      socket.emit('room:joined', { player: host, roomState: room });
      callback({ success: true, roomCode: room.code });
    } catch (err: any) {
      callback({ success: false, error: err?.message || 'Failed to create room' });
    }
  });

  socket.on('room:join', (payload, callback) => {
    try {
      const result = roomManager.joinRoom(socket, payload);
      if (result.success && result.room) {
        const player = result.room.players.find((p) => p.id === socket.id)!;
        socket.emit('room:joined', { player, roomState: result.room });
        callback({ success: true });
      } else {
        callback({ success: false, error: result.error || 'Failed to join room' });
      }
    } catch (err: any) {
      callback({ success: false, error: err?.message || 'Failed to join room' });
    }
  });

  socket.on('room:update_settings', (settings) => {
    roomManager.updateSettings(socket, settings);
  });

  socket.on('room:toggle_ready', () => {
    roomManager.toggleReady(socket);
  });

  socket.on('room:start_game', () => {
    roomManager.startGame(socket);
  });

  socket.on('room:import_game', (payload, callback) => {
    try {
      const result = roomManager.importGame(socket, payload.gameData);
      callback(result);
    } catch (err: any) {
      callback({ success: false, error: err?.message || 'Failed to import game' });
    }
  });

  socket.on('room:clear_imported_game', () => {
    roomManager.clearImportedGame(socket);
  });

  socket.on('game:submit_word', (payload) => {
    roomManager.submitWord(socket, payload.word);
  });

  socket.on('game:restart', () => {
    roomManager.restartGame(socket);
  });

  socket.on('room:leave', () => {
    roomManager.leaveRoom(socket);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    roomManager.leaveRoom(socket);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WordChain Server listening on http://localhost:${PORT}`);
});
