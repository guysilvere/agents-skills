# Installation — Machine neuve (OpenCode + Antigravity)

> Guide pas à pas pour restaurer le setup IA Agence Bulles sur une nouvelle machine.

## Prérequis

- Git, Node.js (ou Bun), un compte GitHub (`guysilvere`).
- OpenCode (CLI) : https://opencode.ai
- Antigravity (Google) : https://antigravity.google/download
- Clé SSH GitHub configurée (`ssh -T git@github.com` doit répondre).

## 1. Cloner les repos

```bash
# Repo du setup IA (ce repo)
git clone git@github.com:guysilvere/agents-skills.git ~/agents-skills

# (Optionnel) Repos projets Agence Bulles
# git clone git@github.com:guysilvere/<projet>.git ~/Projets/<projet>
```

## 2. Synchroniser OpenCode + Antigravity

```bash
cd ~/agents-skills

# Prévisualisation (aucune modification)
./scripts/sync-skills.sh --dry-run

# Application complète (backup + suppression anciens + copie nouveaux)
./scripts/sync-skills.sh
```

Le script installe :
- 🟦 OpenCode : 12 skills → `~/.config/opencode/skills/`, 3 agents → `~/.config/opencode/agents/`, 8 commandes → `~/.config/opencode/commands/`
- 🟩 Antigravity : 12 skills → `~/.gemini/config/skills/`, 8 workflows → `~/.gemini/workflows/`

## 3. Config OpenCode

```bash
# Si absent, créer la config globale avec default_agent: lead-dev
mkdir -p ~/.config/opencode
```

`~/.config/opencode/opencode.json` minimal :

```json
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "lead-dev"
}
```

- Ajouter les providers/modèles (Anthropic, OpenAI, etc.) via `opencode auth login`.
- (Optionnel) Reprendre `opencode/opencode.jsonc.new` pour les MCP (github, brevo, n8n, supabase).

## 4. Config Antigravity

- 🟩 Règles globales : copier le template `~/.gemini/GEMINI.md` fourni par la skill `opencode-admin` (`opencode-admin/assets/antigravity/GEMINI.md`).
- 🟩 Règles projet : dans chaque repo, `.agents/rules/*.md` (AGENTS.md n'est pas lu par Antigravity).
- 🟩 Permissions : via l'UI Antigravity (Customizations → Permissions), syntaxe `action(target)`.

## 5. Vérification

```bash
# Skills OpenCode
ls ~/.config/opencode/skills/            # → 10 dossiers
# Agents OpenCode
ls ~/.config/opencode/agents/            # → lead-dev, ops-quality, integrations
# Commandes OpenCode
ls ~/.config/opencode/commands/          # → cadrage, spec, validate, release, deploy, docs-sync
# Skills Antigravity
ls ~/.gemini/config/skills/              # → 10 dossiers
# Workflows Antigravity
ls ~/.gemini/workflows/                  # → cadrage, spec, validate, release, deploy, docs-sync
```

- Redémarrer OpenCode (agent par défaut = `lead-dev`).
- Dans Antigravity, vérifier que les skills apparaissent (progressive disclosure) et lancer `/cadrage`.

## 6. Mises à jour futures

```bash
cd ~/agents-skills && git pull && ./scripts/sync-skills.sh
```

Le script est idempotent : il remplace toujours par l'état du repo.

## Dépannage

| Problème | Solution |
|----------|----------|
| Skill non chargée dans OpenCode | Vérifier `SKILL.md` (majuscules), frontmatter `name`==dossier, `permission.skill: allow` |
| Skill non visible dans Antigravity | Vérifier `~/.gemini/config/skills/<nom>/SKILL.md`, redémarrer la conversation |
| Agent Antigravity bloqué (hange) | Outil mal orthographié dans `tools[]` (ex: `view_file`, `run_command`) |
| Backup accidentel | Restaurer depuis `~/.config/opencode-backups/bak/<date>/` |
| Conflit avec un ancien setup | `./scripts/sync-skills.sh` supprime puis recopie : état du repo garanti |
