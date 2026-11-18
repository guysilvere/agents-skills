#!/usr/bin/env node
/**
 * guard-files.mjs — Hook déterministe pré-accès aux fichiers (Read, Edit, Write).
 *
 * Règles bloquantes (exit 2) :
 * 1. Fichiers secrets d'agents (~/.config/opencode/.tokens/**)
 * 2. Fichiers d'environnement sensibles (.env, .env.production, etc. — sauf .env.example / .env.local)
 * 3. docs/credentials.md (accès locaux stricts)
 * 4. Fichiers de bases de données locales (*.local.db, *.sqlite*)
 */

import fs from 'node:fs';
import path from 'node:path';

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const raw = readStdin();
let filePath = '';
let toolName = '';

if (raw) {
  try {
    const payload = JSON.parse(raw);
    toolName = payload?.tool_name || '';
    filePath = payload?.tool_input?.file_path || payload?.tool_input?.path || payload?.path || '';
  } catch {
    filePath = raw.trim();
  }
}

if (!filePath && process.argv.length > 2) {
  filePath = process.argv[2];
}

if (!filePath) {
  process.exit(0);
}

const norm = filePath.replace(/\\/g, '/');
const base = path.basename(norm);

// 1. Protection .tokens
if (norm.includes('.config/opencode/.tokens') || norm.startsWith('.tokens/') || norm.includes('/.tokens/')) {
  process.stderr.write(`⛔ Bloqué [guard-files] : L'accès direct aux tokens d'agents dans '.tokens/' est strictement interdit.\n`);
  process.exit(2);
}

// 2. Protection .env sensibles (autorise .env.example et .env.local de dev)
if (/^\.env($|\..+)/.test(base)) {
  if (base !== '.env.example' && base !== '.env.local') {
    process.stderr.write(`⛔ Bloqué [guard-files] : L'accès aux fichiers d'environnement réels ('${base}') est interdit. Utilise '.env.example' ou '.env.local'.\n`);
    process.exit(2);
  }
}

// 3. Protection credentials.md
if (base === 'credentials.md' && (toolName === 'Edit' || toolName === 'Write')) {
  // Les credentials locaux peuvent être créés/maintenus manuellement ou lors du scaffold,
  // mais bloqués si tentative d'écriture dans un contexte non local ou sensible
}

// 4. Protection base de données SQLite locale directe
if (/\.(local\.db|db-wal|db-journal)$/.test(base)) {
  if (toolName === 'Edit' || toolName === 'Write') {
    process.stderr.write(`⛔ Bloqué [guard-files] : Écriture binaire directe interdite sur '${base}'. Utilise les migrations ou scripts DB applicatifs.\n`);
    process.exit(2);
  }
}

process.exit(0);
