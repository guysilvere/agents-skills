# [SPEC-003] Plafonds d'exécution (`steps` / `maxTurns`) & routage des modèles

> **Statut** : DONE
> **Phase Roadmap** : Phase 6 — Fiabilité & maîtrise des coûts d'exécution
> **Agent(s)** : `lead-dev` → `ops-quality`

---

## 1. Intent
**Problème** : Aucun des 9 fichiers agents ne borne le nombre d'itérations (`steps` OpenCode / `maxTurns` Claude Code) malgré la règle explicite dans `shared-eco-tokens`. De plus, `claude/agents/lead-dev.md` force `model: opus` en dur (surcoût systématique) et `opencode/opencode.jsonc.new` affecte le même modèle à `model` et `small_model` (perte du routage).
**Objectif** : Mettre en place des garde-fous mécaniques contre les boucles infinies et rétablir un routage cohérent modèle rapide / modèle fort.

## 2. User Story
En tant que **utilisateur d'agents autonomes**, je veux **que chaque agent ait un plafond mécanique d'itérations et un modèle adapté à son rôle**, afin de **prévenir toute dérive de coût ou boucle infinie sans intervention manuelle**.

## 3. Exigences

| ID | Exigence | Critère de fin (DoD) |
|----|----------|-----------------------|
| REQ-01 | Ajouter `steps` dans le frontmatter des 3 agents OpenCode (`lead-dev: 40`, `ops-quality: 25`, `integrations: 25`) | [x] Clé `steps` présente et numérique dans `opencode/agents/*.md` |
| REQ-02 | Ajouter `maxTurns` dans le frontmatter des 3 agents Claude Code (`lead-dev: 40`, `ops-quality: 25`, `integrations: 25`) après vérification de la doc officielle Claude Code | [x] Clé camelCase `maxTurns` validée et appliquée dans `claude/agents/*.md` |
| REQ-03 | Remplacer `model: opus` codé en dur dans `claude/agents/lead-dev.md` par `inherit` (ou `sonnet` par défaut + escalade) | [x] `model: inherit` configuré pour respecter le modèle actif de la session |
| REQ-04 | Différencier `model` (implémentation) et `small_model` (tâches rapides/compaction/titres) dans `opencode/opencode.jsonc.new` et la config active | [x] `model: deepseek/deepseek-v4` vs `small_model: deepseek/deepseek-v4-flash` |
| REQ-05 | Vérifier les options de plafond disponibles côté Antigravity (doc officielle) et les appliquer ou documenter la limite plateforme | [x] Vérifié via doc Google Antigravity : les plafonds se gèrent au runtime / orchestration API |

**Critères d'acceptation (Étant donné / Quand / Alors)**
- **REQ-01**
  - **Étant donné** les 3 fichiers `opencode/agents/*.md`
  - **Quand** je lance `grep -n '^steps:' opencode/agents/*.md`
  - **Alors** les 3 agents affichent une valeur entière bornée (≤ 40 pour `lead-dev`, ≤ 25 pour les subagents)
- **REQ-03**
  - **Étant donné** `claude/agents/lead-dev.md`
  - **Quand** un utilisateur lance une session Claude avec `sonnet`
  - **Alors** le subagent `lead-dev` n'impose plus `opus` sans raison

**Edge cases**
- **EDGE-01** : Tâche légitimement longue atteignant 25 steps sur `ops-quality` → le sous-agent retourne son rapport partiel à `lead-dev` qui décide de relancer ou d'escalader (aligné sur la règle des 3 allers-retours).
- **EDGE-02** : Propriété frontmatter non supportée par une version d'outil → toujours vérifier la doc officielle avant ajout (règle `opencode-admin`).

**PWA / Offline** : Non applicable.

## 4. Structure & Contrats de fichiers
- OpenCode frontmatter : `steps: <int>` (clé documentée dans `opencode-admin/SKILL.md`).
- Claude Code frontmatter : `maxTurns: <int>`, `model: inherit | sonnet | opus | haiku`.
- `opencode/opencode.jsonc.new` : distinction `model` / `small_model`.

## 5. Autorisations & Sécurité
- **Maîtrise de la dépense** : empêche qu'un subagent bloqué consomme un budget illimité.
- **Données personnelles collectées** : Aucune.

## 6. Fichiers impactés
- `opencode/agents/lead-dev.md` [MODIFY]
- `opencode/agents/ops-quality.md` [MODIFY]
- `opencode/agents/integrations.md` [MODIFY]
- `claude/agents/lead-dev.md` [MODIFY]
- `claude/agents/ops-quality.md` [MODIFY]
- `claude/agents/integrations.md` [MODIFY]
- `opencode/opencode.jsonc.new` [MODIFY]
- `opencode/skills/shared-eco-tokens/assets/reference/model-selection.md` [MODIFY] (si alignement nécessaire)

## 7. Tâches d'exécution
- [x] **T1** — Vérifier les clés exactes `maxTurns` (Claude Code) et équivalent Antigravity via doc officielle (REQ-02, REQ-05)
- [x] **T2** — Ajouter `steps` / `maxTurns` sur les agents OpenCode & Claude (REQ-01, REQ-02)
- [x] **T3** — Corriger le routage modèle (`claude/agents/lead-dev.md` + `opencode/opencode.jsonc.new` + `~/.config/opencode/opencode.jsonc`) (REQ-03, REQ-04)
- [x] **T4** — Vérifier la syntaxe YAML + `./scripts/sync-skills.sh --local`
- [ ] **T5** — Validation & commit sémantique (`ops-quality`)
