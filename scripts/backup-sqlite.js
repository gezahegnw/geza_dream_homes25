#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'dev.db');
const backupsDir = path.resolve(process.cwd(), 'backups');

if (!fs.existsSync(dbPath)) {
  console.error('No dev.db found in project root. Run `npm run db:migrate` first.');
  process.exit(1);
}

if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(backupsDir, `dev-${ts}.db`);

fs.copyFileSync(dbPath, out);
console.log(`Backup written to ${out}`);
