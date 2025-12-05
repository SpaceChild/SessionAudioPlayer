import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getDatabase } from '../db/database';
import { requireAuth } from '../middleware/auth';
import type { AudioFile } from '../types';

const router = Router();
const AUDIO_PATH = process.env.AUDIO_PATH || '/audio';

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/stream/:fileId
 * Stream audio file with range support (for seeking)
 */
router.get('/:fileId', (req: Request, res: Response) => {
  const db = getDatabase();
  const { fileId } = req.params;

  try {
    // Get file from database
    const file = db
      .prepare('SELECT * FROM audio_files WHERE id = ? AND deleted = 0')
      .get(fileId) as AudioFile | undefined;

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Build full file path
    const filePath = path.join(AUDIO_PATH, file.file_path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audio file not found on disk' });
    }

    // Get file stats
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // Parse range header (for seeking support)
    const range = req.headers.range;

    if (range) {
      // Parse range: "bytes=start-end"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).set({
          'Content-Range': `bytes */${fileSize}`,
        });
        return res.end();
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': 'audio/mpeg',
      });

      fileStream.pipe(res);
    } else {
      // No range header - stream entire file
      res.set({
        'Content-Length': fileSize.toString(),
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
      });

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).json({ error: 'Failed to stream file' });
  }
});

export default router;
