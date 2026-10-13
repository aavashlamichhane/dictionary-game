import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { importedGame, settings } from '../server/dist/validation.js';
import { createInitialRoom, processWordSubmission, getNextPlayerIndex } from '../server/dist/gameEngine.js';
const require = createRequire(new URL('../client/package.json', import.meta.url));
const { io } = require('socket.io-client');
const root = new URL('../', import.meta.url);
let child, base, log = '';
const sockets = [];
const player = (id) => ({ id, name: id, color: '#105666', avatar: '🎮', isHost: false, isReady: true, isConnected: true, strikes: 0, isEliminated: false, score: 0, wordsPlayedCount: 0 });
before(async () => {
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve)); base = 'http://127.0.0.1:' + port;
  child = spawn(process.execPath, ['server/dist/index.js'], { cwd: root, env: { ...process.env, PORT: String(port), NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', data => log += data); child.stderr.on('data', data => log += data);
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base + '/api/health')).ok) return; } catch {}
    if (child.exitCode !== null) throw new Error(log);
    await delay(100);
  }
  throw new Error('Server did not start: ' + log);
});
after(async () => {
  sockets.forEach(socket => socket.disconnect());
  if (child && child.exitCode === null) { const done = once(child, 'exit'); child.kill('SIGTERM'); await done; }
});
async function connect() {
  const socket = io(base, { transports: ['websocket'], forceNew: true, reconnection: false }); sockets.push(socket);
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); }); return socket;
}
const ack = (socket, event, payload) => new Promise((resolve, reject) => socket.timeout(2000).emit(event, payload, (err, value) => err ? reject(err) : resolve(value)));
const profile = (name) => ({ playerName: name, avatar: '🎮', color: '#105666' });
test('production serves frontend and dictionary; unknown API stays 404', async () => {
  assert.match(await (await fetch(base + '/')).text(), /WordChain/);
  assert.equal((await (await fetch(base + '/api/word/apple')).json()).isValid, true);
  assert.equal((await fetch(base + '/api/word/' + 'a'.repeat(81))).status, 400);
  assert.equal((await fetch(base + '/api/unknown')).status, 404);
});
test('malformed events without acknowledgements do not terminate the server', async () => {
  const socket = await connect();
  socket.emit('room:create', null); socket.emit('room:join', {}); socket.emit('room:import_game', null); socket.emit('game:submit_word', { word: 42 }); socket.emit('room:update_settings', { gameMode: {} });
  await delay(100); assert.equal((await fetch(base + '/api/health')).status, 200);
  assert.equal((await ack(socket, 'room:create', { ...profile('Host'), settings: { turnTimeLimit: -1 } })).success, false);
  socket.disconnect();
});
test('settings and imported match schemas reject malformed fields', () => {
  assert.throws(() => settings({ turnTimeLimit: Infinity }));
  assert.throws(() => importedGame({ version: '2.0', chain: [], burnedWords: {}, burnedVerbRoots: {} }));
  assert.throws(() => importedGame({ version: '1.0', chain: [], burnedWords: { apple: null }, burnedVerbRoots: {}, exportedAt: Date.now() }));
  assert.deepEqual(settings({ gameMode: 'casual', turnTimeLimit: 0, unknown: 'ignored' }), { gameMode: 'casual', turnTimeLimit: 0 });
  assert.equal(importedGame({ version: '1.0', chain: [], burnedWords: {}, burnedVerbRoots: {}, exportedAt: Date.now() }).version, '1.0');
});
test('word validation does not treat inherited object names as played words', async () => {
  const host = player('Host'); const room = createInitialRoom('WORD-TEST', host, { turnTimeLimit: 0 }); room.players.push(player('Guest')); room.status = 'playing'; room.currentLetter = 'c';
  const result = await processWordSubmission(room, host, 'constructor');
  assert.notEqual(result.violation?.type, 'DUPLICATE_WORD');
  room.players.push(player('Third')); room.players[1].isEliminated = true;
  assert.equal(getNextPlayerIndex(room, 0), 2);
});
test('overlapping submissions only consume one turn; connected identities cannot be hijacked', async () => {
  const host = await connect(), guest = await connect(), attacker = await connect();
  const joined = once(host, 'room:joined');
  const { roomCode } = await ack(host, 'room:create', { ...profile('Alice'), settings: { turnTimeLimit: 0 }, importedGame: { version: '1.0', exportedAt: Date.now(), chain: [], burnedWords: {}, burnedVerbRoots: {}, lastLetter: 'a' } }); await joined;
  await ack(guest, 'room:join', { ...profile('Bob'), roomCode });
  guest.emit('room:toggle_ready'); await delay(50);
  const started = once(host, 'room:updated'); host.emit('room:start_game'); const [room] = await started; assert.equal(room.status, 'playing');
  assert.equal((await ack(attacker, 'room:join', { ...profile('Alice'), roomCode })).success, false);
  // apple is valid; importing its starting letter gives a deterministic turn.
  host.emit('game:submit_word', { word: 'apple' }); host.emit('game:submit_word', { word: 'apple' });
  await delay(250);
  let snapshot; host.once('room:updated', state => snapshot = state); guest.emit('room:leave'); await delay(100);
  assert.equal(snapshot.turnCount, 1); host.disconnect(); guest.disconnect(); attacker.disconnect(); await delay(100);
  assert.equal((await fetch(base + '/api/rooms/' + roomCode)).status, 404);
});
