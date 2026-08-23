---
description: Vérifie la living documentation du projet (AGENTS.md, CADRAGE, BLUEPRINT, DATABASE, DESIGN_SYSTEM, specs, README, ROADMAP, CHANGELOG, RUNBOOK).
agent: lead-dev
---

Vérifie la cohérence de la living documentation du projet (workflow phases 0-10) :

1. Liste les fichiers de documentation : `AGENTS.md`, `docs/CADRAGE.md`, `docs/BLUEPRINT.md`, `docs/DATABASE.md`, `docs/DESIGN_SYSTEM.md`, `docs/specs/*`, `docs/RUNBOOK.md`, `README.md`, `ROADMAP.md`, `CHANGELOG.md`.
2. Pour chaque fichier : existe-t-il ? est-il référencé dans `AGENTS.md` (mapping) ? contenu ultra-léger (listes à puces) ?
3. Détecte les dérives code/doc : compare les tokens UI (DESIGN_SYSTEM), le schéma (DATABASE), les routes API (BLUEPRINT) avec le code réel.
4. Vérifie `.env.example` : toutes les clés utilisées dans le code y sont-elles listées ?
5. Produis un rapport : fichiers à jour / fichiers à mettre à jour / manquants, avec la liste des corrections nécessaires.

Contexte : $ARGUMENTS
