---
description: Enregistre une version — commit, merge testing→main, tag SemVer, release GitHub (via ops-quality).
agent: ops-quality
---

Enregistre la version courante du projet (skill `shared-git-conventions`) :

1. Vérifie la branche : travail sur `testing`, jamais sur `main`.
2. Révise les changements : `git status`, `git diff`, `git log --oneline -10`.
3. Calcul du bump SemVer (MAJOR/MINOR/PATCH) + mise à jour du `CHANGELOG.md`.
4. Commit en Conventional Commits (`type(scope): résumé + corps = pourquoi`).
5. Push de la branche : `git push origin testing`.
6. Création de la Pull Request `testing` → `main` (MCP GitHub ou `gh pr create`).
7. Merge de la PR sur GitHub (accord utilisateur requis avant merge si non explicite).
8. Récupération locale : `git checkout main && git pull origin main`.
9. Tag `git tag -a v<X.Y.Z>` + push du tag + création de la release GitHub (MCP GitHub ou `gh release create`).
10. Réalignement : `git checkout testing && git merge main && git push origin testing`.
11. Mets à jour README/ROADMAP si nécessaire et signale la prochaine étape (déploiement via /deploy).

Contexte : $ARGUMENTS
