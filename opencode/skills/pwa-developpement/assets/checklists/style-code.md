# Checklist — Style de code (tous langages)

## Nommage
- [ ] Variables/fonctions/classes nommées avec un rôle explicite (pas de `x`, `tmp`, `data`)
- [ ] camelCase JS/TS · snake_case Python · PascalCase composants
- [ ] Fonctions avec verbe d'action : `getUser()`, `formatPrice()`

## DRY & structure
- [ ] Pas de blocs dupliqués (factoriser dès la 2ᵉ occurrence)
- [ ] Pas de copier-coller de config/styles (variables, thèmes, constantes)
- [ ] Une fonction = une responsabilité ; fonctions pures si possible
- [ ] Pas de logique métier dans les composants/UI

## Gestion d'erreur
- [ ] try/catch ou `.catch()` partout — aucun `throw` non rattrapé
- [ ] Aucune Promise sans gestion d'erreur
- [ ] Messages d'erreur explicites (et en français pour l'utilisateur final)

## Commentaires
- [ ] Uniquement le POURQUOI (décisions, workarounds, raisons métier)
- [ ] Aucun code commenté
- [ ] JSDoc/docstrings sur les fonctions publiques

## Imports & organisation
- [ ] Groupés : libs → composants → styles ; ordre alphabétique
- [ ] Aucun import inutilisé

## HTML/JSX
- [ ] Balises sémantiques ; un seul `<h1>` ; pas de sauts de headings
- [ ] `alt` sur chaque img ; `<label>` sur chaque champ ; contraste ≥ 4.5:1
- [ ] `defer`/`async` scripts ; `loading="lazy"` images ; pas de styles inline
- [ ] Title unique ; meta description < 160 car.

## CSS
- [ ] Mobile-first (`min-width`) ; pas de sélecteurs trop spécifiques
- [ ] Tokens/variables pour les motifs récurrents
- [ ] Pas de scroll horizontal ; `min-h-dvh` (pas `100vh`)

## TypeScript
- [ ] TS strict ; pas d'`any` silencieux
- [ ] Types explicites sur les contrats API/données

## Python (FastAPI / IA / Data)
- [ ] Type hints stricts partout (`from typing import ...`)
- [ ] Modèles Pydantic v2 pour toutes les requêtes/réponses d'API
- [ ] Handlers FastAPI en `async def` avec I/O non bloquantes
- [ ] Ruff passe sans erreur (`ruff check .` et `ruff format --check .`)
- [ ] Dépendances déclarées dans `pyproject.toml` (géré par uv ou poetry)
- [ ] Aucun secret en clair (utilisation de `pydantic-settings` ou `os.environ`)

## Propreté générale
- [ ] Pas de console.log laissés en prod
- [ ] Pas de code mort / fichiers inutilisés
- [ ] Fichiers générés et code tiers non modifiés
