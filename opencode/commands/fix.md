---
description: Résolution traçable d'un bug ou incident — Issue GitHub obligatoire avant fix, suivi en commentaires, tests et clôture.
agent: lead-dev
---

Résous le bug ou l'incident en respectant le verrou GitHub Issues (`WORKFLOW.md`) :

1. **Issue obligatoire (verrou)** : vérifie `gh issue list` / MCP `list_issues`. Si absente, crée l'Issue **avant** toute édition (`issue_write` ou `gh issue create`) avec symptôme + logs. Pas d'étape 2 sans `#<id>`.
2. **Branche & investigation** : bascule sur `testing` si besoin. Poste en commentaire (`add_issue_comment` / `gh issue comment`) la cause racine et toute piste échouée.
3. **Fix & tests** : corrige + ajoute un test de non-régression + lance lint, typecheck et tests.
4. **Commit** : `fix(scope): résumé court (Refs #<id>)`.
5. **Clôture & relais** : ferme l'Issue avec synthèse (ou `Closes #<id>` en PR) et indique `Issue : #<id>` dans le relais `ops-quality`.

Contexte : $ARGUMENTS
