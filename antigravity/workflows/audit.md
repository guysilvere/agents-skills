---
name: audit
description: Audit sécurité complet + validation PWA avant mise en production.
---

# Audit sécurité et validation PWA

Reçois la mission d'audit pour le projet mentionné (dossier ou dépôt GitHub).

## Étape 1 — Audit sécurité

Charge la skill `pwa-validation` :
- OWASP Top 10, secrets exposés, headers HTTP, CORS, CSP.

## Étape 2 — Validation PWA

Toujours avec la skill `pwa-validation` :
- Validation complète : build, Lighthouse, hors-ligne, UX, a11y, SEO.

## Étape 3 — Verdict consolidé

Consolide les deux rapports en un verdict unique :
- ✅ Prêt pour prod
- ⚠️ Corrections nécessaires (liste priorisée)
- ⛔ Bloquant sécurité

## Étape 4 — Corrections

Si le verdict est ⚠️ ou ⛔ : charge la skill `pwa-developpement` pour appliquer les corrections, puis relance les étapes 1 à 3.

## Étape 5 — Rapport final

Livre le rapport final : verdict, corrections priorisées, chemins des fichiers audités, statut des validations.
