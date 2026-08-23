# Checklist — Déploiement

## Avant déploiement
- [ ] Validation complète passée (skill `pwa-validation`) : lint, tests, build, Lighthouse, a11y, SEO, sécurité
- [ ] Aucun blocage sécurité (⛔) en cours
- [ ] `CHANGELOG.md` à jour + bump SemVer décidé
- [ ] Merge `testing` → `main` effectué
- [ ] Tag version + release GitHub créés
- [ ] `.env.example` à jour ; secrets configurés dans Coolify (jamais commités)

## Staging
- [ ] Déploiement staging OK (`staging.<domaine>` + PocketBase dédiée)
- [ ] Validation fonctionnelle sur l'environnement miroir
- [ ] Démo client possible sans impacter la prod

## Production (Coolify)
- [ ] Déploiement depuis GitHub (branch `main`) réussi
- [ ] Healthcheck OK
- [ ] Logs sans erreur bloquante
- [ ] SSL actif (auto via Caddy / Cloudflare Full Strict)

## Cloudflare
- [ ] Proxy orange actif (IP masquée)
- [ ] SSL Full (Strict)
- [ ] Turnstile actif sur formulaires
- [ ] Règles de cache edge appliquées
- [ ] Tunnels Zero Trust fonctionnels (consoles d'admin accessibles)
- [ ] Aucun port d'admin exposé publiquement

## Données & sauvegardes
- [ ] PocketBase déployé avec volume persistant
- [ ] Backup quotidien R2 configuré (cron) et exécuté
- [ ] Test de restauration effectué récemment (date : ___)
- [ ] Médias compressés AVIF/WebP avant upload

## Après déploiement
- [ ] `docs/RUNBOOK.md` mis à jour (procédures, incidents éventuels)
- [ ] `README.md` + `ROADMAP.md` à jour
- [ ] Monitoring/alertes actifs
