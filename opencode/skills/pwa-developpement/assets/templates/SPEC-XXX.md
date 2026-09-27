# [SPEC-XXX] [Nom de la fonctionnalité]

> **Statut** : DRAFT / APPROVED / IN_PROGRESS / DONE
> **Phase Roadmap** : [Phase 0–10 — voir WORKFLOW.md]
> **Agent(s)** : `lead-dev` → `ops-quality` → `integrations` (si paiements/intégrations)

---

## 1. Intent
**Problème** : [besoin métier concret, en une ou deux phrases]
**Objectif** : [résultat attendu / bénéfice mesurable]

## 2. User Story
En tant que **[Rôle]**, je veux **[action]**, afin de **[valeur]**.

## 3. Exigences

| ID | Exigence | Critère de fin (DoD) |
|----|----------|-----------------------|
| REQ-01 | [description] | [ ] [vérifiable] |
| REQ-02 | [description] | [ ] [vérifiable] |

**Critères d'acceptation (Étant donné / Quand / Alors)** — un par exigence testable.
> Un critère vérifiable se teste ; une case à cocher se discute.

- **REQ-01**
  - **Étant donné** [contexte, état initial]
  - **Quand** [action de l'utilisateur ou événement]
  - **Alors** [résultat observable, vérifiable]
- **REQ-02**
  - **Étant donné** …
  - **Quand** …
  - **Alors** …

**Edge cases**
- **EDGE-01** : [situation] → [comportement attendu]
- **EDGE-02** : [situation] → [comportement attendu]

**PWA / Offline** : [requis ou non — stratégie si requis]

## 4. Modèle de données & API
```json
{ "collection": "nom", "schema": [] }
```
- `POST /api/...` : [payload / usage]
- Webhooks : [événements écoutés/émis, signature, idempotence]

## 5. Autorisations — RBAC (obligatoire, anti-IDOR)

**Matrice par rôle** — qui a le droit, indépendamment de la ressource :

| Rôle | Périmètre | Peut |
|------|-----------|------|
| [anonyme] | | |
| [utilisateur] | ses propres données | lire, créer, modifier |
| [admin] | son organisation | + supprimer |
| [superadmin] | global | tout |

**Matrice par ressource** — le contrôle effectif, endpoint par endpoint :

| Ressource | Lire | Créer | Modifier | Supprimer |
|-----------|------|-------|----------|-----------|
| [collection] | [qui] | [qui] | [qui] | [qui] |

> « Aucune » est une réponse valide ; un blanc ne l'est pas.

- **Implémentation de l'autorisation** : [module/fonction — Turso n'a pas de RLS, tout est applicatif → reporter la ligne dans `docs/DATABASE.md`]
- **Données personnelles collectées** : [champs — justifier la minimisation]

## 6. Fichiers impactés
- `src/lib/server/...` [NEW/MODIFY]
- `backoffice/src/components/...` [NEW/MODIFY]
- `backoffice/src/services/...` [NEW/MODIFY]

## 7. Tâches d'exécution
- [ ] **T1** — Backend/schéma (REQ-01)
- [ ] **T2** — UI/composant (REQ-02)
- [ ] **T3** — Tests écrits (`lead-dev` : unitaires + intégration)
- [ ] **T4** — Build & lint (`ops-quality`)
- [ ] **T5** — Commit sémantique (`ops-quality`)

---
*Une fois DONE, ce fichier fait foi comme référence unique de la fonctionnalité.*
*DoD global : aucune spec ne passe à DONE sans « tests écrits et verts » — voir `WORKFLOW.md`.*
