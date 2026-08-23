---
description: Audit sécurité complet + validation PWA avant mise en production via ops-quality et la skill pwa-validation.
agent: ops-quality
---

Effectue un audit sécurité complet et une validation PWA sur le projet :

1. Charge la skill `pwa-validation` (`skill pwa-validation`).
2. Étape 1 — Audit sécurité : OWASP Top 10, secrets exposés, headers HTTP, CORS, CSP.
3. Étape 2 — Validation PWA : build, Lighthouse (≥ 90), mode hors-ligne, UX, a11y (WCAG AA), SEO.
4. Étape 3 — Verdict consolidé :
   - ✅ Prêt pour prod
   - ⚠️ Corrections nécessaires (liste priorisée)
   - ⛔ Bloquant sécurité
5. Étape 4 — Si nécessaire, applique ou fais appliquer les corrections via `pwa-developpement`, puis revalide.
6. Étape 5 — Présente le rapport final avec verdict clair, corrections priorisées et chemins des fichiers audités.

Contexte additionnel : $ARGUMENTS
