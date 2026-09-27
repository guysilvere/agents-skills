---
description: Rédige un ADR (Architecture Decision Record) dans docs/adr/ depuis le template standard.
agent: lead-dev
---

Rédige un ADR pour la décision suivante : $ARGUMENTS

1. Charge la skill `pwa-developpement` (`skill pwa-developpement`) et lis le template `assets/templates/ADR.md`.
2. Repère le **dernier numéro** dans `docs/adr/` et incrémente (numérotation continue, jamais réutilisée).
3. Produis `docs/adr/NNNN-<titre-kebab-case>.md` :
   - **Contexte** : le problème, les contraintes, ce qui a déclenché la décision ;
   - **Décision** : à l'affirmatif et au présent ;
   - **Alternatives** : ce qui a été écarté et pourquoi ;
   - **Conséquences** : positives, coûts assumés, ce qui reste à surveiller ;
   - **Références** : issue, PR, doc, conversation.
4. Statut initial : `PROPOSÉ`. Il passe à `ACCEPTÉ` après validation par l'utilisateur.
5. Si cette décision **remplace** un ADR existant : le nouvel ADR le référence, et le `Statut` de l'ancien passe à `REMPLACÉ par ADR-NNNN`. **Ne jamais réécrire l'ancien ADR.**
6. Si l'ADR contredit une doc existante (`BLUEPRINT.md`, `DATABASE.md`, `stack-table.md`), signale les fichiers à mettre à jour dans le même lot.

> Un ADR se rédige **au moment de la décision**, pas après. S'il manque des éléments de contexte, pose les questions avant de rédiger.
