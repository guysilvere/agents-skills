---
description: Lance la validation complète (tests locaux Caddy, build, lint, Lighthouse, a11y, SEO, sécurité) via ops-quality.
agent: ops-quality
---

Exécute la validation complète de la PWA en cours (skill `pwa-validation`) :

1. Charge la skill `pwa-validation` (`skill pwa-validation`).
2. Séquence : lint → typecheck → tests → build → vérification /etc/hosts + Caddy auto-start + site local (.test/.local via `~/Projets/PROJECTS_REGISTRY.md`) → preview Docker OrbStack (`docker compose -f docker-compose.dev.yml up`) → identifiants via `docs/credentials.md` → Lighthouse → hors-ligne.
3. Audits : a11y (checklist), SEO (checklist), sécurité (checklist — grep secrets, vérification `.gitignore` pour `.env`, `docs/credentials.md`, bases locales, OWASP).
4. Vérifie la checklist pré-commit.
5. Verdict : ✅ prêt à commiter / ⚠️ corrections requises (liste priorisée) / ⛔ blocage sécurité.
6. Ne corrige PAS le code : signale les points bloquants à lead-dev.

Contexte : $ARGUMENTS
