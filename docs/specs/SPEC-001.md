# [SPEC-001] Living Doc, parité multi-outils & versionnage `GEMINI.md`

> **Statut** : DONE
> **Phase Roadmap** : Phase 10 — Living doc & cohérence écosystème
> **Agent(s)** : `lead-dev` → `ops-quality`

---

## 1. Intent
**Problème** : Plusieurs documents et fichiers de config ont dérivé (`GEMINI.md` hors dépôt git cite `Skills (10)` et `GeniusPay`, `README.md` liste 15 skills au lieu de 16, `docs/ANTIGRAVITY.md` annonce 12 skills / 8 workflows, `adr.md` manque côté Antigravity, 15/16 skills déclarent `compatibility: opencode` uniquement, `claude/agents/lead-dev.md` omet la règle GitHub Issues).
**Objectif** : Rétablir une source de vérité unique, exacte et synchronisée sur OpenCode, Antigravity et Claude Code avant toute refonte structurelle.

## 2. User Story
En tant que **mainteneur de l'écosystème IA**, je veux **que la documentation, les compteurs, les workflows et les règles globales soient versionnés et alignés sur les 3 outils**, afin d'**éliminer les comportements divergents et les références obsolètes**.

## 3. Exigences

| ID | Exigence | Critère de fin (DoD) |
|----|----------|-----------------------|
| REQ-01 | Versionner `antigravity/GEMINI.md` dans le dépôt et le synchroniser via `scripts/sync-skills.sh` vers `~/.gemini/GEMINI.md` et le plugin CLI | [x] Fichier créé, purgé de `GeniusPay` et compteur `Skills (16)` exact ; `sync-skills.sh` synchronise `~/.gemini/` et CLI |
| REQ-02 | Créer `antigravity/workflows/adr.md` à parité avec `opencode/commands/adr.md` | [x] `diff <(ls opencode/commands) <(ls antigravity/workflows)` vide (11 fichiers à parité) |
| REQ-03 | Mettre à jour les compteurs et listes dans `README.md` et `docs/ANTIGRAVITY.md` | [x] `scroll-craft` ajouté au README (16 skills) ; `docs/ANTIGRAVITY.md` à jour (16 skills, 11 workflows) |
| REQ-04 | Aligner `compatibility: opencode, antigravity, claude` sur les 16 `SKILL.md` | [x] Les 16 `SKILL.md` déclarent la compatibilité complète |
| REQ-05 | Ajouter la règle GitHub Issues (bugs & incidents) dans `claude/agents/lead-dev.md` | [x] Règle alignée sur `opencode/agents/lead-dev.md` et `antigravity/agents/lead-dev.md` |

**Critères d'acceptation (Étant donné / Quand / Alors)**
- **REQ-01**
  - **Étant donné** le dépôt `agents-skills` sur branche `testing`
  - **Quand** j'exécute `./scripts/sync-skills.sh --local --antigravity-only`
  - **Alors** `~/.gemini/GEMINI.md` et `~/.gemini/antigravity-cli/plugins/agence-bulles/rules/GEMINI.md` sont identiques à `antigravity/GEMINI.md` et `grep -i GeniusPay antigravity/GEMINI.md` ne renvoie rien
- **REQ-02**
  - **Étant donné** `opencode/commands/` (11 fichiers) et `antigravity/workflows/`
  - **Quand** je compare les noms de fichiers des deux dossiers
  - **Alors** la liste est strictement identique (11 fichiers dont `adr.md`)
- **REQ-04**
  - **Étant donné** les 16 fichiers `opencode/skills/*/SKILL.md`
  - **Quand** je vérifie la clé YAML `compatibility`
  - **Alors** les 16 fichiers déclarent `compatibility: opencode, antigravity, claude`

**Edge cases**
- **EDGE-01** : `~/.gemini/GEMINI.md` contient des personnalisations locales non présentes dans le repo → faire un `diff` préalable et intégrer toute règle valide dans `antigravity/GEMINI.md` avant d'écraser (backup auto conservé).
- **EDGE-02** : Frontmatter YAML cassé par ` : ` dans `description` → valider le YAML de chaque `SKILL.md` et `adr.md`.

**PWA / Offline** : Non applicable (dépôt de configuration agents/skills).

## 4. Structure & Contrats de fichiers
- `antigravity/GEMINI.md` : règles globales Antigravity (≤ 12 000 car., limite Antigravity).
- `antigravity/workflows/adr.md` : frontmatter `description` + étapes séquentielles alignées sur `opencode/commands/adr.md`.
- `scripts/sync-skills.sh` : nouvelle source `SRC_AG_RULES="${BASE_SRC}/antigravity/GEMINI.md"` copiée vers `$AG_RULES` et `${AG_CLI_PLUGIN}/rules/GEMINI.md`.

## 5. Autorisations & Sécurité
- **Périmètre** : aucun secret ni token manipulé.
- **Backup obligatoire** : `sync-skills.sh` sauvegarde `~/.gemini/GEMINI.md` avant écrasement.
- **Données personnelles collectées** : Aucune.

## 6. Fichiers impactés
- `antigravity/GEMINI.md` [NEW]
- `antigravity/workflows/adr.md` [NEW]
- `scripts/sync-skills.sh` [MODIFY]
- `README.md` [MODIFY]
- `docs/ANTIGRAVITY.md` [MODIFY]
- `claude/agents/lead-dev.md` [MODIFY]
- `opencode/skills/*/SKILL.md` (15 fichiers) [MODIFY]

## 7. Tâches d'exécution
- [x] **T1** — Diff `~/.gemini/GEMINI.md`, création `antigravity/GEMINI.md` assaini et mise à jour `scripts/sync-skills.sh` (REQ-01)
- [x] **T2** — Création `antigravity/workflows/adr.md` (REQ-02)
- [x] **T3** — Mise à jour `README.md`, `docs/ANTIGRAVITY.md`, `claude/agents/lead-dev.md` et `compatibility` des 15 skills (REQ-03..05)
- [x] **T4** — Vérification par commandes (`diff`, `grep`, `./scripts/sync-skills.sh --local`)
- [ ] **T5** — Validation & commit sémantique sur `testing` (`ops-quality`)
