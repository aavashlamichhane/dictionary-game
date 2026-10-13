# WordChain

A word-chain game for friends on separate devices or sharing one screen. Each word starts with the last letter of the previous word. Repeated words are rejected, and playing a verb burns its related forms: playing **took** also rules out **take**, **taken**, **takes**, and **taking**.

[Try the self-hosted demo](https://wordchain.aavashlamichhane.com.np/) · [Hosting guide](docs/HOSTING.md)

The demo runs on a personal server and may occasionally be slow or unavailable.

## Features

- Online rooms for up to eight players, shareable invitations, ready checks, and host settings.
- Pass & Play for two to eight people using one device.
- Server-side word-list validation, WordNet definitions when available, and heuristic verb-family detection.
- Timed or unlimited turns; three-strikes, sudden-death, and casual modes.
- Export and import JSON match files to carry forward the word chain and burned words into a new match. Player scores and identities are not restored.
- Browser-generated sound effects and a responsive interface.

**Pass & Play still needs the backend** for dictionary requests. Dictionaries are bundled with the server; an external dictionary service is not required. You can run a built copy on a local machine or LAN without internet, but this is not an offline PWA. Optional Google Fonts fall back to system fonts when unavailable.

## Local setup

Install Node.js 22 or newer and the pinned pnpm version:

```sh
npm install --global pnpm@10.30.2
git clone https://github.com/aavashlamichhane/dictionary-game.git
cd dictionary-game
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:5173. The development command builds the shared types first, then starts Vite on port 5173 and the backend on port 3001. Vite proxies both /api and /socket.io to the backend. Rebuild shared types after changing shared/src, or run its TypeScript compiler in watch mode in another terminal.

For a production build:

```sh
pnpm build
pnpm start
```

Open http://localhost:3001. One Node process serves the built frontend, HTTP API, and Socket.IO. PORT defaults to 3001. No database, API key, or application .env file is required.

## Playing

Create a room, share its code (for example WORD-AB23) or invitation URL (?room=WORD-AB23), and have the other players join and mark themselves ready. The host chooses the timer and game mode. Alternatively, choose Pass & Play and enter two to eight names.

Valid words must meet the minimum length, appear in the bundled English word list, start with the required letter, and avoid previously burned words or verb families. Not every accepted word has a WordNet definition, and verb classification can be imperfect.

## Hosting

See [docs/HOSTING.md](docs/HOSTING.md) for Docker Compose, native Node, HTTPS reverse proxying, LAN access, updates, health checks, and troubleshooting. Serve the site, /api, and /socket.io from the same origin. Static-only hosting does not run the game backend.

Rooms, scores, and timers live in memory. Use a single server process: restarting it clears active rooms, and multiple independent replicas will not share games. Empty rooms are removed after everyone disconnects. Use exported match files to retain word history before a restart.

## Checks

```sh
pnpm test
pnpm audit --prod
```

Tests build all workspaces and cover production HTTP serving, dictionary lookup, malformed Socket.IO requests, word submissions, room lifecycle, and import/settings validation. CI also builds and smoke-tests the Docker image.

## Repository layout

| Directory | Purpose |
| --- | --- |
| client/ | React, Vite, Tailwind CSS, local mode, and Socket.IO client |
| server/ | Express, Socket.IO, room lifecycle, and dictionary/game engine |
| shared/ | TypeScript game state and event types |
| tests/ | Node test runner regression and integration checks |
| docs/ | Hosting instructions |

The npm workspace names remain @dict-game/* for compatibility. The root package is private to prevent accidental npm publication; the GitHub repository and its source are public.

## Contributions and licensing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development and bug reports. Rooms use anonymous player names, not authenticated accounts; room codes are invitations rather than an access-control mechanism. Do not use the service to store sensitive information or expose it without appropriate hosting limits.

The application is licensed under [MIT](LICENSE). Bundled dictionaries and dependencies retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
