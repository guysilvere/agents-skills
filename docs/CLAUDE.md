# Configuration Claude Code

> Documentation de référence pour l'alignement de **Claude Code** sur le même écosystème (skills, agents, MCP) que 🟦 OpenCode et 🟩 Antigravity.

## 1. Différences structurelles avec OpenCode / Antigravity

Claude Code n'a pas de notion de « primary agent » : tous les fichiers `.claude/agents/*.md` sont des **subagents**, invoqués via l'outil Task (ou explicitement par nom). Il n'y a donc pas d'équivalent direct au `mode: primary` d'OpenCode ou au `mainAgent: true` d'Antigravity pour `lead-dev` — c'est un subagent comme les deux autres, invocable à la demande ou en `--agent lead-dev` au lancement d'une session.

Claude Code ne lit que `CLAUDE.md` (pas `AGENTS.md` automatiquement). Ce repo garde `AGENTS.md`/`GEMINI.md` identiques à la racine ; `CLAUDE.md` importe `AGENTS.md` via `@AGENTS.md` plutôt que de dupliquer son contenu.

Claude Code ne supporte pas la syntaxe `{file:...}` d'OpenCode pour les secrets — uniquement l'expansion `${VAR}` depuis l'environnement shell. Voir §3.

## 2. Emplacements des fichiers

```
                           Source de vérité (agents-skills)
                             ├── claude/agents/       (3 agents, format subagent Claude)
                             ├── opencode/skills/      (12 skills — réutilisées telles quelles)
                             └── opencode/mcp.servers.json
                                          │
                                          ▼
                              🟪 Claude Code (global, scope user)
                              ~/.claude/agents/        (lead-dev.md, ops-quality.md, integrations.md)
                              ~/.claude/skills/        (12 skills, copie directe — format SKILL.md déjà compatible)
                              ~/.claude.json → mcpServers (scope user, via `claude mcp add-json`)
```

- **Skills (12)** : `~/.claude/skills/<nom>/SKILL.md` — aucune conversion nécessaire, `opencode/skills/` sert de source unique (les champs `compatibility`/`metadata` inconnus sont ignorés sans erreur par Claude).
- **Agents (3)** : `~/.claude/agents/<nom>.md` — frontmatter `name`/`description`/`tools`/`model`, corps repris des versions Antigravity (déjà en prose, sans les blocs `permission` imbriqués d'OpenCode). Noms d'outils traduits vers la nomenclature Claude (`Read`, `Edit`, `Write`, `Glob`, `Grep`, `Bash`, `WebFetch`, `WebSearch`, `Task`).
- **MCP** : pas de fichier généré directement — `scripts/sync-skills.sh` appelle `claude mcp add-json <nom> '<json>' --scope user` (interface officielle, plutôt que d'éditer `~/.claude.json` à la main, qui est un fichier d'état géré par l'application).

## 3. Secrets MCP — `${VAR}` uniquement

Claude Code résout `${MA_VARIABLE}` dans `url`, `headers`, `args` et `env` de `.mcp.json` / `claude mcp add-json`, à partir de **variables d'environnement réelles** — pas de fichier référencé comme `{file:...}` (OpenCode).

- Convention de nommage : `MCP_<NOM_DU_JETON_EN_MAJUSCULES>_TOKEN` (ex. `github` → `MCP_GITHUB_TOKEN`, `geniuspay-key` → `MCP_GENIUSPAY_KEY_TOKEN`).
- `scripts/export-mcp-tokens.sh` lit `~/.config/opencode/.tokens/<nom>` (même convention que OC/AG) et exporte ces variables. **À sourcer** dans le profil shell (`~/.zshrc`) — jamais exécuté directement :

  ```bash
  source ~/agents-skills/scripts/export-mcp-tokens.sh
  ```

- Les fichiers `.mcp.json` générés/enregistrés par Claude ne contiennent jamais de secret en clair — uniquement des références `${MCP_..._TOKEN}`.

## 4. Règle d'or de synchronisation

Comme pour OpenCode et Antigravity, toute modification des agents ou des skills dans ce repository doit être déployée vers Claude Code via :

```bash
./scripts/sync-skills.sh --local            # les 3 cibles (OC + AG + Claude)
./scripts/sync-skills.sh --local --claude-only  # Claude uniquement
```

Le script :
1. Sauvegarde `~/.claude/skills`, `~/.claude/agents` et la liste des MCP `scope user` avant modification (`~/.config/opencode-backups/bak/<horodatage>/`).
2. Purge puis recopie `~/.claude/skills/` et `~/.claude/agents/`.
3. Ré-enregistre chaque serveur MCP actif via `claude mcp remove` + `claude mcp add-json --scope user` (idempotent), et retire ceux désactivés dans `opencode/mcp.servers.json`.
4. Nécessite le CLI `claude` dans le `PATH` pour l'étape MCP — sans lui, skills et agents sont tout de même synchronisés, avec un avertissement.

## 5. Ce qui n'est PAS répliqué (hors périmètre)

- Les **commandes**/**workflows** (`opencode/commands/`, `antigravity/workflows/`) ne sont pas répliqués vers Claude Code : le mécanisme exact des commandes personnalisées Claude Code diffère (skills à invocation manuelle vs fichiers `.claude/commands/`) et n'a pas été validé à date. À traiter séparément si besoin.
- Aucun fichier existant d'OpenCode ou d'Antigravity (`opencode/`, `antigravity/`, `opencode.json`, `.mcp.json` racine) n'a été modifié pour cet ajout — tout le support Claude est additif (`claude/`, `docs/CLAUDE.md`, `CLAUDE.md`, `scripts/export-mcp-tokens.sh`, extensions non destructives de `scripts/sync-skills.sh`).
