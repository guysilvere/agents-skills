---
name: shared-graft
description: Indexation du code par graft (@nanonets/graft) — vérifier que le projet est indexé, interroger le graphe au lieu de grep/read, et rafraîchir l'index après des changements. Charger au début de toute session sur un projet existant, et après toute modification de code significative.
license: MIT
compatibility: opencode
metadata:
  audience: tous
  domain: productivite
---

# shared-graft

## Ce que je fais
- Garantit que le projet courant est **indexé** par graft, pour que les agents trouvent le code
  sans lire les fichiers entiers.
- Remplace `grep`/`read` par des requêtes au graphe : **une requête remplace plusieurs lectures**.
- Maintient l'index **à jour** après les changements de code.

## 1. Au démarrage — vérifier l'indexation

```bash
graft --version                 # le CLI est-il installé ?
ls graft/INDEX.md 2>/dev/null   # le projet est-il indexé ?
```

| Situation | Action |
| --- | --- |
| `graft` absent du PATH | ⛔ **STOP — notifier l'utilisateur et demander l'installation** (voir § 4). Ne pas improviser de substitut. |
| `graft` présent, pas de `graft/` | Proposer `graft build` (indexation initiale). |
| `graft/` présent | Utiliser le graphe (§ 2). Vérifier la fraîcheur (§ 3). |

## 2. Travailler avec le graphe — pas avec grep

> **Règle** : avant de chercher du code, interroger le graphe. `grep`/`read` ne servent qu'en
> repli, quand le graphe ne couvre pas le besoin.

| Besoin | Outil |
| --- | --- |
| Comprendre comment quelque chose marche | `graft ask "<question>" --source` |
| Trouver où vit un symbole | `graft ask` puis citer les spans `covers: fichier:ligne` |
| **Toutes** les occurrences (exhaustif) | `graft grep "<litteral>"` — `ask` est top-N, pas exhaustif |
| Surface d'API d'un fichier | `graft skeleton <fichier>` |
| Qui appelle quoi / rayon d'impact | `graft callers <symbole>` (`--direction out`, `--depth all`) |
| Orientation dans un repo inconnu | `graft map` |
| Naviguer | `graft/INDEX.md` liste tous les nœuds |

- **Citer les spans** `fichier:ligne` renvoyés par le graphe, et éditer directement depuis là.
- Si un span est tronqué (`+N more lines`), ouvrir **ce fichier à cette ligne précise** — jamais
  le fichier entier.
- En MCP, les outils équivalents sont `graft_find_code`, `graft_find_all`, `graft_trace_calls`,
  `graft_file_api`, `graft_repo_map`.

## 3. Maintenir l'index à jour

**Rafraîchir après tout changement de code significatif** — création/suppression de fichiers,
déplacement de symboles, refactoring. Pas besoin après une simple retouche de texte.

```bash
graft build          # déterministe, sans clé API, $0
```

- **Quand** : à la fin d'une fonctionnalité, avant de déléguer à `ops-quality`, et avant un commit
  qui touche la structure du code.
- **Pourquoi** : un index périmé fait répondre le graphe à côté — pire que pas d'index, parce que
  l'erreur est silencieuse.
- **Vérifier la fraîcheur** : comparer la date de `graft/INDEX.md` (ou `graft check-freshness`).
- ⚠️ **Depuis graft 0.19, `graft/` est un cache LOCAL** : le CLI l'ajoute lui-même au `.gitignore`.
  Ne pas le versionner — chaque poste lance `graft build` pour obtenir le sien. (Comportement
  différent de 0.12, où le dossier était versionné.)

## 4. Si graft n'est pas installé — notifier, ne pas contourner

⛔ **STOP — validation humaine requise.**

```
graft n'est pas installé sur cette machine.
L'indexation du projet est requise pour que les agents trouvent le code efficacement.
Installer ?  npm i -g @nanonets/graft
```

- **Ne jamais** installer un paquet global sans accord explicite.
- **Ne jamais** se rabattre silencieusement sur `grep` en faisant comme si de rien n'était :
  signaler la dégradation, puis continuer avec l'accord de l'utilisateur.
- Mettre à jour si une version plus récente existe : `npm i -g @nanonets/graft@latest`.

## 5. Nouveau projet — indexer dès le scaffold

Lors de la création d'un projet (`pwa-developpement`, phase de scaffold) :

1. Vérifier la présence de `graft` (§ 1).
2. Après le premier commit, lancer `graft build`.
3. Rien à ajouter au `.gitignore` : **graft 0.19+ s'y inscrit lui-même** (`graft/` est un cache local).

## Règles
- Le graphe **avant** grep/read. Toujours.
- Un index périmé est trompeur : le rafraîchir plutôt que s'en méfier.
- Pas d'installation silencieuse — notifier et demander.
- Toujours charger `shared-eco-tokens` en parallèle : interroger le graphe **est** une optimisation
  de tokens (une requête au lieu de plusieurs lectures).
