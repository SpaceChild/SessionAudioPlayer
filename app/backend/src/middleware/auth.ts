import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
  }
}

/**
 * Authentication middleware - protects routes
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.session.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

/**
 * Get client IP address (considering proxies)
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}
