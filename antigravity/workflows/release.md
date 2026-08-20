---
name: release
description: Commit sémantique + tag SemVer + release GitHub (équivalent Antigravity de /release OpenCode).
---

# Release Git/GitHub

Prépare et exécute une release pour le projet mentionné.

## Étape 1 — Branche courante

Vérifie la branche active avec `git branch --show-current`.
- Si sur `main` → stop : « bascule d'abord sur la branche testing ».

## Étape 2 — Commit

Charge la skill `shared-git-conventions` :
- Réviser les changements (`git status`, `git diff`).
- Committer avec Conventional Commits (feat/fix/docs/chore).

## Étape 3 — Merge dans main

- Si sur `testing` : `git checkout main && git merge testing`.
- Attends l'accord explicite de l'utilisateur avant de merger.

## Étape 4 — Niveau SemVer

- Regarde le log des commits non taggés.
- Propose le niveau SemVer (patch / minor / major) selon les messages.
- Met à jour `CHANGELOG.md`.

## Étape 5 — Tag et release

- Crée le tag `vX.Y.Z` et le pousse.
- Crée la release GitHub (outils `github_*` du MCP) avec notes de release orientées utilisateur.

## Étape 6 — Résumé

Résume : version, tag, lien de la release, nombre de commits inclus.
