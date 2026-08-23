# Checklist — Pré-commit

## Qualité du code
- [ ] Lint passe sans erreur (`npm run lint`)
- [ ] Typecheck passe (`npm run typecheck`)
- [ ] Tests unitaires passent (`npm test`)
- [ ] Build de production réussi sans warning bloquant (`npm run build`)

## PWA & preview locale (Caddy)
- [ ] Preview servie via domaine `.test` (pas localhost)
- [ ] Manifest + service worker détectés par Lighthouse
- [ ] Mode hors-ligne : page de repli active + fonctions de base
- [ ] Performance ≥ 80 · Accessibilité ≥ 90 (Lighthouse)
- [ ] CLS < 0.1 · INP < 200 ms

## UX mobile
- [ ] Cibles tactiles ≥ 44 px
- [ ] Contraste ≥ 4.5:1
- [ ] Pas de scroll horizontal
- [ ] Safe areas gérées (notch / barre de gestes)

## Sécurité (aucun secret)
- [ ] Grep sans résultat : `sk-`, `AKIA`, `ghp_`, `password=`, `SECRET`, `TOKEN`
- [ ] `.env` non commité (présent dans .gitignore)
- [ ] Aucune URL de BDD / clé API en clair dans le code
- [ ] CSP + headers de sécurité présents

## Docs synchronisées (Living Documentation)
- [ ] DESIGN_SYSTEM.md / DATABASE.md / BLUEPRINT.md à jour si dérive
- [ ] `.env.example` à jour si nouvelle variable
- [ ] CHANGELOG.md préparé pour la version

## Git
- [ ] Branche de travail (`testing`) — jamais `main`
- [ ] Commit en Conventional Commits `type(scope): résumé`
