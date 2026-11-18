# Orientation — OpenCode vs Antigravity

> Carte des emplacements et formats par outil. Source : opencode.ai/docs (FR) + antigravity.google/docs. À consulter AVANT toute création d'agent, skill, commande, règle ou permission.

## Emplacements globaux & projet

| Élément | 🟦 OpenCode | 🟩 Antigravity | ⚪ Partagé |
|---------|-------------|----------------|-----------|
| Règles globales | `~/.config/opencode/AGENTS.md` | `~/.gemini/GEMINI.md` | ❌ |
| Règles projet | `AGENTS.md` racine (fallback `CLAUDE.md`) | `.agents/rules/*.md` | ❌ |
| Règles externes | champ `instructions` dans opencode.json | `@mentions` dans les rules | ❌ |
| Skills globales | `~/.config/opencode/skills/<nom>/SKILL.md` | `~/.gemini/config/skills/<nom>/SKILL.md` | ⚠️ contenu identique, à dupliquer ou symlink |
| Skills projet | `.opencode/skills/` **et** `.agents/skills/` | `.agents/skills/` | ✅ **`.agents/skills/` = dossier commun** |
| Agents globaux | `~/.config/opencode/agents/<nom>.md` | `~/.gemini/config/agents/<nom>.md` | ❌ frontmatter différent |
| Agents projet | `.opencode/agents/` | `.agents/agents/<nom>.md` (ou `<nom>/agent.md`) | ❌ |
| Commandes | `commands/*.md` (global ou projet) | **Workflows** `/workflow-nom` (UI Customizations) | ❌ |
| Plugins | Code JS/TS `~/.config/opencode/plugins/` | Packages `plugin.json` + skills/rules/mcp/hooks | ❌ |
| Permissions | `opencode.json` + frontmatter agents | UI Permissions (action(target)) | ❌ syntaxe différente |
| MCP | `opencode.json` (local/remote) | `.agents/mcp_config.json` / UI | ❌ fichiers différents |

## Formats de frontmatter — différences clés

### Skills (SKILL.md)
- 🟦 OpenCode : `name` **obligatoire** (regex `^[a-z0-9]+(-[a-z0-9]+)*$`, == nom du dossier), `description` obligatoire ≤ 1024 car., `license`/`compatibility`/`metadata` optionnels.
- 🟩 Antigravity : `name` **optionnel** (défaut = nom du dossier), `description` obligatoire.
- ⚪ Compatible : un SKILL.md conforme OpenCode fonctionne dans Antigravity (champs inconnus ignorés).

### Agents
- 🟦 OpenCode : `description` (obligatoire), `mode` (primary/subagent/all), `model`, `temperature`, `steps`, `permission`, `tools`, `hidden`, `color`, `top_p`.
- 🟩 Antigravity : `name` + `description` (obligatoires), `tools` (string[] — noms EXACTS `view_file`, `run_command`...), `mainAgent` (bool), `subagent` (bool), `model` (inherit/flash/pro), `commandExecutionPolicy` (off/auto/eager/sandbox), `mcpServers`, `skills`/`plugins`.
- ⚠️ Piège AG : une faute de frappe dans `tools[]` fait **hanger** le subagent.

### Permissions — priorité INVERSE
- 🟦 OpenCode : `allow`/`ask`/`deny` par outil ; **dernière règle correspondante gagne** (mettre `"*"` en premier).
- 🟩 Antigravity : `action(target)` (`read_file`, `write_file`, `command`, `read_url`, `execute_url`, `unsandboxed`, `mcp`) ; **priorité Deny > Ask > Allow** (le plus restrictif gagne).

## Commandes vs Workflows
- 🟦 OpenCode : `~/.config/opencode/commands/<nom>.md`, frontmatter `description` + `agent` + `model`, syntaxe `$ARGUMENTS`, `$1`, `!cmd`, `@fichier`. Invocation `/nom`.
- 🟩 Antigravity : Workflows markdown (≤ 12 000 car.), invocation `/workflow-nom`, exécution séquentielle, appels de workflows imbriqués. Slash intégrés : `/goal`, `/grill-me`, `/schedule`, `/browser`.
- ❌ Une commande OpenCode ne fonctionne PAS dans Antigravity : créer l'équivalent en Workflow.

## Conventions Agence Bulles
- Assets métier (CADRAGE, SPEC, scripts R2, docker-compose, Caddyfile) = artefacts de PROJET → ⚪ indépendants de l'outil.
- Config d'outil (agents, skills, commandes, permissions) = 🟦/🟩 séparés.
- Une seule source de vérité par contenu : dupliquer (ou symlink) uniquement les skills globales entre les 2 dossiers ; `.agents/skills/` pour les skills projet partagées.
