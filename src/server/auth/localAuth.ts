import { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import type { D1Database } from '@cloudflare/workers-types';
import jwt from 'jsonwebtoken';

const SESSION_TOKEN_COOKIE_NAME = 'session_token';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface LocalUser {
  id: string;
  email: string;
  name?: string;
  google_user_data?: {
    name?: string;
    email?: string;
    picture?: string;
  };
}

/**
 * Create a local auth middleware that checks for session token
 */
export function createLocalAuthMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    const sessionToken = getCookie(c, SESSION_TOKEN_COOKIE_NAME);
    
    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(sessionToken, JWT_SECRET) as any;
      
      // Get user from database
      const db = (c.env as any).DB;
      const { results } = await db.prepare(
        "SELECT * FROM users WHERE user_id = ?"
      ).bind(decoded.userId).all();

      if (results.length === 0) {
        return c.json({ error: 'User not found' }, 401);
      }

      const user = results[0] as any;
      
      // Attach user to context
      c.set('user', {
        id: user.user_id || user.id,
        email: user.email,
        name: user.name,
        google_user_data: user.google_user_data ? (typeof user.google_user_data === 'string' ? JSON.parse(user.google_user_data) : user.google_user_data) : undefined,
      } as LocalUser);

      await next();
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return c.json({ error: 'Invalid or expired token' }, 401);
      }
      return c.json({ error: 'Authentication failed' }, 401);
    }
  };
}

/**
 * Generate a session token for a user
 */
export function generateSessionToken(userId: string): string {
  return jwt.sign(
    { userId, exp: Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60) }, // 60 days
    JWT_SECRET
  );
}

/**
 * Get current user from session token
 */
export async function getCurrentUserFromToken(
  sessionToken: string,
  db: D1Database
): Promise<LocalUser | null> {
  try {
    const decoded = jwt.verify(sessionToken, JWT_SECRET) as any;
    
    const { results } = await db.prepare(
      "SELECT * FROM users WHERE user_id = ?"
    ).bind(decoded.userId).all();

    if (results.length === 0) {
      return null;
    }

    const user = results[0] as any;
    return {
      id: user.user_id || user.id,
      email: user.email,
      name: user.name,
      google_user_data: user.google_user_data ? (typeof user.google_user_data === 'string' ? JSON.parse(user.google_user_data) : user.google_user_data) : undefined,
    };
  } catch {
    return null;
  }
}

export { SESSION_TOKEN_COOKIE_NAME };

