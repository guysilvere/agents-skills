# Référence — Sélection de modèle

## Choix rapide selon la tâche

| Tâche | Modèle conseillé | Pourquoi |
|-------|------------------|----------|
| Réponses simples, planification, revue, résumé | Modèle rapide/économique (ex : flash) | Coût minimal, latence faible |
| Implémentation complexe, débogage profond | Modèle capable (ex : pro/sonnet) | Une fois le plan clair uniquement |
| Rédaction de docs / living documentation | Modèle rapide | Structure + listes à puces |
| Références API / recherche web | Modèle rapide + webfetch | Le contexte vient de l'outil |

## Règles d'économie
- **Un seul gros modèle par tâche** : ne pas alterner.
- **Plan d'abord** : clarifier le plan avec un modèle rapide, puis lancer l'implémentation sur le modèle capable.
- **Sous-agents** : donner un modèle adapté à LEUR tâche (ops-quality = validation → rapide).
- **Steps** : borner les sous-agents (`steps: 10-15`) pour éviter les boucles coûteuses.

## Pièges à éviter
- Régénérer un gros fichier pour un petit changement → éditer la plage concernée.
- Tout relire « pour être sûr » → grep ciblé + lecture de plage.
- Longues sessions sans compaction → laisser la compaction automatique résumer.

## Agence Bulles — config actuelle
- Modèle par défaut (`model`) : `deepseek/deepseek-v4` (implémentation et code)
- Modèle rapide (`small_model`) : `deepseek/deepseek-v4-flash` (compaction, titres, summaries)
- Plafonds mécaniques : `steps: 40` (lead-dev), `steps: 25` (ops-quality & integrations)
- Claude Code subagents : `maxTurns: 40` (lead-dev avec model inherit), `maxTurns: 25` (ops-quality & integrations)
