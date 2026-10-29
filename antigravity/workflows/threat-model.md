---
name: threat-model
description: Génère une modélisation des menaces STRIDE pour une fonctionnalité ou une architecture PWA.
---

# Modélisation des menaces (STRIDE)

Analyse et atténuation des risques de sécurité pour la fonctionnalité ciblée.

## Étape 1 — Chargement du template

Charge la skill `pwa-cadrage` et lis le template `assets/templates/THREAT_MODEL.md`.

## Étape 2 — Définition de la surface d'attaque

- Cartographie les routes HTTP et server actions SvelteKit.
- Identifie les webhooks entrants (paiement, Brevo) et leurs signatures HMAC.
- Analyse les accès à la base de données Turso (rappel : absence de RLS native → autorisation serveur obligatoire).
- Vérifie les flux d'upload Cloudflare R2.

## Étape 3 — Matrice STRIDE

Évalue chaque catégorie :
- **Spoofing** : Session, cookies HttpOnly, signature webhook HMAC.
- **Tampering** : Validation Zod stricte, requêtes SQL paramétrées Drizzle.
- **Repudiation** : Journalisation d'audit des actions critiques et paiements.
- **Information Disclosure** : Prévention des IDOR sur Turso (`WHERE id = ? AND user_id = ?`), protection des secrets d'environnement.
- **Denial of Service** : Rate limiting, protection Cloudflare Turnstile.
- **Elevation of Privilege** : Vérification des rôles et contrôle d'accès applicatif.

## Étape 4 — Livrable

Produis le document `docs/security/THREAT_MODEL.md` ou intègre la matrice dans la spécification `docs/specs/SPEC-XXX.md`.
