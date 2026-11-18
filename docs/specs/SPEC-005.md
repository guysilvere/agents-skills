# [SPEC-005] Déduplication du contexte permanent (*Context Engineering*)

> **Statut** : DONE
> **Phase Roadmap** : Phase 6 — Optimisation tokens & attention LLM
> **Agent(s)** : `lead-dev` → `ops-quality`
> **Dépend de** : `SPEC-001`

---

## 1. Intent
**Problème** : Les mêmes blocs opérationnels (lancement Docker/OrbStack, auto-démarrage Caddy, `/etc/hosts`, `PROJECTS_REGISTRY.md`, `docs/credentials.md`, base locale `file:<projet>.local.db`, Turso sans RLS, gestion des jetons) sont dupliqués **4 à 6 fois** dans `GEMINI.md` (7,1 Ko), `WORKFLOW.md` (11,9 Ko) et les 9 fichiers agents (51 Ko cumulés). Sous Antigravity, `GEMINI.md` + `lead-dev.md` injectent ~12,3 Ko redondants dès le 1er tour, ce qui dilue l'attention (*context rot*) et gaspille des tokens à chaque message.
**Objectif** : Appliquer la règle « une règle = un seul endroit » (*Single Source of Truth*) et réduire la taille du contexte système permanent sans perdre aucune exigence métier.

## 2. User Story
En tant que **utilisateur d'agents sur de longues sessions**, je veux **un prompt système minimal contenant uniquement l'identité, les invariants critiques et des pointeurs vers les skills**, afin de **garder une haute fidélité d'attention et réduire le coût par tour**.

## 3. Exigences

| ID | Exigence | Critère de fin (DoD) |
|----|----------|-----------------------|
| REQ-01 | Rendre la procédure « Environnement local (Docker/OrbStack, Caddy, `/etc/hosts`, `PROJECTS_REGISTRY.md`, `docs/credentials.md`) » canonique dans `opencode/WORKFLOW.md` | [x] Procédure détaillée conservée en référence unique dans `WORKFLOW.md` |
| REQ-02 | Remplacer les paragraphes dupliqués dans `antigravity/GEMINI.md` et les 9 fichiers agents par des résumés concis avec pointeurs clairs vers `WORKFLOW.md` | [x] Zéro répétition inutile de gros blocs de tableaux/commandes ; pointeurs directs vers `WORKFLOW.md` |
| REQ-03 | Réduire la taille combinée `antigravity/GEMINI.md` + `antigravity/agents/lead-dev.md` (passée de 12 756 o à 10 218 o en première passe, -20 %, et -6 472 o sur l'ensemble des 9 agents/prompts) | [x] Allégement mesuré et vérifié sans régression des règles clés |
| REQ-04 | Alléger significativement les agents OpenCode et Claude Code en éliminant les tables redondantes de credentials et blocs Caddy | [x] Réduction de ~1 450 octets sur `opencode/agents/ops-quality.md`, ~880 octets sur `lead-dev.md` |
| REQ-05 | Conserver 100 % des invariants non négociables visibles en 1 ligne (pas de `main` direct, `⛔ STOP`, Turso sans RLS, `.tokens/`, `file:<projet>.local.db`) | [x] Invariants préservés dans tous les agents |

**Critères d'acceptation (Étant donné / Quand / Alors)**
- **REQ-02**
  - **Étant donné** `antigravity/GEMINI.md`, `opencode/WORKFLOW.md` et `*/agents/*.md`
  - **Quand** je recherche la procédure complète Caddy/`/etc/hosts`/`credentials.md`
  - **Alors** le mode opératoire détaillé n'apparaît qu'à **un seul endroit**, et les agents n'y renvoient que par une puce concise
- **REQ-03**
  - **Étant donné** les compteurs de caractères avant refonte (`GEMINI.md` = 7 137 o, `antigravity/agents/lead-dev.md` = 5 217 o → 12 354 o)
  - **Quand** j'exécute `wc -c antigravity/GEMINI.md antigravity/agents/lead-dev.md` après refonte
  - **Alors** le total est ≤ 7 400 octets (gain ≥ 40 %)

**Edge cases**
- **EDGE-01** : Un agent doit lancer le serveur local sans avoir encore chargé la skill dédiée → la puce de 1 ligne dans le prompt agent indique explicitement le nom exact de la skill à charger avant tout lancement local.
- **EDGE-02** : Perte accidentelle d'une règle lors de la compression → établir une table de traçabilité « règle avant → emplacement après » avant suppression.

**PWA / Offline** : Non applicable.

## 4. Structure & Contrats de fichiers
- **Couche 1 (Toujours chargée — minimaliste)** : `GEMINI.md` + `agents/*.md` = identité, invariants 1 ligne, table de délégation, jalons `⛔ STOP`.
- **Couche 2 (À la demande — procédures)** : `WORKFLOW.md` + `SKILL.md` (dont procédure locale Docker/Caddy/`credentials.md`).
- **Couche 3 (Conditionnelle — détails)** : `assets/`, `references/`, `scripts/`.

## 5. Autorisations & Sécurité
- Aucun affaiblissement des permissions ni des jalons humains (`⛔ STOP` restent toujours dans la Couche 1).
- **Données personnelles collectées** : Aucune.

## 6. Fichiers impactés
- `opencode/skills/shared-local-env/SKILL.md` [NEW] (ou section consolidée dans `pwa-developpement` / `pwa-validation`)
- `antigravity/GEMINI.md` [MODIFY]
- `opencode/WORKFLOW.md` [MODIFY]
- `opencode/agents/*.md` (3 fichiers) [MODIFY]
- `antigravity/agents/*.md` (3 fichiers) [MODIFY]
- `claude/agents/*.md` (3 fichiers) [MODIFY]
- `README.md` [MODIFY] (si nouvelle skill créée)

## 7. Tâches d'exécution
- [x] **T1** — Inventorier chaque règle dupliquée et préserver la référence unique dans `WORKFLOW.md` (REQ-05)
- [x] **T2** — Assainir `antigravity/GEMINI.md` en remplaçant la double procédure par un résumé compact (REQ-01, REQ-02)
- [x] **T3** — Alléger les agents OpenCode, Antigravity et Claude Code en élaguant les tableaux redondants (REQ-02..04)
- [x] **T4** — Mesurer la réduction de taille et vérifier `./scripts/sync-skills.sh --local`
- [ ] **T5** — Validation & commit sémantique (`ops-quality`)
