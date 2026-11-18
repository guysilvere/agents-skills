#!/usr/bin/env node
/**
 * guard-bash.mjs — Hook déterministe pré-exécution commandes shell.
 *
 * Règles bloquantes (exit 2) :
 * 1. git commit / git push direct sur la branche 'main' (sauf bypass ALLOW_MAIN_COMMIT=1)
 * 2. git push --force / +refs/...
 * 3. Commandes destructrices interdites (rm -rf /, mkfs, etc.)
 * 4. Staging ou commit direct de fichiers sensibles (.env, .tokens, credentials.md, *.local.db)
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const raw = readStdin();
let command = '';

if (raw) {
  try {
    const payload = JSON.parse(raw);
    command = payload?.tool_input?.command || payload?.command || '';
  } catch {
    // Si passage direct d'une commande brute
    command = raw;
  }
}

if (!command && process.argv.length > 2) {
  command = process.argv.slice(2).join(' ');
}

if (!command) {
  process.exit(0);
}

const trimmed = command.trim();

// 1. Détection de commandes destructrices
if (/\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|--recursive\s+--force)\s+(\/|~|\$HOME)\b/.test(trimmed)) {
  process.stderr.write("⛔ Bloqué [guard-bash] : Suppression récursive racine ou HOME interdite.\n");
  process.exit(2);
}

// 2. Détection push force
if (/\bgit\s+push\b.*(--force|-f|\+refs\/)/.test(trimmed)) {
  process.stderr.write("⛔ Bloqué [guard-bash] : 'git push --force' est strictement interdit par la politique Agence Bulles.\n");
  process.exit(2);
}

// 3. Détection ajout de fichiers interdits dans git add
if (/\bgit\s+add\b/.test(trimmed)) {
  const sensitivePatterns = [
    /(^|\s|\/)\.env(\.|$)(?!example\b|local\b)/,
    /(^|\s|\/)\.tokens(\/|$)/,
    /(^|\s|\/)credentials\.md(\s|$)/,
    /(^|\s)\S+\.local\.db(\s|$)/
  ];
  for (const pat of sensitivePatterns) {
    if (pat.test(trimmed)) {
      process.stderr.write("⛔ Bloqué [guard-bash] : Tentative d'ajouter un fichier sensible ou secret interdit à Git (.env, .tokens, credentials.md, *.local.db).\n");
      process.exit(2);
    }
  }
}

// 4. Détection commit / push sur 'main'
const isGitCommit = /\bgit\s+commit\b/.test(trimmed);
const isGitPush = /\bgit\s+push\b/.test(trimmed);

if (isGitCommit || isGitPush) {
  if (process.env.ALLOW_MAIN_COMMIT !== '1') {
    try {
      const currentBranch = execSync('git branch --show-current 2>/dev/null', { encoding: 'utf8' }).trim();
      if (currentBranch === 'main' || currentBranch === 'master') {
        process.stderr.write(`⛔ Bloqué [guard-bash] : Commit/push direct sur '${currentBranch}' interdit. Travaille sur la branche 'testing' et passe obligatoirement par une PR.\n`);
        process.exit(2);
      }
    } catch {
      // Hors git ou commande échouée, on laisse passer
    }
  }
}

process.exit(0);
