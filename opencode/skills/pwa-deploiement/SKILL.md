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
- Comble le gap Phase 8 du workflow projet : déploiement Coolify, configuration Cloudflare, sauvegardes R2, restauration, compression médias.
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
- Backup automatique : base de données (fichier `pb_data/data.db` ou dump SQL) + fichiers médias → bucket R2.
- Scripts : `assets/scripts/backup-r2.sh` (sauvegarde), `assets/scripts/restore-r2.sh` (restauration).
- **Tester régulièrement la procédure de restauration** (obligatoire).
- Monitoring : uptime + alertes de statut.

## 5. Compression des médias (obligatoire avant upload)
- Toutes les images/médias utilisateurs compressés en **AVIF ou WebP** côté client ou backend avant envoi vers R2.
- Script : `assets/scripts/compress-avif.sh` (conversion batch).

## 6. RUNBOOK (docs/RUNBOOK.md)
- Livrable Phase 8 : procédures opérationnelles condensées.
- Contenu : déploiement, staging, sauvegardes/restauration, monitoring, incidents, rotation des clés.
- Template : `assets/templates/RUNBOOK.md`.

## 7. docker-compose.yml (prod/staging)
- Services : app (image build), PocketBase sidecar (volume `pb_data`), optionnel : n8n.
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
