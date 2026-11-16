# agents-skills — Écosystème IA Agence Bulles (OpenCode + Antigravity + Claude Code)

> Source de vérité du setup IA de l'agence : agents, skills, assets, commandes, workflows et documentation.
> Synchronise automatiquement vers 🟦 OpenCode (`~/.config/opencode/`), 🟩 Antigravity Desktop (`~/.gemini/`), 🟩 Antigravity CLI (`~/.gemini/antigravity-cli/`) et 🟪 Claude Code (`~/.claude/`).

## Contenu

| Élément | Emplacement | Description |
|---------|-------------|-------------|
| Agents | `opencode/agents/` | `lead-dev` (primary) + `ops-quality`, `integrations` (subagents) — format OpenCode |
| Agents AG | `antigravity/agents/` | Les 3 mêmes rôles — format Antigravity |
| Agents Claude | `claude/agents/` | Les 3 mêmes rôles — format subagent Claude Code (pas de notion de « primary ») |
| Skills | `opencode/skills/` | 15 skills versionnées (assets séparés 🟦/🟩/⚪), réutilisées telles quelles par Claude Code |
| Assets | `opencode/assets/` | Templates, scripts, checklists, configs par skill |
| Commandes | `opencode/commands/` | 10 commandes slash OpenCode (dont `/threat-model`) |
| Workflows AG | `antigravity/workflows/` | 10 workflows Antigravity équivalents |
| MCP | `opencode/mcp.servers.json` | Source de vérité serveurs MCP (sans secret en clair) |
| Migration | `opencode/` | README-MIGRATION, PLAN, ARCHIVAGE, DIFF, opencode.jsonc.new |

## Standards & Conventions clés

- **Base de données locale (`file:<projet>.local.db`)** :
  - Utilisation exclusive du fichier SQLite/libSQL direct nommé selon le projet : `file:<projet>.local.db`.
  - Zéro démon serveur en tâche de fond (aucun `turso dev` ni conteneur Docker requis).
  - Données persistantes sur disque et réinitialisation instantanée (`rm -f <projet>.local.db && npm run db:migrate`).
  - **Exclusion Git stricte** : `*.local.db`, `*.db`, `*.db-journal`, `*.db-wal`, `*.sqlite*` obligatoirement dans `.gitignore`.
- **Lancement local (Docker, OrbStack & Caddy) & Registre des ports (`PROJECTS_REGISTRY.md`)** :
  - **Lancement obligatoire via Docker et OrbStack** : pour voir et tester le site en local, toujours démarrer l'application avec `docker compose -f docker-compose.dev.yml up` (aucun serveur nu sur l'hôte).
  - **Vérification `/etc/hosts` obligatoire** : vérification systématique avant lancement que le host (`<projet>.test`, `<projet>.local`) est résolu localement (`127.0.0.1` et `::1`) sans conflit ni erreur dans `/etc/hosts` ; inscription immédiate si absent.
  - **Caddy auto-start & domaines `.test` / `.local`** : Caddy est démarré automatiquement s'il est inactif (`caddy run`). Si le site local n'existe pas dans `~/.config/caddy/Caddyfile`, il est créé automatiquement avec `tls internal`.
  - **Registre unique des ports (`~/Projets/PROJECTS_REGISTRY.md`)** : répertorie tous les projets web locaux, leurs domaines et bloque les ports réservés sans doublon.
  - **Mêmes comptes tests locaux & `docs/credentials.md`** : fichier local uniquement listant les identifiants (login/mdp en clair), obligatoirement exclu du versioning Git (`.gitignore`) et jamais commité. Restituer obligatoirement les accès et URLs à chaque lancement.
- **Autorisation applicative** :
  - Turso n'ayant pas de RLS (Row-Level Security), toute l'autorisation est applicative et centralisée dans les server routes SvelteKit (`src/lib/server/auth/authorize.ts`) pour éliminer tout risque d'IDOR.
- **Paiements & Webhooks** :
  - Passerelle unifiée (Wave, Orange Money, MTN, Moov, cartes bancaires) avec sandbox réelle obligatoire avant tout jalon `live`.
  - Vérification de signature HMAC à temps constant (`crypto.timingSafeEqual`) et idempotence transactionnelle en base.

## Skills (15)

