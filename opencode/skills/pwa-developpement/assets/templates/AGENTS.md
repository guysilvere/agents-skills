# <Nom du projet> — Configuration

> Point d'entrée unique IA. Charger uniquement le fichier `.md` nécessaire à la tâche (faible consommation de tokens).
> ⚪ Règles de PROJET (ce fichier) — lues par OpenCode. Antigravity : voir section « Compatibilité Antigravity » en bas.

## Index & mapping des fichiers
| Fichier | Emplacement | Rôle |
|---------|-------------|------|
| AGENTS.md | Racine | Ce fichier — index, règles, contraintes |
| CADRAGE.md | docs/CADRAGE.md | Personas, KPIs, monétisation, scope MVP |
| BLUEPRINT.md | docs/BLUEPRINT.md | Stack, flux de données, routes API, webhooks, jobs |
| DATABASE.md | docs/DATABASE.md | Schéma, règles d'accès, migrations |
| DESIGN_SYSTEM.md | docs/DESIGN_SYSTEM.md | Tokens CSS, palette, layout signature PWA |
| SPEC-XXX.md | docs/specs/SPEC-XXX.md | Spec unitaire par fonctionnalité |
| ROADMAP.md | Racine | Jalons court/moyen/long terme |
| README.md | Racine | Build, setup Caddy local, variables, lancement |
| CHANGELOG.md | Racine | Versions sémantiques + notes de release |
| RUNBOOK.md | docs/RUNBOOK.md | Déploiement Coolify, proxy Cloudflare, backups R2, migrations, rollback, monitoring |
| ci.yml | .github/workflows/ci.yml | CI bloquante sur PR (secrets, lint, typecheck, tests, build) |

## Configuration projet
- PORT=`<prochain_port>`
- DEV_CMD=`<commande_dev>`
- HEALTH_CHECK=`curl -s -o /dev/null -w "%{http_code}" http://localhost:<PORT>`
- KILL_CMD=`lsof -ti :<PORT> | xargs kill -9 2>/dev/null; echo "Port <PORT> freed"`

## Règle de chargement sélectif
- Ne lire QUE le fichier `.md` requis pour la tâche en cours.

## Règle de synchronisation documentaire immédiate (Living Documentation)
- Tokens UI/boutons/inputs/palettes → mettre à jour `docs/DESIGN_SYSTEM.md`
- Champs/tables/relations/règles d'accès → mettre à jour `docs/DATABASE.md`
- Routes API/payloads/webhooks/jobs → mettre à jour `docs/BLUEPRINT.md`
- Variable d'environnement ajoutée/modifiée → mettre à jour `.env.example` + ce mapping

## Directives de style
- Ultra-léger : listes à puces dans tous les `.md`, zéro texte superflu.
- Typage strict TypeScript ; fonctions pures ; pas d'`any` silencieux.
- Respect du Layout Signature PWA (Top App Bar, Bottom Navigation, FAB).
- Cibles tactiles ≥ 44px ; safe areas ; contraste WCAG AA ; mode sombre.
- **Budget de performance** : JS initial < 150 KB gzip ; images AVIF/WebP ; cible réseau lent (3G). Toute régression bloque la PR.

## CI & jalons humains
- CI : `.github/workflows/ci.yml` — secrets → lint → typecheck → tests → audit → build, sur chaque PR.
- Merge `main` **uniquement via PR** (CI verte + validation humaine) — jamais de merge local.
- ⛔ **STOP — validation humaine requise** avant : merge `main` / tag / release · déploiement staging et prod · migration non locale · appel à une API de paiement hors sandbox · suppression de ressource.

## Interdictions strictes
- ❌ Aucun emoji dans l'interface (sauf demande explicite)
- ❌ Aucune autre bibliothèque d'icônes que celle choisie (Lucide/Tabler/Phosphor/React/Remix)
- ❌ Aucune image non compressée en AVIF/WebP avant upload R2
- ❌ Aucune modification directe sur `main` (travailler sur `testing`)
- ❌ Aucun secret en clair (clés API, tokens, URLs de BDD)

## Agents autorisés
- `lead-dev` : dev, build, fix, doc
- `ops-quality` : validation avant commit, git, releases, déploiement
- `integrations` : paiements, webhooks, emails, R2, scripts DB, n8n

## Compatibilité Antigravity
- 🟦 OpenCode lit ce `AGENTS.md` (racine projet).
- 🟩 Antigravity ne lit PAS `AGENTS.md` : créer des rules projet dans `.agents/rules/*.md` (mêmes règles, format Antigravity) — template : `assets/antigravity/rule.md` (skill opencode-admin).
- 🟩 Règles globales Antigravity : `~/.gemini/GEMINI.md` (équivalent global de ce fichier).
- ⚪ Contenu du projet (`docs/*.md`, specs, conventions) : indépendant de l'outil — identique partout.
