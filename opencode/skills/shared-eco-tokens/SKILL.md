---
name: shared-eco-tokens
description: Référence d'arbitrage de modèles et optimisation de coût pour sessions longues ou traitements par lots. Utiliser à la demande lorsqu'une tâche nécessite de choisir le modèle le plus adapté (flash vs capable) ou d'auditer la consommation de tokens.
license: MIT
compatibility: opencode, antigravity, claude
metadata:
  audience: tous
  domain: productivite
---

# shared-eco-tokens

> Cette skill est une **référence à la demande**. Les 5 réflexes continus d'économie de tokens sont intégrés directement dans les règles globales et n'exigent pas de lire ce fichier à chaque tour.

## Quand me charger ?
- Arbitrage explicite de modèle pour une sous-tâche (`assets/reference/model-selection.md`).
- Audit de consommation ou d'explosion de tokens sur une session longue.
- Optimisation d'un lot de prompts ou automatisation récurrente.

## 1. Choisir le modèle selon la tâche
- Tâches simples / planification / revue / résumé : modèle rapide et peu coûteux (`flash`).
- Implémentation complexe, architecture délicate : modèle plus capable (`pro` / `sonnet`), uniquement une fois le plan validé.
- Fixer une limite d'itérations (`steps` / `maxTurns`) sur chaque sous-agent.
- Table détaillée : `assets/reference/model-selection.md`.

## 2. Découper et déléguer
- Sous-tâches isolées → sous-agents (`ops-quality`, `integrations`) pour maintenir un contexte principal léger.
- Skills = chargements ponctuels d'instructions, invoquées uniquement quand l'étape l'exige.
- Laisser la compaction automatique résumer les longues sessions.

## 3. Prompts réutilisables & templates
- Garder un template stable pour les tâches récurrentes (revues de PR, specs, rapports QA) — économise ~40 % de tokens.

## Assets
- `assets/reference/model-selection.md`
