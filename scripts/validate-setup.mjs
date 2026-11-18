#!/usr/bin/env node
/**
 * scripts/validate-setup.mjs
 * Validation déterministe et statique de l'écosystème Agence Bulles (SPEC-010)
 *
 * Vérifie :
 *  1. Structure & frontmatter YAML des 16 skills (longueur <= 200 lignes, CSO, syntaxe)
 *  2. Conformité du frontmatter des agents et des commandes/workflows
 *  3. Parité stricte opencode/commands/ ↔ antigravity/workflows/
 *  4. Parité 100% des 9 agents avec agents-src/
 *  5. Absence de termes bannis (GeniusPay) et de secrets en clair
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, basename, relative } from 'node:path';

const ROOT_DIR = resolve(import.meta.dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
const failures = [];

function check(title, fn) {
  totalChecks++;
  try {
    const result = fn();
    if (result === true || result === undefined) {
      passedChecks++;
      return;
    }
    failures.push({ title, reason: String(result) });
  } catch (err) {
    failures.push({ title, reason: err.message });
  }
}

/**
 * Extrait le frontmatter d'un fichier Markdown
 */
function extractFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf8');
  if (!content.startsWith('---')) {
    throw new Error(`Frontmatter d'ouverture '---' manquant`);
  }
  const endIndex = content.indexOf('\n---', 3);
  if (endIndex === -1) {
    throw new Error(`Frontmatter de fermeture '---' manquant`);
  }
  const fmRaw = content.slice(3, endIndex).trim();
  return { fmRaw, body: content.slice(endIndex + 4), fullContent: content };
}

/**
 * Valide les règles CSO sur la ligne description
 */
function validateDescription(fmRaw, filePath) {
  const lines = fmRaw.split('\n');
  const descLineIdx = lines.findIndex(l => /^description\s*:/i.test(l.trim()));
  if (descLineIdx === -1) {
    throw new Error(`Champ 'description' absent`);
  }

  // Si multiligne ou simple
  let descRaw = lines[descLineIdx].replace(/^description\s*:\s*/i, '').trim();
  if (descRaw === '|' || descRaw === '>-' || descRaw === '>') {
    let nextIdx = descLineIdx + 1;
    descRaw = '';
    while (nextIdx < lines.length && /^\s+/.test(lines[nextIdx])) {
      descRaw += ' ' + lines[nextIdx].trim();
      nextIdx++;
    }
    descRaw = descRaw.trim();
  }

  // Retirer les guillemets englobants s'il y en a
  let descClean = descRaw;
  const isQuoted = (descRaw.startsWith('"') && descRaw.endsWith('"')) || (descRaw.startsWith("'") && descRaw.endsWith("'"));
  if (isQuoted) {
    descClean = descRaw.slice(1, -1);
  }

  // 1. Zéro chevron < ou >
  if (/[<>]/.test(descClean)) {
    throw new Error(`La description contient des chevrons interdits (< ou >)`);
  }

  // 2. Si non quoté, interdiction de ' : '
  if (!isQuoted && /\s+:\s+/.test(descRaw)) {
    throw new Error(`Deux-points ' : ' non protégés par des guillemets dans description`);
  }

  // 3. Longueur max 500 car.
  if (descClean.length > 500) {
    throw new Error(`Description trop longue (${descClean.length} car., max 500)`);
  }
  if (descClean.length < 15) {
    throw new Error(`Description trop courte (${descClean.length} car., min 15)`);
  }

  return descClean;
}

console.log('🔍 Exécution des vérifications du setup Agence Bulles...\n');

// =============================================================================
// 1. SKILLS (16 skills opencode)
// =============================================================================
const skillsDir = join(ROOT_DIR, 'opencode', 'skills');
const skillFolders = readdirSync(skillsDir).filter(name => {
  return statSync(join(skillsDir, name)).isDirectory();
});

check(`Compte de skills attendu (16)`, () => {
  if (skillFolders.length !== 16) {
    return `Attendu: 16 skills, Trouvé: ${skillFolders.length} (${skillFolders.join(', ')})`;
  }
});

