# agents-skills — Écosystème IA Agence Bulles (OpenCode + Antigravity + Claude Code)

> Source de vérité du setup IA de l'agence : agents, skills, assets, commandes, workflows et documentation.
> Synchronise automatiquement vers 🟦 OpenCode (`~/.config/opencode/`), 🟩 Antigravity Desktop (`~/.gemini/`), 🟩 Antigravity CLI (`~/.gemini/antigravity-cli/`) et 🟪 Claude Code (`~/.claude/`).

## Contenu

| Élément | Emplacement | Description |
|---------|-------------|-------------|
| Agents | `opencode/agents/` | `lead-dev` (primary) + `ops-quality`, `integrations` (subagents) — format OpenCode |
| Agents AG | `antigravity/agents/` | Les 3 mêmes rôles — format Antigravity |
| Agents Claude | `claude/agents/` | Les 3 mêmes rôles — format subagent Claude Code (pas de notion de « primary ») |
| Skills | `opencode/skills/` | 12 skills versionnées (assets séparés 🟦/🟩/⚪), réutilisées telles quelles par Claude Code |
| Assets | `opencode/assets/` | Templates, scripts, checklists, configs par skill |
| Commandes | `opencode/commands/` | 8 commandes slash OpenCode |
| Workflows AG | `antigravity/workflows/` | 8 workflows Antigravity équivalents |
| MCP | `opencode/mcp.servers.json` | Source de vérité serveurs MCP (sans secret en clair) |
| Migration | `opencode/` | README-MIGRATION, PLAN, ARCHIVAGE, DIFF, opencode.jsonc.new |

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
- Options : `--local`, `--dry-run`, `--opencode-only`, `--antigravity-only`, `--claude-only`, `--no-backup`, `--help`.

> ⚠️ Les agents OpenCode, Antigravity et Claude Code ont des formats **différents** : le script synchronise les agents OpenCode (`opencode/agents/`), les agents Antigravity (`antigravity/agents/`), les agents Claude Code (`claude/agents/`) et les workflows Antigravity (`antigravity/workflows/`).
> ⚠️ Claude Code ne supporte pas la syntaxe `{file:...}` d'OpenCode pour les secrets MCP — voir `docs/CLAUDE.md` §3 pour `export-mcp-tokens.sh`.

## Skills (12)

- `pwa-cadrage` — cadrage, naming, stack, blueprint, roadmap
- `design-ux-flow` — méthodologie UX 10 étapes, problème chirurgical, micro-victoires, onboarding
- `pwa-developpement` — scaffolding, AGENTS.md, SPEC-XXX, DATABASE.md, conventions
- `design-pwa-system` — direction artistique, design system, layout signature, brief inference + dials + bibliothèque DESIGN.md
- `design-3d` — visuels 3D procéduraux Three.js depuis une image (héros produits, objets animés)
- `pwa-validation` — tests locaux, E2E Playwright, audit design automatisé, Lighthouse, a11y, SEO, sécurité
- `pwa-deploiement` — Coolify, Cloudflare, R2, RUNBOOK
- `api-paiements` — GeniusPay (sandbox + live), webhooks, dunning, factures, modèle de frais + calculateur de net
- `api-best-practices` — design API REST
- `shared-git-conventions` — git, SemVer, releases
- `shared-eco-tokens` — optimisation de tokens (toujours chargée)
- `opencode-admin` — administration des outils IA (OC + AG)

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