- `apple-design` — design physique & motion Apple appliqué au web (latence zéro, ressorts, direct manipulation, typographie optique)
- `pwa-cadrage` — cadrage, naming, stack, blueprint, roadmap, modélisation des menaces STRIDE
- `design-ux-flow` — méthodologie UX 10 étapes, problème chirurgical, micro-victoires, onboarding
- `pwa-developpement` — scaffolding, AGENTS.md, SPEC-XXX, DATABASE.md (base locale direct file:<projet>.local.db), conventions
- `pwa-test-harness` — cockpit specs & banc d'essai QA (Kanban/Liste, simulation, persistance Turso, sync Markdown)
- `design-pwa-system` — direction artistique, design system, layout signature, brief inference + dials + bibliothèque DESIGN.md + stress-test UI
- `design-3d` — visuels 3D procéduraux Three.js depuis une image (héros produits, objets animés)
- `pwa-validation` — tests locaux Caddy (.test), partage obligatoire des logins/mdp de test, E2E Playwright, audit design, Lighthouse, a11y & motion, SEO, sécurité (OWASP, webhooks HMAC, anti-IDOR)
- `pwa-deploiement` — Coolify, Cloudflare, R2, RUNBOOK
- `api-paiements` — passerelle de paiement (sandbox + live), webhooks HMAC, dunning, factures, réconciliation
- `api-best-practices` — design API REST
- `shared-git-conventions` — git, SemVer, releases
- `shared-graft` — indexation du code par graft (@nanonets/graft)
- `shared-eco-tokens` — optimisation de tokens (toujours chargée)
- `opencode-admin` — administration des outils IA (OC + AG)

## Installation & mise à jour

```bash
# 1. Cloner ce repo
git clone git@github.com:guysilvere/agents-skills.git ~/agents-skills

# 2. Synchroniser skills/agents/commandes/workflows vers OpenCode + Antigravity + Claude Code
~/agents-skills/scripts/sync-skills.sh --dry-run   # prévisualiser
~/agents-skills/scripts/sync-skills.sh             # appliquer (depuis remote)
~/agents-skills/scripts/sync-skills.sh --local     # appliquer (depuis workspace local)

# 3. (Claude Code uniquement) Exposer les jetons MCP en variables d'env — à ajouter dans ~/.zshrc
source ~/agents-skills/scripts/export-mcp-tokens.sh
```

Le script :
- Clone/pull le repo depuis GitHub (source de vérité) ou utilise `--local`.
- **Backup** les dossiers cibles existants (`~/.config/opencode-backups/bak/<date>/`).
- **Supprime** les anciens agents/skills/commandes/workflows des trois outils.
- **Copie** les nouveaux fichiers à jour.
- **Génère et fusionne** les configurations MCP OpenCode/Antigravity (sans secrets exposés) et enregistre les serveurs MCP Claude Code via `claude mcp add-json --scope user`.
- Options : `--local`, `--dry-run`, `--opencode-only`, `--antigravity-only`, `--claude-only`, `--mcp-only`, `--mcp-server=NOM`, `--no-backup`, `--help`.

> ⚠️ Les agents OpenCode, Antigravity et Claude Code ont des formats **différents** : le script synchronise les agents OpenCode (`opencode/agents/`), les agents Antigravity (`antigravity/agents/`), les agents Claude Code (`claude/agents/`) et les workflows Antigravity (`antigravity/workflows/`).
> ⚠️ Claude Code ne supporte pas la syntaxe `{file:...}` d'OpenCode pour les secrets MCP — voir `docs/CLAUDE.md` §3 pour `export-mcp-tokens.sh`.


## Agents (3)

| Agent | Mode OC/AG | Mode Claude | Rôle |
|-------|------------|-------------|------|
| `lead-dev` | primary | subagent (pas de « primary » chez Claude) | Cycle produit complet (cadrage → dev → doc) |
| `ops-quality` | subagent | subagent | Validation, Git, déploiement, RUNBOOK |
| `integrations` | subagent | subagent | Paiements, webhooks, emails, R2, n8n |

## Documentation détaillée

- `docs/INSTALLATION.md` — guide complet d'installation machine neuve
- `docs/SYNC.md` — fonctionnement du script de synchronisation
- `docs/OPENCODE.md` — spécificités OpenCode (agents, skills, permissions)
- `docs/ANTIGRAVITY.md` — spécificités Antigravity (subagents, workflows, rules)
- `docs/CLAUDE.md` — spécificités Claude Code (subagents, skills, secrets MCP `${VAR}`)
- `opencode/README-MIGRATION.md` — historique de la migration (17 → 3 agents, 36 → 10 skills)