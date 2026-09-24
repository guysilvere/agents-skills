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

## Indexation du code (graft)

- **Au démarrage** sur un projet existant : vérifier `graft --version` et `graft/INDEX.md`.
- **`graft` absent** → ⛔ notifier l'utilisateur et **demander l'installation** (`npm i -g @nanonets/graft`). Ne jamais installer un paquet global sans accord, ni se rabattre silencieusement sur `grep`.
- **`graft` présent** → **interroger le graphe avant tout `grep`/`read`** : `graft ask` (comprendre), `graft grep` (exhaustif), `graft skeleton` (surface d'API), `graft callers` (impact), `graft map` (orientation).
- **Rafraîchir** (`graft build`, déterministe, $0) après tout changement de code significatif — fin de fonctionnalité, avant de déléguer à `ops-quality`, avant un commit structurel.
- Un index **périmé est trompeur** : il fait répondre le graphe à côté, silencieusement. Le rafraîchir plutôt que s'en méfier.
- `graft/` est versionné dans les projets ; `graft/.cache/` est ignoré.
- Détail : skill `shared-graft`.

## Jetons & secrets d'agent

- **Emplacement unique** : tout jeton d'agent va dans `~/.config/opencode/.tokens/<nom>` — jamais ailleurs.
- **Nommage** :
  - jeton **global** (sert tous les projets) → nom du service, sans préfixe : `github`, `brevo`, `coolify` ;
  - jeton **par projet** → `turso-<projet>-<env>` (ex. `turso-lodgi-prod`, `turso-brvm-radar-test`) ;
  - **service multi-valeurs** → un fichier par valeur, suffixé : `<service>-key` / `<service>-secret` (ex. `geniuspay-key`, `geniuspay-secret`). Jamais de fichier à plusieurs lignes : un jeton = un fichier.
- **Vérifier l'environnement avant tout appel** : un jeton de paiement `pk_live_`/`sk_live_` manipule de l'argent réel → jalon humain. Tester en `sandbox` d'abord.
- **Portée** : un jeton global est déclaré une fois dans `opencode/mcp.servers.json` (`{{TOKEN:<nom>}}`) et synchronisé. Un jeton de projet n'y figure **pas** : il se gère à la main.
- **Permissions** : `chmod 600` sur le fichier, `700` sur le dossier `.tokens/`.
- **Jamais** de jeton dans un dépôt Git, un `.env.example`, un log ou un commentaire.
- **Ne pas confondre** : un jeton d'**agent** (ce dossier) n'est pas un secret **applicatif** (clés d'un projet → variables d'environnement Coolify / `.env.local`).
- **Renommer un jeton global** = renommer le fichier **et** le `{{TOKEN:<nom>}}` de `mcp.servers.json`, puis resynchroniser.
- Inventaire complet, pièges de maintenance et procédures de rotation : `~/.config/opencode/.tokens/README.md`.

> `.tokens/` est en **`deny` de lecture** pour les agents OpenCode : toute opération dessus est manuelle.

## Ajouter une nouvelle skill

1. Créer `~/.config/opencode/skills/<nom>/SKILL.md` — frontmatter `name` (= nom du dossier) + `description` (ce que fait la skill **et quand la déclencher)**, section `## Assets`.
2. L'invoquer : `skill <nom>`.
3. Aucune modification d'agent : la permission `skill: allow` rend toute skill disponible aux 3 agents.

> Toute `description` contenant ` : ` doit être reformulée en ` — ` sinon le frontmatter YAML est invalide et l'agent/skill ne charge pas.
