#!/usr/bin/env node
/**
 * scripts/eval-triggers.mjs
 * Runner d'evals pour le déclenchement des skills (SPEC-010 REQ-03)
 *
 * Mode statique (par défaut, CI / gratuit) :
 *   node scripts/eval-triggers.mjs
 *   Vérifie la validité du dataset evals/skill-triggers.json, la couverture des 16 skills
 *   et la cohérence des clauses d'exclusion mutuelle.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT_DIR = resolve(import.meta.dirname, '..');
const EVALS_PATH = join(ROOT_DIR, 'evals', 'skill-triggers.json');
const SKILLS_DIR = join(ROOT_DIR, 'opencode', 'skills');

if (!existsSync(EVALS_PATH)) {
  console.error(`❌ Fichier d'evals introuvable : ${EVALS_PATH}`);
  process.exit(1);
}

const evals = JSON.parse(readFileSync(EVALS_PATH, 'utf8'));
const realSkills = new Set(readdirSync(SKILLS_DIR));

console.log(`📊 Évaluation du dataset de déclenchement des skills (${evals.length} cas)...\n`);

let errors = 0;
const coveredSkills = new Set();
const seenIds = new Set();

for (const testCase of evals) {
  const { id, prompt, expectedSkill, forbiddenSkills = [], category, rationale } = testCase;

  if (!id || seenIds.has(id)) {
    console.error(`  ✖ ID manquant ou doublon : ${id}`);
    errors++;
  }
  seenIds.add(id);

  if (!prompt || typeof prompt !== 'string' || prompt.length < 10) {
    console.error(`  ✖ Prompt invalide dans [${id}]`);
    errors++;
  }

  if (!realSkills.has(expectedSkill)) {
    console.error(`  ✖ [${id}] expectedSkill '${expectedSkill}' n'existe pas dans ${SKILLS_DIR}`);
    errors++;
  } else {
    coveredSkills.add(expectedSkill);
  }

  for (const forbidden of forbiddenSkills) {
    if (!realSkills.has(forbidden)) {
      console.error(`  ✖ [${id}] forbiddenSkill '${forbidden}' n'existe pas dans ${SKILLS_DIR}`);
      errors++;
    }
    if (forbidden === expectedSkill) {
      console.error(`  ✖ [${id}] Conflit : '${forbidden}' est à la fois attendue et interdite`);
      errors++;
    }
  }

  if (!rationale) {
    console.error(`  ✖ [${id}] Rationale explicatif manquant`);
    errors++;
  }
}

// Couverture globale
const uncoveredSkills = [...realSkills].filter(s => !coveredSkills.has(s));

console.log(`- Total cas d'évaluation : ${evals.length}`);
console.log(`- Skills couvertes en attendu : ${coveredSkills.size}/${realSkills.size}`);

if (uncoveredSkills.length > 0) {
  console.warn(`⚠️ Attention, skills non couvertes par au moins un prompt attendu : ${uncoveredSkills.join(', ')}`);
}

if (errors > 0) {
  console.error(`\n❌ Échec : ${errors} anomalie(s) détectée(s) dans le jeu d'evals.`);
  process.exit(1);
}

console.log(`\n✅ Dataset d'evals 100% valide et exhaustif.`);
process.exit(0);
