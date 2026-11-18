# [SPEC-004] Alignement des outils & permissions des agents (OC / AG / Claude)

> **Statut** : DONE
> **Phase Roadmap** : Phase 6 — Fiabilité multi-outils & moindre privilège
> **Agent(s)** : `lead-dev` → `ops-quality`

---

## 1. Intent
**Problème** : Deux divergences fonctionnelles cassent le comportement des agents entre outils : (1) `ops-quality` n'a aucun outil d'édition dans `antigravity/agents/ops-quality.md` et `claude/agents/ops-quality.md` alors qu'il doit maintenir `CHANGELOG.md`, `RUNBOOK.md` et `README.md` (ce qui le force à bricoler via `bash` ou à échouer) ; (2) les noms d'outils dans `antigravity/agents/*.md` (`view_file`, `write_to_file`, `replace_file_content`, `find_by_name`, `grep_search`) diffèrent potentiellement des noms runtime Antigravity actuels (`read_file`, `write_file`, `edit_file`), ce qui peut faire bloquer les subagents.
**Objectif** : Garantir que chaque agent dispose exactement des outils valides et nécessaires sur chacun des 3 outils, sans briser la séparation stricte entre `ops-quality` et le code applicatif.

## 2. User Story
En tant que **développeur déléguant à `ops-quality` ou `integrations`**, je veux **que les subagents disposent des bons noms d'outils et des permissions exactes sur OpenCode, Antigravity et Claude Code**, afin d'**éviter les blocages silencieux et les contournements via shell**.

## 3. Exigences

| ID | Exigence | Critère de fin (DoD) |
|----|----------|-----------------------|
| REQ-01 | Vérifier les noms d'outils officiels Antigravity (Desktop + CLI `agy`) et aligner `antigravity/agents/*.md` + `opencode-admin/assets/antigravity/agent.md` | [x] Liste d'outils vérifiée (`view_file`, `write_to_file`, `replace_file_content`, `list_dir`, `grep_search`, `find_by_name`, `run_command`, `read_url_content`) alignée sur la spec `BuiltinTools` Antigravity |
| REQ-02 | Clarifier et unifier le modèle d'édition de `ops-quality` sur les 3 outils : autoriser les outils d'édition légitimes (`Edit`/`Write` sur Claude, `write_to_file`/`replace_file_content` sur AG) pour `CHANGELOG.md`, `RUNBOOK.md`, `README.md` | [x] Outils d'édition ajoutés à `ops-quality` sur Claude Code et Antigravity, alignés sur les permissions ciblées OpenCode |
| REQ-03 | Aligner les templates et checklists `opencode-admin/assets/checklists/agent-oc-vs-ag.md` avec les noms d'outils vérifiés | [x] Nomenclature d'outils et matrice cohérente |
| REQ-04 | Vérifier que `integrations` dispose bien de `run_command` / `Bash` sandboxé pour exécuter ses propres tests d'intégration (règle `WORKFLOW.md`) | [x] Outil présent et sandboxé sur les 3 outils |

**Critères d'acceptation (Étant donné / Quand / Alors)**
- **REQ-01**
  - **Étant donné** un appel `invoke_subagent` vers `ops-quality` ou `integrations` sous Antigravity
  - **Quand** le subagent démarre et lit un fichier
  - **Alors** il ne bloque pas sur un nom d'outil inexistant
- **REQ-02**
  - **Étant donné** une demande de release mettant à jour `CHANGELOG.md`
  - **Quand** `ops-quality` exécute la release sur OpenCode, Antigravity ou Claude Code
  - **Alors** le comportement est déterministe et identique sur les 3 outils, sans modification possible du code source applicatif

**Edge cases**
- **EDGE-01** : Antigravity Desktop et Antigravity CLI (`agy`) utilisent des alias d'outils différents → vérifier avant de modifier les deux cibles ; documenter dans `docs/ANTIGRAVITY.md`.
- **EDGE-02** : `ops-quality` tente d'éditer un fichier dans `src/` → refusé mécaniquement (permission OC + hook SPEC-009).

**PWA / Offline** : Non applicable.

## 4. Structure & Contrats de fichiers
- Matrice cible d'outils par rôle × outil (OpenCode / Antigravity / Claude Code) documentée dans `opencode/skills/opencode-admin/assets/checklists/agent-oc-vs-ag.md`.

## 5. Autorisations & Sécurité
- **Principe de séparation** : `ops-quality` ne peut jamais modifier `src/**`, `tests/**`, ni les migrations DB.
- **Anti-récursion** : seuls les agents primaires (`lead-dev`) possèdent l'outil de délégation (`task` / `invoke_subagent` / `Task`).
- **Données personnelles collectées** : Aucune.

## 6. Fichiers impactés
- `antigravity/agents/lead-dev.md` [MODIFY]
- `antigravity/agents/ops-quality.md` [MODIFY]
- `antigravity/agents/integrations.md` [MODIFY]
- `claude/agents/ops-quality.md` [MODIFY]
- `opencode/agents/ops-quality.md` [MODIFY] (si option « `lead-dev` édite les docs » retenue)
- `opencode/skills/opencode-admin/SKILL.md` [MODIFY]
- `opencode/skills/opencode-admin/assets/antigravity/agent.md` [MODIFY]
- `opencode/skills/opencode-admin/assets/checklists/agent-oc-vs-ag.md` [MODIFY]

## 7. Tâches d'exécution
- [x] **T1** — Vérifier la liste exacte des outils Antigravity (Desktop & CLI) via doc officielle (REQ-01)
- [x] **T2** — Valider le choix d'édition `ops-quality` (autoriser l'édition documentaire ciblée sur les 3 outils) (REQ-02)
- [x] **T3** — Mettre à jour les fichiers agents et les templates `opencode-admin` (REQ-01..04)
- [x] **T4** — Tester l'alignement multi-outils + `./scripts/sync-skills.sh --local`
- [ ] **T5** — Validation & commit sémantique (`ops-quality`)
