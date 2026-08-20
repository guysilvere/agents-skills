---
name: spec
description: Génère une spécification fonctionnelle docs/specs/SPEC-XXX.md pour une nouvelle fonctionnalité.
---

# Spécification fonctionnelle (SPEC-XXX)

Crée la spec unitaire de la fonctionnalité demandée.

## Étape 1 — Template

Charge la skill `pwa-developpement` et lis le template `assets/templates/SPEC-XXX.md`.

## Étape 2 — Rédaction

Rédige `docs/specs/SPEC-XXX-<nom>.md` avec :
- Intent (Problème / Objectif)
- User Story
- Exigences (table ID / Exigence / Critère de fin DoD)
- Edge cases
- PWA / Offline (requis ou non)
- Modèle de données & API (collection + routes)
- Fichiers impactés
- Tâches d'exécution (T1 backend, T2 UI, T3 build/lint, T4 commit)

## Étape 3 — Statut

- Statut initial : DRAFT → soumettre à l'utilisateur pour APPROVED.

## Étape 4 — Livrable

Présente le chemin du fichier, le statut, et les tâches ordonnées.
