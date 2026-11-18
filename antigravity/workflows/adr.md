---
name: adr
description: Rédige un ADR (Architecture Decision Record) dans docs/adr/ depuis le template standard.
---

# Architecture Decision Record (ADR)

Rédige un ADR pour la décision d'architecture demandée.

## Étape 1 — Template & numérotation

- Charge la skill `pwa-developpement` et lis le template `assets/templates/ADR.md`.
- Repère le **dernier numéro** dans `docs/adr/` et incrémente (numérotation continue, jamais réutilisée).
- S'il manque des éléments de contexte, pose les questions **avant** de rédiger.

## Étape 2 — Rédaction

Produis `docs/adr/NNNN-<titre-kebab-case>.md` avec :
- **Contexte** : problème, contraintes, déclencheur de la décision.
- **Décision** : formulée à l'affirmatif et au présent.
- **Alternatives** : options écartées et raisons.
- **Conséquences** : bénéfices, coûts assumés, points de vigilance.
- **Références** : issue, PR, doc, conversation.

## Étape 3 — Statut & remplacement

- Statut initial : `PROPOSÉ` → passe à `ACCEPTÉ` après validation humaine.
- Si cette décision **remplace** un ADR existant : le nouvel ADR le référence, et le `Statut` de l'ancien passe à `REMPLACÉ par ADR-NNNN` (**ne jamais réécrire l'ancien ADR**).

## Étape 4 — Living documentation

- Si l'ADR contredit une doc existante (`BLUEPRINT.md`, `DATABASE.md`, `stack-table.md`), signale les fichiers à mettre à jour dans le même lot.
