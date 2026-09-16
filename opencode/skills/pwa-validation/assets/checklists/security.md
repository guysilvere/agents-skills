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

## Données & vie privée
- [ ] Pas de données sensibles en clair dans localStorage / IndexedDB
- [ ] Transmission de données personnelles chiffrée (TLS)
- [ ] Conformité RGPD : bannière cookies, politique de confidentialité

## Infra (prod)
- [ ] Proxy Cloudflare orange (IP masquée), SSL Full (Strict)
- [ ] Consoles d'admin via tunnels Zero Trust (pas de ports ouverts)
- [ ] Jeton Turso **scopé** par environnement (read-only quand possible) — jamais partagé entre staging et prod
- [ ] Autorisation vérifiée sur **chaque** endpoint (Turso n'a pas de RLS → IDOR si oublié)
- [ ] Rate limiting sur les routes sensibles (auth, paiement)

## Verdict
- [ ] ⛔ Blocage sécurité critique → ne PAS commiter ni release tant que levé
