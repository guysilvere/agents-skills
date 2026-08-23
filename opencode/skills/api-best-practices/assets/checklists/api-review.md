# Checklist — Revue d'API (avant mise en production)

## Conception
- [ ] Ressources au pluriel, nommage cohérent
- [ ] Versioning (`/api/v1/`) appliqué
- [ ] Pagination définie (cursor ou offset-limit)
- [ ] Status codes corrects (200/201/204/400/401/403/404/409/422/500)
- [ ] Payloads typés (contrats explicites) ; pas de données non requises exposées

## Sécurité
- [ ] Authentification configurée et testée (API key / JWT / OAuth)
- [ ] Aucun secret en clair (headers, logs, réponses d'erreur)
- [ ] Rate limiting actif avec headers de quota
- [ ] CORS restreint aux origines autorisées
- [ ] Headers de sécurité : HSTS, X-Content-Type-Options
- [ ] Entrées utilisateur validées (injection, XSS)

## Robustesse
- [ ] Gestion d'erreur standardisée (structure unique, messages français)
- [ ] Timeout configuré (10-30 s)
- [ ] Retry avec backoff exponentiel + jitter (max 3-5)
- [ ] Idempotence des écritures (`Idempotency-Key`)
- [ ] Webhooks signés (HMAC) et vérifiés ; réponse 2xx d'accusé

## Observabilité
- [ ] Logs structurés (request_id, timestamps, sans données sensibles)
- [ ] Monitoring des erreurs (4xx/5xx)
- [ ] Tests d'intégration couvrant les cas d'erreur

## Docs
- [ ] Endpoints documentés (OpenAPI/Swagger)
- [ ] `.env.example` à jour (nouvelles clés)
- [ ] `docs/BLUEPRINT.md` mis à jour (routes, webhooks, jobs)
