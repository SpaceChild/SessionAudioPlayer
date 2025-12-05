# Session Audio Player

Web-based audio streaming player for managing and marking long MP3 sessions.

## Project Status

✅ **Phase 1 Complete**: Project Setup & Infrastructure
- Project structure created
- Docker configuration ready
- Caddy reverse proxy configured
- Environment variables secured

🚧 **Phase 2 In Progress**: Database Design & Backend Core

## Project Structure

```
SessionAudioPlayer/
├── app/
│   ├── frontend/         # React + Vite + TypeScript frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── backend/          # Express + TypeScript backend
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── docker/           # Docker configuration
│       └── Dockerfile
├── data/                 # SQLite database (not in git)
├── docker-compose.yml
├── .env                  # Environment secrets (not in git)
└── README.md
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Material-UI (MUI)
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite with better-sqlite3
- **Security**: Session-based auth, bcrypt, rate limiting
- **Deployment**: Docker, Caddy reverse proxy, CloudFlare DNS

## Features

- 🔐 Password-protected access with lockout after 3 failed attempts
- 🎵 Stream MP3 files from Nextcloud folder
- ⏱️ Create time marks with notes during playback
- 📱 Responsive mobile-first design
- 🔒 HTTPS-only access via CloudFlare + Caddy

## Setup

### Prerequisites

- Docker and Docker Compose
- Nextcloud with SessionAudio folder at: `/home/timbo/nextcloud/data/nextcloud/data/timbo/files/SessionAudio`
- Caddy running in `caddy-network`
- CloudFlare DNS configured

### Environment Variables

Create a `.env` file (already done, not in git):

```env
PASSWORD_HASH=<bcrypt hash>
SESSION_SECRET=<random 64-char hex string>
```

### Deployment

1. **Build and start the container:**
   ```bash
   docker compose up -d --build
   ```

2. **Reload Caddy configuration:**
   ```bash
   docker exec caddy caddy reload --config /etc/caddy/Caddyfile
   ```

3. **Access the application:**
   Open https://sessionaudio.spacechild.de

### Unlocking After Failed Attempts

If locked out after 3 failed login attempts:

```bash
docker exec sessionaudio sqlite3 /app/data/sessionaudio.db "DELETE FROM auth_attempts;"
```

## Development

The application is built as a single Docker container with:
- Multi-stage build (frontend → backend → production)
- Production-only dependencies in final image
- Health checks for monitoring

## Access URLs

- **Production**: https://sessionaudio.spacechild.de
- **Internal**: http://sessionaudio:3000 (within caddy-network)

## Next Steps

- Phase 2: Implement database schema and backend services
- Phase 3: Build frontend components
- Phase 4: Integration testing
- Phase 5: Documentation and deployment

## Security Notes

- The password is hashed with bcrypt (salt rounds: 10)
- Session cookies are httpOnly and secure
- Rate limiting prevents brute force attacks
- All traffic is HTTPS-only via Caddy
- `.env` file is excluded from git
