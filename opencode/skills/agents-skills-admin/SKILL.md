---
name: agents-skills-admin
description: "Administration des outils IA de l'écosystème Agence Bulles (OpenCode, Antigravity, Claude Code). Création et validation de skills, gestion des 3 agents via agents-src/ et scripts/build-agents.mjs, permissions, workflows, commandes et synchronisation sync-skills.sh. Utiliser pour toute modification de configuration, de règle ou d'agent."
license: MIT
compatibility: opencode, antigravity, claude
metadata:
  audience: lead-dev
  domain: tooling
---

# agents-skills-admin

## Ce que je fais
- Administre les outils IA (OpenCode, Antigravity, Claude Code) de l'écosystème Agence Bulles — pas le code applicatif.
- Maintient la parité stricte entre les 3 outils et garantit la conformité de `agents-src/` et des 16 skills.
- Gère la synchronisation globale via `scripts/sync-skills.sh` et la validation via `scripts/validate-setup.mjs`.

## 1. Modification et création d'agents (Agents-as-Code)
- **Source canonique unique** : `agents-src/{lead-dev,ops-quality,integrations}.body.md` + `agents-src/frontmatter/{opencode,antigravity,claude}/*.yaml`.
- **Règle absolue** : ne jamais éditer directement les fichiers dans `opencode/agents/`, `antigravity/agents/` ou `claude/agents/` (fichiers générés).
- **Procédure de mise à jour d'un agent** :
  1. Modifier le corps dans `agents-src/<role>.body.md` (ou les frontmatters si changement de modèle/step).
  2. Compiler les 9 fichiers : `node scripts/build-agents.mjs`.
  3. Valider l'intégrité globale : `node scripts/validate-setup.mjs`.
  4. Déployer sur les 3 outils : `./scripts/sync-skills.sh --local`.

## 2. Skills (SKILL.md)
- Emplacement source unique : `opencode/skills/<name>/SKILL.md`.
- Déployé vers OpenCode (`~/.config/opencode/skills/`), Antigravity (`~/.gemini/config/skills/`) et Claude Code (`~/.claude/skills/`).
- Règles impératives (vérifiées par `scripts/validate-setup.mjs`) :
  - `name == nom-du-dossier`
  - `description` : ≤ 500 car., sans chevrons `< >`, sans ` : ` non protégé par des guillemets.
  - Longueur totale du fichier `SKILL.md` : **≤ 200 lignes**.
  - Si la documentation est longue, externaliser dans un sous-dossier `references/` ou `assets/`.

## 3. Commandes & Workflows
- `opencode/commands/<nom>.md` (format OpenCode).
- `antigravity/workflows/<nom>.md` (format Antigravity).
- **Parité stricte** : chaque commande slash doit posséder son équivalent workflow de même nom (ex: `/agents-skills-update`).

## 4. Permissions & Sécurité
- Détecter les secrets ou clés en clair dans les dépôts ou configs.
- Tout jeton d'agent vit dans `~/.config/opencode/.tokens/<nom>` (chmod 600).
- Guard-rails mécaniques : `hooks/guard-bash.mjs` et `hooks/guard-files.mjs` (testés via `node --test hooks/hooks.test.mjs`).
