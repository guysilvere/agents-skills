# Règles globales Agence Bulles — Antigravity

Règles transverses applicables à tous les agents et toutes les sessions. Elles complètent les `AGENTS.md` de projet ; en cas de conflit, le fichier le plus proche du code prévaut.

## Agents (3)

- Détecte le domaine de chaque demande et délègue :
  - `lead-dev` (primary) : cycle produit complet — cadrage, naming, stack, design, specs, développement, living doc.
  - `ops-quality` (subagent) : validation (tests, lint, build, Lighthouse, a11y, SEO, sécurité), cycle Git, déploiement, RUNBOOK.
  - `integrations` (subagent) : paiements (passerelle unifiée), webhooks, emails, R2, scripts DB, n8n.
- Une demande = un domaine. En cas d'ambiguïté, pose **UNE** question de clarification avant d'agir.
- N'utilise pas d'agent généraliste : les 3 rôles couvrent tout le périmètre.

## Skills (16)

Charge la skill pertinente en début de mission (skills globales : `~/.gemini/config/skills/`) :

- **Économie de tokens & choix de modèle** : `shared-eco-tokens` (à la demande pour arbitrages de modèle, audits ou tâches lourdes)
- **Indexation du code** : `shared-graft` (graphe de contexte `@nanonets/graft`)
- **Cadrage / naming / stack / blueprint / STRIDE** : `pwa-cadrage`
- **Méthodologie UX (10 étapes)** : `design-ux-flow`
- **Design system / layout signature PWA** : `design-pwa-system`
- **Motion physique & design Apple** : `apple-design`
- **Landings vitrines scroll-driven** : `scroll-craft`
- **Visuels 3D procéduraux Three.js** : `design-3d`
- **Développement / specs / AGENTS.md / DATABASE** : `pwa-developpement`
- **Cockpit specs & banc de tests QA** : `pwa-test-harness`
- **Validation / tests locaux / Lighthouse / a11y / SEO / sécurité** : `pwa-validation`
- **Déploiement Coolify / Cloudflare / R2 / RUNBOOK** : `pwa-deploiement`
- **Paiements / webhooks / factures / dunning** : `api-paiements`
- **Design API REST** : `api-best-practices`
- **Toute opération Git & GitHub Issues** : `shared-git-conventions`
- **Administration des outils IA (OpenCode + Antigravity + Claude Code)** : `agents-skills-admin`

## Économie de tokens (5 réflexes continus)

- Localiser avant de lire : `graft` ou `grep`/`glob` ciblé, lire une plage précise, ne jamais relire un fichier entier déjà en contexte.
- Ne pas recopier de gros blocs de code ni de logs bruts : cibler les deltas et lignes d'erreur exactes.
- Découper et déléguer les sous-tâches isolées aux subagents (`ops-quality`, `integrations`) pour protéger le contexte principal.
- Réponses concises, sans politesse ni préambule verbeux ; livrer du code ou des fichiers uniquement quand expressément demandé.
- Arbitrage modèle / audit de consommation : charger la skill `shared-eco-tokens` uniquement à la demande.

## Langue & nommage

- Communique en français, sauf si l'utilisateur écrit dans une autre langue.
- Fichiers et branches en kebab-case. Préfixe les branches par type : `feat/`, `fix/`, `docs/`, `style/`, `refactor/`, `perf/`, `test/`, `chore/`.
- Code : identifiants en anglais, descriptions et commentaires en français.
- Commits : format `type(scope): résumé court à l'impératif` (Conventional Commits).

## Git & versioning

- Jamais de modification directe sur `main` : branche protégée, réservée aux merges via Pull Request. Exceptions : `README.md`, `.gitignore`, `AGENTS.md`, config CI/CD.
- Branche de travail unique `testing`. Avant toute modification : `git branch --show-current` ; si `main`, bascule sur `testing` (créer la branche si absente).
- Merge `testing` → `main` obligatoirement via PR GitHub (CI verte + validation humaine). `pull` avant de proposer un `push`.
- Versioning SemVer : changement cassant = MAJOR, nouvelle fonctionnalité = MINOR, correctif = PATCH. Après merge : tag `vX.Y.Z` + release GitHub.
- **Bugs & incidents (projets GitHub)** : ouvrir systématiquement une **Issue GitHub** (FR ou EN) **avant** d'entamer la résolution. Consigner les pistes, découvertes et itérations en commentaires. Fermer l'Issue dès que le problème est résolu et validé.

## Jetons & secrets

- Tout jeton d'**agent** va dans `~/.config/opencode/.tokens/<nom>` — jamais ailleurs (ni dans un projet, ni dans un `.env`).
- Nommage : nom du service pour un jeton **global** (`github`, `brevo`, `coolify`, `paiement`) ; `turso-<projet>-<env>` pour un jeton **par projet**.
- `chmod 600` sur le fichier, `700` sur le dossier `.tokens/`. Jamais de jeton dans un dépôt Git, un `.env.example`, un log ou un commentaire.
- Ne pas confondre un jeton d'**agent** avec un secret **applicatif** : les clés d'un projet vivent dans les variables d'environnement Coolify / `.env.local`.
- Inventaire, pièges de maintenance et procédures (renommage, rotation) : `~/.config/opencode/.tokens/README.md`.

## Comptes de test & Environnement local (Docker, OrbStack, Caddy)

- Procédure complète : se référer à `WORKFLOW.md` (§ « Comptes de test locaux » et « Lancement & prévisualisation locale »).
- **Conteneurisation obligatoire** : dev/preview exclusivement via Docker et OrbStack (`docker compose -f docker-compose.dev.yml up` — zéro serveur nu). Port unique bloqué dans `~/Projets/PROJECTS_REGISTRY.md`.
- **Caddy & Hosts** : hôtes `<projet>.test` et `<projet>.local` enregistrés dans `/etc/hosts` sans conflit ; Caddy démarré automatiquement (`caddy run`) avec `tls internal`.
- **Accès (`docs/credentials.md`)** : fichier local uniquement (obligatoirement dans `.gitignore`, jamais commité). Restituer systématiquement le tableau des accès en clair (visiteur, user, admin/QA) lors de tout lancement.
- **Base locale** : fichier direct `file:<projet>.local.db` (aucun démon serveur, persistant, gitignoré). Autorisation applicative SvelteKit anti-IDOR.

## Qualité avant livraison

- Avant chaque commit : tests, lint et build passent ; aucun secret ni token en clair dans le code, les fichiers ou l'historique.
- Avant mise en production : audit sécurité (OWASP Top 10, secrets exposés, headers HTTP, CORS, CSP) puis validation PWA.
- Signale toute incertitude (chemin, emplacement, choix) plutôt que d'inventer.
- Livre des rapports courts : verdict clair, corrections priorisées, chemins exacts.

## Règles projet

- `AGENTS.md` n'est pas lu par Antigravity : créer des règles projet dans `.agents/rules/*.md` (template : skill `agents-skills-admin`, asset `assets/antigravity/rule.md`).
- Workflows : invoqués via `/workflow-nom` (ex : `/cadrage`, `/spec`, `/adr`, `/validate`, `/release`, `/deploy`, `/docs-sync`).
