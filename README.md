# 🔤 WordChain - The Verb-Burn Word Battle

A fast-paced, real-time multiplayer word-chain game built for competition and collaboration across multiple devices or locally on a single device.

---

## 🎮 Core Game Rules

1. **The Word Chain:**
   - The game begins with a starting letter.
   - The active player must submit a valid English word starting with that letter.
   - Each subsequent player must say a word starting with the **ending letter** of the previous word (e.g. `appl`**`e`** $\rightarrow$ **`e`**`lephan`**`t`** $\rightarrow$ **`t`**`ree`).

2. **No Duplicates:**
   - No word can be repeated across the entire match. If Alice played *"tiger"* on Turn 2, no one can ever play *"tiger"* again.

3. **The Verb-Burn Rule (Special Rule!):**
   - If any form of a verb is played (e.g. *"took"*), the **root verb** (`take`) and **all its inflection forms** (`take`, `takes`, `took`, `taken`, `taking`) are immediately burned!
   - If another player later attempts to submit *"taking"* or *"take"*, the engine detects the burned root and rejects the word:
     > ⚠️ *"Verb form violation! 'taking' is an inflection of root verb 'take', which was already burned when Alice played 'took' on Turn 1!"*

4. **Valid Words & Definitions:**
   - Every word is validated against a 275,000+ English word dictionary and WordNet offline database. Words must have an established dictionary meaning. Definitions and parts of speech are displayed on each word card.

5. **Timers & Elimination:**
   - **3 Strikes Mode:** 3 mistakes/timeouts eliminate a player.
   - **Sudden Death Mode:** 1 mistake eliminates a player.
   - **Casual Mode:** Points and warnings without elimination.

---

## 🌐 Game Modes

### 1. Online Multiplayer (Cross-Device)
- **Host a Room:** Generate a 4-character Room Code (e.g. `WORD-9K`) and a 1-click shareable invite link (`?room=WORD-9K`).
- **Join a Room:** Friends open the link or type the room code on their phones, tablets, or laptops.
- **Synchronized Lobby:** Live avatars, player ready checks, host controls (turn timer, game mode).
- **Live Turns:** Real-time turns, server-driven countdown clock, instant word validation, and victory podium with confetti.

### 2. Pass & Play (Local 1-Device)
- Enter 2 to 8 player names on a single smartphone, tablet, or laptop.
- Pass the device around the room on each turn without needing internet or multiple devices!

---

## 🛠️ Tech Stack & Architecture

- **Monorepo:** `pnpm` workspaces (`@dict-game/shared`, `@dict-game/server`, `@dict-game/client`).
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas-Confetti.
- **Backend:** Node.js, Express, Socket.io (bi-directional WebSockets).
- **Linguistic Engine:**
  - `an-array-of-english-words`: 275,000+ word offline validation.
  - `wordnet`: 140,000+ word offline definitions and parts of speech.
  - `compromise` NLP + Curated Irregular Verb Family Database: Instant 0ms lemmatization and verb-conjugation poisoning.
- **Audio:** Synthesized browser Web Audio API sound effects (no external audio files needed).

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- `pnpm` >= 9

### Installation
```bash
# Install all dependencies
pnpm install
```

### Development
```bash
# Runs both backend (port 3001) and frontend (port 5173 with proxy) concurrently
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build & Run
```bash
# Build shared, server, and client
pnpm build

# Run production server (serves both API/WebSockets and frontend on port 3001)
pnpm start
```
Open [http://localhost:3001](http://localhost:3001) in your browser.
