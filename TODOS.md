# Session Audio Player - Implementation Plan

## Architecture Overview

### Technology Stack Decisions

#### Frontend Framework
**Options Considered:**
1. **React + Vite** ✅ RECOMMENDED
   - Advantages: Modern, fast, excellent mobile support, large ecosystem, TypeScript support
   - Disadvantages: Requires build step, larger learning curve

2. **Vue.js + Vite**
   - Advantages: Simpler syntax, good mobile support
   - Disadvantages: Smaller ecosystem than React

3. **Vanilla JavaScript**
   - Advantages: No dependencies, simple
   - Disadvantages: More manual work, harder to maintain complex state

**Recommendation: React + Vite + TypeScript**

#### UI Component Library
**Options Considered:**
1. **Material-UI (MUI)** ✅ RECOMMENDED
   - Advantages: Complete component set, excellent mobile support, professional look
   - Disadvantages: Slightly larger bundle size

2. **Tailwind CSS**
   - Advantages: Highly customizable, small bundle
   - Disadvantages: More manual styling work

**Recommendation: Material-UI for rapid development and mobile-first design**

#### Backend Framework
**Options Considered:**
1. **Node.js + Express + TypeScript** ✅ RECOMMENDED
   - Advantages: JavaScript everywhere, streaming support, large ecosystem
   - Disadvantages: Single-threaded (but sufficient for single user)

2. **Python + FastAPI**
   - Advantages: Excellent for file operations
   - Disadvantages: Different language from frontend

3. **Go + Fiber**
   - Advantages: Very performant, compiled binary
   - Disadvantages: Different language, smaller ecosystem for this use case

**Recommendation: Node.js + Express + TypeScript**

#### Database
**Options Considered:**
1. **SQLite** ✅ RECOMMENDED
   - Advantages: Zero-config, file-based, perfect for single-user, built-in with Node.js
   - Disadvantages: No concurrent writes (not needed here)

2. **PostgreSQL**
   - Advantages: More features
   - Disadvantages: Overkill for this use case, requires separate container

**Recommendation: SQLite with better-sqlite3 package**

#### Authentication
**Options Considered:**
1. **JWT + Rate Limiting**
   - Advantages: Stateless, modern
   - Disadvantages: More complex

2. **Session-based + Rate Limiting** ✅ RECOMMENDED
   - Advantages: Simpler, easier to implement lockout
   - Disadvantages: Requires session storage

**Recommendation: Session-based with express-session + rate limiting**

#### Container Strategy
**Options Considered:**
1. **Single Container (Frontend + Backend)** ✅ RECOMMENDED
   - Advantages: Simpler deployment, single docker-compose.yml, easier to manage
   - Disadvantages: Couples frontend and backend

2. **Separate Containers**
   - Advantages: Better separation of concerns
   - Disadvantages: More complex, unnecessary for single-user app

**Recommendation: Single container with Node.js serving built frontend + API**

---

## Implementation Steps

### Phase 1: Project Setup & Infrastructure

#### Step 1.1: Initialize Project Structure
- [ ] Create project directory: `/home/timbo/Dev/SessionAudioPlayer/app`
- [ ] Initialize Node.js project with TypeScript
- [ ] Set up Vite + React + TypeScript for frontend
- [ ] Create folder structure:
  ```
  /home/timbo/Dev/SessionAudioPlayer/
  ├── app/
  │   ├── frontend/         # React + Vite frontend
  │   │   ├── src/
  │   │   ├── public/
  │   │   ├── package.json
  │   │   └── vite.config.ts
  │   ├── backend/          # Express backend
  │   │   ├── src/
  │   │   ├── package.json
  │   │   └── tsconfig.json
  │   └── docker/           # Docker configuration
  │       ├── Dockerfile
  │       └── docker-compose.yml
  ├── data/                 # SQLite database & persistent data
  ├── REQUIREMENTS.md
  ├── PLAN.md
  └── TODOS.md
  ```

#### Step 1.2: Docker Configuration
- [ ] Create Dockerfile with multi-stage build:
  - Stage 1: Build frontend (Node.js + Vite)
  - Stage 2: Build backend TypeScript
  - Stage 3: Production image (Node.js slim)
