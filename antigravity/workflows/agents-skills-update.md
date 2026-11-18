---
name: agents-skills-update
description: Met à jour une règle, un agent ou une skill de l'écosystème IA puis compile et synchronise les 3 outils.
---

# Mise à jour Agents & Skills (Agents-as-Code)

Met à jour l'écosystème IA de l'Agence Bulles et propage les modifications sur OpenCode, Antigravity et Claude Code.

## Étape 1 — Préparation

Charge la skill `agents-skills-admin` :
- Identifier les composants ciblés (agent, skill, commande, workflow ou règle globale).

## Étape 2 — Édition de la source canonique

- **Pour un agent** : modifier exclusivement `agents-src/<role>.body.md` (ou `agents-src/frontmatter/<outil>/<role>.yaml`). Ne jamais modifier manuellement les fichiers générés sous `opencode/agents/`, `antigravity/agents/` ou `claude/agents/`.
- **Pour une skill** : modifier ou créer `opencode/skills/<nom>/SKILL.md` (limite ≤ 200 lignes, description CSO ≤ 500 car., sans chevrons).

## Étape 3 — Compilation & Validation

1. Lancer la compilation des 9 agents :
   ```bash
   node scripts/build-agents.mjs
   ```
2. Valider l'intégrité de l'écosystème :
   ```bash
   node scripts/validate-setup.mjs
   ```

## Étape 4 — Déploiement local

Déployer vers les environnements locaux (`~/.config/opencode/`, `~/.gemini/`, `~/.claude/`) :
```bash
./scripts/sync-skills.sh --local
```

## Étape 5 — Rapport

Restituer un résumé concis des modifications appliquées et confirmer l'état vert des validations.
