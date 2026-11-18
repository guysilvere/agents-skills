# Conventions de code Agence Bulles (tous langages)

## Règles transverses
- **Nommage** : explicite (jamais `x`, `tmp`, `data`) ; camelCase JS/TS, snake_case Python, PascalCase composants.
- **DRY** : factoriser dès la 2ᵉ occurrence ; pas de copier-coller config/styles.
- **Fonctions** : une responsabilité ; pures si possible ; verbe d'action.
- **Erreurs** : try/catch partout, messages explicites, jamais de Promise sans gestion d'erreur.
- **Commentaires** : seulement le POURQUOI ; pas de code commenté.
- **Imports** : groupés (libs → composants → styles), ordre alphabétique, jamais d'imports inutilisés.
- Checklist : `assets/checklists/style-code.md`.

## HTML/JSX
- Balises sémantiques, un seul `<h1>`, fragments au lieu de `<div>` inutiles.
- `alt` sur chaque img, `<label>` sur chaque champ, contraste ≥ 4.5:1.
- `defer`/`async` sur les scripts, `loading="lazy"` images, pas de styles inline.
- SEO : title unique, meta description < 160 car., JSON-LD.

## CSS/Tailwind
- Mobile-first (`min-width`) ; classes utilitaires ; motifs récurrents extraits (`@apply` ou composants).
- Variables CSS / tokens pour tout ce qui se répète.

## JavaScript/TypeScript
- TypeScript strict, types explicites sur les APIs/contrats de données.
- Pas d'`any` silencieux, pas de logique métier dans les composants.

## Python (FastAPI / Workers / Services IA)
- **Typage strict & validation** : Python 3.12+, `typing` systématique, modèles **Pydantic v2** pour tous les schémas d'entrée/sortie.
- **Framework & Asynchronisme** : **FastAPI** avec handlers `async def` non bloquants ; dépendances injectées via `Depends()`.
- **Outillage** : **Ruff** pour le linting/formatage (`ruff check .`, `ruff format .`) ; gestionnaire **uv** ou `pyproject.toml`.
- **Architecture** : Séparation stricte : `routers/`, `services/` (logique métier), `models/` (Pydantic / DB), `workers/` (tâches de fond).
- **Sécurité & secrets** : Variables d'environnement validées via `pydantic-settings` (`SettingsConfigDict`).

## PWA
- Manifest complet, service worker offline-first, IndexedDB pour les données locales.
