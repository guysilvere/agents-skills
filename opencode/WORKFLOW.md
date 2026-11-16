# WORKFLOW — référence unique (phases 0–10)

> Charger à la demande. Les 3 agents renvoient ici : ne pas dupliquer ce contenu ailleurs.

## Phases

| Phase | Nom | Livrable | Agent |
| --- | --- | --- | --- |
| 0 | Cadrage | `docs/CADRAGE.md` | `lead-dev` |
| 1 | Naming | nom validé + repo GitHub | `lead-dev` |
| 2 | Stack | `docs/BLUEPRINT.md` | `lead-dev` |
| 3 | Design | `docs/DESIGN_SYSTEM.md` | `lead-dev` |
| 4 | Données | `docs/DATABASE.md` + schéma harness | `lead-dev` |
| 5 | Specs & Cockpit QA | `docs/specs/SPEC-XXX.md` + `/admin/specs` & `/admin/test` (Kanban/QA) | `lead-dev` |
| 6 | Développement | code fonctionnel guidé par tests au vert | `lead-dev` (+ `integrations` si externe) |
| 7 | Validation | banc `/admin/test` validé + rapport ops | `ops-quality` |
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

## Gestion des bugs & incidents (GitHub Issues)

Sur tout projet hébergé sur GitHub :
- **Issue obligatoire avant résolution** : tout bug, régression ou problème technique doit impérativement faire l'objet d'une **Issue GitHub** (en français ou en anglais) **avant** d'entamer sa résolution.
- **Traçabilité & itérations** : consigner en commentaires de l'Issue les pistes investiguées, les résultats intermédiaires, les obstacles rencontrés et le parcours de résolution.
- **Clôture après résolution** : une fois le problème résolu et validé par les tests, fermer l'Issue avec un commentaire de synthèse ou via le mot-clé de liaison de la PR (`Fixes #<id>` ou `Closes #<id>`).
- Outils : MCP GitHub (`issue_write`, `add_issue_comment`) ou CLI `gh` (`gh issue create`, `gh issue comment`, `gh issue close`).

## Comptes de test locaux & accès (docs/credentials.md)

Lors de la création d'un SaaS et tout au long du développement :
- **Mêmes comptes de test en local** : utiliser impérativement les mêmes comptes de test locaux (visiteur, utilisateur standard, admin/QA) tout au long du cycle de vie du projet, synchronisés avec les seeders `scripts/seed`.
- **Création dès le départ (`docs/credentials.md`)** : dès la phase d'initialisation/scaffold, créer obligatoirement le fichier `docs/credentials.md` (template `credentials.md`) listant tous les accès pour l'application (URL `.test`, rôles, login/email et mot de passe en clair).
- **Fichier local uniquement — JAMAIS commité** : `docs/credentials.md` est un fichier local uniquement et **ne doit jamais être commité**. Il doit être inscrit obligatoirement dans le `.gitignore` du projet dès l'initialisation.
- **Référence systématique** : à chaque fois que les accès sont demandés pour une tâche (lancement dev, preview, tests QA, validation), se référer obligatoirement à ce fichier.
- **Création & maintenance continue** : si `docs/credentials.md` n'existe pas lors d'une tâche, **le créer immédiatement et le maintenir**. Le mettre à jour à chaque modification d'accès (ajout d'accès, suppression d'accès, modification de mot de passe).

## Lancement & prévisualisation locale (Docker, OrbStack & Caddy)

- **Conteneurisation obligatoire via OrbStack** : pour voir, exécuter ou tester l'application ou le SaaS en local, toujours démarrer l'environnement via **Docker et OrbStack** :
  ```bash
  docker compose -f docker-compose.dev.yml up
  ```
- **Zéro serveur nu sur la machine hôte** : ne jamais exécuter un serveur de dev directement sur l'hôte sans conteneurisation dès qu'il s'agit de voir ou tester le site.
- **Auto-démarrage forcé de Caddy** : dès qu'une prévisualisation ou un accès local est demandé, vérifier la présence du démon Caddy (`pgrep -f caddy`). S'il n'est pas actif, le démarrer automatiquement en arrière-plan (`caddy run --config ~/.config/caddy/Caddyfile &`).
- **Vérification et assainissement préalable de `/etc/hosts`** : avant tout lancement local, inspecter obligatoirement `/etc/hosts` pour s'assurer que les domaines locaux du projet (`<projet>.test`, `<projet>.local`, etc.) sont bien configurés vers `127.0.0.1` et `::1`. Si un host n'est pas enregistré, l'ajouter et vérifier que `/etc/hosts` est exempt d'erreurs, de lignes orphelines ou de conflits.
- **Création du site local Caddy (.test / .local)** : si le domaine `<projet>.test` (et son alias `<projet>.local`) n'est pas encore présent dans `~/.config/caddy/Caddyfile`, créer automatiquement le bloc avec `tls internal` et `reverse_proxy localhost:<PORT_RESERVE>`, puis appliquer via `caddy reload --config ~/.config/caddy/Caddyfile`.
- **Répertoire central des ports anti-doublon (`~/Projets/PROJECTS_REGISTRY.md`)** :
  - Emplacement unique et partagé : `~/Projets/PROJECTS_REGISTRY.md` (aucun fichier isolé par projet).
  - Tout projet réserve obligatoirement son port hôte unique dans ce registre avant configuration Docker/Caddy pour garantir l'absence totale de chevauchement de ports.

