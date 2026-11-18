# [SPEC-008] Optimisation CSO des descriptions & frontières des 5 skills design

> **Statut** : DONE
> **Phase Roadmap** : Phase 6 — Qualité de déclenchement des skills (Discovery Layer)
> **Agent(s)** : `lead-dev` → `ops-quality`
> **Dépend de** : `SPEC-007`

---

## 1. Intent
**Problème** : Cinq skills couvrent le domaine design (`design-ux-flow`, `design-pwa-system`, `apple-design`, `scroll-craft`, `design-3d`). Sans clauses explicites d'exclusion mutuelle ni mots-clés déclencheurs différenciés dans leur `description` YAML (*Claude Search Optimization* — CSO), un agent qui conçoit une interface risque soit de charger 3 à 4 skills en même temps (explosion de tokens), soit de déclencher la mauvaise skill (ex : `scroll-craft` sur un dashboard SaaS).
**Objectif** : Rendre le routage par `description` YAML chirurgical, sans chevauchement ni faux positifs, sur les 5 skills design et l'ensemble du catalogue.

## 2. User Story
En tant que **agent évaluant le catalogue de skills au démarrage**, je veux **des descriptions YAML précises avec verbes déclencheurs et frontières explicites (« utiliser pour X ; pour Y voir Z »)**, afin de **charger exactement la seule skill pertinente du premier coup**.

## 3. Exigences

| ID | Exigence | Critère de fin (DoD) |
|----|----------|-----------------------|
| REQ-01 | Établir une matrice de routage non recouvrante des 5 skills design (`UX/parcours` → `design-ux-flow`, `UI/tokens/composants SaaS` → `design-pwa-system`, `gestes/springs/motion tactile` → `apple-design`, `landing vitrine scroll-driven` → `scroll-craft`, `scène/objet 3D Three.js` → `design-3d`) | [x] Matrice établie et intégrée dans les descriptions YAML |
| REQ-02 | Réécrire la `description` YAML des 5 skills design avec : (a) 3e personne, (b) mots-clés/fichiers déclencheurs concrets, (c) clause négative / renvoi vers la skill voisine, (d) ≤ 500 car., zéro ` : ` ni `< >` | [x] 5 frontmatters réécrits et validés |
| REQ-03 | Auditer les `description` des 11 autres skills pour vérifier la présence d'un déclencheur clair (« Utiliser quand… ») et l'absence de chevauchement (ex : `api-paiements` vs `api-best-practices`, `pwa-validation` vs `pwa-test-harness`) | [x] 100 % des 16 skills auditées (toutes ≤ 445 car., zéro chevron, zéro colon cassant) |
| REQ-04 | Mettre à jour `opencode-admin/assets/checklists/skill-validation.md` pour inclure les règles CSO (triggers + clauses d'exclusion + zéro `< >`) | [x] Checklist enrichie avec les critères CSO |

**Critères d'acceptation (Étant donné / Quand / Alors)**
- **REQ-02**
  - **Étant donné** une demande utilisateur : « Conçois le dashboard mobile et les tokens couleurs de mon SaaS »
  - **Quand** l'agent lit uniquement les `description` YAML du catalogue
  - **Alors** seule `design-pwa-system` correspond clairement (`scroll-craft` s'exclut explicitement hors landing vitrine, `design-3d` s'exclut hors scène Three.js)
- **REQ-03**
  - **Étant donné** toutes les skills dans `opencode/skills/*/SKILL.md`
  - **Quand** un parser YAML charge chaque frontmatter
  - **Alors** 100 % sont valides, ≤ 1024 car. (cible ≤ 500 car.), sans `<`, `>`, ni ` : ` non échappé

**Edge cases**
- **EDGE-01** : Une landing page combine `scroll-craft` + un objet 3D `design-3d` → la clause de `design-3d` autorise la composition explicite quand un visuel 3D est demandé en complément.
- **EDGE-02** : Description trop longue qui gonfle le catalogue chargé dans *toutes* les sessions → viser **200 à 400 caractères** par skill (total catalogue 16 skills ≤ 6 Ko).

**PWA / Offline** : Non applicable.

## 4. Structure & Contrats de fichiers
- Format cible `description` YAML :
  `<Ce que fait la skill>. Utiliser quand <triggers / mots-clés / livrables>. Ne pas utiliser pour <cas voisin> (voir <autre-skill>).`

## 5. Autorisations & Sécurité
- Interdiction stricte des chevrons `<` et `>` dans les frontmatters YAML (prévention injection dans le prompt catalogue — bonne pratique Anthropic).
- **Données personnelles collectées** : Aucune.

## 6. Fichiers impactés
- `opencode/skills/design-ux-flow/SKILL.md` [MODIFY]
- `opencode/skills/design-pwa-system/SKILL.md` [MODIFY]
- `opencode/skills/apple-design/SKILL.md` [MODIFY]
- `opencode/skills/scroll-craft/SKILL.md` [MODIFY]
- `opencode/skills/design-3d/SKILL.md` [MODIFY]
- `opencode/skills/{api-best-practices,api-paiements,pwa-validation,pwa-test-harness}/SKILL.md` [MODIFY] (si chevauchement détecté)
- `opencode/skills/opencode-admin/assets/checklists/skill-validation.md` [MODIFY]

## 7. Tâches d'exécution
- [x] **T1** — Rédiger la matrice de frontières des 5 skills design + paires proches (`api-*`, `pwa-validation`/`pwa-test-harness`) (REQ-01)
- [x] **T2** — Réécrire les `description` YAML conformes CSO et vérifier les budgets de caractères (REQ-02, REQ-03)
- [x] **T3** — Mettre à jour `skill-validation.md` (REQ-04)
- [x] **T4** — Valider le parsing YAML de tous les `SKILL.md` + `./scripts/sync-skills.sh --local`
- [ ] **T5** — Validation & commit sémantique (`ops-quality`)
