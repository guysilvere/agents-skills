---
description: Lance la validation complète (tests locaux Caddy, build, lint, Lighthouse, a11y, SEO, sécurité) via ops-quality.
agent: ops-quality
---

Exécute la validation complète de la PWA en cours (skill `pwa-validation`) :

1. Charge la skill `pwa-validation` (`skill pwa-validation`).
2. Séquence : lint → typecheck → tests → build → preview Caddy (domaine .test) → Lighthouse → hors-ligne.
3. Audits : a11y (checklist), SEO (checklist), sécurité (checklist — grep secrets, OWASP).
4. Vérifie la checklist pré-commit.
5. Verdict : ✅ prêt à commiter / ⚠️ corrections requises (liste priorisée) / ⛔ blocage sécurité.
6. Ne corrige PAS le code : signale les points bloquants à lead-dev.

Contexte : $ARGUMENTS
