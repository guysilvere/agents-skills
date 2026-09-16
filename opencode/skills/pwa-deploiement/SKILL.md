---
name: pwa-deploiement
description: Déploiement et exploitation d'une PWA Agence Bulles — RUNBOOK, déploiement Coolify + Cloudflare (proxy orange, tunnels Zero Trust), sauvegardes Cloudflare R2 (backup/restore), compression AVIF/WebP, docker-compose, staging. Charger (via ops-quality) dès qu'un déploiement, une sauvegarde, une restauration ou une mise en production est en jeu (Phase 8 du workflow).
license: MIT
compatibility: opencode
metadata:
  audience: ops-quality
  domain: deploiement
---

# pwa-deploiement

## Ce que je fais
- Couvre la **Phase 8** du workflow projet (`~/.config/opencode/WORKFLOW.md`) : déploiement Coolify, configuration Cloudflare, sauvegardes R2 et restauration, migrations + rollback, monitoring, compression médias.
- Fournit les procédures opérationnelles condensées (RUNBOOK).

## 1. Environnement de staging
- Déploiement totalement séparé de la production : `staging.<domaine>` + instance PocketBase dédiée (`db.staging.<domaine>`).
- Backups isolés ; validation fonctionnelle avant mise en ligne.

## 2. Déploiement Coolify
- Déploiement depuis GitHub (branche `main` après merge), SSL auto via Caddy, variables d'env dans l'UI Coolify.
- PocketBase : déploiement conteneurisé sur Coolify (volume pour `pb_data`). Turso : cloud libSQL managé.
- Micro-services Python (FastAPI) : conteneur Docker multi-stage (`python:3.12-slim` + Uvicorn), healthcheck sur `/health`.
- Vérifier : Dockerfile multi-stage présent, port correct, healthcheck.
- Checklist : `assets/checklists/deploy.md`.

## 3. Configuration Cloudflare
- **Proxy DNS orange** : masquer l'IP réelle du VPS, SSL Full (Strict).
- **Tunnels Zero Trust** : exposer les consoles d'admin (Coolify, PocketBase) sans ports ouverts → `assets/configs/cloudflared.yml`.
- **Turnstile** sur tous les formulaires ; WAF/DDoS ; règles de cache edge.
- **R2** : stockage médias/uploads/sauvegardes (0 egress).

## 4. Sauvegardes R2 (quotidiennes)
- Backup automatique : base de données + fichiers médias → bucket R2.
- **Cohérence obligatoire** : pour SQLite / PocketBase, utiliser le **mécanisme de backup de PocketBase** (snapshot à chaud / `.backup`). **Jamais** une copie brute du fichier `data.db` en cours d'écriture — le résultat serait corrompu.
- Scripts : `assets/scripts/backup-r2.sh` (sauvegarde), `assets/scripts/restore-r2.sh` (restauration).
- **Test de restauration obligatoire et périodique** : restaurer sur un environnement jetable, vérifier l'intégrité, détruire. Tracer la date du dernier test dans `RUNBOOK.md`. Une sauvegarde jamais restaurée n'est pas une sauvegarde.

## 5. Migrations — ordre impératif
1. **Backup** et vérifier qu'il est lisible
2. Migration testée sur une **copie de staging**
3. Déploiement du code
4. Migration en production
5. **Vérification** (healthcheck + requêtes de contrôle)
6. **Rollback** documenté et **testé en staging**
- ⛔ Aucune migration sur une base non locale sans validation humaine explicite.

## 6. Monitoring (minimum)
- **Disponibilité** : check uptime sur l'app et la console PocketBase — alertes vers email/slack.
- **Erreurs applicatives** : remontée et suivi (Sentry / logs Coolify) — alerte sur pic.
- **Jobs critiques** : alerte si la réconciliation des paiements ou les backups ne s'exécutent pas.

## 7. Compression des médias (obligatoire avant upload)
- Toutes les images/médias utilisateurs compressés en **AVIF ou WebP** avant envoi vers R2.
- ⚠️ **Pas dans les `pb_hooks`** (moteur JS embarqué, sans Node.js → pas de libs npm d'image) : côté client ou service dédié.
- Script : `assets/scripts/compress-avif.sh` (conversion batch).

## 8. RUNBOOK (docs/RUNBOOK.md)
- Livrable Phase 8 : procédures opérationnelles condensées.
- Contenu : déploiement, staging, migrations + rollback, sauvegardes/restauration (+ test périodique), monitoring, incidents, rotation des clés.
- Template : `assets/templates/RUNBOOK.md`.

## 9. docker-compose.yml (prod/staging)
- Services : app (image build), PocketBase sidecar (volume `pb_data`).
- **n8n : hors MVP sauf besoin avéré** — c'est un composant d'infra supplémentaire à héberger, sécuriser et sauvegarder. Si présent : webhooks entrants authentifiés.
- Template : `assets/configs/docker-compose.yml`.

## Règles
- Ne jamais exposer les ports d'admin publiquement (tunnels ou firewall).
- Chaque déploiement doit être documenté dans RUNBOOK.md (Living Documentation).
- Toujours charger `shared-eco-tokens` en parallèle.

## Assets
- `assets/templates/RUNBOOK.md`
- `assets/scripts/backup-r2.sh`
- `assets/scripts/restore-r2.sh`
- `assets/scripts/compress-avif.sh`
- `assets/configs/docker-compose.yml`
- `assets/configs/cloudflared.yml`
- `assets/checklists/deploy.md`
