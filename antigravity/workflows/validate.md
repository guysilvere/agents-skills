---
name: validate
description: Validation complète avant commit — tests locaux, build, lint, Lighthouse, a11y, SEO, sécurité.
---

# Validation PWA (pré-commit)

Lance la validation complète du projet mentionné.

## Étape 1 — Prérequis

Charge la skill `pwa-validation` :
- Vérifier la branche (`testing` — jamais `main`).
- Vérifier le setup Caddy local (`<projet>.test`) pour tester SW/offline/installation PWA.

## Étape 2 — Exécution des checks

- Build + lint + typecheck.
- Tests unitaires (règles métier, calculs de prix).
- Lighthouse : score performance mobile ≥ 90.
- Audit a11y (WCAG AA) + SEO (OG, robots.txt, sitemap).

## Étape 3 — Audit sécurité

- OWASP Top 10, secrets exposés, en-têtes HTTP (CSP, HSTS), CORS, Turnstile.

## Étape 4 — Verdict

- ✅ Prêt pour commit/release
- ⚠️ Corrections listées (priorisées) — ne pas commiter sans accord
- ⛔ Bloquant — retourner à `pwa-developpement` pour correction

## Étape 5 — Rapport

Livre le rapport : checks exécutés, scores, verdict, liste de corrections priorisée.
