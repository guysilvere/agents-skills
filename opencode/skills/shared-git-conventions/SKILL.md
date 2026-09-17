---
name: shared-git-conventions
description: Conventions Git/GitHub Agence Bulles — branche testing unique, commits Conventional Commits, versioning SemVer, notes de release et descriptions de PR, merge et pull, MCP GitHub. À utiliser pour toute opération de versioning (via ops-quality).
license: MIT
compatibility: opencode
metadata:
  audience: ops-quality
  domain: git
---

# shared-git-conventions

## Ce que je fais
- Applique les conventions Git/GitHub de l'écosystème Agence Bulles (workflow solo, pas de PR review heavy).

## Règle absolue : jamais de modification directe sur `main`
- `main` = branche protégée, ne reçoit que des merges.
- **Branche de travail unique : `testing`** (utilisateur solo — pas de branches par feature).
- Workflow : `main (protégée) └─ testing (travail) → commit → push → merge → tag → release`.

## Vérification obligatoire avant toute modification
1. `git branch --show-current`
2. Si `main` → `git checkout -b testing` (ou basculer)
3. Si ni `main` ni `testing` → `git checkout testing` puis merger/abandonner
4. Si `testing` → continuer

### Exceptions autorisées sur `main`
- README.md (tagline, liens, badges) · .gitignore · AGENTS.md · fichiers CI/CD
- Tout le reste (src/, components/, pages/, api/, services/) → sur `testing`.

## Convention de nom de branche (si branche dédiée nécessaire)
`feat/<sujet>` · `fix/<bug>` · `docs/<sujet>` · `style/<sujet>` · `refactor/<sujet>` · `perf/<sujet>` · `test/<sujet>` · `chore/<maintenance>`

## Commits (Conventional Commits)
- Format : `type(scope): résumé court à l'impératif` — types : feat, fix, docs, style, refactor, perf, test, chore.
- Corps obligatoire : le POURQUOI, pas le COMMENT.

## Versions (SemVer)
- MAJOR = changement cassant · MINOR = nouvelle fonctionnalité · PATCH = correctif.
- Proposer le bump adapté + mettre à jour `CHANGELOG.md` (template `assets/templates/CHANGELOG.md`).

## Merge & pull (PR obligatoire sur `main`)
- `main` est protégée : **aucun merge ni push direct sur `main`**.
- Tout merge vers `main` passe obligatoirement par une Pull Request GitHub :
  1. Push de `testing` : `git push origin testing`
  2. Création de la PR `testing` → `main` (MCP GitHub `create_pull_request` ou `gh pr create`) avec description (contexte, changements, validation).
  3. Merge de la PR sur GitHub (MCP GitHub `merge_pull_request` ou `gh pr merge --merge`).
  4. Récupération sur `main` local : `git checkout main && git pull origin main`.
  5. Tagger (`git tag -a vX.Y.Z -m "..."`) + pusher le tag (`git push origin vX.Y.Z`).
  6. Créer la release GitHub (`gh release create` ou MCP GitHub).
  7. Réaligner `testing` : `git checkout testing && git merge main && git push origin testing`.

## PR & releases
- Description de PR : contexte, changements, impact, tests effectués → template `assets/templates/PR-template.md`.
- Notes de release : regroupées par type, langage orienté utilisateur → template `assets/templates/release-notes.md`.
- Enchaînement automatique : dès qu'une release ou un merge vers `main` est demandé, exécuter le cycle complet (PR → merge GitHub → pull `main` → tag → release GitHub → réalignement `testing`).

## GitHub MCP (privilégié sur la CLI gh)
- Le MCP GitHub est authentifié : créer repos/branches/PR/issues/releases, lister, lire/écrire, commenter.
- Utiliser les outils `github_*` plutôt que `gh` (pas de passes).

## Sécurité
- `git push`, merge de PR et création de release nécessitent l'accord explicite de l'utilisateur.
- `git push --force` et `git rebase -i` : interdits (permissions deny sur ops-quality).

## Assets
- `assets/templates/PR-template.md`
- `assets/templates/CHANGELOG.md`
- `assets/templates/release-notes.md`
