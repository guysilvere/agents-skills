---
description: Met à jour une règle, un agent ou une skill de l'écosystème IA puis compile et synchronise les 3 outils.
agent: lead-dev
---

Met à jour l'écosystème d'agents et skills (OpenCode, Antigravity, Claude Code) :

1. Charge la skill `agents-skills-admin`.
2. Si la modification concerne un **agent** :
   - Édite uniquement le fichier source canonique `agents-src/<role>.body.md` ou les fichiers de frontmatter `agents-src/frontmatter/<outil>/<role>.yaml`.
   - Ne modifie jamais directement les fichiers générés dans `opencode/agents/`, `antigravity/agents/` ou `claude/agents/`.
3. Si la modification concerne une **skill** :
   - Édite ou crée `opencode/skills/<nom>/SKILL.md` (≤ 200 lignes, description conforme CSO ≤ 500 car., sans chevrons).
4. Compile et propage les modifications :
   - Exécute `node scripts/build-agents.mjs`.
5. Valide la conformité du dépôt :
   - Exécute `node scripts/validate-setup.mjs`.
   - Exécute `node --test hooks/hooks.test.mjs` si les hooks sont touchés.
6. Synchronise l'ensemble des 3 outils sur la machine :
   - Exécute `./scripts/sync-skills.sh --local`.
7. Produis un rapport clair des fichiers mis à jour et confirme la validation.

Demande de mise à jour : $ARGUMENTS
