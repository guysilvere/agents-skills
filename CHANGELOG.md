# CHANGELOG

## [2.0.1] — 2026-09-17

### Corrigé
- **`scripts/sync-skills.sh`** : initialisation automatique des tokens manquants avec `chmod 600` et avertissement console lors de la résolution MCP OpenCode (`resolve_mcp_oc()`). Évite l'erreur bloquante `ConfigInvalidError: bad file reference` au démarrage d'OpenCode lorsqu'un serveur MCP est déclaré dans `mcp.servers.json` avant que son fichier secret ne soit créé.

## [2.0.0] — 2026-09-16

> **Changement cassant** : la passerelle de paiement, la base de données et le framework front changent. Toute spec ou projet écrit avant cette version doit être relu.

### Modifié — Paiements : Jèko + CinetPay → **GeniusPay** (passerelle unique)
- **Référence réécrite** (`api-paiements/assets/reference/geniuspay.md`) : endpoints, sandbox, statuts, méthodes, payload webhook.
- **Sandbox réelle disponible** (`pk_sandbox_…` / `sk_sandbox_…`) — les règles « hors sandbox » redeviennent opérantes.
- **Piège documenté** : `amount` est un **entier en XOF, minimum 200** — pas des centimes (contrairement à Jèko).
- **Anti-rejeu** : `X-GeniusPay-Timestamp` existe, mais l'exemple officiel ne signe que le corps → incertitude signalée, à clarifier avec le support.
- **5 incohérences de la doc fournisseur** relevées et tracées (signature, retry, rate limits, `payment_url` vs `checkout_url`, `paystack`).
- **MCP GeniusPay** ajouté à `opencode.jsonc` (`https://geniuspay.ci/api/mcp`) — doc à jour plutôt que recopiée.
- CinetPay supprimé ; `reference/jeko.md`, `reference/cinetpay.md` et `curl-jeko.sh` supprimés, remplacés par `curl-geniuspay.sh`.
- Factures PDF : plus de contrainte de moteur embarqué (rendu côté serveur Node).

### Modifié — Base de données : PocketBase → **Turso (libSQL)**
- **Turso n'a pas de row-level security** (le RLS est une demande ouverte de libSQL). La perte des API rules de PocketBase est le principal coût de ce changement : **l'autorisation devient applicative**.
- Nouvelle règle structurante : **un seul runtime possède la base et l'autorisation** (server routes SvelteKit) — deux runtimes = deux logiques d'autorisation = IDOR.
- `DATABASE.md` réécrit : matrice d'autorisation obligatoire par table, module `authorize.ts` unique, requêtes scopées.
- Sauvegardes : export logique `turso db shell .dump` (jamais de copie de fichier) ; `backup-r2.sh` et `restore-r2.sh` réécrits.
- Suppression de la console PocketBase des tunnels et de la topologie ; `pocketbase *` retiré des permissions.

### Modifié — Front : React → **SvelteKit**
- `BLUEPRINT.md`, `stack-table.md`, `README.md`, `docker-compose.dev.yml` alignés sur SvelteKit + TypeScript strict + Zod.
- `adapter-node` retenu : runtime Node réel, npm complet (pdf-lib, sharp, R2, Brevo).

