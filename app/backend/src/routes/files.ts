import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { scanAudioFiles } from '../services/audioScanner';
import { requireAuth } from '../middleware/auth';
import type { AudioFile } from '../types';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/files
 * Get all audio files sorted by creation date (newest first)
 */
router.get('/', (req: Request, res: Response) => {
  const db = getDatabase();

  try {
    const files = db
      .prepare(
        `SELECT * FROM audio_files
         ORDER BY created_at DESC`
      )
      .all() as AudioFile[];

    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

/**
 * GET /api/files/:id
 * Get a single audio file by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  try {
    const file = db
      .prepare('SELECT * FROM audio_files WHERE id = ?')
      .get(id) as AudioFile | undefined;

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

/**
 * DELETE /api/files/:id
 * Delete file entry and all related time marks
 */
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  try {
    // Check if file exists
    const file = db
      .prepare('SELECT id FROM audio_files WHERE id = ?')
      .get(id) as Pick<AudioFile, 'id'> | undefined;

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete time marks (CASCADE should handle this, but explicit is safer)
    db.prepare('DELETE FROM time_marks WHERE audio_file_id = ?').run(id);

    // Delete file entry
    db.prepare('DELETE FROM audio_files WHERE id = ?').run(id);

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

/**
 * POST /api/files/scan
 * Trigger manual scan of audio directory
 */
router.post('/scan', async (req: Request, res: Response) => {
  try {
    const result = await scanAudioFiles();
    res.json(result);
  } catch (error) {
    console.error('Error scanning files:', error);
    res.status(500).json({ error: 'Failed to scan files' });
  }
});

export default router;
