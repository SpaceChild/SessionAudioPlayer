-- Audio files table
CREATE TABLE IF NOT EXISTS audio_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    file_path TEXT NOT NULL,
    duration_seconds INTEGER,
    file_size_bytes INTEGER,
    created_at DATETIME NOT NULL,
    modified_at DATETIME NOT NULL,
    last_scanned DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted INTEGER DEFAULT 0
);

-- Time marks table
CREATE TABLE IF NOT EXISTS time_marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audio_file_id INTEGER NOT NULL,
    time_seconds REAL NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (audio_file_id) REFERENCES audio_files(id) ON DELETE CASCADE
);

-- Authentication attempts table
CREATE TABLE IF NOT EXISTS auth_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    success INTEGER DEFAULT 0
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audio_files_created ON audio_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_files_deleted ON audio_files(deleted);
CREATE INDEX IF NOT EXISTS idx_time_marks_audio_file ON time_marks(audio_file_id, time_seconds ASC);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip ON auth_attempts(ip_address, attempt_time DESC);
