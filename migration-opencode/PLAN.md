# Plan de migration — 11 étapes

> Statut : chaque étape est cochée au fur et à mesure. La colonne ✔ est remplie pendant l'exécution.

| # | Étape | Statut |
|---|-------|--------|
| 0 | Backup complet `~/.config/opencode` → `~/.config/opencode-backups/backup-20260820/` (hors node_modules) | ✅ Fait |
| 1 | Créer `/Users/silveremeya/Projets/agents-skills/migration-opencode/` (README-MIGRATION.md, PLAN.md, ARCHIVAGE.md) | ✅ Fait |
| 2 | Écrire les 3 agents finaux (`agents/lead-dev.md`, `agents/ops-quality.md`, `agents/integrations.md`) | ✅ Fait |
| 3 | Écrire les 10 skills (`skills/<nom>/SKILL.md` + assets dans `skills/<nom>/assets/`) | ✅ Fait (10 SKILL.md + 43 assets) |
| 4 | Écrire les 6 commandes slash (`commands/*.md`) | ✅ Fait |
| 5 | Écrire `opencode.jsonc.new` (config cible avec diff expliqué) | ✅ Fait (JSON validé + DIFF.md) |
| 6 | Appliquer : créer les 3 agents dans `~/.config/opencode/agents/` | ✅ Fait |
| 7 | Appliquer : créer les 10 skills + assets dans `~/.config/opencode/skills/` | ✅ Fait |
| 8 | Appliquer : archiver les anciens agents (`agents-archive/`) et skills (`skills-archive/`) | ✅ Fait (19 fichiers agents + 33 dossiers skills) |
| 9 | Appliquer : mettre à jour `opencode.jsonc` (default_agent lead-dev, MCP, plugins) | ✅ Fait (JSON validé) |
| 10 | Appliquer : créer les 6 commandes dans `~/.config/opencode/commands/` | ✅ Fait |
| 11 | Vérification finale : lister agents/, skills/, commands/ ; vérifier `skill: allow` et section `## Assets` ; mettre à jour README-MIGRATION.md | ✅ Fait |

## Ordre d'application (contrainte utilisateur)

1. Écrire TOUS les fichiers dans `agents-skills/migration-opencode/` (étapes 1–5)
2. PUIS appliquer dans `~/.config/opencode/` (étapes 6–10)
3. Enfin vérifier (étape 11)

## Détail de chaque étape

### Étape 2 — Agents
- `lead-dev.md` : mode primary, temperature 0.3, model par défaut (deepseek/deepseek-v4-flash), permissions complètes, task limitée à ops-quality + integrations.
- `ops-quality.md` : mode subagent, temperature 0.1, edit limité aux docs, bash avec allowlist + deny push --force / rebase -i.
- `integrations.md` : mode subagent, temperature 0.2, edit ask configs/hooks/scripts, bash avec allowlist curl/npx/psql/pocketbase/pb, webfetch allow.

### Étape 3 — Skills (10)
Chacune : frontmatter (`name` = nom du dossier, `description`), corps en listes à puces, section `## Assets` avec liens relatifs `assets/...`.

### Étape 4 — Commandes (6)
`cadrage`, `spec`, `validate`, `release`, `deploy`, `docs-sync` — format Markdown avec frontmatter `description` + `agent`.

### Étape 5 — opencode.jsonc.new
Diff vs actuel :
- `default_agent`: `maestro` → `lead-dev`
- MCP `Notion`: `enabled: true` → `false` (non utilisé)
- MCP `github`, `n8n`, `supabase`, `supabase-agencebulles`, `brevo`: inchangés (gardés)
- `plugin`: `@sveltejs/opencode` conservé (choix conservateur) ; autres plugins inchangés
- `model` / `small_model`: inchangés

### Étapes 6–10 — Application
Copie depuis `migration-opencode/` vers `~/.config/opencode/`, puis archivage par `mv` (jamais `rm`).

### Étape 11 — Vérification
- `ls ~/.config/opencode/agents/` → exactement 3 fichiers actifs (lead-dev, ops-quality, integrations)
- `ls ~/.config/opencode/skills/` → les 10 skills + non-archivées
- `ls ~/.config/opencode/commands/` → les 6 nouvelles
- grep `skill: allow` dans les 3 agents
- grep `## Assets` dans les 10 SKILL.md
- Mettre à jour README-MIGRATION.md (section Statut final)
