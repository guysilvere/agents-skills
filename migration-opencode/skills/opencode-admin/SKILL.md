---
name: opencode-admin
description: Administration des outils IA de l'écosystème Agence Bulles — OpenCode ET Antigravity (Google). Création/validation de SKILL.md, gestion des fichiers agent.md (agents OpenCode + subagents Antigravity), permissions, config (opencode.jsonc, GEMINI.md, workflows, commandes), plugins et sécurisation des tokens. Charger dès qu'une demande concerne la configuration d'un outil, un agent, une skill, une permission, une commande ou un secret en clair.
license: MIT
compatibility: opencode
metadata:
  audience: lead-dev
  domain: opencode
---

# opencode-admin

## Ce que je fais
- Administre les outils IA (OpenCode + Antigravity) de l'écosystème Agence Bulles — pas le code applicatif.
- Garantit la séparation 🟦 OpenCode / 🟩 Antigravity / ⚪ Partagé dans tous les assets (voir `assets/README-ORIENTATION.md`).
- Fusionne les anciennes skills opencode-agent-builder, opencode-skill-builder, opencode-config-manager, opencode-permissions-manager et opencode-secure-tokens.

## 1. Skills (SKILL.md)
- 🟦 OpenCode : `~/.config/opencode/skills/<name>/SKILL.md` (global) | `.opencode/skills/` ou `.agents/skills/` (projet) | `.claude/skills/`, `~/.claude/skills/`, `.agents/skills/`, `~/.agents/skills/` (compat).
- 🟩 Antigravity : `~/.gemini/config/skills/<name>/SKILL.md` (global) | `.agents/skills/` (workspace).
- ⚪ **`.agents/skills/` (racine projet) = dossier lu par les DEUX outils** → privilégier pour les skills projet partagées.
- ⚪ Fichier obligatoirement nommé `SKILL.md` (majuscules).
- Frontmatter : `name` (🟦 obligatoire, regex `^[a-z0-9]+(-[a-z0-9]+)*$`, == nom du dossier ; 🟩 optionnel — défaut dossier), `description` (obligatoire, ≤ 1024 car.), `license`, `compatibility`, `metadata` (optionnels).
- Corps : `## What I do` / `## When to use me` / `## How` — listes à puces ; consignes sensibles à l'outil préfixées 🟦/🟩/⚪.
- Diagnostiquer une skill non chargée : nom du fichier ? frontmatter complet ? name unique ? permission `skill` à deny ? bon emplacement ?
- Templates : `assets/opencode/SKILL.md`, `assets/antigravity/SKILL.md` · checklist : `assets/checklists/skill-validation.md`.

## 2. Agents (agent.md)
- 🟦 OpenCode : `~/.config/opencode/agents/<nom>.md` (global) | `.opencode/agents/` (projet). Frontmatter : `description` (obligatoire), `mode` (primary/subagent/all), `model`, `temperature`, `steps` (ex-maxSteps), `top_p`, `permission`, `tools`, `hidden`, `color`.
- 🟩 Antigravity : `~/.gemini/config/agents/<nom>.md` (global) | `.agents/agents/<nom>.md` ou `<nom>/agent.md` (projet) | `plugins/<name>/agents/`. Frontmatter DIFFÉRENT : `name`, `description` (obligatoires), `tools` (string[] — noms EXACTS `view_file`, `run_command`... une faute de frappe fait hanger le subagent), `mainAgent`, `subagent`, `model` (inherit/flash/pro), `commandExecutionPolicy` (off/auto/eager/sandbox), `mcpServers`, `skills`/`plugins`.
- ⚪ Créer DEUX fichiers pour un même rôle si les deux outils en ont besoin (formats incompatibles).
- 🟦 Agents système cachés (ne pas recréer) : compaction, title, summary. Agents intégrés : build, plan (primaires) ; general, explore, scout (subagents).
- Primary = assistant principal (Tab pour basculer) ; subagent = invoqué par description ou `@nom` (OC) / `invoke_subagent` (AG).
- Templates : `assets/opencode/agent.md`, `assets/antigravity/agent.md` · checklist : `assets/checklists/agent-oc-vs-ag.md`.

## 3. Permissions
- 🟦 OpenCode — valeurs `allow`/`ask`/`deny` ; catégories : read, edit (couvre write+patch), glob, grep, bash, task, skill, lsp, webfetch, websearch, external_directory, doom_loop. Granulaire : objet avec patterns glob — **wildcard `*` en premier, la DERNIÈRE règle correspondante l'emporte**. Par défaut permissif (allow) ; `external_directory` et `doom_loop` = ask ; `.env` refusés par défaut (sauf `.env.example`).
- 🟩 Antigravity — `action(target)` : `read_file`, `write_file` (implique read_file), `read_url`, `execute_url`, `command`, `unsandboxed`, `mcp`. Trois listes Deny/Ask/Allow, **priorité Deny > Ask > Allow** (le plus restrictif gagne, contrairement à OpenCode). Défauts : workspace auto-allowed (read/write), web = Ask.
- ⚪ Ne jamais confondre : priorité « dernière règle gagnante » (OC) vs « Deny > Ask > Allow » (AG).

