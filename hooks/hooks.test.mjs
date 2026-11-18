import { describe, it } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const guardBash = path.join(__dirname, 'guard-bash.mjs');
const guardFiles = path.join(__dirname, 'guard-files.mjs');

function runHook(script, stdinPayload, env = {}) {
  return spawnSync('node', [script], {
    input: JSON.stringify(stdinPayload),
    encoding: 'utf8',
    env: { ...process.env, ...env }
  });
}

describe('SPEC-009 — Garde-fous déterministes (Hooks)', () => {
  it('guard-bash : bloque git push --force', () => {
    const res = runHook(guardBash, { tool_name: 'Bash', tool_input: { command: 'git push origin main --force' } });
    assert.strictEqual(res.status, 2);
    assert.match(res.stderr, /git push --force/);
  });

  it('guard-bash : bloque git add sur .env de production', () => {
    const res = runHook(guardBash, { tool_name: 'Bash', tool_input: { command: 'git add .env.production' } });
    assert.strictEqual(res.status, 2);
    assert.match(res.stderr, /fichier sensible ou secret interdit/);
  });

  it('guard-bash : bloque git add sur credentials.md', () => {
    const res = runHook(guardBash, { tool_name: 'Bash', tool_input: { command: 'git add docs/credentials.md' } });
    assert.strictEqual(res.status, 2);
    assert.match(res.stderr, /fichier sensible ou secret interdit/);
  });

  it('guard-bash : autorise une commande saine sur testing', () => {
    const res = runHook(guardBash, { tool_name: 'Bash', tool_input: { command: 'git status' } });
    assert.strictEqual(res.status, 0);
  });

  it('guard-files : bloque lecture de .env réel', () => {
    const res = runHook(guardFiles, { tool_name: 'Read', tool_input: { file_path: '/app/.env' } });
    assert.strictEqual(res.status, 2);
    assert.match(res.stderr, /fichiers d'environnement réels/);
  });

  it('guard-files : autorise lecture de .env.example et .env.local', () => {
    const r1 = runHook(guardFiles, { tool_name: 'Read', tool_input: { file_path: '/app/.env.example' } });
    assert.strictEqual(r1.status, 0);
    const r2 = runHook(guardFiles, { tool_name: 'Read', tool_input: { file_path: '/app/.env.local' } });
    assert.strictEqual(r2.status, 0);
  });

  it('guard-files : bloque accès direct aux tokens', () => {
    const res = runHook(guardFiles, { tool_name: 'Read', tool_input: { file_path: '/Users/foo/.config/opencode/.tokens/github' } });
    assert.strictEqual(res.status, 2);
    assert.match(res.stderr, /tokens d'agents/);
  });

  it('guard-files : bloque écriture binaire directe sur *.local.db', () => {
    const res = runHook(guardFiles, { tool_name: 'Write', tool_input: { file_path: 'lodgi.local.db' } });
    assert.strictEqual(res.status, 2);
    assert.match(res.stderr, /Écriture binaire directe interdite/);
  });
});
