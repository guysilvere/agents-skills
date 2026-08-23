# SYNC — Script de synchronisation GitHub → OpenCode + Antigravity

> `scripts/sync-skills.sh` : importe depuis GitHub la source de vérité et met à jour les deux outils automatiquement.

## Principe

```
GitHub (guysilvere/agents-skills)  ──clone/pull──►  repo local ~/agents-skills
                                                       │
                                                       ▼
                                    scripts/sync-skills.sh
                                                       │
                    ┌──────────────────────────────────┴──────────────────────────┐
                    ▼                                                              ▼
        🟦 OpenCode                                    🟩 Antigravity
        ~/.config/opencode/skills/                    ~/.gemini/config/skills/
        ~/.config/opencode/agents/                    ~/.gemini/workflows/
        ~/.config/opencode/commands/
```

- **Source de vérité** : `opencode/skills/` (12 skills), `opencode/agents/` (3 agents), `opencode/commands/` (8 commandes), `antigravity/workflows/` (8 workflows), `antigravity/agents/` (3 agents AG).
- **Cible skills** : le même dossier de skills est copié dans les DEUX outils (format `SKILL.md` compatible — standard agentskills.io).
- **Cible agents** : `opencode/agents/` → OpenCode ; `antigravity/agents/` → Antigravity (formats différents, deux sources séparées).
- **Cible workflows** : uniquement Antigravity (les commandes OpenCode n'y fonctionnent pas).

## Usage

```bash
./scripts/sync-skills.sh                 # clone/pull + backup + purge + copie
./scripts/sync-skills.sh --dry-run       # affiche ce qui serait fait, sans rien modifier
./scripts/sync-skills.sh --opencode-only # ne touche qu'à ~/.config/opencode
./scripts/sync-skills.sh --antigravity-only # ne touche qu'à ~/.gemini
./scripts/sync-skills.sh --no-backup     # désactive le backup préalable (déconseillé)
./scripts/sync-skills.sh --help          # aide
```

## Étapes internes

1. **Clone/pull** : `git clone` (1er run) ou `git pull` (runs suivants) depuis GitHub dans `~/.cache/agents-skills-sync/`.
2. **Backup** : copie des dossiers cibles existants vers `~/.config/opencode-backups/bak/<horodatage>/`.
3. **Purge** : suppression des anciens dossiers cibles (skills/agents/commands/workflows) — les fichiers hors des dossiers gérés ne sont PAS touchés.
4. **Copie** : recopie depuis le repo local vers les cibles.
5. **Rapport** : liste des dossiers installés par outil, chemin du backup.

## Garanties

- **Idempotent** : l'état final = état du repo GitHub, à chaque run.
- **Réversible** : backup complet avant modification (restauration manuelle possible).
- **Ciblé** : ne purge QUE les dossiers gérés (skills, agents, commands, workflows) ; jamais `opencode.jsonc`, `GEMINI.md`, `mcp_config.json`, `.tokens/`, ni les projets.
- **Sûr par défaut** : `--dry-run` recommandé avant chaque mise à jour majeure.

## Symlinks (validation effectuée le 2026-08-20)

Un test symlink a confirmé que les skills globales peuvent être **liées** au lieu d'être dupliquées :
- `ln -s ~/.config/opencode/skills/<skill> ~/.gemini/config/skills/<skill>` → SKILL.md lisible, `find` détecte la skill, frontmatter OK.
- Bénéfice : une seule copie physique des skills globales, mise à jour par le script dans les deux outils.
- Limite : si le script purge puis recopie, il doit d'abord supprimer les symlinks orphelins (`find ... -type l -delete`). Prévoir un drapeau `--symlink` dans une future version du script pour créer les liens à la place des copies.

## Structure des sources

```
opencode/
├── skills/            # 12 skills (SKILL.md + assets/)
├── agents/            # lead-dev.md, ops-quality.md, integrations.md (format OpenCode)
└── commands/          # 8 commandes : audit, cadrage, deploy, docs-sync, new-pwa, release, spec, validate
antigravity/
├── agents/            # lead-dev.md, ops-quality.md, integrations.md (format Antigravity)
└── workflows/         # 8 workflows : audit, cadrage, deploy, docs-sync, new-pwa, release, spec, validate
```

## Limites connues

- Les **agents Antigravity** sont synchronisés depuis `antigravity/agents/` (format frontmatter différent d'OpenCode).
- Les **règles Antigravity** (`GEMINI.md`, `.agents/rules/`) ne sont pas synchronisées — modèles dans `opencode-admin/assets/antigravity/`.
- Les **MCP** (`opencode.jsonc`, `~/.gemini/config/mcp_config.json`) ne sont pas synchronisés — secrets locaux par machine.
