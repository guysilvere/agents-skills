# ARCHIVAGE — Agents et skills déplacés

> Règle d'or : **jamais de `rm` définitif**. Tout est déplacé par `mv` vers les dossiers d'archive.
> Emplacements : `~/.config/opencode/agents-archive/` et `~/.config/opencode/skills-archive/`.
> Backup complet de secours : `~/.config/opencode-backups/bak/2026-08-20/`.

## Agents archivés (→ `~/.config/opencode/agents-archive/`)

Tous les agents remplacés par les 3 nouveaux. Les fichiers `.backup` existants (chef-pwa.md.backup, designer-flow.md.backup, pwa-tester.md.backup, seo-specialist.md.backup) sont archivés avec leur agent.

| Agent | Remplacé par | Notes |
|-------|-------------|-------|
| `maestro` | `lead-dev` | Ancien agent par défaut — remplacé, va en archive |
| `architecte` | `lead-dev` | |
| `chef-pwa` | `lead-dev` | |
| `designer-flow` | `lead-dev` | |
| `explore` | `lead-dev` | ⚠️ Introuvable dans `agents/` — rien à archiver (liste pour mémoire) |
| `general` | `lead-dev` | ⚠️ Introuvable dans `agents/` — rien à archiver (liste pour mémoire) |
| `seo-specialist` | `lead-dev` + `ops-quality` | SEO contenu → lead-dev ; audit SEO → ops-quality |
| `svelte-file-editor` | `lead-dev` | ⚠️ Introuvable dans `agents/` — voir note plugin Svelte ci-dessous |
| `pwa-tester` | `ops-quality` | |
| `gestionnaire-git` | `ops-quality` | |
| `api-master` | `integrations` | |
| `n8n-builder` | `integrations` | Contexte SaaS uniquement |
| `operateur-typebot` | `integrations` | Chatbots SaaS |
| `valideur-typebot` | `integrations` | Chatbots SaaS |
| `typebot-master` | `integrations` | Chatbots SaaS |
| `tgrow-coach` | (aucun) | Archivé — périmètre hors écosystème courant |
| `brvm-analyste` | (aucun) | Archivé — périmètre hors écosystème courant |
| `opencode-admin` | `lead-dev` + skill `opencode-admin` | L'agent OpenCode ne pilote plus ; la compétence devient une skill |

**Note plugin Svelte (`@sveltejs/opencode`)** : le plugin (conservé dans la config) référence une skill `svelte-code-writer` et mentionne un agent `svelte-file-editor`. Cet agent n'existe pas dans `~/.config/opencode/agents/` (ni ailleurs) : le plugin fonctionne via ses propres skills, il ne casse rien. Si la stack finale d'un projet n'est pas Svelte, le plugin peut être désactivé (retrait de la ligne `@sveltejs/opencode` dans `plugin`) sans impact sur les agents.

## Skills archivées (→ `~/.config/opencode/skills-archive/`)

### A. Skills n8n (5) — périmètre SaaS externalisé
`n8n-api-deploy`, `n8n-error-handling-debug`, `n8n-expressions-and-data`, `n8n-node-reference`, `n8n-workflow-builder`

> **Réactivation n8n (note incluse à la demande de l'utilisateur)** : si l'écosystème agence redevient actif sur n8n, réactiver en fusionnant ces 5 skills en **1 seule skill `n8n`** :
> - Dossier unique `n8n/SKILL.md` avec sections : Déploiement/API (ex `n8n-api-deploy`), Debug (ex `n8n-error-handling-debug`), Expressions & données (ex `n8n-expressions-and-data`), Référence nodes (ex `n8n-node-reference`), Builder workflow (ex `n8n-workflow-builder`).
> - Contenu : reprendre les SKILL.md depuis `skills-archive/` et condenser en listes à puces, garder les assets éventuels.
> - L'agent `integrations` la chargera dynamiquement via `skill n8n` (permission `skill: allow` déjà en place — aucune modification d'agent nécessaire).

### B. Skills Typebot / chatbots (4)
`typebot-api`, `typebot-designer`, `api-reference-typebot`, `designer-flow` (si présent — non trouvé, liste pour mémoire)

### C. Skills API / références (2)
`api-reference-n8n`, `api-reference-cpanel`

### D. Skills fusionnées — contenu absorbé (19)
| Skill archivée | Absorbée par |
|----------------|--------------|
| `pwa-planification` | `pwa-cadrage` |
| `pwa-plan-projet` | `pwa-cadrage` |
| `pwa-stress-test-idee` | `pwa-cadrage` |
| `pwa-trouver-nom` | `pwa-cadrage` |
| `pwa-monetisation` | `pwa-cadrage` |
| `pwa-copywriting-landing` | `pwa-cadrage` |
| `pwa-feuille-route` | `pwa-cadrage` |
| `pwa-stack` | `pwa-cadrage` |
| `pwa-best-practices` | `pwa-developpement` |
| `pwa-tests-locaux` | `pwa-validation` |
| `design-pwa` | `design-pwa-system` |
| `design-pwa-direction` | `design-pwa-system` |
| `design-pwa-data` | `design-pwa-system` (assets data/palettes.json + data/styles.json) |
| `responsive-design` | `design-pwa-system` |
| `api-reference-jeko` | `api-paiements` |
| `opencode-agent-builder` | `opencode-admin` |
| `opencode-skill-builder` | `opencode-admin` |
| `opencode-config-manager` | `opencode-admin` |
| `opencode-permissions-manager` | `opencode-admin` |
| `opencode-secure-tokens` | `opencode-admin` |

### E. Skills hors périmètre (2)
`brvm-portefeuille`, `tgrow-coaching-narrative` — archivées, non remplacées.

### F. Autres
- `ui-ux-pro-max` : archivée (contenu générique absorbé par `design-pwa-system` pour l'usage Agence Bulles).

## Skills conservées en place
- `test-pwa-steps` (dossier de test — non concerné par la migration, laissé tel quel)
- `supabase`, `supabase-postgres-best-practices` (gérées par `skills-lock.json`, non touchées)

## Commandes existantes non remplacées
- `audit.md`, `new-pwa.md`, `plannotator-annotate.md`, `plannotator-last.md`, `plannotator-review.md` — conservées. ⚠️ `release.md` existante est **remplacée** par la nouvelle commande `release` (ops-quality).
