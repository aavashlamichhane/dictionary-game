# Hosting WordChain

## Architecture

Run one persistent Node server. It serves client/dist, /api, and /socket.io on the same origin. A static hosting service alone is insufficient, even for Pass & Play. Room state is in memory and disappears on restart; no database or persistent volume is currently used. Export important word history before updating. Multiple replicas are unsupported.

## Docker Compose (recommended)

Install [Docker Engine](https://docs.docker.com/engine/install/) and the Compose plugin first. From the repository root:

```sh
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:3001/api/health
docker compose logs --tail=100 wordchain
```

Open http://localhost:3001 on the host. The default published port is **127.0.0.1:3001**, so it is available to a local reverse proxy, not directly to other machines. The image runs as the non-root node user, uses a pinned pnpm version, and checks /api/health. Compose enables an init process and restarts the service unless stopped.

For LAN access, copy .env.example to .env and set HOST_BIND=0.0.0.0. Other devices can then open http://HOST_LAN_IP:3001 if your host firewall permits it. HOST_PORT changes the published host port; leave the container's internal PORT at 3001 because its health check uses that port. The Compose .env file configures port publication, not browser environment variables.

## HTTPS with nginx

Point a domain's DNS record at your server. Keep WordChain bound to loopback, expose ports 80 and 443 for nginx, and use this server block (replace wordchain.example.com):

```nginx
server {
    listen 80;
    server_name wordchain.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 75s;
    }
}
```

On Ubuntu/Debian, save it in /etc/nginx/sites-available/wordchain and enable it with a symlink in sites-enabled. Validate with sudo nginx -t before reloading nginx. Install Certbot and its nginx plugin using the [official instructions](https://certbot.eff.org/instructions), then run:

```sh
sudo certbot --nginx -d wordchain.example.com
```

The Upgrade and Connection headers are necessary for WebSockets. The timeout is longer than Socket.IO's default heartbeat window; see its [reverse-proxy documentation](https://socket.io/docs/v4/reverse-proxy/). Forward the entire application, including /api and /socket.io, rather than just the homepage. If using a CDN or tunnel, enable WebSockets and avoid caching those two paths.

## Native Node hosting

Use Node.js 22+ and pnpm 10.30.2:

```sh
pnpm install --frozen-lockfile
pnpm build
NODE_ENV=production PORT=3001 pnpm start
```

For PowerShell, set $env:NODE_ENV = 'production' and $env:PORT = '3001' before pnpm start. The server listens on all interfaces; restrict direct port access with your firewall when using nginx. Use systemd or another process supervisor for unattended operation, with the repository as its working directory and node server/dist/index.js as the command. Do not enable cluster mode.

## Updates and stopping

From a clean checkout:

```sh
git pull --ff-only
docker compose up -d --build
```

For native hosting, reinstall locked dependencies, rebuild, and restart your supervisor. Updates interrupt games. docker compose down stops the Compose deployment. Ctrl+C, SIGTERM, and SIGINT stop a native process; timers and sockets are closed during shutdown.

## Verification and troubleshooting

- /api/health should return JSON with status ok; this checks the HTTP process, not active rooms or every definition.
- /api/word/apple should return a valid word result. Definitions may be absent briefly while WordNet initializes; word-list validation remains available.
- Create a room in one browser and join it in another to verify WebSockets, ready checks, and turns.
- If a page loads but a room will not connect, check /socket.io forwarding, WebSocket support, proxy logs, and that every request reaches the same process.
- If Pass & Play rejects every request, ensure /api reaches the backend; serving client/dist by itself is not sufficient.
- A room-not-found response after restarting is expected because rooms are not persisted.
- Match imports must be version 1.0 JSON exports. Socket messages have a 256 KiB limit; very large match histories need to be reduced before import.
- Google Fonts are optional external requests; blocked font access does not prevent gameplay. To remove these requests, replace the links in client/index.html with locally hosted fonts or rely on system fallbacks.
- Public rooms have no account authentication. Use host/CDN connection and request limits for an internet-facing deployment; no automated scaling or abuse-management service is included.