- [ ] Create docker-compose.yml:
  - Service name: `sessionaudio`
  - Mount: `/home/timbo/nextcloud/data/nextcloud/data/timbo/files/SessionAudio:/audio:ro` (read-only)
  - Mount: `./data:/app/data` (for SQLite database)
  - Network: Join `caddy-network` (external)
  - Port: Internal 3000 (not exposed to host)
  - Environment variables:
    - `PASSWORD_HASH` (bcrypt hash of password)
    - `SESSION_SECRET` (random secret for session signing)
    - `AUDIO_PATH=/audio`
    - `DB_PATH=/app/data/sessionaudio.db`

#### Step 1.3: Caddy Configuration
- [ ] Add new domain to `/home/timbo/nextcloud/caddy/Caddyfile`:
  ```
  sessionaudio.spacechild.de {
      tls {
          dns cloudflare {$CLOUDFLARE_API_TOKEN}
      }
      reverse_proxy sessionaudio:3000 {
          header_up X-Real-IP {remote_host}
          header_up X-Forwarded-For {remote_host}
          header_up X-Forwarded-Proto {scheme}
          header_up X-Forwarded-Host {host}
      }
      header {
          Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
      }
      log {
          output file /data/sessionaudio-access.log
      }
  }
  ```

#### Step 1.4: CloudFlare DNS
- [ ] Add DNS record in CloudFlare:
  - Type: CNAME
  - Name: `sessionaudio`
  - Target: `cloud.spacechild.de`
  - Proxy status: DNS only (orange cloud off)

---

### Phase 2: Database Design & Backend Core

#### Step 2.1: Database Schema Design
- [ ] Create database schema:
  ```sql
  -- Audio files table
  CREATE TABLE audio_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      file_path TEXT NOT NULL,
      duration_seconds INTEGER,
      file_size_bytes INTEGER,
      created_at DATETIME NOT NULL,
      modified_at DATETIME NOT NULL,
      last_scanned DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted BOOLEAN DEFAULT 0
  );

  -- Time marks table
  CREATE TABLE time_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audio_file_id INTEGER NOT NULL,
      time_seconds REAL NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (audio_file_id) REFERENCES audio_files(id) ON DELETE CASCADE
  );

  -- Authentication attempts table
  CREATE TABLE auth_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      success BOOLEAN DEFAULT 0
  );

  -- System settings table
  CREATE TABLE system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
  );

  -- Indexes for performance
  CREATE INDEX idx_audio_files_created ON audio_files(created_at DESC);
  CREATE INDEX idx_time_marks_audio_file ON time_marks(audio_file_id, time_seconds ASC);
  CREATE INDEX idx_auth_attempts_ip ON auth_attempts(ip_address, attempt_time DESC);
  ```

#### Step 2.2: Backend Dependencies
- [ ] Install backend dependencies:
  ```json
  {
    "dependencies": {
      "express": "^4.18.x",
      "express-session": "^1.17.x",
      "express-rate-limit": "^7.1.x",
      "better-sqlite3": "^9.2.x",
      "bcrypt": "^5.1.x",
      "music-metadata": "^8.1.x",
      "cors": "^2.8.x",
      "helmet": "^7.1.x",
      "compression": "^1.7.x"
    },
    "devDependencies": {
      "@types/express": "^4.17.x",
      "@types/express-session": "^1.17.x",
      "@types/better-sqlite3": "^7.6.x",
      "@types/bcrypt": "^5.0.x",
      "@types/cors": "^2.8.x",
      "@types/compression": "^1.7.x",
      "typescript": "^5.3.x",
      "tsx": "^4.7.x",
      "nodemon": "^3.0.x"
    }
  }
  ```

#### Step 2.3: Backend Core Services
- [ ] Create `backend/src/db/database.ts`:
  - SQLite connection manager
  - Database initialization
  - Schema migration on startup

- [ ] Create `backend/src/services/audioScanner.ts`:
  - Scan `/audio` folder for .mp3 files recursively
  - Extract metadata (duration, file size, creation date) using `music-metadata`
  - Insert new files into `audio_files` table
  - Mark files as deleted if they no longer exist
  - Return scan results

