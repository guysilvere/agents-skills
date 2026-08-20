---
description: <courte description affichée dans le TUI>
agent: <agent qui exécute la commande — optionnel, défaut : agent actuel>
model: <provider/model-id>   # optionnel — override du modèle
subtask: false        # optionnel — true force l'invocation d'un subagent
---

<Prompt envoyé au LLM — syntaxe supportée :>

# Arguments
- `$ARGUMENTS` : tous les arguments passés après /commande
- `$1` `$2` `$3` : arguments positionnels
# Sortie shell (injectée dans le prompt)
- !`npm test`
- !`git log --oneline -10`
# Références de fichiers (contenu injecté dans le prompt)
- @src/components/Button.tsx
