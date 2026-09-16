---
name: pwa-developpement
description: Développement de code PWA Agence Bulles — scaffolding, structure de projet, AGENTS.md, SPEC-XXX, DATABASE.md, README.md, conventions de branche, refactoring, cleanup et bonnes pratiques par langage (HTML, CSS, JS, TS, Python, JSON). Charger pour toute phase de construction ou de nettoyage de code.
license: MIT
compatibility: opencode
metadata:
  audience: lead-dev
  domain: developpement
---

# pwa-developpement

## Ce que je fais
- Guide le développement et le nettoyage de code PWA selon les standards Agence Bulles.
- Fournit les règles de qualité/propreté/performance par langage.
- Comble le gap DATABASE.md (schéma + règles d'accès).

## 1. Initialisation du projet
- Créer `AGENTS.md` à la racine (point d'entrée unique IA) si absent — template avec section « Compatibilité Antigravity » incluse.
- 🟩 Antigravity : dupliquer les règles projet dans `.agents/rules/*.md` (AGENTS.md n'y est pas lu) — template `assets/antigravity/rule.md` (skill `opencode-admin`).
- Créer `README.md` depuis l'ébauche du blueprint ; mise à jour à chaque feature.
- Créer `.env.example` listant TOUTES les clés (Jeko, CinetPay, Brevo/Mailtrap, Turnstile, R2, VAPID, PocketBase/Turso).
- Template : `assets/templates/AGENTS.md`, `assets/templates/README.md`, `assets/configs/.env.example`.

## 2. Règle de branche
- Vérifier la branche active AVANT toute modification : `git branch --show-current`.
- Si sur `main` → créer et basculer sur `testing`. Jamais de changement applicatif sur `main`.

## 3. Spécifications (SPEC-XXX)
- Toute nouvelle fonctionnalité → `docs/specs/SPEC-XXX-nom.md` avec le template standard obligatoire :
  - Intent (Problème/Objectif), User Story, Exigences (table ID/Exigence/DoD), Edge cases, PWA/Offline, Modèle de données & API, Fichiers impactés, Tâches.
- Statuts : DRAFT → APPROVED → IN_PROGRESS → DONE.
- Template : `assets/templates/SPEC-XXX.md`.

## 4. Conventions de code (tous langages)
- **Nommage** : explicite (jamais `x`, `tmp`, `data`) ; camelCase JS/TS, snake_case Python, PascalCase composants.
- **DRY** : factoriser dès la 2ᵉ occurrence ; pas de copier-coller config/styles.
- **Fonctions** : une responsabilité ; pures si possible ; verbe d'action.
- **Erreurs** : try/catch partout, messages explicites, jamais de Promise sans gestion d'erreur.
- **Commentaires** : seulement le POURQUOI ; pas de code commenté.
- **Imports** : groupés (libs → composants → styles), ordre alphabétique, jamais d'imports inutilisés.
- Checklist : `assets/checklists/style-code.md`.

### HTML/JSX
- Balises sémantiques, un seul `<h1>`, fragments au lieu de `<div>` inutiles.
- `alt` sur chaque img, `<label>` sur chaque champ, contraste ≥ 4.5:1.
- `defer`/`async` sur les scripts, `loading="lazy"` images, pas de styles inline.
- SEO : title unique, meta description < 160 car., JSON-LD.

### CSS/Tailwind
- Mobile-first (`min-width`) ; classes utilitaires ; motifs récurrents extraits (`@apply` ou composants).
- Variables CSS / tokens pour tout ce qui se répète.

### JavaScript/TypeScript
- TypeScript strict, types explicites sur les APIs/contrats de données.
- Pas d'`any` silencieux, pas de logique métier dans les composants.

### Python (FastAPI / Micro-services / Workers / IA)
- **Typage strict & validation** : Python 3.12+, `typing` systématique, modèles **Pydantic v2** pour tous les schemas d'entrée/sortie.
- **Framework & Asynchronisme** : **FastAPI** avec handlers `async def` non bloquants ; dépendances injectées via `Depends()`.
- **Outillage** : **Ruff** pour le linting/formatage (`ruff check .`, `ruff format .`) ; gestionnaire de paquets **uv** ou `pyproject.toml`.
- **Architecture** : Séparation stricte : `routers/`, `services/` (logique métier), `models/` (Pydantic / DB), `workers/` (tâches de fond).
- **Sécurité & secrets** : Variables d'environnement validées via `pydantic-settings` (`SettingsConfigDict`).

### PWA
- Manifest complet, service worker offline-first, IndexedDB pour les données locales.

## 5. Nettoyage & refactoring (après chaque feature)
1. Supprimer code mort, imports/variables inutilisés, code commenté.
2. Extraire les fonctions dupliquées ; simplifier la logique excessive.
3. Ne PAS toucher aux fichiers générés, config ou code tiers.
4. Recharger `pwa-validation` après nettoyage (lint + typecheck + build).

## 6. Environnement & Structure de projet (Docker en 1er choix)
- **Dev local conteneurisé (défaut)** : Lancement systématique via Docker Desktop :
  ```bash
  docker compose -f docker-compose.dev.yml up
  ```
  - Volumes montés pour le hot-reloading automatique (`src/`, `backend/`, `pb_hooks/`).
  - PocketBase / DB locale et micro-services isolés dans leur réseau Docker.
  - Proxy local Caddy (`https://projet.test`) pointant vers les ports exposés par les conteneurs.

```
projet/
├── src/                       # Code source frontend (React / PWA)
├── backend/                   # Micro-services Python / Hono (optionnel)
├── docker/pocketbase/
│   ├── pb_hooks/              # Logique métier serveur
│   ├── pb_migrations/         # Migrations versionnées
│   └── pb_data/               # Données locales (volume Docker)
├── Dockerfile                 # Multi-stage production (Coolify)
├── docker-compose.dev.yml     # Dev local avec hot-reload (Docker Desktop)
├── docker-compose.yml         # Prod / Staging
├── .env.example
└── docs/ (CADRAGE, BLUEPRINT, DATABASE, DESIGN_SYSTEM, specs/, RUNBOOK)
```

## 7. Base de données (DATABASE.md)
- Schéma relationnel succinct, règles d'accès (RLS / règles PocketBase), stratégie de migration, dictionnaire de données.
- Migration de la doc : toute modification de champs/tables/règles → mise à jour immédiate de `docs/DATABASE.md`.
- Template : `assets/templates/DATABASE.md`.

## Règles
- Ultra-léger : listes à puces partout ; zéro texte superflu.
- Aucun emoji dans l'interface sauf demande explicite ; une seule bibliothèque d'icônes.
- Images compressées AVIF/WebP avant upload R2 (jamais de PNG/JPEG bruts).
- Toujours charger `shared-eco-tokens` en parallèle.

## Assets
- `assets/templates/AGENTS.md`
- `assets/templates/SPEC-XXX.md`
- `assets/templates/DATABASE.md`
- `assets/templates/README.md`
- `assets/configs/.env.example`
- `assets/configs/docker-compose.dev.yml`
- `assets/checklists/style-code.md`
