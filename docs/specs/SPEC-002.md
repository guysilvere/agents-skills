# [SPEC-002] Isolation & hygiène des serveurs MCP (sécurité PROD & tokens)

> **Statut** : DONE
> **Phase Roadmap** : Phase 8 — Sécurité & gouvernance infrastructure
> **Agent(s)** : `lead-dev` → `ops-quality`

---

## 1. Intent
**Problème** : `opencode/mcp.servers.json` activait globalement deux bases Turso de **production** (`turso-lodgi-prod`, `turso-brvm-radar-prod`) exposées en écriture dans *toutes* les sessions de *tous* les projets, créant un risque de mutation accidentelle et chargeant inutilement des schémas d'outils. De plus, `opencode/opencode.jsonc.new` référençait encore un MCP `paiement` obsolète.
**Objectif** : Réduire drastiquement la surface de risque sur les bases de production et le nombre de schémas d'outils MCP chargés par défaut dans chaque session, tout en conservant les outils transverses indispensables (`github`, `coolify`, `graft`) en global.

## 2. User Story
En tant que **développeur utilisant des agents IA sur plusieurs projets**, je veux **que les bases Turso de production ne soient jamais exposées globalement et que les serveurs MCP verbeux soient activés de manière ciblée**, afin d'**éviter toute mutation accidentelle en prod et d'économiser des tokens à chaque tour**.

## 3. Exigences

| ID | Exigence | Critère de fin (DoD) |
|----|----------|-----------------------|
| REQ-01 | Passer `turso-lodgi-prod` et `turso-brvm-radar-prod` à `enabled: false` dans `opencode/mcp.servers.json` avec note explicite (activation ponctuelle ou `.mcp.json` projet) | [x] `enabled: false` vérifié dans `opencode/mcp.servers.json` |
| REQ-02 | Fournir un template `.mcp.json` projet (dans `pwa-developpement/assets/configs/mcp.project.example.json`) montrant comment brancher une base Turso **uniquement** dans le repo concerné (avec avertissement `⛔ STOP` prod) | [x] Template créé et référencé dans `WORKFLOW.md` |
| REQ-03 | Évaluer et documenter la politique de scoping : conserver GitHub et Coolify en global (transverses 90 % des SaaS) et isoler les bases de données | [x] Décision documentée dans `WORKFLOW.md` |
| REQ-04 | Nettoyer `opencode/opencode.jsonc.new` (supprimer le bloc `paiement` absent de la source de vérité `mcp.servers.json`) | [x] Zéro serveur fantôme dans `opencode.jsonc.new` |
| REQ-05 | Mettre à jour `opencode/WORKFLOW.md` § « Serveurs MCP » pour refléter la politique « global transverse vs `.mcp.json` projet » | [x] Docs synchronisées |

**Critères d'acceptation (Étant donné / Quand / Alors)**
- **REQ-01**
  - **Étant donné** `opencode/mcp.servers.json` après modification
  - **Quand** j'inspecte les serveurs `enabled: true`
  - **Alors** aucun serveur `turso-*-prod` n'est actif globalement
- **REQ-02**
  - **Étant donné** un projet nécessitant un accès ponctuel à Turso
  - **Quand** le développeur consulte `WORKFLOW.md`
  - **Alors** il dispose d'une procédure claire (`.mcp.json` local non commité ou activation temporaire) sans exposer la prod aux autres repos

**Edge cases**
- **EDGE-01** : Claude Code en scope `user` retire les serveurs `enabled: false` via `sync-skills.sh` → vérifié, `turso-*-prod` sont proprement retirés sans toucher à `openrouter` (OAuth).
- **EDGE-02** : Besoin urgent d'inspecter une base prod → commande documentée (`--mcp-server=turso-<projet>-prod`).

## 4. Structure & Contrats de fichiers
- `opencode/mcp.servers.json` : source de vérité MCP unique (JSON valide, zéro secret en clair).
- `opencode/skills/pwa-developpement/assets/configs/mcp.project.example.json` : modèle `.mcp.json` projet.

## 5. Autorisations & Sécurité
- **Moindre privilège** : les agents en session quotidienne n'ont plus accès en écriture aux bases Turso de production.
- **Jalon humain (`⛔ STOP`)** : toute migration ou écriture sur base non locale reste soumise à validation explicite.
- **Secrets** : aucun token en clair ; uniquement `{{TOKEN:...}}` ou `${VAR}`.
- **Données personnelles collectées** : Aucune.

## 6. Fichiers impactés
- `opencode/mcp.servers.json` [MODIFY]
- `opencode/opencode.jsonc.new` [MODIFY]
- `opencode/WORKFLOW.md` [MODIFY]
- `agents-src/frontmatter/claude/integrations.yaml` [MODIFY]
- `opencode/skills/pwa-developpement/assets/configs/mcp.project.example.json` [NEW]

## 7. Tâches d'exécution
- [x] **T1** — Désactiver `turso-*-prod` en global et nettoyer `opencode/opencode.jsonc.new` (REQ-01, REQ-04)
- [x] **T2** — Créer le template `.mcp.json` projet et documenter la règle dans `WORKFLOW.md` (REQ-02, REQ-05)
- [x] **T3** — Appliquer le scoping et retirer les références globales dans `agents-src/` (REQ-03)
- [x] **T4** — Tester `./scripts/sync-skills.sh --local --dry-run` + synchroniser localement
- [x] **T5** — Validation complète & passage à DONE