- [ ] Create `backend/src/services/authService.ts`:
  - Check login attempts
  - Validate password against hash
  - Record auth attempts
  - Check if system is locked (>= 3 failed attempts)
  - Provide unlock mechanism (manual DB update)

#### Step 2.4: Backend API Routes
- [ ] Create `backend/src/routes/auth.ts`:
  - `POST /api/auth/login` - Login with password
  - `POST /api/auth/logout` - Logout
  - `GET /api/auth/status` - Check if logged in
  - `GET /api/auth/locked` - Check if system is locked

- [ ] Create `backend/src/routes/files.ts`:
  - `GET /api/files` - Get all audio files (sorted by created_at DESC)
  - `DELETE /api/files/:id` - Delete file entry and all time marks
  - `POST /api/files/scan` - Trigger manual scan

- [ ] Create `backend/src/routes/marks.ts`:
  - `GET /api/marks/:fileId` - Get all marks for a file
  - `POST /api/marks` - Create new time mark
  - `DELETE /api/marks/:id` - Delete time mark

- [ ] Create `backend/src/routes/stream.ts`:
  - `GET /api/stream/:fileId` - Stream audio file with range support

#### Step 2.5: Backend Middleware
- [ ] Create authentication middleware:
  - Check session for authentication
  - Protect all routes except `/api/auth/*`

- [ ] Create rate limiting middleware:
  - Limit login attempts (5 per 15 minutes per IP)
  - General API rate limit (100 requests per minute)

- [ ] Create security middleware:
  - Helmet for security headers
  - CORS configuration
  - Compression for responses

---

### Phase 3: Frontend Development

#### Step 3.1: Frontend Dependencies
- [ ] Install frontend dependencies:
  ```json
  {
    "dependencies": {
      "react": "^18.2.x",
      "react-dom": "^18.2.x",
      "react-router-dom": "^6.21.x",
      "@mui/material": "^5.15.x",
      "@mui/icons-material": "^5.15.x",
      "@emotion/react": "^11.11.x",
      "@emotion/styled": "^11.11.x",
      "axios": "^1.6.x"
    },
    "devDependencies": {
      "@types/react": "^18.2.x",
      "@types/react-dom": "^18.2.x",
      "@vitejs/plugin-react": "^4.2.x",
      "typescript": "^5.3.x",
      "vite": "^5.0.x"
    }
  }
  ```

#### Step 3.2: Frontend Project Structure
- [ ] Create folder structure:
  ```
  frontend/src/
  ├── components/
  │   ├── LoginForm.tsx
  │   ├── FileList.tsx
  │   ├── FileListItem.tsx
  │   ├── Player.tsx
  │   ├── PlayerControls.tsx
  │   ├── TimeSlider.tsx
  │   ├── MarkButton.tsx
  │   ├── MarkList.tsx
  │   ├── MarkListItem.tsx
  │   ├── MarkDialog.tsx
  │   └── ContextMenu.tsx
  ├── pages/
  │   ├── LoginPage.tsx
  │   ├── FilesPage.tsx
  │   └── PlayerPage.tsx
  ├── services/
  │   ├── api.ts
  │   └── audioService.ts
  ├── hooks/
  │   ├── useAuth.ts
  │   ├── useAudioPlayer.ts
  │   └── useContextMenu.ts
  ├── types/
  │   └── index.ts
  ├── App.tsx
  └── main.tsx
  ```

#### Step 3.3: TypeScript Types
- [ ] Create `frontend/src/types/index.ts`:
  ```typescript
  export interface AudioFile {
    id: number;
    filename: string;
    file_path: string;
    duration_seconds: number;
    file_size_bytes: number;
    created_at: string;
    modified_at: string;
    deleted: boolean;
  }

  export interface TimeMark {
    id: number;
    audio_file_id: number;
    time_seconds: number;
    note: string;
    created_at: string;
  }

  export interface AuthStatus {
    authenticated: boolean;
    locked: boolean;
  }
  ```

