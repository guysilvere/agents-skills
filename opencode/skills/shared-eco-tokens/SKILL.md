---
name: shared-eco-tokens
description: Optimise la consommation de tokens et le choix du modèle pour gagner du temps et réduire les coûts tout en restant efficace avec les modèles IA. À utiliser en continu dans toutes les sessions, et particulièrement sur les tâches longues, répétitives ou impliquant de gros fichiers.
license: MIT
compatibility: opencode
metadata:
  audience: tous
  domain: productivite
---

# shared-eco-tokens

## Ce que je fais
- Réduit la consommation de tokens : même résultat, plus vite, moins cher.

## Contexte : ne charger que le nécessaire
- Localiser avant de lire : `grep`/`glob` pour trouver l'endroit exact, puis lire une plage précise.
- Ne pas relire un fichier déjà lu dans la session ; ne pas recopier de longs blocs.
- S'appuyer sur l'`AGENTS.md` du dépôt pour les règles récurrentes.

## Choisir le modèle selon la tâche
- Tâches simples / planification / revue : modèle rapide et peu coûteux.
- Implémentation complexe : modèle plus capable, mais seulement une fois le plan clair.
- Fixer une limite d'itérations (`steps`) sur les sous-agents.
- Référence : `assets/reference/model-selection.md`.

## Découper et déléguer
- Sous-tâches isolées → sous-agents (`ops-quality`, `integrations`) : contexte séparé, n'alourdit pas la session.
- Skills = charges ponctuelles d'instructions, invoquées via `skill <nom>`.
- Laisser la compaction automatique résumer les longues sessions.

## Prompts réutilisables
- Garder un **prompt template** pour les tâches récurrentes (revues de PR, AGENTS.md, logs) — économise ~40 % de tokens.

## Mode streaming & cancellation
- Préférer le mode streaming : permet d'interrompre dès que la sortie dévie.

## Sortie
- Réponses concises, sans préambule ni redite.
- Ne générer code/fichiers que lorsqu'ils sont demandés.

## Réflexe
- Avant une action coûteuse, se demander : « existe-t-il un chemin moins coûteux pour le même résultat ? »

## Assets
- `assets/reference/model-selection.md`
