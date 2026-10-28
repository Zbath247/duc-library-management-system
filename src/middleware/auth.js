import crypto from 'node:crypto';
import db from '../config/db.js';

const COOKIE_NAME = 'duc_session';
const SESSION_TTL_DAYS = 7;

/**
 * Creates a new session in SQLite and returns the token
 */
export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  const expiresAtIso = expiresAt.toISOString();

  const stmt = db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(token, userId, expiresAtIso);

  return { token, expiresAt };
}

/**
 * Deletes a session by token
 */
export function deleteSession(token) {
  if (!token) return;
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

/**
 * Cleanup expired sessions
 */
export function purgeExpiredSessions() {
  const nowIso = new Date().toISOString();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowIso);
}

/**
 * Express middleware to identify the current user via httpOnly cookie
 */
export function authenticate(req, res, next) {
  req.user = null;
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return next();
  }

  const stmt = db.prepare(`
    SELECT s.token, s.expires_at, u.id, u.username, u.full_name, u.role, u.member_id,
           m.card_number, m.name_km, m.name_en, m.type as member_type, m.status as member_status
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN members m ON u.member_id = m.id
    WHERE s.token = ?
  `);

  const row = stmt.get(token);
  if (!row) {
    res.clearCookie(COOKIE_NAME);
    return next();
  }

  // Check expiry
  if (new Date(row.expires_at) < new Date()) {
    deleteSession(token);
    res.clearCookie(COOKIE_NAME);
    return next();
  }

  req.user = {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    role: row.role,
    memberId: row.member_id,
    cardNumber: row.card_number,
    nameKm: row.name_km,
    nameEn: row.name_en,
    memberType: row.member_type,
    memberStatus: row.member_status
  };

  next();
}

/**
 * Middleware: Requires a logged in user
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Please log in.'
    });
  }
  next();
}

/**
 * Middleware: Role-Based Access Control
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Forbidden: role '${req.user.role}' lacks permission for this action.`
      });
    }

    next();
  };
}

export { COOKIE_NAME, SESSION_TTL_DAYS };
