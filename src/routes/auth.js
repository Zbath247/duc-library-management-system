import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { createSession, deleteSession, requireAuth, COOKIE_NAME, SESSION_TTL_DAYS } from '../middleware/auth.js';
import { recordAudit } from '../middleware/audit.js';

const router = express.Router();

/**
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_FIELDS',
      message: 'Both username and password are required.'
    });
  }

  const stmt = db.prepare(`
    SELECT u.id, u.username, u.password_hash, u.full_name, u.role, u.member_id,
           m.card_number, m.name_km, m.name_en, m.type as member_type, m.status as member_status
    FROM users u
    LEFT JOIN members m ON u.member_id = m.id
    WHERE LOWER(u.username) = LOWER(?)
  `);

  const user = stmt.get(username.trim());
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password.'
    });
  }

  const passwordValid = bcrypt.compareSync(password, user.password_hash);
  if (!passwordValid) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password.'
    });
  }

  if (user.member_status === 'suspended') {
    return res.status(403).json({
      success: false,
      error: 'ACCOUNT_SUSPENDED',
      message: 'Your member account is currently suspended. Please contact the library administration.'
    });
  }

  // Create session
  const { token, expiresAt } = createSession(user.id);

  // Set httpOnly cookie
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  });

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  recordAudit(user.id, 'USER_LOGIN', 'users', user.id, { username: user.username, role: user.role }, ip);

  res.json({
    success: true,
    message: 'Logged in successfully',
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      memberId: user.member_id,
      cardNumber: user.card_number,
      nameKm: user.name_km,
      nameEn: user.name_en,
      memberType: user.member_type,
      memberStatus: user.member_status
    }
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    deleteSession(token);
    if (req.user) {
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      recordAudit(req.user.id, 'USER_LOGOUT', 'users', req.user.id, null, ip);
    }
  }

  res.clearCookie(COOKIE_NAME);
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }

  res.json({
    success: true,
    authenticated: true,
    user: req.user
  });
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_FIELDS',
      message: 'Both current password and new password are required.'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'PASSWORD_TOO_SHORT',
      message: 'New password must be at least 6 characters long.'
    });
  }

  const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_CURRENT_PASSWORD',
      message: 'Current password is incorrect.'
    });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  recordAudit(req.user.id, 'CHANGE_PASSWORD', 'users', req.user.id, null, ip);

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

export default router;
