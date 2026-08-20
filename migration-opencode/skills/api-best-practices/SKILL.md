---
name: api-best-practices
description: Guide de conception et d'intégration d'API RESTful — principes REST, sécurité, gestion d'erreur, webhooks, retry, idempotency, pagination, review checklist. À utiliser pour toute conception, intégration ou revue d'API (y compris Jèko/CinetPay via api-paiements).
license: MIT
compatibility: opencode
metadata:
  audience: integrations
  domain: api
---

# api-best-practices

## Ce que je fais
- Référentiel de conception et d'intégration d'API RESTful pour Agence Bulles.

## RESTful Design
- Ressources au pluriel (`/users`, `/payment_requests`) ; méthodes GET/POST/PUT/PATCH/DELETE.
- Versioning : `/api/v1/` dans l'URL.
- Pagination : cursor-based (grandes collections) / offset-limit (petites).
- Status codes : 200, 201, 204, 400, 401, 403, 404, 409, 422, 500.

## Authentification & sécurité
- API Keys : header personnalisé (`X-API-KEY`) pour les serveurs ; OAuth 2.1 / JWT pour les apps utilisateur.
- **Jamais de clés en clair** : `{file:...}` ou variables d'environnement.
- Rate limiting : headers `X-RateLimit-Remaining`, `Retry-After`.
- CORS : origines autorisées explicites en production.
- Headers : `Strict-Transport-Security`, `X-Content-Type-Options`.

## Gestion d'erreur
- Structure standard : `{ "id": "error_code", "message": "...", "extras": "..." }` → template `assets/templates/error-response.json`.
- Messages explicites, en français pour l'utilisateur final.
- Toujours catcher les erreurs HTTP (timeout, 4xx, 5xx) ; timeout raisonnable 10-30 s.

## Webhooks
- Signature HMAC pour vérifier l'authenticité ; URLs HTTPS uniquement.
- Idempotence : même payload = même résultat ; répondre 2xx pour accuser réception.
- Retry : backoff exponentiel + jitter, max 3-5 tentatives.

## Retry strategy
- Exponential backoff avec jitter ; max 3 tentatives appels API.
- Header `Idempotency-Key` pour éviter les doublons d'écriture.

## Review d'API (checklist)
- Passer `assets/checklists/api-review.md` avant chaque mise en production d'un endpoint.

## Assets
- `assets/templates/error-response.json`
- `assets/checklists/api-review.md`