#### Step 3.4: API Service Layer
- [ ] Create `frontend/src/services/api.ts`:
  - Axios instance with base URL
  - Request/response interceptors
  - Error handling
  - Methods for all API endpoints:
    - `login(password: string)`
    - `logout()`
    - `getAuthStatus()`
    - `getFiles()`
    - `deleteFile(id: number)`
    - `scanFiles()`
    - `getMarks(fileId: number)`
    - `createMark(fileId: number, timeSeconds: number, note: string)`
    - `deleteMark(id: number)`
    - `getStreamUrl(fileId: number)`

#### Step 3.5: Authentication Flow
- [ ] Create `frontend/src/hooks/useAuth.ts`:
  - Authentication state management
  - Login/logout functions
  - Check lock status

- [ ] Create `frontend/src/pages/LoginPage.tsx`:
  - Password input field
  - Login button
  - Error messages (wrong password, locked)
  - Show lock message if locked

#### Step 3.6: File List View
- [ ] Create `frontend/src/pages/FilesPage.tsx`:
  - Main container with AppBar
  - Scan button in toolbar
  - File list component
  - Navigation to player on item click

- [ ] Create `frontend/src/components/FileList.tsx`:
  - List container
  - Render FileListItem for each file
  - Handle empty state

- [ ] Create `frontend/src/components/FileListItem.tsx`:
  - Display filename (bold) and creation date
  - Gray out if deleted
  - Click handler (navigate to player if not deleted)
  - Long-press/right-click handler

- [ ] Create `frontend/src/components/ContextMenu.tsx`:
  - Generic context menu component
  - Position at cursor/touch point
  - "Delete" option
  - Close on outside click

#### Step 3.7: Audio Player
- [ ] Create `frontend/src/hooks/useAudioPlayer.ts`:
  - Audio element management
  - Play/pause state
  - Current time tracking
  - Duration
  - Seek functionality
  - Event listeners (timeupdate, ended, error)

- [ ] Create `frontend/src/pages/PlayerPage.tsx`:
  - Layout: header with filename, player controls, mark list
  - Load file data and marks on mount
  - Pass audio player state to child components

- [ ] Create `frontend/src/components/PlayerControls.tsx`:
  - Play/Pause button (IconButton)
  - Responsive layout

- [ ] Create `frontend/src/components/TimeSlider.tsx`:
  - MUI Slider component
  - Current time display (left, hh:mm:ss)
  - Remaining time display (right, -hh:mm:ss)
  - Seek on slider change
  - Update slider on timeupdate

- [ ] Create `frontend/src/components/MarkButton.tsx`:
  - Prominent FAB (Floating Action Button)
  - Click handler: create mark at current time
  - Open MarkDialog on click

- [ ] Create `frontend/src/components/MarkDialog.tsx`:
  - Dialog with text input for note
  - Save button (creates mark via API)
  - Cancel button
  - Keep playing while dialog is open

#### Step 3.8: Marks List
- [ ] Create `frontend/src/components/MarkList.tsx`:
  - List container
  - Render MarkListItem for each mark
  - Sorted by time ascending
  - Handle empty state

- [ ] Create `frontend/src/components/MarkListItem.tsx`:
  - Display time (bold, hh:mm:ss) and note (truncated with "...")
  - Click handler: seek to time and play
  - Long-press/right-click handler for delete

#### Step 3.9: Responsive Design
- [ ] Ensure mobile-first design:
  - Touch-friendly button sizes (min 48px)
  - Responsive typography
  - Mobile-optimized list items
  - Bottom navigation for mobile
  - Swipe gestures consideration

- [ ] Test on different screen sizes:
  - Mobile (320px - 480px)
  - Tablet (481px - 768px)
  - Desktop (769px+)

---

### Phase 4: Integration & Testing

#### Step 4.1: Backend Integration
- [ ] Create `backend/src/server.ts`:
  - Express app setup
  - Middleware registration
  - Route registration
  - Static file serving (built frontend)
  - Error handling
  - Start server on port 3000

- [ ] Create startup script:
  - Initialize database
  - Run initial scan
  - Start server

