# Migration OpenCode — 2026-08-20

Migration complète du setup OpenCode de l'utilisateur (écosystème Agence Bulles) : 17 agents + ~40 skills fragmentées → 3 agents pivot + 10 skills consolidées + 6 commandes slash + config simplifiée.

## Avant / Après

| Aspect | AVANT | APRÈS |
|--------|-------|-------|
| Agents | 16 actifs + backups (architecte, chef-pwa, designer-flow, explore, general, gestionnaire-git, n8n-builder, opencode-admin, operateur-typebot, pwa-tester, seo-specialist, svelte-file-editor, tgrow-coach, typebot-master, valideur-typebot, api-master, brvm-analyste, maestro) | **3 agents** : `lead-dev` (primary, défaut), `ops-quality` (subagent), `integrations` (subagent) |
| Skills | ~40 dossiers (n8n-*, typebot-*, pwa-* fragmentées, design-* éclatées, opencode-* x5) | **10 skills** consolidées, chacune avec `## Assets` |
| Commandes slash | 0 (dossier `commands/` existait mais non exploité) | **6 commandes** : cadrage, spec, validate, release, deploy, docs-sync |
| Config | `default_agent: maestro`, MCP Notion actif, plugin Svelte actif | `default_agent: lead-dev`, Notion désactivé, plugin Svelte conservé |
| Modèle | `deepseek/deepseek-v4-flash` (inchangé) | inchangé |

## Les 3 agents

1. **`lead-dev`** (PRIMARY, défaut) — cycle de vie produit complet (cadrage → naming → stack → design → specs → dev → living doc → SEO/contenu). Écrit le code ET la doc. Route vers ops-quality et integrations.
2. **`ops-quality`** (SUBAGENT) — validation & livraison : tests locaux (Caddy .test), build, lint, Lighthouse, a11y, SEO, audit sécurité → cycle Git (branche testing, Conventional Commits, tags, releases) → déploiement Coolify/Cloudflare + RUNBOOK. Ne corrige pas le code.
3. **`integrations`** (SUBAGENT) — argent & intégrations : Jèko + CinetPay, webhooks + dunning + factures PDF, emails transactionnels Brevo/Mailtrap, stockage R2 URLs présignées, scripts seed/migration DB, n8n lié au SaaS.

## Les 10 skills

| Skill | Source / fusion | Assets |
|-------|-----------------|--------|
| `pwa-cadrage` | pwa-planification + pwa-plan-projet + pwa-stress-test-idee + pwa-trouver-nom + pwa-monetisation + pwa-copywriting-landing + pwa-feuille-route + pwa-stack | templates/CADRAGE.md, templates/BLUEPRINT.md, templates/ROADMAP.md, checklists/stress-test.md, checklists/naming.md, data/stack-table.md |
| `pwa-developpement` | pwa-best-practices (réécrite) | templates/AGENTS.md, templates/SPEC-XXX.md, templates/DATABASE.md, templates/README.md, configs/.env.example, checklists/style-code.md |
| `design-pwa-system` | design-pwa + design-pwa-direction + design-pwa-data + responsive-design | templates/DESIGN_SYSTEM.md, configs/layout-signature.css, checklists/mobile-pwa.md, data/palettes.json, data/styles.json |
| `pwa-validation` | pwa-tests-locaux (réécrite) | checklists/pre-commit.md, checklists/security.md, checklists/seo.md, checklists/a11y.md, configs/Caddyfile.test |
| `pwa-deploiement` | **NOUVELLE** (comble le gap Phase 8) | templates/RUNBOOK.md, scripts/backup-r2.sh, scripts/restore-r2.sh, scripts/compress-avif.sh, configs/docker-compose.yml, configs/cloudflared.yml, checklists/deploy.md |
| `api-paiements` | api-reference-jeko + CinetPay | reference/jeko.md, reference/cinetpay.md, checklists/webhook.md, scripts/curl-jeko.sh, templates/invoice.pdf.hbs |
| `api-best-practices` | gardée, renforcée | templates/error-response.json, checklists/api-review.md |
| `shared-git-conventions` | gardée | templates/PR-template.md, templates/CHANGELOG.md, templates/release-notes.md |
| `shared-eco-tokens` | gardée (obligatoire) | reference/model-selection.md |
| `opencode-admin` | opencode-agent-builder + opencode-skill-builder + opencode-config-manager + opencode-permissions-manager + opencode-secure-tokens | templates/agent.md, templates/SKILL.md, checklists/skill-validation.md |

