---
name: pwa-test-harness
description: Cockpit de développement, spécifications vivantes et banc de tests QA pour PWA Agence Bulles — affichage Kanban et Liste des specs/tâches, scénarios de test interactifs, persistance Turso/SQLite, synchronisation Markdown docs/specs/, accès Super Admin strict. À initialiser dès le début de chaque projet avant le code métier.
license: MIT
compatibility: opencode
metadata:
  audience: lead-dev
  domain: architecture
---

# pwa-test-harness

## Ce que je fais
- Initialise et pilote le cockpit de développement (`/admin/specs` et `/admin/test` ou route combinée `/admin/harness`).
- Double affichage des spécifications et tâches : **vue Kanban** (colonnes de workflow) et **vue Liste** tabulaire filtrable.
- Banc d'essai QA interactif : formulaires de simulation, exécution de tests, marqueurs d'état à un clic (`PASS`, `FAIL`, `TODO`), journalisation des bugs.
- Persistance et historisation des campagnes de test en base Turso (libSQL) / SQLite.
- Synchronisation bidirectionnelle avec les specs Markdown (`docs/specs/*.md`).

## Règle d'initialisation obligatoire (Arrêt & Accord Humain)
- ⚠️ **Si les pages `/admin/specs` et `/admin/test` (ou `/admin/harness`) n'existent pas dans le projet** :
  - **Arrêt obligatoire** : demander impérativement à l'utilisateur : *« Les pages de suivi des Specs et de Tests QA n'existent pas encore sur ce projet. Souhaites-tu que je crée le cockpit de test et de specs maintenant ? »*.
  - Ne jamais créer ces routes sans accord explicite de l'utilisateur.

## Règle de rétro-compatibilité Markdown (`docs/specs/`)
- Si des fichiers Markdown existent dans `docs/specs/SPEC-XXX.md` :
  - **Les utiliser impérativement comme ressource principale** pour peupler la table `project_specs`.
  - Extraire le titre, l'intent/résumé, les critères d'acceptation (DoD) et la thématique via le script `assets/scripts/sync-specs.ts`.
  - Créer automatiquement les scénarios QA correspondants dans `qa_scenarios`.

## Ordre de développement du projet (Dès la Phase 3)
- Au démarrage de tout projet (neuf ou existant), les **premières pages créées doivent être les pages de Specs et de Tests** :
  1. Cadrage & Stack validés.
  2. Création de la migration SQL (`assets/schemas/harness.sql`).
  3. Montage de la route Cockpit `/admin/harness` (ou `/admin/specs` + `/admin/test`).
  4. Enregistrement des specs et des critères d'acceptation.
  5. Implémentation du code métier guidée par la validation des tests au vert.

## Fonctionnalités de l'interface Cockpit

### 1. Gestion des Specs & Tâches
- **Double affichage Liste & Kanban** :
  - **Vue Kanban** : 5 colonnes de progression (`DRAFT` → `READY` → `IN_PROGRESS` → `TESTING` → `DONE`). Déplacement de cartes à un clic ou drag & drop.
  - **Vue Liste** : tableau synthétique avec filtres par statut, recherche plein texte, thématique et tri par priorité (`P0_BLOCKING`, `P1_CORE`, `P2_NICE_TO_HAVE`).
- **Annotations & Complétion IA / Humain** :
  - Champ de note libre pour orienter le correctif.
  - Possibilité pour l'humain ou l'agent (`lead-dev`, `integrations`) de marquer une spec comme `DONE` ou `TESTING`.

### 2. Banc de Tests QA & Formulaires interactifs
- Groupement par thématique / suite (Authentification, Paiements, PWA Offline, R2, etc.).
- Formulaires de simulation interactifs : déclenchement d'un appel API avec fixtures pré-remplies.
- Marqueurs d'état à 1 clic : `Succès (Vert)` | `Échec (Rouge)` | `Reset/Pending (Gris)`.
- Journalisation immédiate des erreurs et traces en base (`qa_results`).
- Conservation de l'historique : les anciens tests restent consultables même lors de l'ajout de nouveaux scénarios.

## Sécurité & Contrôle d'accès applicatif
- **Accès Super Admin strict** :
  - Page accessible librement en environnement local `.test` et staging.
  - En production : route **désactivée par défaut** (404) ou réservée aux utilisateurs avec rôle `super_admin`.
  - Turso n'ayant pas de RLS, la vérification s'opère côté serveur dans `+page.server.ts` ou `hooks.server.ts`.
- **Règles visuelles Agence Bulles** :
  - **Zéro emoji** dans l'interface (utiliser des icônes SVG/Lucide).
  - Mobile-first, Tailwind CSS fluide, design épuré en dark mode.

## Assets à consulter
- `assets/schemas/harness.sql` : schéma complet de base de données Turso/SQLite.
- `assets/templates/routes/+page.svelte` : template complet avec Kanban, Liste et banc QA.
- `assets/templates/routes/+page.server.ts` : serveur SvelteKit (chargement & actions).
- `assets/templates/routes/+server.ts` : API JSON interne pour agents IA et MCP local.
- `assets/scripts/sync-specs.ts` : script d'ingestion des specs Markdown existantes.
- `assets/templates/mcp/project-mcp.json` : configuration MCP de projet local.