for (const folder of skillFolders) {
  const skillMdPath = join(skillsDir, folder, 'SKILL.md');
  const relPath = relative(ROOT_DIR, skillMdPath);

  check(`Skill [${folder}] existe et est accessible`, () => {
    if (!existsSync(skillMdPath)) return `Fichier introuvable : ${relPath}`;
  });

  if (existsSync(skillMdPath)) {
    check(`Skill [${folder}] taille <= 200 lignes`, () => {
      const content = readFileSync(skillMdPath, 'utf8');
      const lines = content.split('\n').length;
      if (lines > 200) {
        return `${relPath} dépasse 200 lignes (${lines} lignes)`;
      }
    });

    check(`Skill [${folder}] conformité frontmatter & CSO`, () => {
      const { fmRaw } = extractFrontmatter(skillMdPath);
      // Vérifier name
      const nameMatch = fmRaw.match(/^name\s*:\s*([^\s#]+)/m);
      if (!nameMatch) {
        return `Champ 'name' manquant dans ${relPath}`;
      }
      if (nameMatch[1].trim() !== folder) {
        return `name '${nameMatch[1].trim()}' ne correspond pas au dossier '${folder}'`;
      }
      // Vérifier description
      validateDescription(fmRaw, relPath);
    });
  }
}

// =============================================================================
// 2. PARITÉ COMMANDES (opencode/commands) ↔ WORKFLOWS (antigravity/workflows)
// =============================================================================
const commandsDir = join(ROOT_DIR, 'opencode', 'commands');
const workflowsDir = join(ROOT_DIR, 'antigravity', 'workflows');

const commands = readdirSync(commandsDir).filter(f => f.endsWith('.md')).sort();
const workflows = readdirSync(workflowsDir).filter(f => f.endsWith('.md')).sort();

check(`Parité commandes (${commands.length}) ↔ workflows (${workflows.length})`, () => {
  const cmdSet = new Set(commands);
  const wfSet = new Set(workflows);

  const missingInWf = commands.filter(c => !wfSet.has(c));
  const missingInCmd = workflows.filter(w => !cmdSet.has(w));

  if (missingInWf.length > 0 || missingInCmd.length > 0) {
    return `Désynchronisation commandes/workflows :
      Manquants dans workflows: [${missingInWf.join(', ')}]
      Manquants dans commands: [${missingInCmd.join(', ')}]`;
  }
});

for (const wf of workflows) {
  const wfPath = join(workflowsDir, wf);
  check(`Workflow frontmatter [${wf}]`, () => {
    const { fmRaw } = extractFrontmatter(wfPath);
    validateDescription(fmRaw, wfPath);
  });
}

// =============================================================================
// 3. AGENTS SOURCE CANONIQUE & GÉNÉRATION (SPEC-010 REQ-01)
// =============================================================================
const TARGETS = ['opencode', 'antigravity', 'claude'];
const ROLES = ['lead-dev', 'ops-quality', 'integrations'];
const AGENTS_SRC = join(ROOT_DIR, 'agents-src');

function filterBodyForTarget(body, target) {
  let filtered = body.replace(/<!--\s*only:([a-z0-9_-]+)\s*-->([\s\S]*?)<!--\s*\/only\s*-->/gi, (match, tool, content) => {
    return tool.toLowerCase() === target.toLowerCase() ? content.trim() : '';
  });
  filtered = filtered.replace(/<!--\s*except:([a-z0-9_-]+)\s*-->([\s\S]*?)<!--\s*\/except\s*-->/gi, (match, tool, content) => {
    return tool.toLowerCase() === target.toLowerCase() ? '' : content.trim();
  });
  return filtered.replace(/\n{3,}/g, '\n\n').trim();
}

for (const role of ROLES) {
  const bodyPath = join(AGENTS_SRC, `${role}.body.md`);
  check(`Corps canonique agents-src/${role}.body.md existe`, () => {
    if (!existsSync(bodyPath)) return `Fichier corps introuvable : ${bodyPath}`;
  });
}

for (const target of TARGETS) {
  for (const role of ROLES) {
    const fmPath = join(AGENTS_SRC, 'frontmatter', target, `${role}.yaml`);
    check(`Frontmatter source [${target}/${role}.yaml] valide`, () => {
      if (!existsSync(fmPath)) return `Frontmatter manquant : ${fmPath}`;
      const raw = readFileSync(fmPath, 'utf8');
      validateDescription(raw, fmPath);
    });

    const agentDestPath = join(ROOT_DIR, target, 'agents', `${role}.md`);
    check(`Agent généré synchronisé [${target}/agents/${role}.md]`, () => {
      if (!existsSync(agentDestPath)) return `Fichier manquant : ${agentDestPath}`;
      const bodyPath = join(AGENTS_SRC, `${role}.body.md`);
      const rawBody = readFileSync(bodyPath, 'utf8');
      const rawFm = readFileSync(fmPath, 'utf8').trim();
      const processedBody = filterBodyForTarget(rawBody, target);
      const expected = `---\n${rawFm}\n---\n<!-- GENERATED BY scripts/build-agents.mjs — EDIT agents-src/ -->\n\n${processedBody}\n`;

      const actual = readFileSync(agentDestPath, 'utf8');
      if (actual !== expected) {
        return `Contenu désynchronisé de agents-src/. Lancez 'node scripts/build-agents.mjs'`;
      }
    });
  }
}

// =============================================================================
// 4. DATASET EVALS (evals/skill-triggers.json)
// =============================================================================
const evalsPath = join(ROOT_DIR, 'evals', 'skill-triggers.json');
check(`Dataset evals/skill-triggers.json existe et valide`, () => {
  if (!existsSync(evalsPath)) return `Fichier introuvable : ${evalsPath}`;
  const evals = JSON.parse(readFileSync(evalsPath, 'utf8'));
  if (!Array.isArray(evals) || evals.length < 15) {
    return `Attendu au moins 15 cas d'evals, trouvé : ${evals.length}`;
  }
  const realSkills = new Set(readdirSync(skillsDir));
  const covered = new Set();
  for (const item of evals) {
    if (!item.id || !item.prompt || !item.expectedSkill) {
      return `Cas d'eval invalide : ${JSON.stringify(item)}`;
    }
    if (!realSkills.has(item.expectedSkill)) {
      return `Skill inconnue dans eval [${item.id}] : ${item.expectedSkill}`;
    }
    covered.add(item.expectedSkill);
  }
  if (covered.size < 16) {
    return `Couverture incomplète des skills : ${covered.size}/16`;
  }
});

// =============================================================================
// 5. TERMES BANNIS ET DÉTECTION STATIQUE DE SECRETS
// =============================================================================
const SCANNED_DIRS = ['opencode', 'antigravity', 'claude', 'agents-src', 'hooks', 'scripts'];

function walkDir(dir, cb) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        walkDir(fullPath, cb);
      }
    } else {
      cb(fullPath);
    }
  }
}

