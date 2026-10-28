import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

import db from './src/config/db.js';
import { runSeed } from './src/db/seed.js';
import { authenticate, purgeExpiredSessions } from './src/middleware/auth.js';
import authRoutes from './src/routes/auth.js';
import usersRoutes from './src/routes/users.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = Boolean(process.env.VERCEL);

// Ensure runtime directories exist
const uploadDir = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'public', 'uploads');
const backupsDir = isVercel ? path.join('/tmp', 'backups') : path.join(__dirname, 'backups');

try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
} catch (err) {
  console.warn('[Server] Directory creation warning:', err.message);
}

// Auto-initialize SQLite database if empty (ensures Vercel cold starts have data)
try {
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (!tableCheck) {
    console.log('[DB] Initializing database tables and seed data...');
    runSeed();
  }
} catch (err) {
  console.error('[DB Setup Error]', err);
}

// Core middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Identify user from session cookie
app.use(authenticate);

// Static assets
app.use(express.static(path.join(__dirname, 'public')));
if (fs.existsSync(uploadDir)) {
  app.use('/uploads', express.static(uploadDir));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: isVercel ? 'vercel-serverless' : 'standalone-node',
    timestamp: new Date().toISOString(),
    user: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null
  });
});

// Single Page Application fallback for index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'API route not found' });
  }
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

let server = null;
if (!isVercel) {
  // Clean up expired sessions periodically (every 6 hours) on standalone server
  setInterval(purgeExpiredSessions, 6 * 60 * 60 * 1000);

  server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` DUC Library Management System is running on port ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

export default app;
export { server };
