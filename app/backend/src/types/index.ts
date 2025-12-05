export interface AudioFile {
  id: number;
  filename: string;
  file_path: string;
  duration_seconds: number | null;
  file_size_bytes: number;
  created_at: string;
  modified_at: string;
  last_scanned: string;
  deleted: number; // SQLite uses 0/1 for boolean
}

export interface TimeMark {
  id: number;
  audio_file_id: number;
  time_seconds: number;
  note: string;
  created_at: string;
}

export interface AuthAttempt {
  id: number;
  ip_address: string;
  attempt_time: string;
  success: number; // SQLite uses 0/1 for boolean
}

export interface SystemSetting {
  key: string;
  value: string;
}

export interface ScanResult {
  newFiles: number;
  deletedFiles: number;
  totalFiles: number;
}
