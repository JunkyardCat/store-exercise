import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthUser {
  id: number;
  role: 'customer' | 'admin';
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export const COOKIE_NAME = 'token';

export function signToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
}

export function setAuthCookie(res: Response, user: AuthUser) {
  res.cookie(COOKIE_NAME, signToken(user), {
    httpOnly: true, // JavaScript in the browser cannot read it
    sameSite: 'lax',
    secure: config.isProduction, // https only in production
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/** Attaches req.user if a valid cookie is present. Never blocks the request. */
export function loadUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as AuthUser;
      req.user = { id: payload.id, role: payload.role };
    } catch {
      // invalid or expired token: treat as logged out
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Please log in first.' });
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Please log in first.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only.' });
  next();
}
