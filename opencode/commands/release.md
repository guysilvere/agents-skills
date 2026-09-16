---
description: Enregistre une version — commit, merge testing→main, tag SemVer, release GitHub (via ops-quality).
agent: ops-quality
---

Enregistre la version courante du projet (skill `shared-git-conventions`) :

1. Vérifie la branche : travail sur `testing`, jamais `main`.
2. Révise les changements : `git status`, `git diff`, `git log --oneline -10`.
3. Mise à jour `CHANGELOG.md` (template) + bump SemVer proposé (MAJOR/MINOR/PATCH selon les changements).
4. Commit en Conventional Commits (type(scope): résumé + corps = pourquoi).
5. Merge `testing` → `main` (accord utilisateur requis avant push/merge).
6. Tag : `git tag v<X.Y.Z>` puis crée la release GitHub (MCP github_*).
7. Mets à jour README/ROADMAP si nécessaire et signale la prochaine étape (déploiement via /deploy).

Contexte : $ARGUMENTS