## Décisions clés

1. **Agents flexibles** : tous les agents ont `permission.skill: allow` → chargement dynamique de TOUTES les skills (existantes et futures) sans modifier les agents. Aucune liste restrictive de skills dans le frontmatter. Chaque agent documente une section « Intégration de nouvelles skills ».
2. **Traçabilité d'abord** : tous les fichiers de migration sont écrits dans ce dossier AVANT application dans `~/.config/opencode/`.
3. **Archivage réversible** : aucun `rm` définitif. Les agents/skills remplacés sont déplacés vers `~/.config/opencode/agents-archive/` et `~/.config/opencode/skills-archive/`. Backup complet dans `~/.config/opencode-backups/backup-20260820/`.
4. **Plugin Svelte conservé** : choix conservateur (voir ARCHIVAGE.md pour la note sur svelte-file-editor). Peut être désactivé si la stack finale n'est pas Svelte.
5. **Notion MCP désactivé** (`enabled: false`) : non utilisé dans les flux actuels. Réversible en 1 ligne.
6. **Structure assets** : les assets sont écrits dans `skills/<nom>/assets/` (copie directe vers `~/.config/opencode/skills/<nom>/`). Le dossier racine `assets/` du plan sert de localisation documentaire ; les liens `## Assets` des SKILL.md sont relatifs au dossier skill.

## Réversibilité

- **Restaurer la config** : `cp ~/.config/opencode-backups/backup-20260820/opencode.jsonc ~/.config/opencode/opencode.jsonc`
- **Restaurer agents/skills/commandes** : déplacer les dossiers depuis `agents-archive/` / `skills-archive/` vers leur emplacement d'origine, et inversement pour les 3 agents / 10 skills / 6 commandes créés.
- **Restaurer l'état complet** : `rsync -a ~/.config/opencode-backups/backup-20260820/ ~/.config/opencode/` (hors node_modules).

## Statut final

✅ **MIGRATION COMPLÈTE — 2026-08-20**

| Vérification | Résultat |
|--------------|----------|
| Agents créés | 3 (`lead-dev` primary défaut, `ops-quality`, `integrations`) — présents dans `~/.config/opencode/agents/` |
| Skills créées | 10, avec `## Assets` et liens relatifs valides — 43 assets installés |
| Agents archivés | 15 agents + 4 fichiers .backup + README.txt → `agents-archive/` |
| Skills archivées | 33 dossiers → `skills-archive/` |
| Commandes créées | 6 (cadrage, spec, validate, release, deploy, docs-sync) |
| Config | `default_agent: lead-dev`, Notion désactivé, plugin Svelte conservé, tokens `{file:...}` intacts |
| `skill: allow` | Présent dans les 3 agents (flexibilité skills futures) |
| Fichiers de migration | Écrits dans ce dossier AVANT application — traces complètes |

**Notes de vérification**
- `test-pwa-steps` (dossier de test) et `supabase`/`supabase-postgres-best-practices` (skills-lock.json) : non touchées.
- Commandes existantes conservées : `audit`, `new-pwa`, `plannotator-*` (liées au plugin). `release.md` remplacée par la nouvelle version.
- Agents `explore`, `general`, `svelte-file-editor` : introuvables dans `agents/` — rien à archiver (voir ARCHIVAGE.md).

**Prochaines étapes**
- Redémarrer OpenCode pour charger le nouvel agent par défaut et les nouvelles skills.
- Commit git du dossier `migration-opencode/` dans le repo agents-skills.
- Test de bout en bout : lancer `/cadrage` sur un nouveau projet, `/validate` sur un projet existant.
- Réactivation n8n si nécessaire : fusionner les 5 skills n8n-* de `skills-archive/` en une skill `n8n` (instructions dans ARCHIVAGE.md).
