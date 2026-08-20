---
name: docs-sync
description: Vérifie et restaure la cohérence de la living documentation (AGENTS.md, CADRAGE, BLUEPRINT, DATABASE, DESIGN_SYSTEM, specs, CHANGELOG).
---

# Synchronisation documentaire (living doc)

Vérifie que la documentation du projet est à jour par rapport au code.

## Étape 1 — Inspection

Charge la skill `pwa-developpement` :
- Lire `AGENTS.md` (point d'entrée) pour la liste des fichiers et les règles.

## Étape 2 — Comparaison doc ↔ code

Vérifier les écarts :
- UI (tokens, boutons, inputs, palette) → `docs/DESIGN_SYSTEM.md`
- Schéma (champs, tables, relations, RLS) → `docs/DATABASE.md`
- API (routes, payloads, webhooks, jobs) → `docs/BLUEPRINT.md`
- Variables d'env → `.env.example` + mapping AGENTS.md

## Étape 3 — Mise à jour

- Appliquer les corrections aux fichiers `.md` concernés (dans le même incrément).
- Vérifier que les specs en cours (SPEC-XXX) reflètent l'état réel.

## Étape 4 — Rapport

Livre : fichiers mis à jour, écarts corrigés, fichiers restants à valider.
