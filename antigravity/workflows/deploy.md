---
name: deploy
description: Déploiement staging puis production — Coolify + Cloudflare, tunnel Zero Trust, sauvegardes R2.
---

# Déploiement (Coolify + Cloudflare)

Lance le déploiement du projet mentionné.

## Étape 1 — Prérequis

Charge la skill `pwa-deploiement` :
- Valider la release sur GitHub (tag vX.Y.Z).
- Vérifier l'environnement staging (miroir de prod).

## Étape 2 — Staging

- Déployer sur l'environnement staging via Coolify.
- Valider fonctionnellement (tests, smoke checks).

## Étape 3 — Production

- Déployer en production (app SvelteKit + landing). Base **Turso** — managée, aucun conteneur de base à héberger.
- Vérifier le proxy Cloudflare (DNS orange, SSL Full Strict, Turnstile).
- Vérifier les tunnels Zero Trust (console Coolify).

## Étape 4 — Sauvegardes et monitoring

- Vérifier la sauvegarde quotidienne R2 (export logique Turso `.dump` + médias).
- Vérifier le monitoring / alerting.
- Mettre à jour `docs/RUNBOOK.md` si une procédure a changé.

## Étape 5 — Rapport

Livre : URL de prod, statut des validations, backup vérifié, liens RUNBOOK.
