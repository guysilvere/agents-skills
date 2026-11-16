---
name: new-pwa
description: Blueprint complet + scaffold d'une nouvelle PWA Agence Bulles (phases 0-5).
---

# Création d'une nouvelle PWA

Lance la création d'une nouvelle PWA pour le projet mentionné.

## Phase 1 — Cadrage

### Étape 1 — Stress-test et naming

Charge la skill `pwa-cadrage` :
- Stress-tester l'idée.
- Proposer 5-10 noms + vérifier la disponibilité (domaine + GitHub).
- ⛔ Attendre la validation du nom par l'utilisateur.

### Étape 2 — Blueprint et stack

Avec la skill `pwa-cadrage` :
- Choisir la stack dans le cadre recommandé.
- Produire `docs/CADRAGE.md`, `docs/BLUEPRINT.md`.

### Étape 3 — Roadmap et monétisation

- Roadmap v0/v1/v2 (ROADMAP.md).
- Stratégie de monétisation (paiement — sandbox `pk_sandbox_…`).

## Phase 2 — Construction

### Étape 4 — Scaffold

Charge la skill `pwa-developpement` :
- Créer le dossier de projet.
- Scaffolder le projet, `npm install`, `git init`.
- Configurer le `.gitignore` : inclure les bases locales (`*.local.db`, `*.db`, etc.) et obligatoirement `docs/credentials.md`.
- **Réserver le port hôte** dans `~/Projets/PROJECTS_REGISTRY.md` (anti-doublon), déclarer le site `<projet>.test` et `<projet>.local` dans `~/.config/caddy/Caddyfile`, et inscrire les hôtes dans `/etc/hosts` (sur `127.0.0.1` et `::1`) sans erreur ni conflit.
- **Créer dès le départ `docs/credentials.md`** : lister les accès (login et mot de passe en clair pour visiteur, utilisateur standard, admin/QA). Ce sont les mêmes comptes de test qui serviront tout au long du développement. Fichier local uniquement, jamais commité.
- Créer l'`AGENTS.md` (+ section compatibilité Antigravity → `.agents/rules/`).
- Créer le `README.md` à partir du blueprint.

### Étape 5 — Livrables

Présente :
- Nom validé + blueprint (architecture, stack, data model).
- Roadmap + stratégie de monétisation.
- Code scaffoldé, prêt pour le développement des features.