#### Step 4.2: Docker Build & Deploy
- [ ] Create multi-stage Dockerfile:
  ```dockerfile
  # Stage 1: Build frontend
  FROM node:20-alpine AS frontend-build
  WORKDIR /app/frontend
  COPY frontend/package*.json ./
  RUN npm ci
  COPY frontend/ ./
  RUN npm run build

  # Stage 2: Build backend
  FROM node:20-alpine AS backend-build
  WORKDIR /app/backend
  COPY backend/package*.json ./
  RUN npm ci
  COPY backend/ ./
  RUN npm run build

  # Stage 3: Production
  FROM node:20-alpine
  WORKDIR /app

  # Install production dependencies
  COPY backend/package*.json ./
  RUN npm ci --only=production

  # Copy built files
  COPY --from=backend-build /app/backend/dist ./dist
  COPY --from=frontend-build /app/frontend/dist ./public

  # Create data directory
  RUN mkdir -p /app/data

  EXPOSE 3000
  CMD ["node", "dist/server.js"]
  ```

- [ ] Create docker-compose.yml:
  ```yaml
  version: '3.8'

  services:
    sessionaudio:
      build:
        context: ./app
        dockerfile: ../docker/Dockerfile
      container_name: sessionaudio
      restart: unless-stopped
      user: "33:33"  # www-data (same as Nextcloud)
      volumes:
        # Audio files from Nextcloud (read-only)
        - /home/timbo/nextcloud/data/nextcloud/data/timbo/files/SessionAudio:/audio:ro
        # Database and persistent data
        - ./data:/app/data
      environment:
        - NODE_ENV=production
        - PASSWORD_HASH=${PASSWORD_HASH}
        - SESSION_SECRET=${SESSION_SECRET}
        - AUDIO_PATH=/audio
        - DB_PATH=/app/data/sessionaudio.db
        - PORT=3000
      networks:
        - caddy-network

  networks:
    caddy-network:
      external: true
      name: caddy-network
  ```

- [ ] Create `.env` file with secure values:
  - Generate PASSWORD_HASH (using bcrypt)
  - Generate SESSION_SECRET (random 64-char string)

#### Step 4.3: Testing Checklist
- [ ] **Authentication**:
  - [ ] Correct password allows login
  - [ ] Wrong password shows error
  - [ ] 3 failed attempts locks system
  - [ ] Locked system shows lock message
  - [ ] Session persists on page refresh
  - [ ] Logout works correctly

- [ ] **File List**:
  - [ ] Files appear after scan
  - [ ] Files sorted by date descending
  - [ ] Deleted files shown grayed out
  - [ ] Right-click shows context menu (desktop)
  - [ ] Long-press shows context menu (mobile)
  - [ ] Delete removes file from list
  - [ ] Cannot play deleted files

- [ ] **Audio Player**:
  - [ ] Audio streams correctly
  - [ ] Play/pause works
  - [ ] Time displays update correctly
  - [ ] Slider reflects current position
  - [ ] Slider seeking works
  - [ ] Audio continues after seeking
  - [ ] Range requests work (seek without reloading)

- [ ] **Time Marks**:
  - [ ] Mark button creates mark at current time
  - [ ] Dialog allows adding note
  - [ ] Audio keeps playing during dialog
  - [ ] Marks appear in list sorted by time
  - [ ] Long notes truncated with "..."
  - [ ] Clicking mark seeks to that time
  - [ ] Right-click/long-press shows delete option
  - [ ] Deleting mark removes from list

- [ ] **Mobile Responsiveness**:
  - [ ] Touch targets are large enough
  - [ ] Layout adapts to screen size
  - [ ] Long-press works on mobile
  - [ ] Landscape mode works

- [ ] **Security**:
  - [ ] HTTPS only (redirects HTTP to HTTPS)
  - [ ] Protected routes require authentication
  - [ ] Session cookie is httpOnly and secure
  - [ ] Rate limiting works
  - [ ] No directory listing on audio folder

#### Step 4.4: Deployment
- [ ] Build Docker image:
  ```bash
  cd /home/timbo/Dev/SessionAudioPlayer
  docker compose build
  ```

- [ ] Start container:
  ```bash
  docker compose up -d
  ```

- [ ] Update Caddy configuration:
  ```bash
  docker exec caddy caddy reload --config /etc/caddy/Caddyfile
  ```

- [ ] Verify DNS:
  ```bash
  nslookup sessionaudio.spacechild.de
  ```