## 4. Commandes & Workflows
- 🟦 OpenCode — `~/.config/opencode/commands/<nom>.md` (global) | `.opencode/commands/` (projet) | config JSON `command`. Frontmatter : `description` + `agent` + `model` + `subtask`. Syntaxe : `$ARGUMENTS`, `$1`, `!cmd` (sortie shell), `@fichier` (référence fichier). Invocation `/nom`. Template : `assets/opencode/command.md`.
- 🟩 Antigravity — **Workflows** markdown (≤ 12 000 car.), invocation `/workflow-nom`, étapes séquentielles, appels de workflows imbriqués ; slash intégrés `/goal`, `/grill-me`, `/schedule`, `/browser`. Template : `assets/antigravity/workflow.md`.
- ⚪ Une commande OpenCode ne fonctionne PAS dans Antigravity → créer l'équivalent en Workflow.

## 5. Règles (instructions)
- 🟦 OpenCode — `AGENTS.md` racine projet (fallback `CLAUDE.md`), global `~/.config/opencode/AGENTS.md`, priorité : local → global → claude ; champ `instructions` dans opencode.json pour référencer d'autres fichiers/URLs (⚠️ pas d'analyse automatique des @références dans AGENTS.md, sauf instructions explicites).
- 🟩 Antigravity — global `~/.gemini/GEMINI.md`, projet `.agents/rules/*.md` avec modes d'activation : manual (via @mention), always on, model decision, glob. `@mentions` supportées dans les rules. Limite 12 000 car. par fichier.
- Templates : `assets/antigravity/GEMINI.md`, `assets/antigravity/rule.md` ; template AGENTS.md (avec section compat Antigravity) : `pwa-developpement/assets/templates/AGENTS.md`.

## 6. Config (opencode.jsonc)
- 🟦 OpenCode : priorité config distante → globale `~/.config/opencode/opencode.json` → OPENCODE_CONFIG → projet → `.opencode/` → OPENCODE_CONFIG_CONTENT. Substitution `{env:VAR}` / `{file:chemin}`. MCP local `{type:"local", command, enabled, environment, timeout}` / distant `{type:"remote", url, enabled, headers, oauth}`. Autres clés : `server`, `provider/model/small_model`, `default_agent`, `formatter`, `compaction`, `plugin`, `disabled_providers`, `instructions`. Schéma : https://opencode.ai/config.json.
- 🟩 Antigravity : config via UI Customizations (permissions, rules, workflows, MCP, plugins) ; fichiers : `~/.gemini/GEMINI.md`, `~/.gemini/config/` ; projet `.agents/` (rules, skills, agents, plugins, mcp_config.json).
- 🟩 Plugins Antigravity = packages déclaratifs : `plugin.json` + `skills/`, `rules/`, `mcp_config.json`, `hooks.json` ; emplacements `.agents/plugins/` (workspace), `~/.gemini/config/plugins/` (global). 🟦 Plugins OpenCode = code JS/TS `~/.config/opencode/plugins/` (global), `.opencode/plugins/` (projet) ou npm.

## 7. Sécurisation des tokens
- Détecter les tokens en clair (Bearer/JWT/sk-/api_key) dans opencode.jsonc et configs.
- Backup AVANT modification ; dossier `~/.config/opencode/.tokens/` (chmod 700) ; un fichier par secret (chmod 600, `echo -n`).
- Remplacer par `{file:/chemin/absolu}` — plus sûr que `{env:...}` (persistant, invisible dans ps, non fuyant dans les logs).
- Vérifier : `grep -n 'Bearer [a-zA-Z0-9]\{20,\}\|JWT ...\|sk-[a-zA-Z0-9]\{20,\}' opencode.jsonc` → doit être vide.

## Règles
- Emplacements par défaut : global `~/.config/opencode/` (OpenCode) et `~/.gemini/config/` (Antigravity).
- Consulter `assets/README-ORIENTATION.md` AVANT toute création (carte des emplacements/priorités).
- Ne jamais inventer un comportement d'outil : vérifier via la doc officielle (opencode.ai/docs ou antigravity.google/docs — webfetch) si doute.
- Toujours faire un backup avant toute modification.

## Assets
- `assets/README-ORIENTATION.md` — carte des emplacements et priorités OC/AG
- `assets/opencode/agent.md` — template agent OpenCode
- `assets/opencode/SKILL.md` — template skill OpenCode
- `assets/opencode/command.md` — template commande slash OpenCode
- `assets/antigravity/agent.md` — template subagent Antigravity
- `assets/antigravity/SKILL.md` — template skill Antigravity
- `assets/antigravity/workflow.md` — template workflow Antigravity
- `assets/antigravity/rule.md` — template rule Antigravity (.agents/rules)
- `assets/antigravity/GEMINI.md` — template règles globales Antigravity
- `assets/checklists/skill-validation.md` — checklist validation skill (OC + AG)
- `assets/checklists/agent-oc-vs-ag.md` — checklist création d'agent (OC vs AG)
