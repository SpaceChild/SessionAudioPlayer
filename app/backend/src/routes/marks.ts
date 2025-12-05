import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { requireAuth } from '../middleware/auth';
import type { TimeMark } from '../types';

const router = Router();

// All routes require authentication
router.use(requireAuth);

const MAX_NOTE_LENGTH = 200; // As per decision

/**
 * GET /api/marks/:fileId
 * Get all time marks for a specific audio file (sorted by time ascending)
 */
router.get('/:fileId', (req: Request, res: Response) => {
  const db = getDatabase();
  const { fileId } = req.params;

  try {
    const marks = db
      .prepare(
        `SELECT * FROM time_marks
         WHERE audio_file_id = ?
         ORDER BY time_seconds ASC`
      )
      .all(fileId) as TimeMark[];

    res.json(marks);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ error: 'Failed to fetch marks' });
  }
});

/**
 * POST /api/marks
 * Create a new time mark
 */
router.post('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const { audio_file_id, time_seconds, note } = req.body;

  // Validate input
  if (!audio_file_id || time_seconds === undefined) {
    return res.status(400).json({
      error: 'audio_file_id and time_seconds are required',
    });
  }

  if (typeof time_seconds !== 'number' || time_seconds < 0) {
    return res.status(400).json({
      error: 'time_seconds must be a positive number',
    });
  }

  // Validate note length
  const trimmedNote = (note || '').trim();
  if (trimmedNote.length > MAX_NOTE_LENGTH) {
    return res.status(400).json({
      error: `Note must be ${MAX_NOTE_LENGTH} characters or less`,
    });
  }

  try {
    // Check if audio file exists
    const fileExists = db
      .prepare('SELECT id FROM audio_files WHERE id = ?')
      .get(audio_file_id);

    if (!fileExists) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Insert mark
    const result = db
      .prepare(
        `INSERT INTO time_marks (audio_file_id, time_seconds, note)
         VALUES (?, ?, ?)`
      )
      .run(audio_file_id, time_seconds, trimmedNote);

    // Fetch the created mark
    const mark = db
      .prepare('SELECT * FROM time_marks WHERE id = ?')
      .get(result.lastInsertRowid) as TimeMark;

    res.status(201).json(mark);
  } catch (error) {
    console.error('Error creating mark:', error);
    res.status(500).json({ error: 'Failed to create mark' });
  }
});

/**
 * DELETE /api/marks/:id
 * Delete a time mark
 */
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  try {
    // Check if mark exists
    const mark = db
      .prepare('SELECT id FROM time_marks WHERE id = ?')
      .get(id);

    if (!mark) {
      return res.status(404).json({ error: 'Mark not found' });
    }

    // Delete mark
    db.prepare('DELETE FROM time_marks WHERE id = ?').run(id);

    res.json({ success: true, message: 'Mark deleted' });
  } catch (error) {
    console.error('Error deleting mark:', error);
    res.status(500).json({ error: 'Failed to delete mark' });
  }
});

export default router;
