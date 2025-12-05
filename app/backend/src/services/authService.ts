import bcrypt from 'bcrypt';
import { getDatabase } from '../db/database';
import type { AuthAttempt } from '../types';

const PASSWORD_HASH = process.env.PASSWORD_HASH || '';
const MAX_FAILED_ATTEMPTS = 3;

/**
 * Check if system is locked due to too many failed attempts
 */
export function isSystemLocked(): boolean {
  const db = getDatabase();

  const failedAttempts = db
    .prepare(
      `SELECT COUNT(*) as count FROM auth_attempts
       WHERE success = 0`
    )
    .get() as { count: number };

  return failedAttempts.count >= MAX_FAILED_ATTEMPTS;
}

/**
 * Validate password against stored hash
 */
export async function validatePassword(password: string): Promise<boolean> {
  if (!PASSWORD_HASH) {
    console.error('PASSWORD_HASH environment variable not set');
    return false;
  }

  try {
    return await bcrypt.compare(password, PASSWORD_HASH);
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
}

/**
 * Record authentication attempt
 */
export function recordAuthAttempt(
  ipAddress: string,
  success: boolean
): void {
  const db = getDatabase();

  db.prepare(
    'INSERT INTO auth_attempts (ip_address, success) VALUES (?, ?)'
  ).run(ipAddress, success ? 1 : 0);

  console.log(
    `Auth attempt from ${ipAddress}: ${success ? 'SUCCESS' : 'FAILED'}`
  );
}

/**
 * Get number of failed attempts
 */
export function getFailedAttempts(): number {
  const db = getDatabase();

  const result = db
    .prepare('SELECT COUNT(*) as count FROM auth_attempts WHERE success = 0')
    .get() as { count: number };

  return result.count;
}

/**
 * Clear all authentication attempts (used for unlocking)
 */
export function clearAuthAttempts(): void {
  const db = getDatabase();
  db.prepare('DELETE FROM auth_attempts').run();
  console.log('All auth attempts cleared');
}

/**
 * Get recent authentication attempts for monitoring
 */
export function getRecentAttempts(limit: number = 10): AuthAttempt[] {
  const db = getDatabase();

  return db
    .prepare(
      `SELECT * FROM auth_attempts
       ORDER BY attempt_time DESC
       LIMIT ?`
    )
    .all(limit) as AuthAttempt[];
}
