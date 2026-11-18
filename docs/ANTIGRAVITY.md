# Configuration Antigravity (Desktop / IDE & CLI agy)

> Documentation de référence pour l'alignement strict entre **Antigravity Desktop (IDE)** et **Antigravity CLI (`agy`)**.

## 1. Principe de parité Desktop ↔ CLI

Dans l'écosystème Agence Bulles, Antigravity Desktop et Antigravity CLI partagent rigoureusement **les mêmes 3 agents**, **les mêmes 16 skills**, **les mêmes 11 workflows** et **les mêmes règles globales** (`antigravity/GEMINI.md`).

```
                           Source de vérité (agents-skills)
                             ├── antigravity/agents/    (3 agents)
                             ├── antigravity/GEMINI.md  (règles globales)
                             ├── opencode/skills/       (16 skills)
                             ├── antigravity/workflows/ (11 workflows)
                             └── opencode/mcp.servers.json
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
       🟩 Antigravity Desktop / IDE                    🟩 Antigravity CLI (agy)
       ~/.gemini/config/agents/                        ~/.gemini/antigravity-cli/plugins/agence-bulles/agents/
       ~/.gemini/config/skills/                        ~/.gemini/antigravity-cli/plugins/agence-bulles/skills/
       ~/.gemini/workflows/                            ~/.gemini/antigravity-cli/plugins/agence-bulles/rules/GEMINI.md
       ~/.gemini/config/mcp_config.json                ~/.gemini/antigravity-cli/plugins/agence-bulles/plugin.json
       ~/.gemini/GEMINI.md
```

## 2. Emplacements des fichiers

### Antigravity Desktop / IDE
- **Agents (3)** : `~/.gemini/config/agents/` (`lead-dev.md`, `ops-quality.md`, `integrations.md`)
- **Skills (16)** : `~/.gemini/config/skills/`
- **Workflows (11)** : `~/.gemini/workflows/` (`adr.md`, `audit.md`, `cadrage.md`, `deploy.md`, `docs-sync.md`, `fix.md`, `new-pwa.md`, `release.md`, `spec.md`, `threat-model.md`, `validate.md`)
- **Règles globales** : `~/.gemini/GEMINI.md` (synchronisé depuis `antigravity/GEMINI.md`)
- **MCP Servers** : `~/.gemini/config/mcp_config.json`

### Antigravity CLI (`agy`)
- **Plugin agence-bulles** : `~/.gemini/antigravity-cli/plugins/agence-bulles/`
  - **Agents (3)** : `agents/` (identiques à `~/.gemini/config/agents/`)
  - **Skills (16)** : `skills/` (identiques à `~/.gemini/config/skills/`)
  - **Règles globales** : `rules/GEMINI.md` (synchronisé depuis `antigravity/GEMINI.md`)
  - **Manifest** : `plugin.json`
- **Configuration générale CLI** : `~/.gemini/antigravity-cli/settings.json`

## 3. Règle d'or de synchronisation

Toute modification apportée aux agents ou aux skills dans ce repository doit être déployée de manière atomique vers les DEUX cibles Antigravity via :

```bash
# Depuis le repo agents-skills :
./scripts/sync-skills.sh --local
```

Le script :
1. Crée un backup de sécurité dans `~/.config/opencode-backups/bak/<horodatage>/`.
2. Met à jour `~/.gemini/config/` (Desktop).
3. Met à jour `~/.gemini/workflows/`.
4. Met à jour `~/.gemini/antigravity-cli/plugins/agence-bulles/` (CLI).
5. Fusionne les configurations MCP.
