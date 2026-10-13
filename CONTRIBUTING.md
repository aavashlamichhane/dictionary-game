# Contributing

Install the Node/pnpm versions in README.md and run pnpm install --frozen-lockfile, pnpm dev, and pnpm test. Shared types must be built before the server or client; pnpm dev handles the initial build.

Keep gameplay changes consistent between server/src/gameEngine.ts and client/src/pages/PassAndPlay.tsx. Include a regression test for rule or room-lifecycle fixes. Run pnpm audit --prod when changing runtime dependencies and commit pnpm-lock.yaml alongside manifest changes.

For bug reports, include the browser, local or online mode, reproduction steps, and relevant errors. Do not include real credentials or other players' private information. Documentation improvements and hosting reports are welcome.