- [ ] Test access:
  - Open `https://sessionaudio.spacechild.de`
  - Verify HTTPS certificate
  - Test login
  - Upload test MP3 to Nextcloud SessionAudio folder
  - Scan and verify file appears

---

### Phase 5: Documentation & Maintenance

#### Step 5.1: Documentation
- [ ] Create `README.md` with:
  - Project description
  - Architecture overview
  - Setup instructions
  - Environment variables
  - How to unlock after 3 failed attempts
  - How to change password
  - Troubleshooting

- [ ] Create `DEPLOYMENT.md` with:
  - Build instructions
  - Deployment steps
  - Updating the application
  - Backup procedures (SQLite database)

#### Step 5.2: Backup Strategy
- [ ] Document backup of:
  - SQLite database (`/home/timbo/Dev/SessionAudioPlayer/data/sessionaudio.db`)
  - Audio files (already in Nextcloud, backed up)

#### Step 5.3: Monitoring
- [ ] Add to existing monitoring (if any)
- [ ] Check logs: `docker logs sessionaudio`
- [ ] Monitor disk space for SQLite database

---

## Questions for User (Please Answer)

### 1. Password Decision
**Question**: What password would you like to use for the webapp?

**Why**: I need to generate the PASSWORD_HASH for the .env file.

**Action**: Once you provide the password, I'll generate the bcrypt hash.

---

### 2. Audio Streaming Format
**Question**: Should the webapp transcode MP3 files on-the-fly, or stream them as-is?

**Options**:
- **Option A: Stream as-is** ✅ RECOMMENDED
  - Advantages: Lower CPU usage, faster streaming, simpler implementation
  - Disadvantages: Client must support MP3 codec (all modern browsers do)

- **Option B: Transcode to AAC/Opus**
  - Advantages: Better compression, modern codec
  - Disadvantages: Higher CPU load on Raspberry Pi, added complexity

**Recommendation**: Option A (stream as-is) unless you have specific codec requirements.

---

### 3. File Scan Behavior
**Question**: Should the webapp automatically scan for new files on startup, or only on manual scan?

**Options**:
- **Option A: Scan on startup + manual scan** ✅ RECOMMENDED
  - Advantages: Always up-to-date, no manual intervention needed
  - Disadvantages: Slightly slower startup time

- **Option B: Manual scan only**
  - Advantages: Faster startup
  - Disadvantages: Must remember to scan after uploading files

**Recommendation**: Option A (auto-scan on startup + manual button)

---

### 4. Mark Note Length Limit
**Question**: Should there be a character limit for mark notes?

**Options**:
- **Option A: 500 characters**
  - Advantages: Reasonable length for descriptions
  - Disadvantages: None

- **Option B: No limit**
  - Advantages: Maximum flexibility
  - Disadvantages: Could impact UI rendering, database size

**Recommendation**: Option A (500 character limit)

---

### 5. Unlock Mechanism
**Question**: How should you unlock the webapp after 3 failed login attempts?

**Options**:
- **Option A: Direct SQLite modification** ✅ SIMPLEST
  - Command: `docker exec sessionaudio sqlite3 /app/data/sessionaudio.db "DELETE FROM auth_attempts;"`
  - Advantages: Simple, direct
  - Disadvantages: Requires command-line access

- **Option B: Time-based unlock (e.g., 1 hour)**
  - Advantages: Automatic recovery
  - Disadvantages: Security risk, more complex

- **Option C: Environment variable "master key"**
  - Advantages: Can unlock without DB access
  - Disadvantages: Additional secret to manage

**Recommendation**: Option A (direct SQLite modification)

---

## Implementation Timeline Estimate

**Note**: These are sequential steps. Each phase builds on the previous one.

1. **Phase 1 (Project Setup)**: 2-3 hours
2. **Phase 2 (Backend)**: 4-6 hours
3. **Phase 3 (Frontend)**: 6-8 hours
4. **Phase 4 (Integration)**: 2-3 hours
5. **Phase 5 (Documentation)**: 1-2 hours

**Total**: ~15-22 hours of development time

---

## Next Steps

1. **Answer the 5 questions above**
2. **Review and approve this plan**
3. **Begin implementation following the checklist**

Once you approve, we can start with Phase 1: Project Setup & Infrastructure.