### Ajouté
- **Matrice d'autorisation** dans `SPEC-XXX.md` (section 5) et `DATABASE.md` — la contrepartie obligatoire de l'absence de RLS.
- **Jobs planifiés via tâche planifiée Coolify** (SvelteKit n'a pas de scheduler natif) pour la réconciliation GeniusPay.

### Corrigé
- `lead-dev` : `npx`/`node`/`bun`/`curl`/`psql`/`docker`/`coolify`/`gh`/`kill` ne passent plus sans validation ; `ops-quality` passe `edit`/`write` en `deny`.
- `git push --force*` ne couvrait pas `git push origin main --force` → motif élargi.

### Infrastructure
- **Dépôt `agents-skills` rendu public** et **protection de branche `main` activée** : PR obligatoire, force-push et suppression bloqués, admins soumis. Vérifié — le serveur refuse `"Changes must be made through a pull request. Cannot force-push to this branch"`.
- `gitleaks` retenu comme outil de détection de secrets (0 fuite sur 22 commits).

## [1.10.0] — 2026-09-16

### Sécurité
- **Durcissement des permissions des 3 agents** : `npx`/`node`/`bun`, `curl`, `psql`, `docker`, `coolify`, `gh`, `kill` ne passent plus sans validation. `lead-dev` est limité à la lecture Git (`status`/`diff`/`log`/`branch`/`add`/`commit`) ; `ops-quality` passe `edit`/`write` en `deny` (aligne enfin la permission sur la règle « ne corrige jamais le code »).
- **Faille force-push comblée** : le motif `git push --force*` ne couvrait pas `git push origin main --force` (option en fin de commande) — remplacé par `git push*` + `git *` en `ask`. Idem `git reset --hard`, `git clean`, `git branch -D`.
- **Protection `.env` et des tokens d'agent** : les 3 agents refusent la lecture de `*.env` / `*.env.*` et de `~/.config/opencode/.tokens/**` ; `.env.local` reste autorisé pour le dev.
- **`integrations`** : `psql` et `pb` retirés (incohérents avec PocketBase, `pb` inexistant) ; l'édition des `pb_hooks` — code serveur qui manipule l'argent — repasse en validation.

### Ajouté
- **`opencode/WORKFLOW.md`** : référence unique des phases 0–10, des jalons humains (merge `main`, déploiement, migration non locale, appel paiement hors sandbox, suppression de ressource), de l'attribution des tests et du format de relais (3 allers-retours max, puis escalade humaine).
- **Réconciliation des paiements** (`api-paiements/assets/checklists/reconciliation.md`) : job périodique fournisseur ↔ base, détection et traitement des écarts — un webhook perdu signifiait un client débité non crédité.
- **CI GitHub Actions minimale** (`pwa-developpement/assets/configs/ci.yml`) : secrets → lint → typecheck → tests → audit → build, sur chaque PR.
- **Section « Autorisations » obligatoire** dans le template `SPEC-XXX.md` (anti-IDOR) et « tests écrits et verts » dans la DoD.
- **Stratégie offline, mise à jour du service worker et budget de performance** dans le template `BLUEPRINT.md`.
- **Volet données personnelles (loi n°2013-450 / ARTCI)** dans le template `CADRAGE.md`.
- **Migrations + rollback, test de restauration périodique et monitoring** dans le template `RUNBOOK.md`.

### Modifié
- **Attribution des tests** : `lead-dev` et `integrations` écrivent leurs tests, `ops-quality` les exécute et juge la couverture — personne ne les écrivait auparavant.
- **Validation réordonnée** : détection de secrets en étape 0 (bloquante et bon marché), `gitleaks` + `npm audit` + lockfile commité ; merge `main` uniquement via PR avec CI verte.
- **Lighthouse corrigé** : audit sur le build de production servi en HTTPS (certificat Caddy accepté), catégorie « PWA installable » retirée (Lighthouse ≥ 12) → DevTools, `INP` remplacé par `TBT` (métrique terrain vs labo).
- **`impeccable` épinglé en devDependency** au lieu de `npx` à la volée (risque supply chain).
- **Règles webhooks complétées** : signature sur corps brut + comparaison à temps constant, anti-rejeu, 2xx après persistance durable, machine à états, idempotence par contrainte d'unicité en base.
- **Factures PDF et AVIF/WebP hors `pb_hooks`** : PocketBase embarque un moteur JS sans Node.js.
- **Section « Intégration de nouvelles skills » dédupliquée** (3 copies → 1 dans `WORKFLOW.md`).

### Corrigé
- **4 frontmatters YAML invalides** (deux-points non échappé dans la `description`) : `ops-quality.md`, `commands/deploy.md`, `commands/release.md`, `design-ux-flow/SKILL.md`. Celui d'`ops-quality` pouvait invalider l'intégralité de son bloc `permission`.
- **Lien `assets/antigravity/rule.md` cassé** dans `pwa-developpement` (le fichier vit dans la skill `opencode-admin`).

### À trancher
- **React vs SvelteKit** : les templates mentionnent React, le plugin `@sveltejs/opencode` et le MCP Svelte sont actifs. Le défaut est fixé à SvelteKit dans `lead-dev` et `BLUEPRINT.md`, mais les docs React n'ont pas été réécrites.
- **Protection de branche `main`** sur GitHub (PR obligatoire, no force-push) : toujours à activer — c'est la seule protection indépendante des agents.

## [1.9.0] — 2026-09-09

### Ajouté
- **Dev local conteneurisé par défaut (Docker Desktop / Docker Compose)** :
  - **Premier choix systématique** : Lancement des projets locaux via `docker compose -f docker-compose.dev.yml up` pour une isolation totale, parité dev/prod et BDD locale prête sans installation manuelle.
  - **Template `docker-compose.dev.yml`** : Configuration type avec montage de volumes (hot-reload Vite / Hono / Python) et PocketBase local.
  - **Mise à jour des skills & templates** : `stack-table.md`, `pwa-developpement`, `pwa-validation` (Caddy reverse-proxy vers conteneurs Docker).

## [1.8.0] — 2026-08-23

### Ajouté
- **Intégration officielle de Python dans la Stack Agence Bulles** :
  - **Architecture Polyglotte** : PWA/Frontend ultra-léger (Vite, React, Tailwind) + API Web (Hono/PocketBase) + Cerveau Data/IA (Python FastAPI, Celery, scripts d'ingestion).
  - **Conventions & Qualité Python (`pwa-developpement`, `style-code.md`)** : Python 3.12+, typage strict `typing`, schémas **Pydantic v2**, handlers asynchrones `async def`, outillage **Ruff** + uv/pyproject.toml.
  - **Validation & Tests (`pwa-validation`)** : Intégration de `pytest`, `ruff check` et `mypy`/`pyright` dans la chaîne de validation.
  - **Déploiement Coolify (`pwa-deploiement`, `stack-table.md`, `BLUEPRINT.md`)** : Conteneurisation Docker multi-stage (`python:3.12-slim` + Uvicorn) pour micro-services d'IA, OCR, calculs financiers et pipelines de données.

## [1.7.1] — 2026-08-23

### Ajouté
- **Serveur MCP Coolify (`coolify`)** : ajout de l'instance Coolify (`https://home.agencebulles.net/mcp`) dans `mcp.servers.json` et `mcp-servers.md`. Résolution sécurisée via `~/.config/opencode/.tokens/coolify` (chmod 600) et synchronisation vers OpenCode et Antigravity.
- **Alignement Antigravity CLI (`agy`)** : synchronisation du plugin `~/.gemini/antigravity-cli/plugins/agence-bulles` avec les 3 agents modernes (`lead-dev`, `ops-quality`, `integrations`), les 12 skills à jour et `GEMINI.md`.

### Corrigé
- **Suppression référence orpheline `n8n`** : purge de `n8n` dans `mcp.servers.json` et `~/.config/opencode/opencode.jsonc` (qui bloquait le lancement d'OpenCode suite au retrait du fichier de token `~/.config/opencode/.tokens/n8n`).
- **Purge anciens agents Antigravity CLI** : suppression des 14 agents obsolètes (`maestro`, `chef-pwa`, `architecte`, `brvm-analyste`, etc.) et 34 anciennes skills dans `~/.gemini/antigravity-cli/plugins/agence-bulles` avec backup préalable.

## [1.7.0] — 2026-08-23

### Modifié
- **Renommage `migration-opencode/` → `opencode/`** : refactor de l'écosystème OpenCode — l'historique de migration devient le dossier canonique `opencode/` (skills, agents, commandes, `mcp.servers.json`, `sync-skills.sh`, README).
- **`mcp.servers.json`** : suppression des serveurs MCP Supabase (`supabase`, `supabase-local`) — MCP Supabase n'est plus utilisé dans l'écosystème (accès via CLI/API), configuration allégée.

### Corrigé
- **Décomptes écosystème** : correction du nombre de skills synchronisées (**12**) et de commandes/workflows (**8**) dans `opencode/README.md`.
- **Chemins de backup** : correction des références — les backups sont centralisés dans `~/.config/opencode-backups/bak/<date>` (plus `~/backups/`).

### Nettoyage
- **Centralisation des backups** : les sauvegardes avant refactoring sont regroupées sous `~/.config/opencode-backups/bak/<date>` (`chore(backup)`).
- **`.gitignore`** : exclusion des fichiers de config locaux générés (`.claude/`, `.gemini/`, `.ignore`, `.mcp.json`, `AGENTS.md`, `GEMINI.md`, `mcp-servers.md`, `opencode.json`) pour éviter qu'un `git add -A` les committe — ces fichiers sont propres à chaque machine et jamais versionnés.

## [1.6.0] — 2026-08-22

### Ajouté
- **Standards de Scalabilité & Forte Charge** :
  - **Stack & Architecture** : Directives de dimensionnement selon le trafic (PocketBase WAL pour <100 rps, PostgreSQL + PgBouncer pour fortes écritures, Turso pour Edge), cache Redis/Upstash, queues asynchrones (BullMQ).
  - **Optimisation Base de Données (`DATABASE.md`)** : Indexation chirurgicale (B-tree sur FK, composites, partiels), interdiction du `OFFSET/LIMIT` profond au profit de la **pagination par curseur (keyset)**, connection pooling strict, profilage `EXPLAIN ANALYZE`.
  - **Code & Backend (`pwa-developpement`, `style-code.md`)** : I/O non bloquantes, déchargement des tâches lourdes (PDF, emails, webhooks) en tâche de fond, interdiction stricte du `SELECT *` et des requêtes N+1.
  - **API Best Practices (`api-best-practices`, `api-review.md`)** : Rate limiting distribué, cache HTTP (`ETag`, `Cache-Control`), endpoints asynchrones `202 Accepted` pour gros calculs/exports.
  - **Validation Pré-commit (`pre-commit.md`)** : Validation des index BDD, anti-N+1 et temps de latence P95.

## [1.5.0] — 2026-08-22

### Ajouté
- **Centralisation des skills tierces dans `opencode/skills/`** : plannotator-annotate / plannotator-last / plannotator-review (annotation UI) + supabase / supabase-postgres-best-practices (officielles Supabase) → 17 skills synchronisées vers OpenCode ET Antigravity.
- **MCP locaux Turso dev (lodgi) dans `mcp.servers.json`** : `turso-master-local`, `turso-tenant-ivoire`, `turso-cloud` (désactivé) — config projet préservée et centralisée.

### Modifié
- **`sync-skills.sh`** : support des variables d'environnement (`environment` → `environment` pour OpenCode, `env` pour Antigravity) pour les serveurs MCP locaux.
- **README** : comptage skills 12 → 17.

### Nettoyage
- Suppression des skills/MCP/agents locaux dans les dossiers projets (`/Users/silveremeya/Projets`) : `.claude`, `.cursor`, `.agents`, `.opencode`.
- Purge des artefacts gérés dans `~/.gemini/config`, `~/.gemini` et `~/.config/opencode` (skills, agents, commandes, workflows, archives, plugins).
- Sécurisation `~/.agents/mcp_config.json` (secrets en clair supprimés — tokens déjà dans `~/.config/opencode/.tokens/` chmod 600).
- Backup complet avant nettoyage : `~/backups/cleanup-agents-20260822/`.


> Versioning SemVer — les changements notables sont listés par version.

## [1.4.0] — 2026-08-22

### Ajouté
- **Commandes OpenCode `audit.md` et `new-pwa.md`** : parité 8/8 avec les workflows Antigravity.
- **Source de vérité MCP `opencode/mcp.servers.json`** : standardisation des serveurs MCP (Notion, GitHub, n8n, Supabase, Brevo) avec résolution sécurisée des tokens sans secret en clair.
- **Option `--local` dans `sync-skills.sh`** : permet de synchroniser directement depuis le workspace local sans passer par le cache GitHub.

### Modifié
- **Agents Antigravity (`lead-dev`, `integrations`, `ops-quality`)** : correction des outils déclarés (`glob_search` → `find_by_name`, ajout des outils système `write_to_file`, `list_dir`, `search_web`, `invoke_subagent`, `send_message`).
- **`sync-skills.sh`** : fusion intelligente des configurations MCP pour préserver les serveurs existants (ex. Turso) et mise à jour du comptage (12 skills, 8 workflows/commandes).

## [1.3.0] — 2026-08-22

### Ajouté
- **Skill `design-ux-flow`** : méthodologie UX en 10 étapes pour PWA — problème chirurgical, fonctionnalité principale unique, user flow réaliste, navigation orientée utilisateur, micro-victoires, notifications ciblées, onboarding couloir. S'articule entre `pwa-cadrage` (étapes 1-3) et `design-pwa-system` (persistance visuelle).

### Modifié
- **`design-pwa-system`** : référence croisée vers `design-ux-flow` en amont du design visuel (parcours UX d'abord).

## [1.2.0] — 2026-08-20

### Ajouté
- **`ops-quality` (Antigravity + OpenCode)** : nouvelle capacité « Lancement des serveurs locaux » à la demande — démarrage du serveur dev + base de données (PocketBase/Turso) en arrière-plan, activation Caddy pour les URLs `.test` (`caddy run` / `caddy reload`), vérification de disponibilité et affichage d'un tableau récapitulatif (service, lien `.test`, accès dev, description ; identifiants depuis `.env`/`RUNBOOK.md`/`AGENTS.md`, jamais de secrets de prod).
- **`ops-quality` (Antigravity)** : `commandExecutionPolicy` `sandbox` → `auto` pour permettre le lancement de serveurs persistants (cohérent avec `lead-dev`).
- **`ops-quality` (OpenCode)** : permissions `docker *`, `pocketbase *`, `kill *` pour la gestion des services locaux.

### Modifié
- **`workflow-projet-vibe-code.md`** : nettoyage des références aux anciens agents (`architecte`, `chef-pwa`, `pwa-tester`, `gestionnaire-git`) → `lead-dev` (développement) et `ops-quality` (validation + livraison) dans le modèle de SPEC et les tâches d'exécution.

## [1.1.0] — 2026-08-20

### Ajouté
- **Skill `design-3d`** : visuels 3D procéduraux Three.js depuis une image (wrapper léger img2threejs, héros produits/objets animés).
- **`design-pwa-system`** : 3 nouveaux assets de référence — `brief-inference.md` (Design Read avant de coder), `dials.md` (VARIANCE/MOTION/DENSITY + presets), `design-md-library.md` (15 références DESIGN.md de sites réels, par lien).
- **`pwa-validation`** : tests E2E playwright-cli (nouvelle checklist `e2e.md`) + audit design automatisé `npx impeccable detect` dans la séquence de validation.
- **`ops-quality`** : workflow enrichi — étapes E2E (playwright-cli) et audit design (impeccable) avant Lighthouse ; permission `playwright-cli *`.

### Modifié
- README : liste des skills 10 → 11.

### Sources externes référencées (non copiées)
- taste-skill (Leonxlnx) — mécanique brief inference + dials, condensée.
- impeccable (pbakaus) — outil CLI `detect` (npm), 59 règles déterministes.
- playwright-cli (microsoft) — tests E2E (npm global).
- awesome-design-md (voltagent) — bibliothèque DESIGN.md par liens.
- img2threejs — pipeline 3D, cloné pour la skill `design-3d`.
