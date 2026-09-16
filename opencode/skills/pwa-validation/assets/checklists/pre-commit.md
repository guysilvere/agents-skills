# Checklist — Pré-commit

## Sécurité (EN PREMIER — bloquant)
- [ ] `gitleaks detect --source . --redact` sans résultat (historique Git inclus)
- [ ] Fallback grep sans résultat : `sk-`, `AKIA`, `ghp_`, `password=`, `SECRET`, `TOKEN`
- [ ] `.env` non commité (présent dans .gitignore)
- [ ] Aucune URL de BDD / clé API en clair dans le code
- [ ] `npm audit --audit-level=high` sans CVE bloquante + lockfile commité
- [ ] CSP + headers de sécurité présents

## Qualité du code
- [ ] Lint passe sans erreur (`npm run lint`)
- [ ] Typecheck passe (`npm run typecheck`)
- [ ] Tests unitaires passent (`npm test`) — écrits et verts (DoD, voir `WORKFLOW.md`)
- [ ] Build de production réussi sans warning bloquant (`npm run build`)

## PWA & preview locale (Caddy)
- [ ] Preview du **build de production** servie en `https://<projet>.test` — pas `localhost`, pas le serveur de dev
- [ ] Installabilité vérifiée via **DevTools → Application** (Manifest + service worker) — Lighthouse ≥ 12 ne note plus la PWA
- [ ] Mode hors-ligne : page de repli active + fonctions de base
- [ ] Performance ≥ 80 · Accessibilité ≥ 90 (Lighthouse sur HTTPS)
- [ ] LCP < 2.5 s · CLS < 0.1 · **TBT < 200 ms** (l'**INP** est une métrique terrain, non mesurable en labo)

## UX mobile
- [ ] Cibles tactiles ≥ 44 px
- [ ] Contraste ≥ 4.5:1
- [ ] Pas de scroll horizontal
- [ ] Safe areas gérées (notch / barre de gestes)

## Docs synchronisées (Living Documentation)
- [ ] DESIGN_SYSTEM.md / DATABASE.md / BLUEPRINT.md à jour si dérive
- [ ] `.env.example` à jour si nouvelle variable
- [ ] CHANGELOG.md préparé pour la version

## Git
- [ ] Branche de travail (`testing`) — jamais `main`
- [ ] Commit en Conventional Commits `type(scope): résumé`
- [ ] Merge `main` via **PR** (CI verte + validation humaine)
