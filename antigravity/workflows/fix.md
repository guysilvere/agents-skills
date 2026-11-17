---
name: fix
description: Résolution traçable d'un bug ou incident — Issue GitHub obligatoire avant fix, suivi en commentaires, tests et clôture.
---

# Résolution de bug / incident (`/fix`)

Applique ce workflow dès qu'un bug, une régression, un `⛔ Bloquant` de `/validate` ou une erreur résistante (> 1 tentative) survient sur un projet GitHub.

## Étape 1 — Issue GitHub (verrou obligatoire)

- Vérifie les issues ouvertes (`list_issues` ou `gh issue list --state open`).
- Si aucune ne correspond, crée l'Issue **avant** d'éditer le code (`issue_write` ou `gh issue create`, template `.github/ISSUE_TEMPLATE/bug.md` si présent) avec : symptôme, contexte, commande/logs en échec.
- **Verrou** : ne passe pas à l'étape 2 sans `#<id>` (sauf dépôt sans remote GitHub).

## Étape 2 — Investigation & traçabilité

- Vérifie la branche courante (`testing`, jamais `main`).
- Consigne en commentaire (`add_issue_comment` ou `gh issue comment <id>`) la cause racine identifiée et, en cas d'échec intermédiaire, les pistes testées.

## Étape 3 — Correctif & non-régression

- Implémente le correctif sur `testing`.
- Ajoute/mets à jour un test de non-régression + lance lint, typecheck et tests.

## Étape 4 — Commit lié

- Commit Conventional Commits : `fix(scope): résumé court (Refs #<id>)`.

## Étape 5 — Clôture

- Si validé en local et prêt à merger : lier via `Closes #<id>` dans la PR (`/release`), ou fermer l'Issue (`issue_write` / `gh issue close <id>`) avec un court résumé de la solution.
- Renseigne `Issue : #<id>` dans le format de relais vers `ops-quality`.
