---
description: <obligatoire — résume précisément le rôle ET signale quand l'invoquer>
mode: subagent        # primary | subagent | all (défaut all)
model: <provider/model-id>   # optionnel — hérite du parent si omis
temperature: 0.1     # optionnel 0.0–1.0 (0.1 déterministe → 0.7 créatif)
steps: 10            # optionnel — limite d'itérations (remplace l'ancien maxSteps)
top_p: 0.9           # optionnel 0.0–1.0 (alternative à temperature)
color: accent        # optionnel — apparence UI (hex ou primary/secondary/accent/success/warning/error/info)
permission:
  read: allow
  glob: allow
  grep: allow
  edit: ask
  bash:
    "*": ask
    "git *": allow
    "git push --force*": deny
    "npm *": allow
  skill: allow        # chargement dynamique de TOUTES les skills (recommandé)
  task:
    "*": deny
    "<autre-sous-agent>": allow
  webfetch: allow
---

# <Nom de l'agent>

## Rôle
<ce que fait l'agent, son périmètre>

## Workflow
1. ...
2. ...

## Règles
- <règles de travail, interdits>

## Intégration de nouvelles skills
Les skills sont chargées dynamiquement (permission `skill: allow`). Pour ajouter une compétence :
1. Créer le dossier `~/.config/opencode/skills/<nom>/SKILL.md`.
2. L'invoquer via `skill <nom>`.
Aucune modification d'agent requise.

## Délégation
- `<sous-agent>` : <rôle>