## Indexation du code (graft)

- **Au démarrage** sur un projet existant : vérifier `graft --version` et `graft/INDEX.md`.
- **`graft` absent** → ⛔ notifier l'utilisateur et **demander l'installation** (`npm i -g @nanonets/graft`). Ne jamais installer un paquet global sans accord, ni se rabattre silencieusement sur `grep`.
- **`graft` présent** → **interroger le graphe avant tout `grep`/`read`** : `graft ask` (comprendre), `graft grep` (exhaustif), `graft skeleton` (surface d'API), `graft callers` (impact), `graft map` (orientation).
- **Rafraîchir** (`graft build`, déterministe, $0) après tout changement de code significatif — fin de fonctionnalité, avant de déléguer à `ops-quality`, avant un commit structurel.
- Un index **périmé est trompeur** : il fait répondre le graphe à côté, silencieusement. Le rafraîchir plutôt que s'en méfier.
- ⚠️ Depuis **graft 0.19**, `graft/` est un **cache local** : le CLI l'ajoute lui-même au `.gitignore`. Ne pas le versionner — chaque poste lance `graft build`.
- Détail : skill `shared-graft`.

## Serveurs MCP — activer / désactiver

- **Source de vérité unique** : `opencode/mcp.servers.json`. Ne jamais éditer les configs cibles à la main.
- **Activer un serveur désactivé** : passer `enabled` à `true` dans la source, puis `./scripts/sync-skills.sh --local`.
- **Un serveur désactivé se déclare différemment selon la cible** — comportement à connaître :
  - **OpenCode** → déclaré avec `enabled: false` (visible en `opencode mcp list`, non chargé) ;
  - **Antigravity** → déclaré avec `disabled: true` ;
  - **Claude** → **absent** : le script le retire (`claude mcp remove`) tant qu'il est désactivé, et le réenregistre à l'activation. Claude n'a pas d'état « désactivé » en scope user.
- **Pourquoi désactiver plutôt que supprimer** : un serveur `enabled: false` reste déclaré, documenté et réactivable en une ligne — et surtout ses **schémas d'outils ne sont pas chargés** dans le contexte de chaque session. C'est le levier principal d'économie de tokens sur les serveurs verbeux.

## Jetons & secrets d'agent

- **Emplacement unique** : tout jeton d'agent va dans `~/.config/opencode/.tokens/<nom>` — jamais ailleurs.
- **Nommage** :
  - jeton **global** (sert tous les projets) → nom du service, sans préfixe : `github`, `brevo`, `coolify` ;
  - jeton **par projet** → `turso-<projet>-<env>` (ex. `turso-lodgi-prod`, `turso-brvm-radar-test`) ;
  - **service multi-valeurs** → un fichier par valeur, suffixé : `<service>-key` / `<service>-secret` (ex. `paiement-key`, `paiement-secret`). Jamais de fichier à plusieurs lignes : un jeton = un fichier.
- **Vérifier l'environnement avant tout appel** : un jeton de paiement `pk_live_`/`sk_live_` manipule de l'argent réel → jalon humain. Tester en `sandbox` d'abord.
- **Portée** : un jeton global est déclaré une fois dans `opencode/mcp.servers.json` (`{{TOKEN:<nom>}}`) et synchronisé. Un jeton de projet n'y figure **pas** : il se gère à la main.
- **Permissions** : `chmod 600` sur le fichier, `700` sur le dossier `.tokens/`.
- **Jamais** de jeton dans un dépôt Git, un `.env.example`, un log ou un commentaire.
- **Ne pas confondre** : un jeton d'**agent** (ce dossier) n'est pas un secret **applicatif** (clés d'un projet → variables d'environnement Coolify / `.env.local`).
- **Renommer un jeton global** = renommer le fichier **et** le `{{TOKEN:<nom>}}` de `mcp.servers.json`, puis resynchroniser.
- **Roter un jeton** ne suffit pas à le mettre en service partout :
  - **OpenCode** lit `{file:…}` **à chaque appel** → effet immédiat ;
  - **Claude** lit `${MCP_<NOM>_TOKEN}`, peuplé par `scripts/export-mcp-tokens.sh` **au démarrage du shell** → il faut **re-sourcer le script ou ouvrir un nouveau terminal**, sinon Claude garde l'ancien jeton et échoue en 401 sans que le fichier soit en cause ;
  - **Antigravity** reçoit le jeton **injecté en clair** → nécessite une resynchronisation.
  - Symptôme typique : le même jeton fonctionne dans un outil et pas dans l'autre.
- Inventaire complet, pièges de maintenance et procédures de rotation : `~/.config/opencode/.tokens/README.md`.

> `.tokens/` est en **`deny` de lecture** pour les agents OpenCode : toute opération dessus est manuelle.

## Ajouter une nouvelle skill

1. Créer `~/.config/opencode/skills/<nom>/SKILL.md` — frontmatter `name` (= nom du dossier) + `description` (ce que fait la skill **et quand la déclencher)**, section `## Assets`.
2. L'invoquer : `skill <nom>`.
3. Aucune modification d'agent : la permission `skill: allow` rend toute skill disponible aux 3 agents.

> Toute `description` contenant ` : ` doit être reformulée en ` — ` sinon le frontmatter YAML est invalide et l'agent/skill ne charge pas.
