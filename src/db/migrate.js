import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigration() {
  console.log('[Migration] Running database schema migration...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  
  db.exec(sql);
  console.log('[Migration] Tables and indexes created successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    runMigration();
    process.exit(0);
  } catch (err) {
    console.error('[Migration Error]', err);
    process.exit(1);
  }
}
