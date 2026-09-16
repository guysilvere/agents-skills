# WORKFLOW — référence unique (phases 0–10)

> Charger à la demande. Les 3 agents renvoient ici : ne pas dupliquer ce contenu ailleurs.

## Phases

| Phase | Nom | Livrable | Agent |
| --- | --- | --- | --- |
| 0 | Cadrage | `docs/CADRAGE.md` | `lead-dev` |
| 1 | Naming | nom validé + repo GitHub | `lead-dev` |
| 2 | Stack | `docs/BLUEPRINT.md` | `lead-dev` |
| 3 | Design | `docs/DESIGN_SYSTEM.md` | `lead-dev` |
| 4 | Données | `docs/DATABASE.md` | `lead-dev` |
| 5 | Specs | `docs/specs/SPEC-XXX.md` | `lead-dev` |
| 6 | Développement | code + tests | `lead-dev` (+ `integrations` si externe) |
| 7 | Validation | rapport de validation | `ops-quality` |
| 8 | Déploiement | `docs/RUNBOOK.md` | `ops-quality` |
| 9 | SEO / contenu | landing, métadonnées, JSON-LD | `lead-dev` |
| 10 | Living doc & release | docs à jour + tag | `lead-dev` → `ops-quality` |

## Jalons humains (STOP — validation explicite obligatoire)

Aucune action ci-dessous sans un « oui » humain explicite, **quel que soit l'agent** :

- fin de phase 0 (cadrage), phase 2 (stack), phase 4 (schéma de données) ;
- toute spec touchant au paiement, avant implémentation ;
- merge vers `main`, tag et release ;
- déploiement staging et production ;
- migration de schéma sur une base non locale ;
- tout appel à une API de paiement hors sandbox ;
- toute suppression : branche distante, release, bucket, données.

Format d'arrêt attendu : `⛔ STOP — validation humaine requise : <action> / <raison>`.

## Qui écrit les tests

| Périmètre | Écrit | Exécute / juge |
| --- | --- | --- |
| Fonctionnalités | `lead-dev` | `ops-quality` |
| Intégrations (paiement, webhooks, emails) | `integrations` | `ops-quality` |
| Couverture | — | `ops-quality` |

- **DoD** : aucune spec ne passe à DONE sans « tests écrits et verts ».
- `lead-dev` lance lint + typecheck + tests rapides **avant** de déléguer à `ops-quality`.
- `ops-quality` ne corrige pas : il rapporte.

## Format de relais entre agents

```
Spec      : SPEC-XXX (ou « hors spec »)
Fichiers  : <liste des fichiers modifiés>
Commandes : <commandes lancées>
Résultat  : ✅ / ⚠️ / ⛔ + preuve (sortie, score, capture)
Bloquants : <liste priorisée, vide si aucun>
```

- **3 allers-retours maximum** `lead-dev` ↔ `ops-quality` sur un même point.
- Au-delà : escalade humaine (ne pas boucler).

## Rapport `ops-quality` (format fixe)

| Étape | Statut | Preuve |
| --- | --- | --- |
| lint / typecheck | ✅ ⚠️ ⛔ | commande + sortie |
| tests | ✅ ⚠️ ⛔ | nombre passés / échoués |
| build | ✅ ⚠️ ⛔ | taille des bundles |
| Lighthouse | ✅ ⚠️ ⛔ | scores + TBT |
| a11y / SEO / sécurité | ✅ ⚠️ ⛔ | points relevés |

## Ajouter une nouvelle skill

1. Créer `~/.config/opencode/skills/<nom>/SKILL.md` — frontmatter `name` (= nom du dossier) + `description` (ce que fait la skill **et quand la déclencher)**, section `## Assets`.
2. L'invoquer : `skill <nom>`.
3. Aucune modification d'agent : la permission `skill: allow` rend toute skill disponible aux 3 agents.

> Toute `description` contenant ` : ` doit être reformulée en ` — ` sinon le frontmatter YAML est invalide et l'agent/skill ne charge pas.
