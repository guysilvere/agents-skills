# agents-skills — Écosystème IA Agence Bulles (OpenCode + Antigravity)

> Source de vérité du setup IA de l'agence : agents, skills, assets, commandes, workflows et documentation de migration.
> Synchronise automatiquement vers 🟦 OpenCode (`~/.config/opencode/`) et 🟩 Antigravity (`~/.gemini/`).

## Contenu

| Élément | Emplacement | Description |
|---------|-------------|-------------|
| Workflow | `workflow-projet-vibe-code.md` | Workflow projet complet (phases 0-10) |
| Agents | `migration-opencode/agents/` | `lead-dev` (primary) + `ops-quality`, `integrations` (subagents) — format OpenCode |
| Agents AG | `antigravity/agents/` | Les 3 mêmes rôles — format Antigravity |
| Skills | `migration-opencode/skills/` | 10 skills (avec assets séparés 🟦/🟩/⚪) |
| Assets | `migration-opencode/assets/` | Templates, scripts, checklists, configs par skill |
| Commandes | `migration-opencode/commands/` | 6 commandes slash OpenCode |
| Workflows AG | `antigravity/workflows/` | Équivalents Antigravity des commandes |
| Migration | `migration-opencode/` | README-MIGRATION, PLAN, ARCHIVAGE, DIFF, opencode.jsonc.new |

## Installation & mise à jour

```bash
# 1. Cloner ce repo
git clone git@github.com:guysilvere/agents-skills.git ~/agents-skills

# 2. Synchroniser skills/agents/commandes/workflows vers OpenCode + Antigravity
~/agents-skills/scripts/sync-skills.sh --dry-run   # prévisualiser
~/agents-skills/scripts/sync-skills.sh             # appliquer
```

Le script :
- Clone/pull le repo depuis GitHub (source de vérité).
- **Backup** les dossiers cibles existants (`~/.config/opencode-backups/sync-<date>/`).
- **Supprime** les anciens agents/skills/commandes/workflows des deux outils.
- **Copie** les nouveaux fichiers à jour.
- Options : `--dry-run`, `--opencode-only`, `--antigravity-only`, `--no-backup`, `--help`.

> ⚠️ Les agents OpenCode et Antigravity ont des formats **différents** : le script synchronise les agents OpenCode (`migration-opencode/agents/`) et les workflows Antigravity (`antigravity/workflows/`). Les agents Antigravity restent gérés séparément (format AG, voir `opencode-admin/assets/antigravity/agent.md`).

## Skills (10)

- `pwa-cadrage` — cadrage, naming, stack, blueprint, roadmap
- `pwa-developpement` — scaffolding, AGENTS.md, SPEC-XXX, DATABASE.md, conventions
- `design-pwa-system` — direction artistique, design system, layout signature
- `pwa-validation` — tests locaux, Lighthouse, a11y, SEO, sécurité
- `pwa-deploiement` — Coolify, Cloudflare, R2, RUNBOOK
- `api-paiements` — Jèko + CinetPay, webhooks, dunning, factures
- `api-best-practices` — design API REST
- `shared-git-conventions` — git, SemVer, releases
- `shared-eco-tokens` — optimisation de tokens (toujours chargée)
- `opencode-admin` — administration des outils IA (OC + AG)

## Agents (3)

| Agent | Mode | Rôle |
|-------|------|------|
| `lead-dev` | primary | Cycle produit complet (cadrage → dev → doc) |
| `ops-quality` | subagent | Validation, Git, déploiement, RUNBOOK |
| `integrations` | subagent | Paiements, webhooks, emails, R2, n8n |

## Documentation détaillée

- `docs/INSTALLATION.md` — guide complet d'installation machine neuve
- `docs/SYNC.md` — fonctionnement du script de synchronisation
- `docs/OPENCODE.md` — spécificités OpenCode (agents, skills, permissions)
- `docs/ANTIGRAVITY.md` — spécificités Antigravity (subagents, workflows, rules)
- `migration-opencode/README-MIGRATION.md` — historique de la migration (17 → 3 agents, 36 → 10 skills)
