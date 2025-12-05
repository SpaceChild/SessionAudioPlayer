import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';
import { getDatabase } from '../db/database';
import type { AudioFile, ScanResult } from '../types';

const AUDIO_PATH = process.env.AUDIO_PATH || '/audio';

/**
 * Recursively scan directory for MP3 files
 */
function scanDirectory(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        files.push(...scanDirectory(fullPath));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.mp3')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }

  return files;
}

/**
 * Extract audio metadata from MP3 file
 */
async function extractMetadata(filePath: string): Promise<{
  duration: number | null;
  fileSize: number;
  created: Date;
  modified: Date;
}> {
  const stats = fs.statSync(filePath);
  let duration: number | null = null;

  try {
    const metadata = await parseFile(filePath);
    duration = metadata.format.duration || null;
  } catch (error) {
    console.warn(`Could not extract metadata from ${filePath}:`, error);
  }

  return {
    duration: duration ? Math.floor(duration) : null,
    fileSize: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
  };
}

/**
 * Scan audio folder and update database
 */
export async function scanAudioFiles(): Promise<ScanResult> {
  const db = getDatabase();
  console.log(`Scanning audio directory: ${AUDIO_PATH}`);

  if (!fs.existsSync(AUDIO_PATH)) {
    console.error(`Audio path does not exist: ${AUDIO_PATH}`);
    return { newFiles: 0, deletedFiles: 0, totalFiles: 0 };
  }

  // Scan directory for MP3 files
  const foundFiles = scanDirectory(AUDIO_PATH);
  console.log(`Found ${foundFiles.length} MP3 files`);

  let newFiles = 0;
  let updatedFiles = 0;

  // Process each found file
  for (const filePath of foundFiles) {
    const filename = path.basename(filePath);
    const relativePath = path.relative(AUDIO_PATH, filePath);

    // Check if file already exists in database
    const existing = db
      .prepare('SELECT id, deleted FROM audio_files WHERE filename = ?')
      .get(filename) as Pick<AudioFile, 'id' | 'deleted'> | undefined;

    if (existing) {
      // Update existing file (mark as not deleted and update scan time)
      if (existing.deleted === 1) {
        db.prepare(
          'UPDATE audio_files SET deleted = 0, last_scanned = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(existing.id);
        updatedFiles++;
      } else {
        db.prepare(
          'UPDATE audio_files SET last_scanned = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(existing.id);
      }
    } else {
      // Extract metadata and insert new file
      const metadata = await extractMetadata(filePath);

      db.prepare(
        `INSERT INTO audio_files
        (filename, file_path, duration_seconds, file_size_bytes, created_at, modified_at)
        VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        filename,
        relativePath,
        metadata.duration,
        metadata.fileSize,
        metadata.created.toISOString(),
        metadata.modified.toISOString()
      );

      newFiles++;
    }
  }

  // Mark files as deleted if they no longer exist
  const allDbFiles = db
    .prepare('SELECT id, file_path FROM audio_files WHERE deleted = 0')
    .all() as Pick<AudioFile, 'id' | 'file_path'>[];

  let deletedFiles = 0;
  for (const dbFile of allDbFiles) {
    const fullPath = path.join(AUDIO_PATH, dbFile.file_path);
    if (!fs.existsSync(fullPath)) {
      db.prepare('UPDATE audio_files SET deleted = 1 WHERE id = ?').run(
        dbFile.id
      );
      deletedFiles++;
    }
  }

  const totalFiles = db
    .prepare('SELECT COUNT(*) as count FROM audio_files')
    .get() as { count: number };

  console.log(
    `Scan complete: ${newFiles} new, ${updatedFiles} restored, ${deletedFiles} deleted, ${totalFiles.count} total`
  );

  return {
    newFiles,
    deletedFiles,
    totalFiles: totalFiles.count,
  };
}
