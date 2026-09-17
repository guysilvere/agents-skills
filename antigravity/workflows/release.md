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

## Étape 3 — Niveau SemVer & CHANGELOG

- Regarde le log des commits non taggés : `git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo "")..HEAD`.
- Détermine le bump SemVer : MAJOR (changement cassant), MINOR (`feat`), ou PATCH (`fix`, `chore`, `docs`).
- Met à jour `CHANGELOG.md` et committe :
  `git add CHANGELOG.md && git commit -m "docs(changelog): prépare la version vX.Y.Z"`

## Étape 4 — Push de la branche testing

- Pousse les commits locaux : `git push origin testing`.

## Étape 5 — Création de la Pull Request

- Crée la PR de `testing` vers `main` via le MCP GitHub (`create_pull_request`) ou `gh pr create` :
  - Titre au format Conventional Commits.
  - Corps avec contexte, résumé des changements et validation effectuée.

## Étape 6 — Merge de la Pull Request

- Attends l'accord explicite de l'utilisateur avant le merge si celui-ci n'a pas été formulé dans la demande initiale.
- Fusionne la PR sur GitHub via le MCP GitHub (`merge_pull_request`) ou `gh pr merge --merge`.

## Étape 7 — Synchronisation locale de main & Tag

- Récupère le merge sur la branche locale : `git checkout main && git pull origin main`.
- Crée le tag annoté : `git tag -a vX.Y.Z -m "Release vX.Y.Z - résumé"`
- Pousse le tag : `git push origin vX.Y.Z`.

## Étape 8 — Release GitHub

- Crée et publie la release GitHub via `gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."` (ou outils MCP GitHub).
- Notes de release claires et orientées utilisateur extraites du `CHANGELOG.md`.

## Étape 9 — Réalignement de testing

- Bascule et réaligne `testing` sur `main` :
  `git checkout testing && git merge main && git push origin testing`.

## Étape 10 — Résumé

Résume à l'utilisateur : numéro de version, lien de la PR mergée, lien de la release GitHub et statut des branches.
