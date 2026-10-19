# Checklist — Audit sécurité

## Secrets & credentials
- [ ] Aucune variable d'env exposée dans le code (.env hardcodé, clés API en clair)
- [ ] `.env` absent du dépôt Git (vérifier .gitignore)
- [ ] Aucun token/credential dans les logs ou commentaires
- [ ] Secrets stockés via `{file:...}` ou variables d'environnement, jamais en clair

## OWASP Top 10
- [ ] Injection : SQL / commandes shell / NoSQL — entrées sanitisées
- [ ] XSS : entrées utilisateur non sanitisées, `innerHTML` contrôlé
- [ ] IDOR / contrôle d'accès manquant (vérifier chaque ressource)
- [ ] Erreurs non gérées exposant des stack traces → messages génériques
- [ ] Dépendances : `npm audit` — pas de CVE connues bloquantes

## PWA spécifique
- [ ] Service worker : scope raisonnable, pas de cache poisoning
- [ ] Manifest : pas de permissions excessives
- [ ] HTTPS obligatoire (Caddy local / Cloudflare prod)
- [ ] CSP (Content Security Policy) définie et restrictive
- [ ] Headers : `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`
- [ ] CORS : origines autorisées explicites

## Sessions
- [ ] Cookie de session **`HttpOnly`** — inaccessible au JavaScript
- [ ] Flag **`Secure`** — transmis en HTTPS uniquement
- [ ] **`SameSite=Lax`** (ou `Strict` sur les routes sensibles) — protection CSRF
- [ ] Durée de vie bornée + renouvellement à l'activité
- [ ] **Invalidation côté serveur** à la déconnexion (pas seulement la suppression du cookie client)
- [ ] **Rotation** de l'identifiant de session après authentification (anti-fixation)
- [ ] Aucun jeton d'authentification dans `localStorage` (vulnérable au XSS) — préférer un cookie `HttpOnly`

## Données & vie privée
- [ ] Pas de données sensibles en clair dans localStorage / IndexedDB
- [ ] Transmission de données personnelles chiffrée (TLS)
- [ ] Conformité RGPD : bannière cookies, politique de confidentialité

## Paiements & Webhooks (GeniusPay)
- [ ] Signature HMAC vérifiée en temps constant (`crypto.timingSafeEqual`) pour prévenir les attaques temporelles
- [ ] Secret de webhook stocké en variable d'environnement serveur uniquement
- [ ] Idempotence transactionnelle : table `processed_events` vérifiée avant tout traitement pour rejeter les doublons
- [ ] Recalcul du montant côté serveur : jamais de confiance au montant ou statut transmis par le client
- [ ] Réconciliation d'état : interrogation de l'API GeniusPay pour vérifier le statut réel en cas de doute

## Menaces & Architecture (STRIDE)
- [ ] Modélisation STRIDE validée (`pwa-cadrage/assets/templates/THREAT_MODEL.md`) pour chaque flux de données critique
- [ ] Autorisation applicative systématique sur chaque endpoint Turso (`WHERE id = ? AND user_id = ?`) — aucune RLS native
- [ ] Validation Zod stricte sur tous les schémas entrants (`request.json()`, params, formulaires)

## Infra (prod)
- [ ] Proxy Cloudflare orange (IP masquée), SSL Full (Strict)
- [ ] Consoles d'admin via tunnels Zero Trust (pas de ports ouverts)
- [ ] Jeton Turso **scopé** par environnement (read-only quand possible) — jamais partagé entre staging et prod
- [ ] Rate limiting sur les routes sensibles (auth, paiement, webhooks)

## Verdict
- [ ] ⛔ Blocage sécurité critique → ne PAS commiter ni release tant que levé

