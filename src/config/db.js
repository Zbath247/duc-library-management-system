import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const isVercel = Boolean(process.env.VERCEL);
const dbPath = isVercel 
  ? path.join('/tmp', 'duc_library.db')
  : (process.env.DATABASE_PATH || './data/duc_library.db');

const resolvedPath = path.resolve(process.cwd(), dbPath);
const dir = path.dirname(resolvedPath);

if (!fs.existsSync(dir)) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.warn('[DB] Could not create directory:', dir, err.message);
  }
}

export const db = new DatabaseSync(resolvedPath);

// Enable WAL mode or foreign keys
try {
  db.exec(`
    PRAGMA foreign_keys = ON;
  `);
} catch (e) {
  console.warn('[DB PRAGMA Warning]', e.message);
}

export default db;
