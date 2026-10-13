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
import { object, text, settings as validateSettings, profile, importedGame } from './validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  maxHttpBufferSize: 256 * 1024,
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
  if (word.length > 80 || !/^[a-z]+$/i.test(word)) { res.status(400).json({ error: 'Invalid word' }); return; }
  try { res.json(await verifyWord(word)); }
  catch { res.status(503).json({ error: 'Dictionary temporarily unavailable' }); }
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
  const errorMessage = (err: unknown) => err instanceof Error ? err.message : 'Invalid request';
  const respond = (callback: unknown, response: any) => {
    if (typeof callback === 'function') callback(response);
    else if (!response.success) socket.emit('room:error', { message: response.error });
  };

  socket.on('room:create', (payload, callback) => {
    try {
      const input = object(payload);
      const room = roomManager.createRoom(socket, { ...profile(input), settings: validateSettings(input.settings), importedGame: input.importedGame === undefined ? undefined : importedGame(input.importedGame) });
      const host = room.players[0];
      socket.emit('room:joined', { player: host, roomState: room });
      respond(callback, { success: true, roomCode: room.code });
    } catch (err: any) {
      respond(callback, { success: false, error: err?.message || 'Failed to create room' });
    }
  });

  socket.on('room:join', (payload, callback) => {
    try {
      const input = object(payload);
      const result = roomManager.joinRoom(socket, { ...profile(input), roomCode: text(input.roomCode, 'Room code', 9) });
      if (result.success && result.room) {
        const player = result.room.players.find((p) => p.id === socket.id)!;
        socket.emit('room:joined', { player, roomState: result.room });
        respond(callback, { success: true });
      } else {
        respond(callback, { success: false, error: result.error || 'Failed to join room' });
      }
    } catch (err: any) {
      respond(callback, { success: false, error: err?.message || 'Failed to join room' });
    }
  });

  socket.on('room:update_settings', (settings) => {
    try { roomManager.updateSettings(socket, validateSettings(settings)); }
    catch (err) { socket.emit('room:error', { message: errorMessage(err) }); }
  });

  socket.on('room:toggle_ready', () => {
    roomManager.toggleReady(socket);
  });

  socket.on('room:start_game', () => {
    roomManager.startGame(socket);
  });

  socket.on('room:import_game', (payload, callback) => {
    try {
      const result = roomManager.importGame(socket, importedGame(object(payload).gameData));
      respond(callback, result);
    } catch (err: any) {
      respond(callback, { success: false, error: err?.message || 'Failed to import game' });
    }
  });

  socket.on('room:clear_imported_game', () => {
    roomManager.clearImportedGame(socket);
  });

  socket.on('game:submit_word', (payload) => {
    try {
      const word = text(object(payload).word, 'Word', 80);
      void roomManager.submitWord(socket, word).catch(err => socket.emit('room:error', { message: errorMessage(err) }));
    } catch (err) { socket.emit('room:error', { message: errorMessage(err) }); }
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

const PORT = Number(process.env.PORT) || 3001;
const server = httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WordChain Server listening on http://0.0.0.0:${PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  roomManager.close();
  io.close();
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forcefully stopping server');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
