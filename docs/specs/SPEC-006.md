# [SPEC-006] Suppression du paradoxe `shared-eco-tokens`

> **Statut** : DONE
> **Phase Roadmap** : Phase 6 — Optimisation tokens (progressive disclosure)
> **Agent(s)** : `lead-dev` → `ops-quality`
> **Dépend de** : `SPEC-005`

---

## 1. Intent
**Problème** : Tous les agents imposent aujourd'hui « Charge la skill `shared-eco-tokens` en début de session ». Or une skill chargée dans **100 % des sessions** viole le principe même de *progressive disclosure* : elle consomme 1 appel `read_file` + 1 tour complet LLM + 2 Ko au démarrage de chaque conversation, ce qui coûte plus de tokens que ce qu'elle économise sur les tâches courtes.
**Objectif** : Intégrer les 5 réflexes essentiels d'économie de tokens directement dans les règles globales (zéro appel d'outil au démarrage) et recentrer `shared-eco-tokens` sur son rôle de référence à la demande (choix de modèle, audit de session longue, prompts templates).

## 2. User Story
En tant que **utilisateur ouvrant des sessions rapides et fréquentes**, je veux **que les réflexes d'économie de tokens s'appliquent immédiatement sans lecture de fichier obligatoire au tour 1**, afin de **gagner en latence et d'économiser 1 tour d'inférence à chaque session**.

## 3. Exigences

| ID | Exigence | Critère de fin (DoD) |
|----|----------|-----------------------|
| REQ-01 | Résumer le cœur de `shared-eco-tokens` en ≤ 5 puces ultra-courtes (~300 car.) dans `antigravity/GEMINI.md` et `opencode/WORKFLOW.md` | [x] 5 puces intégrées en tête des règles globales |
| REQ-02 | Retirer l'injonction « Charge `shared-eco-tokens` en début de session » des 9 agents (`opencode/`, `antigravity/`, `claude/`) et retirer `skills/shared-eco-tokens` du préchargement `skills:` dans `antigravity/agents/*.md` | [x] Zéro chargement forcé au tour 1, préchargement retiré |
| REQ-03 | Mettre à jour la `description` et le corps de `opencode/skills/shared-eco-tokens/SKILL.md` pour un déclenchement **à la demande** (sélection de modèle, optimisation de coût sur tâche longue/batch, audit de consommation) | [x] Description CSO claire et corps repositionné en référence ponctuelle |

**Critères d'acceptation (Étant donné / Quand / Alors)**
- **REQ-02**
  - **Étant donné** une nouvelle session sur une tâche simple (ex : question courte ou micro-fix)
  - **Quand** l'agent reçoit le premier message utilisateur
  - **Alors** il n'exécute pas de `read_file` sur `shared-eco-tokens/SKILL.md` au tour 1, tout en respectant la concision et la localisation avant lecture
- **REQ-03**
  - **Étant donné** une demande de choix de modèle ou d'optimisation de coût d'un workflow lourd
  - **Quand** l'utilisateur pose la question
  - **Alors** l'agent charge `shared-eco-tokens` et son asset `model-selection.md` à la demande

**Edge cases**
- **EDGE-01** : Références à « charger `shared-eco-tokens` au début » dans d'autres skills ou workflows (`antigravity/workflows/*.md`, `opencode/commands/*.md`) → vérifier via `grep -rn "shared-eco-tokens"` et nettoyer les doublons.

**PWA / Offline** : Non applicable.

## 4. Structure & Contrats de fichiers
- 5 puces globales (cible ~300 car.) : localiser avant de lire (`graft`/grep), ne pas relire/recopier, déléguer les tâches isolées aux subagents, réponses concises, choisir le chemin le moins coûteux.
- `opencode/skills/shared-eco-tokens/SKILL.md` : skill à la demande + `assets/reference/model-selection.md`.

## 5. Autorisations & Sécurité
- Aucun impact sécurité.
- **Données personnelles collectées** : Aucune.

## 6. Fichiers impactés
- `antigravity/GEMINI.md` [MODIFY]
- `opencode/WORKFLOW.md` [MODIFY]
- `opencode/skills/shared-eco-tokens/SKILL.md` [MODIFY]
- `opencode/agents/*.md`, `antigravity/agents/*.md`, `claude/agents/*.md` [MODIFY]
- `README.md` [MODIFY] (retirer « toujours chargée »)

## 7. Tâches d'exécution
- [x] **T1** — Auditer toutes les occurrences de `shared-eco-tokens` dans le dépôt (`grep -rn`)
- [x] **T2** — Intégrer les 5 puces globales et retirer le chargement forcé des agents et des skills (REQ-01, REQ-02)
- [x] **T3** — Recadrer `opencode/skills/shared-eco-tokens/SKILL.md` en skill à la demande (REQ-03)
- [x] **T4** — Vérifier `./scripts/sync-skills.sh --local`
- [ ] **T5** — Validation & commit sémantique (`ops-quality`)
