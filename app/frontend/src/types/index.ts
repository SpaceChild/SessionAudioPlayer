export interface AudioFile {
  id: number;
  filename: string;
  file_path: string;
  duration_seconds: number | null;
  file_size_bytes: number;
  created_at: string;
  modified_at: string;
  last_scanned: string;
  deleted: number; // 0 or 1
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

export interface LoginResponse {
  success?: boolean;
  message?: string;
  error?: string;
  failedAttempts?: number;
  locked?: boolean;
}

export interface ScanResult {
  newFiles: number;
  deletedFiles: number;
  totalFiles: number;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}
