# CHANGELOG

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
