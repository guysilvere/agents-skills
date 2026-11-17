---
name: validate
description: Validation complète avant commit — tests locaux, build, lint, Lighthouse, a11y, SEO, sécurité.
---

# Validation PWA (pré-commit)

Lance la validation complète du projet mentionné.

## Étape 1 — Prérequis

Charge la skill `pwa-validation` :
- Vérifier la branche (`testing` — jamais `main`).
- Consulter `~/Projets/PROJECTS_REGISTRY.md` pour le port réservé du projet.
- Vérifier obligatoirement `/etc/hosts` (s'assurer que `<projet>.test` et `<projet>.local` sont bien inscrits sans conflit, ajouter si manquant).
- Démarrer Caddy s'il est inactif (`pgrep -f caddy` / `caddy run`) et vérifier le site local (`<projet>.test` et `<projet>.local`) dans `~/.config/caddy/Caddyfile`.
- Lancer systématiquement l'application via Docker et OrbStack (`docker compose -f docker-compose.dev.yml up`) — jamais de serveur nu sur l'hôte.
- Se référer à `docs/credentials.md` pour tous les accès tests requis (le créer et le maintenir s'il n'existe pas).

## Étape 2 — Exécution des checks

- Build + lint + typecheck.
- Tests unitaires (règles métier, calculs de prix).
- Lighthouse : score performance mobile ≥ 90.
- Audit a11y (WCAG AA) + SEO (OG, robots.txt, sitemap).

## Étape 3 — Audit sécurité

- OWASP Top 10, secrets exposés, exclusion Git stricte (`.env`, `docs/credentials.md`, bases locales `*.local.db` dans `.gitignore`), en-têtes HTTP (CSP, HSTS), CORS, Turnstile.

## Étape 4 — Verdict & traçabilité GitHub

- ✅ Prêt pour commit/release
- ⚠️ Corrections listées (priorisées) — ne pas commiter sans accord ; ouvrir/mettre à jour une Issue GitHub si récurrent
- ⛔ Bloquant — **ouvrir (ou commenter) l'Issue GitHub** (`issue_write` / `gh issue create`) avec commande échouée + sortie d'erreur avant de retourner à `pwa-developpement` (`/fix`)

## Étape 5 — Rapport

Livre le rapport : checks exécutés, scores, verdict, `Issue : #<id>` (si `⛔`/`⚠️`) et liste de corrections priorisée.
