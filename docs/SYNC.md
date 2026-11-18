# SYNC — Script de synchronisation GitHub → OpenCode + Antigravity + Claude Code

> `scripts/sync-skills.sh` : importe depuis GitHub la source de vérité et met à jour les trois outils automatiquement.

## Principe

```
GitHub (guysilvere/agents-skills)  ──clone/pull──►  repo local ~/agents-skills
                                                        │
                                                        ▼
                                       Pré-vol : build-agents.mjs --check
                                                        │
                                                        ▼
                                     scripts/sync-skills.sh
                                                        │
            ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
            ▼                                           ▼                                           ▼
  🟦 OpenCode                                🟩 Antigravity Desktop                      🟪 Claude Code
  ~/.config/opencode/skills/                 ~/.gemini/config/skills/                    ~/.claude/skills/
  ~/.config/opencode/agents/                 ~/.gemini/config/agents/                    ~/.claude/agents/
  ~/.config/opencode/commands/               ~/.gemini/workflows/                        ~/.claude/hooks/
  ~/.config/opencode/opencode.jsonc          ~/.gemini/config/mcp_config.json            ~/.claude/settings.json
                                             ~/.gemini/GEMINI.md
                                             ~/.gemini/antigravity-cli/plugins/
```

- **Source canonique agents** : `agents-src/` (corps unique + frontmatters par outil) compilé via `scripts/build-agents.mjs`.
- **Source de vérité** : `opencode/skills/` (16 skills), `opencode/commands/` (11 commandes), `antigravity/workflows/` (11 workflows), `antigravity/GEMINI.md`, `hooks/`.
- **Cible skills** : le même catalogue de 16 skills est déployé dans OpenCode, Antigravity Desktop, Antigravity CLI ET Claude Code.
- **Cible agents** : chaque outil reçoit ses 3 agents configurés selon son runtime.
- **Pré-vol déterministe** : vérification obligatoire que les 9 agents générés sont en parité stricte avec `agents-src/` avant toute synchronisation.

## Usage

```bash
./scripts/sync-skills.sh                 # clone/pull + backup + purge + copie
./scripts/sync-skills.sh --local         # appliquer depuis le workspace local
./scripts/sync-skills.sh --dry-run       # affiche ce qui serait fait, sans rien modifier
./scripts/sync-skills.sh --opencode-only # ne touche qu'à ~/.config/opencode
./scripts/sync-skills.sh --antigravity-only # ne touche qu'à ~/.gemini
./scripts/sync-skills.sh --claude-only   # ne touche qu'à ~/.claude
./scripts/sync-skills.sh --no-backup     # désactive le backup préalable (déconseillé)
./scripts/sync-skills.sh --help          # aide
```

## Étapes internes

1. **Pré-vol** : validation de la parité des 9 agents via `node scripts/build-agents.mjs --check`.
2. **Clone/pull** : `git clone` (1er run) ou `git pull` (runs suivants) depuis GitHub dans `~/.cache/agents-skills-sync/` (sauf si `--local`).
3. **Backup** : copie des dossiers cibles existants vers `~/.config/opencode-backups/bak/<horodatage>/`.
4. **Purge** : suppression des anciens dossiers cibles (skills/agents/commands/workflows) — les fichiers hors des dossiers gérés ne sont PAS touchés.
5. **Copie** : recopie depuis la source vers les cibles.
6. **MCP & Hooks** : injection sans secrets exposés et enregistrement automatique des serveurs MCP / hooks.
7. **Rapport** : liste des dossiers installés par outil, chemin du backup.

## Garanties

- **Idempotent** : l'état final = état du repo GitHub (ou local si `--local`), à chaque run.
- **Réversible** : backup complet avant modification (restauration manuelle possible).
- **Ciblé** : ne purge QUE les dossiers gérés (skills, agents, commands, workflows) ; jamais `opencode.jsonc`, `GEMINI.md`, `mcp_config.json`, `.tokens/`, ni les projets.
- **Sûr par défaut** : `--dry-run` recommandé avant chaque mise à jour majeure.
