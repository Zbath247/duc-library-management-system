import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { recordAudit } from '../middleware/audit.js';

const router = express.Router();

// Admin only endpoints for managing staff / user accounts
router.use(requireAuth, requireRoles('admin'));

/**
 * GET /api/users
 */
router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.role, u.member_id, u.created_at,
           m.card_number, m.name_km, m.name_en, m.type as member_type
    FROM users u
    LEFT JOIN members m ON u.member_id = m.id
    ORDER BY u.id ASC
  `).all();

  res.json({ success: true, data: users });
});

/**
 * POST /api/users
 */
router.post('/', (req, res) => {
  const { username, password, fullName, role, memberId } = req.body;

  if (!username || !password || !fullName || !role) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_FIELDS',
      message: 'Username, password, full name, and role are required.'
    });
  }

  if (!['admin', 'librarian', 'member'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_ROLE',
      message: 'Invalid role specified.'
    });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim());
  if (existing) {
    return res.status(400).json({
      success: false,
      error: 'USERNAME_TAKEN',
      message: 'Username is already taken.'
    });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, member_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(username.trim(), passwordHash, fullName.trim(), role, memberId || null);

  const newUserId = Number(result.lastInsertRowid);
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  recordAudit(req.user.id, 'CREATE_USER', 'users', newUserId, { username, role, fullName }, ip);

  res.status(201).json({
    success: true,
    message: 'User account created successfully',
    data: { id: newUserId, username, fullName, role }
  });
});

/**
 * PUT /api/users/:id
 */
router.put('/:id', (req, res) => {
  const userId = Number(req.params.id);
  const { fullName, role, memberId, password } = req.body;

  const target = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(userId);
  if (!target) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'User not found.' });
  }

  if (target.id === req.user.id && role && role !== 'admin') {
    return res.status(400).json({
      success: false,
      error: 'CANNOT_DEMOTE_SELF',
      message: 'You cannot remove your own admin privileges.'
    });
  }

  if (password && password.length >= 6) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(`
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          role = COALESCE(?, role),
          member_id = ?,
          password_hash = ?
      WHERE id = ?
    `).run(fullName || null, role || null, memberId !== undefined ? memberId : null, hash, userId);
  } else {
    db.prepare(`
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          role = COALESCE(?, role),
          member_id = ?
      WHERE id = ?
    `).run(fullName || null, role || null, memberId !== undefined ? memberId : null, userId);
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  recordAudit(req.user.id, 'UPDATE_USER', 'users', userId, { fullName, role }, ip);

  res.json({ success: true, message: 'User account updated successfully' });
});

/**
 * DELETE /api/users/:id
 */
router.delete('/:id', (req, res) => {
  const userId = Number(req.params.id);
  if (userId === req.user.id) {
    return res.status(400).json({
      success: false,
      error: 'CANNOT_DELETE_SELF',
      message: 'You cannot delete your own account.'
    });
  }

  const target = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
  if (!target) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'User not found.' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  recordAudit(req.user.id, 'DELETE_USER', 'users', userId, { username: target.username }, ip);

  res.json({ success: true, message: 'User deleted successfully' });
});

export default router;