const bannedPattern = /\bGeniusPay\b/i;
const secretPatterns = [
  /ghp_[A-Za-z0-9]{36}/,
  /sk_live_[A-Za-z0-9]+/,
  /-----BEGIN (RSA|OPENSSH|EC) PRIVATE KEY-----/
];

const foundBanned = [];
const foundSecrets = [];

for (const dirName of SCANNED_DIRS) {
  walkDir(join(ROOT_DIR, dirName), (filePath) => {
    // Ignorer le script de validation lui-même pour ne pas déclencher sur sa propre définition
    if (filePath === join(ROOT_DIR, 'scripts', 'validate-setup.mjs')) return;
    // Ne tester que les fichiers textes (.md, .json, .yaml, .yml, .mjs, .sh)
    if (!/\.(md|json|ya?ml|mjs|js|sh)$/i.test(filePath)) return;
    const content = readFileSync(filePath, 'utf8');

    if (bannedPattern.test(content)) {
      foundBanned.push(relative(ROOT_DIR, filePath));
    }
    for (const pat of secretPatterns) {
      if (pat.test(content)) {
        foundSecrets.push(relative(ROOT_DIR, filePath));
      }
    }
  });
}

check(`Zéro occurrence du terme banni 'GeniusPay' dans l'écosystème actif`, () => {
  if (foundBanned.length > 0) {
    return `Terme 'GeniusPay' détecté dans : ${foundBanned.join(', ')}`;
  }
});

check(`Zéro clé privée ou secret hardcodé détecté`, () => {
  if (foundSecrets.length > 0) {
    return `Potentiel secret exposé dans : ${foundSecrets.join(', ')}`;
  }
});

// =============================================================================
// RAPPORT FINAL
// =============================================================================
console.log(`─────────────────────────────────────────────────────────────────`);
console.log(`Résultats : ${passedChecks}/${totalChecks} vérifications réussies.`);

if (failures.length > 0) {
  console.error(`\n❌ ÉCHEC DE VALIDATION (${failures.length} erreur(s)) :`);
  for (const fail of failures) {
    console.error(`  ✖ [${fail.title}]`);
    console.error(`    ↳ ${fail.reason}\n`);
  }
  process.exit(1);
} else {
  console.log(`✅ 100% des vérifications ont réussi. Setup sain et conforme.\n`);
  process.exit(0);
}
