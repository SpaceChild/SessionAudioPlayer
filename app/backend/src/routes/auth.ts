import { Router, Request, Response } from 'express';
import {
  validatePassword,
  recordAuthAttempt,
  isSystemLocked,
  getFailedAttempts,
} from '../services/authService';
import { getClientIp } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/auth/login
 * Login with password
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const { password } = req.body;
  const clientIp = getClientIp(req);

  // Check if system is locked
  if (isSystemLocked()) {
    return res.status(403).json({
      error: 'System locked due to too many failed attempts',
      locked: true,
    });
  }

  // Validate password
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  const isValid = await validatePassword(password);

  if (isValid) {
    // Success - set session and record attempt
    req.session.authenticated = true;
    recordAuthAttempt(clientIp, true);

    return res.json({
      success: true,
      message: 'Login successful',
    });
  } else {
    // Failed - record attempt and check if locked now
    recordAuthAttempt(clientIp, false);
    const failedCount = getFailedAttempts();
    const isLocked = isSystemLocked();

    return res.status(401).json({
      error: 'Invalid password',
      failedAttempts: failedCount,
      locked: isLocked,
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout and destroy session
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out' });
  });
});

/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get('/status', (req: Request, res: Response) => {
  // In development mode, always return authenticated
  const isAuthenticated = process.env.NODE_ENV === 'development'
    ? true
    : (req.session.authenticated || false);

  res.json({
    authenticated: isAuthenticated,
    locked: isSystemLocked(),
  });
});

/**
 * GET /api/auth/locked
 * Check if system is locked
 */
router.get('/locked', (req: Request, res: Response) => {
  res.json({
    locked: isSystemLocked(),
    failedAttempts: getFailedAttempts(),
  });
});

export default router;
