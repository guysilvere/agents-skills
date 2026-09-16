---
description: Déploie la PWA (staging/prod) via ops-quality — Coolify + Cloudflare, sauvegardes R2, RUNBOOK.
agent: ops-quality
---

Déploie la PWA en cours (skills `pwa-deploiement` + `pwa-validation`) :

1. Vérifie que la validation est passée (lancer `/validate` si nécessaire).
2. Charge la skill `pwa-deploiement` (`skill pwa-deploiement`).
3. Staging (si applicable) : déploiement `staging.<domaine>` + base Turso de staging, validation fonctionnelle.
4. Production : déploiement Coolify depuis GitHub (branch main), healthcheck, logs.
5. Cloudflare : proxy orange, SSL Full (Strict), tunnels Zero Trust pour les consoles d'admin.
6. Vérifie/planifie les sauvegardes R2 (backup-r2.sh, cron) et le test de restauration.
7. Documente la procédure dans `docs/RUNBOOK.md` (template RUNBOOK) et signale les alertes/monitoring.
8. Check déploiement final : checklist deploy.md.

Contexte : $ARGUMENTS
