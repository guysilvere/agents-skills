---
name: pwa-validation
description: Validation complète d'une PWA avant commit et déploiement — tests locaux via Caddy (.test), lint, typecheck, tests unitaires, build, Lighthouse, audits a11y/SEO/sécurité, checklist pré-commit. Charger avant chaque commit (via ops-quality) pour valider build, performances, accessibilité et sécurité.
license: MIT
compatibility: opencode
metadata:
  audience: ops-quality
  domain: validation
---

# pwa-validation

## Ce que je fais
- Exécute la séquence complète de validation d'une PWA avant commit.
- Centralise l'ancienne skill pwa-tests-locaux + audits a11y/SEO/sécurité.

## 1. Preview locale — Caddy + Docker Desktop (pas localhost)
- Caddy installé : `/opt/homebrew/bin/caddy`, config unique `~/.config/caddy/Caddyfile` (lancé via `caddy run --config ~/.config/caddy/Caddyfile`).
- App lancée via Docker Desktop (`docker compose -f docker-compose.dev.yml up`).
- Ajouter un bloc par projet dans Caddyfile (mappage vers le port exposé par le conteneur Docker) :
```caddy
mon-projet.test, mon-projet.localhost {
    tls internal
    reverse_proxy localhost:5173
}
```
- Recharger après modification : `caddy reload --config ~/.config/caddy/Caddyfile`.
- **Ne jamais tester via `http://localhost:<port>`** — toujours le domaine `.test` (HTTPS local automatique).
- Vérifier qu'aucun service n'écoute déjà sur le port cible.
- Config de référence : `assets/configs/Caddyfile.test`.

## 2. Séquence de validation (dans l'ordre, chaque étape doit passer)
0. **Détection de secrets EN PREMIER** — bloquante et bon marché : inutile de lancer Lighthouse si une clé est commitée.
   - `gitleaks detect --source . --redact` (couvre aussi l'historique Git ; `brew install gitleaks` si absent).
   - Fallback grep : `sk-`, `AKIA`, `ghp_`, `password=`, `SECRET`, `TOKEN`.
   - `npm audit --audit-level=high` + vérifier que le lockfile est commité.
1. **Lint** : `npm run lint` (ESLint / Biome) + `ruff check .` (si backend Python)
2. **Typecheck** : `npm run typecheck` (TS) + `mypy .` / `pyright` (Python si configuré)
3. **Tests unitaires** : `npm test` + `pytest` (si micro-services Python) — écrits par `lead-dev` / `integrations`, pas par `ops-quality`
4. **Build** : `npm run build` sans erreur ni warning bloquant
5. **Preview** : servir le **build de production** (`npm run preview`) via Caddy en **`https://mon-projet.test`** — jamais `localhost`, jamais le serveur de dev (scores non représentatifs).
6. **Tests E2E** : `playwright-cli` — parcours réels (auth, paiement, CRUD, hors-ligne), screenshots succès/échec. Checklist : `assets/checklists/e2e.md`
7. **Audit design automatisé** : `impeccable detect <src>` — 59 règles déterministes anti-slop ; sortie `--json` CI-friendly. **Épingler en devDependency** (`npm i -D impeccable`) — pas de `npx` à la volée sur un paquet non épinglé.
8. **Lighthouse**, sur le build de prod servi en **HTTPS** :
   `npx lighthouse https://mon-projet.test --view --chrome-flags="--ignore-certificate-errors"`
   - Le Chrome lancé par Lighthouse doit accepter le certificat `tls internal` de Caddy, sinon l'audit échoue.
   - Cibles : Performance ≥ 80 (LCP < 2.5 s) · Accessibilité ≥ 90 · CLS < 0.1 · **TBT < 200 ms**.
   - ⚠️ La catégorie **« PWA installable » n'existe plus dans Lighthouse ≥ 12** → vérifier l'installabilité via la checklist PWA et le panneau Application de Chrome DevTools.
   - ⚠️ **INP** est une métrique terrain, non mesurable dans un audit de navigation : utiliser **TBT** comme proxy en labo.
9. **Test hors-ligne** : DevTools → Application → Service Workers → Offline → page de repli + fonctions de base

## 3. Audit accessibilité (a11y)
- Contraste ≥ 4.5:1 (WCAG AA) ; focus visible ; navigation clavier et tactile
- ARIA ; labels sur icônes ; `prefers-reduced-motion` ; safe areas
- Checklist : `assets/checklists/a11y.md`

## 4. Audit SEO
- Title unique + meta description < 160 car. ; OpenGraph / Twitter Cards
- robots.txt, sitemap.xml ; données structurées JSON-LD
- Checklist : `assets/checklists/seo.md`

## 5. Audit sécurité (complète l'étape 0)
- **Secrets** : `gitleaks` (historique Git inclus) ; `.env` non commité (vérifier .gitignore) ; aucun token dans logs/commentaires
- **Dépendances** : `npm audit` + lockfile commité
- **OWASP Top 10** : injection (SQL/shell/NoSQL), XSS (innerHTML non contrôlé), IDOR, stack traces exposées
- **PWA** : SW scope trop large, cache poisoning, permissions manifest excessives, HTTPS obligatoire, CSP restrictive, headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy), CORS explicite
- **Données** : pas de données sensibles en clair dans localStorage/IndexedDB ; transmission chiffrée
- Checklist : `assets/checklists/security.md`

## 6. Checklist pré-commit
- Lint + typecheck OK · tests OK · build OK · PWA installable · hors-ligne OK · cibles tactiles ≥ 44px · contraste ≥ 4.5:1 · pas de scroll horizontal · aucun secret dans le code
- Checklist : `assets/checklists/pre-commit.md`

## 7. Verdict
- ✅ **Prêt à commiter** → cycle Git (branche testing, commit conventionnel, tag, release) via ops-quality.
- ⚠️ **Corrections requises** → lister les points bloquants priorisés, retourner à `lead-dev` (ne pas corriger soi-même).
- ⛔ **Blocage sécurité** → ne pas commiter, ne pas tagger/release tant que levé.

## Règles
- Ne pas modifier le code applicatif — signaler puis livrer.
- Toujours charger `shared-eco-tokens` pour un rapport concis.
- Outils externes : `playwright-cli` — paquet **`@playwright/cli`** (le paquet npm `playwright-cli` est déprécié) ; `impeccable` — à épingler en devDependency.

## Assets
- `assets/checklists/pre-commit.md`
- `assets/checklists/security.md`
- `assets/checklists/seo.md`
- `assets/checklists/a11y.md`
- `assets/checklists/e2e.md`
- `assets/configs/Caddyfile.test`
