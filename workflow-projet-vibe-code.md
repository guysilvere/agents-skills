# Workflow de projet — Vibe coding (OpenCode / Antigravity)

## Structure Générale du Projet : Duo Landing Page + Application SaaS
Pour chaque projet SaaS, deux livrables indissociables sont conçus :
1. **La Landing Page** : Vitrine marketing, conversion, démonstration, avis clients/retours utilisateurs, liens de connexion/inscription.
2. **L'Application SaaS (Frontend PWA & Backend)** : Espace connecté, cœur de métier, gestion des données, facturation et support client.
* **Harmonie visuelle stricte** : La landing page et l'application SaaS partagent rigoureusement le même design system (palette de couleurs, typographies, styles de boutons, icônes).

---

## Nomenclature & Cartographie des Fichiers Markdown (.md)
Afin d'éviter toute surcharge de tokens lors des sessions de développement assisté par IA (OpenCode / Antigravity), **tous les fichiers `.md` doivent être ultra-légers, synthétiques et rédigés sous forme de listes à puces directes sans texte superflu**.

### Règle d'or de synchronisation continue ("Living Documentation")
**Toute modification de code qui dévie de la documentation existante impose la mise à jour immédiate du fichier `.md` concerné avant validation de la tâche :**
- Modification de tokens UI, boutons, inputs, palettes → Mise à jour immédiate de `docs/DESIGN_SYSTEM.md`.
- Modification de champs, tables, relations, règles RLS/PocketBase → Mise à jour immédiate de `docs/DATABASE.md`.
- Modification de routes API, payloads, webhooks ou jobs → Mise à jour immédiate de `docs/BLUEPRINT.md`.
- Ajout ou modification d'une variable d'environnement → Mise à jour de `.env.example` et mapping dans `AGENTS.md`.

Le fichier **`AGENTS.md`** sert de point d'entrée unique et de table d'orientation (mapping) pour que les agents IA ne chargent que le fichier strictement nécessaire à la tâche en cours :

| Fichier | Emplacement / Rôle | Format & Contenu (Ultra-léger / Low Tokens) |
| :--- | :--- | :--- |
| **`AGENTS.md`** | Racine du projet | **Fichier central d'indexation IA** : mapping des fichiers, règles d'or, règle de synchronisation continue et contraintes techniques. |
| **`CADRAGE.md`** | `/docs/CADRAGE.md` | Résumé concis : personas cibles, KPIs, modèle économique (Jèko/CinetPay) et scope MVP (v0/v1). |
| **`BLUEPRINT.md`** | `/docs/BLUEPRINT.md` | Spécifications techniques condensées : stack retenue, flux de données, routes API, webhooks et jobs asynchrones. |
| **`DATABASE.md`** | `/docs/DATABASE.md` | Schéma relationnel succinct, règles d'accès RLS/PocketBase, stratégie de migration et dictionnaire de données. |
| **`DESIGN_SYSTEM.md`**| `/docs/DESIGN_SYSTEM.md` | Tokens CSS bruts, palette hexadécimale, règles du Layout Signature PWA et bibliothèque d'icônes unique. |
| **`SPEC-XXX.md`** | `/docs/specs/SPEC-XXX.md` | **Spécification unitaire par fonctionnalité** (Intent, User Story, DoD, API/Schéma, Tâches). |
| **`ROADMAP.md`** | Racine du projet | Liste des jalons à court, moyen et long terme (mis à jour à chaque version). |
| **`README.md`** | Racine du projet | Commandes de build, setup Caddy local, variables d'environnement et guide de lancement. |
| **`CHANGELOG.md`** | Racine du projet | Journal condensé des versions sémantiques (`0.1.0`, etc.) et notes de release. |
| **`RUNBOOK.md`** | `/docs/RUNBOOK.md` | Procédures opérationnelles : déploiement Coolify, proxy Cloudflare, sauvegardes quotidiennes et restauration R2. |

---

## Phase 0 — Cadrage & Stratégie Produit
1. **Questions de cadrage & Définition du public cible** :
   - Poser des questions pour combler les zones d'ombre et affiner le périmètre fonctionnel.
   - Identifier et formaliser les personas et le public cible (attentes, irritants, habitudes d'utilisation sur mobile/bureau) directement au sein de cette étape.
2. **Objectifs business & KPIs** : Définir les objectifs clés (acquisition, activation, rétention, churn) et les indicateurs mesurables de succès.
3. **Modèle de monétisation & Passerelles de Paiement Locales** :
   - Définir le modèle économique : Freemium, abonnement mensuel/annuel, paiement à l'usage ou achat unique.
   - **Passerelles de paiement retenues (sans passerelle internationale)** :
     - **Passerelle principale** : **Jèko** pour tous les paiements Mobile Money.
     - **Passerelle secondaire / Backup & Cartes** : **CinetPay** pour le Mobile Money (secours) et les paiements par carte bancaire.
   - Gestion des abonnements, webhooks de paiement/renouvellement, relances automatiques en cas d'échec de prélèvement (*dunning*) et génération automatique de factures/reçus PDF.
4. **Analyse rapide de la concurrence** : Examiner 2 à 3 applications similaires (forces, faiblesses, opportunités de différenciation UX/UI).
5. **Scope du MVP & Synthèse documentaire** :
   - Arbitrer strictement ce qui appartient à la version v0 (bêta fermée), à la v1 (lancement public) et ce qui est reporté aux versions ultérieures.
   - **Livrable** : Générer le fichier **`docs/CADRAGE.md`** (format condensé).

---

## Phase 1 — Identité du projet & Domaines
6. **Proposer 5 à 10 noms de projet** :
   - Le nom doit être simple, court et évocateur.
   - Ce nom servira d'identifiant unique à toutes les étapes (dossier local, domaines prod/test, base de données, etc.).
   - **Règle stricte** : Ne pas passer aux étapes suivantes sans avoir formellement validé le nom retenu.
7. **Dossier local & Référentiel Git** :
   - Nom du dossier local : `/Projets/<nom-du-projet>`
   - Nom du repository GitHub basé strictement sur le nom du projet validé.
8. **Nom de domaine (Production & Local)** :
   - **Recherche de disponibilité** : Vérifier sur Internet, les bureaux d'enregistrement et GitHub si le nom est déjà utilisé avec les extensions `.app`, `.net`, `.ci`, `.com`, `.dev`.
   - Si le nom ou domaine est déjà pris avec ces extensions, éliminer la proposition ou adapter avec une variante pertinente.
   - **Domaine local** : Assigner un domaine de test en `.test` (ex: `<nom-du-projet>.test`) qui sera configuré dans Caddy.

---

## Phase 2 — Stack technique, Données & Infrastructure
9. **Définir la stack** (Tableau comparatif des architectures recommandées) :

| Catégorie | Stack recommandée | Caractéristiques & Cas d'usage |
| :--- | :--- | :--- |
| **Application SaaS (PWA Mobile-First)** | **Preact + UnoCSS** | Ultra-léger, chargement instantané, idéal PWA performante. |
| | **SolidJS + Open Props** | Réactivité sans Virtual DOM, performances brutes maximales. |
| | **Svelte / SvelteKit + CSS scopé** | DX optimale, CSS encapsulé nativement, code concis. |
| | **React (ou Preact)** | Écosystème riche de composants si besoins spécifiques. |
| | **Alpine.js + Tailwind / Vanilla** | Approche déclarative minimaliste pour interfaces directes. |
| **Site Statique / Landing Page** | **Astro + CSS Vanilla** | Zéro JS envoyé au client par défaut, SEO ultra-performant. |
| | **HTML Statique + Pico CSS (ou Chota)** | Minimalisme absolu, mise en page sémantique sans build lourd. |
| | **HTML/CSS moderne natif + Lightning CSS** | Performances CSS pures, bundle optimisé sans framework. |
| | **HTML + CSS Grid Vanilla** | Contrôle total du layout, zéro dépendance externe. |
| **Code partagé (App + Landing)** | **SvelteKit (Full-Stack / Hybride)** | Routeur unique pour Landing + App, CSS scopé ou UnoCSS. |
| | **Astro + Preact (Architecture par Îlots)** | Landing ultra-rapide avec îlots interactifs partagés. |
| | **Monorepo Vite (Turborepo / pnpm)** | `apps/web` (Landing HTML/Vite) + `apps/app` (Preact), tokens CSS ou config UnoCSS partagée. |
| **Sans code partagé (Découplé)** | **SolidJS + CSS Grid** (App) / **HTML + Lightning CSS** (Landing) | Zéro framework et zéro dépendance JS sur la landing, perf max. |
| | **Preact SPA + UnoCSS** (App) / **Générateur minimaliste (Hugo/11ty)** (Landing) | Séparation stricte site vitrine / application cliente. |
| | **Alpine.js + Tailwind** (App) / **HTML Vanilla + CSS Grid Mobile-First** (Landing) | Landing sémantique épurée avec feuille de style CSS Grid unique. |

*(Tout choix sortant de ce cadre doit être expressément argumenté et validé).*

**Infrastructure Réseau, Sécurité & Stockage (Cloudflare)**
- **Proxy DNS Edge** : Routage DNS sous proxy Cloudflare (nuage orange activé) pour masquer l'IP réelle du serveur VPS Coolify.
- **Protection WAF & DDoS** : Filtrage applicatif, mitigation DDoS illimitée, et Cloudflare Turnstile sur tous les formulaires.
- **Stockage Cloudflare R2** : Stockage d'objets compatible S3 pour héberger les fichiers médias, uploads utilisateurs et archives de sauvegardes sans frais d'egress.
- **Tunnels Cloudflare Zero Trust** : Exposition chiffrée et sécurisée des consoles d'administration (Coolify, PocketBase) sans ports ouverts.

10. **Architecture PWA (Progressive Web Application)** :
    - Fichier `manifest.webmanifest` complet : `display: standalone`, `orientation: portrait`, `theme_color`, `background_color`, icônes masquables 192x192 et 512x512, raccourcis applicatifs.
    - Service Worker avec stratégie de mise en cache offline-first des assets critiques et stale-while-revalidate pour les requêtes réseau.
    - Détection du statut réseau (en ligne / hors ligne) avec indicateur discret.

11. **Architecture des dossiers & Séparation des responsabilités** :
    - Organisation claire : front / back / monorepo, typages partagés, isolation des utilitaires métier.
12. **Licence logicielle** : Choisir la licence du projet (MIT, propriétaire/commerciale, etc.).

13. **Schéma, Modèle de données & Stratégie de persistance** :
    - Critères de choix : volume de données prévisionnel, scalabilité, facilité des backups automatiques vers Cloudflare R2 et portabilité.
    - **Bases de données de référence** :
      - **PocketBase** (Auto-hébergé sur VPS Coolify, base préférée par défaut).
      - **Turso (libSQL) + Cloudflare R2** (Base distribuée edge managée).
    - Isolation stricte des environnements : base de test (`testing`/`staging`) et base de production (`production`).
    - **Gestion des migrations & Seeders** : Scripts de migration de schéma versionnés et jeu de fausses données de test réalistes (*seeders*).
    - **Multi-Tenant (si applicable)** : Modélisation des espaces de travail (*workspaces* / organisations) et rôles associés (Admin, Éditeur, Lecteur).
    - **Livrable** : Rédiger **`docs/DATABASE.md`** (schéma concis et règles d'accès).

14. **Médias, Emails transactionnels & Notifications** :
    - **Compression obligatoire des images** : Toutes les images et médias utilisateurs doivent **impérativement être compressés au format AVIF ou WebP** côté client ou backend avant tout upload et stockage dans Cloudflare R2.
    - **Emails transactionnels** : Services préférés : **Brevo** ou **Mailtrap** pour la délivrabilité des liens magiques, réinitialisations, OTP et reçus.
    - **Web Push Notifications** : Protocole Web Push / VAPID via le Service Worker pour l'envoi d'alertes mobiles et bureau.

15. **Architecture des API, Tâches de fond & Blueprint** :
    - Définition des routes (REST / RPC), typage strict des payloads et gestion standardisée des erreurs HTTP.
    - Traitement asynchrone des tâches lourdes (génération PDF, compression d'images, exports).
    - Webhooks sortants pour l'interconnexion avec des flux d'automatisation (n8n, Make).
    - **Livrable** : Rédiger **`docs/BLUEPRINT.md`** (flux d'API et architecture technique condensée).
16. **Planification du projet** : Rédiger le fichier initial **`ROADMAP.md`** à la racine (jalons courts et clairs).

---

## Phase 3 — UX / Design & Layout Signature PWA
17. **Arborescence & Parcours utilisateur (UX)** : Sitemap complet, parcours d'onboarding, réduction des étapes vers l'action clé.
18. **Wireframes, Maquettes & Écrans** :
    - Conception d'écrans pensée prioritairement pour smartphone (*mobile-first*).
    - Possibilité d'utiliser **Google Stitch** pour générer ou prototyper rapidement les écrans (optionnel / selon pertinence).

19. **Layout Signature pour tous les SaaS (Mobile-First & Adaptatif Desktop)** :
    - **Top App Bar (En-tête)** :
      - Barre compacte (hauteur 56px max), affichant le titre contextuel de l'écran actif.
      - Bouton retour contextuel automatique si navigation en sous-page.
      - Zone d'actions rapides à droite (centre de notifications, raccourci profil).
    - **Bottom Navigation Bar (Navigation inférieure)** :
      - Barre fixe ancrée en bas d'écran sur mobile, optimisée pour l'accès au pouce.
      - 3 à 5 onglets maximum avec icônes explicites et labels concis.
      - Prise en compte impérative de la zone d'encoche : `padding-bottom: env(safe-area-inset-bottom, 16px)`.
      - Transition fluide vers une sidebar latérale repliable sur écran bureau/tablette (≥ 768px).
    - **Floating Action Button (FAB)** :
      - Bouton d'action principale flottant, positionné en bas à droite au-dessus de la barre de navigation.
      - Déclenché pour l'action créatrice centrale (ex : "+ Nouveau devis", "+ Ajouter une mesure").
    - **Ergonomie tactile & Interfaces du bas (Bottom Sheets)** :
      - Cibles tactiles (*hit areas*) de **48x48 px minimum** pour l'ensemble des boutons et liens.
      - Utilisation de panneaux coulissants depuis le bas (*Bottom Sheets*) à la place de modales centrées sur mobile.
      - Configuration `viewport-fit=cover` pour une immersion complète sous les barres d'état système.
    - **Cartes (Cards) & États de chargement** :
      - Bordures subtiles (`border border-neutral-200 dark:border-neutral-800`), coins arrondis (`rounded-xl` ou `rounded-2xl`).
      - Espacements confortables (`p-4` sur mobile, `p-6` sur bureau).
      - **Empty States & Skeletons** : Design soigné des écrans sans données (illustrations sobres, texte explicatif et bouton d'action) et placeholders animés lors du chargement.

20. **Charte graphique & Thématique partagée (Landing + SaaS)** :
    - Définition unifiée de la palette de couleurs, logo (avec déclinaisons pour icônes PWA), typographies.
    - **Harmonie absolue** : La landing page vitrine et le backend SaaS partagent rigoureusement le même thème visuel, les mêmes polices et les mêmes couleurs.
    - Support natif des modes clair et sombre (*light/dark mode*).
    - **Bibliothèque d'icônes** : Sélectionner une seule bibliothèque pour l'ensemble du projet. **Aucun emoji dans l'interface** sauf demande explicite. Bibliothèques de référence :
      - [Lucide](https://github.com/lucide-icons/lucide)
      - [Tabler Icons](https://github.com/tabler/tabler-icons)
      - [Phosphor Icons](https://github.com/phosphor-icons/homepage)
      - [React Icons](https://github.com/react-icons/react-icons)
      - [Remix Icon](https://github.com/Remix-Design/RemixIcon)

21. **Design System & Bibliothèque de composants réutilisables** :
    - Spacing unifié, typographie modulaire, variantes de boutons, alertes et notifications toast.
    - **Tableaux de données (Data Tables)** : Vues en tableau responsive (cartes empilées sur mobile, tableau complet avec scroll horizontal doux sur desktop).
    - **Filtres & Tri** : Tiroirs de filtrage ergonomiques sur mobile, barres de filtres sur desktop.
    - **Champs de recherche** : Barre de recherche globale ou contextuelle avec debounce et effacement rapide.
    - **Page & Formulaires de connexion / Inscription** : Layout dédié, épuré, centré, intégrant les boutons OAuth et le widget Turnstile.
    - **Livrable** : Rédiger **`docs/DESIGN_SYSTEM.md`** (tokens bruts et composants standardisés).

---

## Phase 4 — Environnement IA & Standard des Spécifications Fonctionnelles (Specs)
22. **Fichier Central de Pilotage IA (`AGENTS.md`)** :
    - Rédigé à la racine du projet pour guider les assistants de vibe coding sans surcharger leur contexte mémoire.
    - **Contenu obligatoire de `AGENTS.md`** :
      - **Index & Mapping des fichiers** : Table des matières renvoyant vers `docs/CADRAGE.md`, `docs/BLUEPRINT.md`, `docs/DATABASE.md`, `docs/DESIGN_SYSTEM.md`, `docs/specs/`, `docs/RUNBOOK.md`, `ROADMAP.md` et `CHANGELOG.md`.
      - **Consigne de chargement sélectif** : Directive ordonnant à l'agent de ne lire **que** le fichier `.md` requis pour la tâche demandée (faible consommation de tokens).
      - **Consigne de synchronisation documentaire immédiate** : Si le code évolue en déviant de la doc (UI, DB, API), mise à jour immédiate du fichier Markdown correspondant.
      - **Directives de style de code** : Normes de typage, structure des dossiers, respect du Layout Signature PWA.
      - **Interdictions strictes** : Ne pas insérer d'emojis, ne pas utiliser d'autres bibliothèques d'icônes, ne pas stocker d'images non compressées en AVIF/WebP.

23. **Standard de Spécification Fonctionnelle Explicite (`/docs/specs/SPEC-XXX.md`)** :
    - Toute nouvelle fonctionnalité ou sous-module fait obligatoirement l'objet d'un fichier de spécification unitaire dans `/docs/specs/SPEC-XXX-nom.md`.
    - **Template Standard Obligatoire** :
```markdown
# [SPEC-XXX] [Nom de la fonctionnalité]

> **Statut** : DRAFT / APPROVED / IN_PROGRESS / DONE
> **Phase Roadmap** : [Phase 0 / 1 / 2 / 3 / 4]
> **Agent(s)** : `architecte` → `chef-pwa` → `pwa-tester` → `gestionnaire-git`

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

**Edge cases**
- **EDGE-01** : [situation] → [comportement attendu]
- **EDGE-02** : [situation] → [comportement attendu]

**PWA / Offline** : [requis ou non — stratégie si requis]

## 4. Modèle de données & API
```json
{ "collection": "nom", "schema": [] }
```
- `POST /api/...` : [payload / usage]

## 5. Fichiers impactés
- `backend/pb_hooks/...` [NEW/MODIFY]
- `backoffice/src/components/...` [NEW/MODIFY]
- `backoffice/src/services/...` [NEW/MODIFY]

## 6. Tâches d'exécution
- [ ] **T1** — Backend/schéma (REQ-01)
- [ ] **T2** — UI/composant (REQ-02)
- [ ] **T3** — Build & lint (`pwa-tester`)
- [ ] **T4** — Commit sémantique (`gestionnaire-git`)

---
*Une fois DONE, ce fichier fait foi comme référence unique de la fonctionnalité.*
```

24. **Fichier `.env.example`** : Documenter et lister l'ensemble des clés requises dès le démarrage :
    - Clés d'API SaaS & configuration de base de données (PocketBase / Turso)
    - Passerelles de paiement locales : Identifiants API & Webhook secrets **Jèko** et **CinetPay**
    - Fournisseur d'emails transactionnels : Clés API / SMTP **Brevo** ou **Mailtrap**
    - Clés Cloudflare Turnstile (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`)
    - Identifiants Cloudflare R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`)
    - Clés VAPID pour les Web Push notifications

---

## Phase 5 — Setup technique local
25. **Environnement de développement local** : Configuration conteneurisée (`docker-compose.yml`, `Dockerfile`, mappage des ports).
26. **Reverse proxy local Caddy (HTTPS local)** :
    - Configuration de Caddy pour mapper `<nom-du-projet>.test` en HTTPS local avec certificat automatique.
    - **Indispensable** : Permet de tester le Service Worker, le mode offline et l'installation PWA sur appareils physiques connectés au réseau local.
27. **Initialisation Git** : Premier commit propre avec fichier `.gitignore` adapté à la stack.
28. **Linter & Formateur de code** : Règles strictes de formattage automatique (Biome, ESLint/Prettier).
29. **Versionnage sémantique** : Initialisation à `0.1.0` et création du fichier initial **`CHANGELOG.md`**.

---

## Phase 6 — Développement guidé par les Specs & Synchronisation Continue
30. **Cycle d'exécution par Spec** :
    - Développement séquentiel basé sur le statut des `SPEC-XXX.md` (`APPROVED` → `IN_PROGRESS` → `DONE`).
    - **Règle de synchronisation documentaire systématique** : Lors de l'implémentation d'une Spec, si une décision technique impacte le design system (tailles de boutons, couleurs), le schéma de base de données ou les routes API, les fichiers `DESIGN_SYSTEM.md`, `DATABASE.md` ou `BLUEPRINT.md` doivent être **mis à jour immédiatement dans le même incrément de travail**.
31. **Gestion des erreurs & Logs complets** : Journalisation structurée, retours d'erreurs clairs pour l'utilisateur sans fuite d'informations sensibles.
32. **Authentification & Gestion des accès** :
    - **Google activé par défaut**.
    - **Apple** : Mentionner explicitement *"Bientôt disponible"* tant que l'accès développeur Apple n'est pas activé.
    - Email + Mot de passe ou Magic Link (selon les exigences définies pour le projet).
    - **Protection anti-bot** : Cloudflare Turnstile obligatoire sur les écrans d'authentification et de paiement.
33. **Sécurité, Contrôle d'accès & Traitement Médias** :
    - Row Level Security (RLS) / règles de collection PocketBase, politique CORS stricte, sanitisation des entrées.
    - Compression systématique côté client/serveur en **AVIF** ou **WebP** avant envoi vers Cloudflare R2 via URLs présignées.
    - En-têtes HTTP de sécurité (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
34. **Implémentation PWA & Optimisations Mobiles** :
    - Enregistrement du Service Worker et stratégies de cache.
    - Bannière d'installation PWA native personnalisée.
    - Claviers mobiles adaptés sur tous les champs de formulaires (`inputmode="numeric"`, `inputmode="email"`, `autocomplete`).
35. **Parcours d'activation & Onboarding** :
    - Checklist d'accueil au premier lancement guidant l'utilisateur vers son premier résultat concret (*Aha moment*).
36. **Stratégie de tests** : Tests unitaires sur les règles métier et calculs de prix, tests d'intégration webhooks Jèko / CinetPay, et tests de non-régression responsive mobile.
37. **Documentation technique / API** : Documentation des points d'entrée et schéma OpenAPI/Swagger.

---

## Phase 7 — Pré-lancement, Maintenance Documentaire & Conformité
38. **Documentation de démarrage, Suivi de Versions & Roadmap** :
    - Rédaction et maintenance du fichier **`README.md`** à la racine : Guide d'installation, variables, architecture.
    - **Mise à jour obligatoire du `README.md`, de la `ROADMAP.md` et du `CHANGELOG.md` à chaque nouvelle version enregistrée / livrée.**
39. **Stratégie SEO & Landing Page** :
    - Conception et optimisation de la Landing Page vitrine (alignée au thème du SaaS).
    - Balises OpenGraph, Twitter Cards, robots.txt, sitemap.xml.
40. **Accessibilité (a11y)** : Contrastes de couleurs (WCAG AA), navigation au clavier et tactile fluide, attributs ARIA.
41. **Optimisation des performances** :
    - Audit Lighthouse : Validation des critères PWA, score performance mobile ≥ 90.
    - Compression moderne des assets (Brotli, formats WebP/AVIF pour les images).
    - Règles de mise en cache Cloudflare Edge.
42. **Mentions Légales, CGU / CGV & RGPD** :
    - Mention obligatoire : **Toutes les applications sont développées par Agence Bulles (agencebulles.net)**.
    - Bannière de consentement aux cookies et politique de confidentialité des données personnelles.

---

## Phase 8 — Déploiement & Exploitation
43. **Enregistrement des versions** : Création des tags de versions et releases sur GitHub.
44. **Pipeline CI/CD** : Linting, vérification des types et tests automatisés avant build et déploiement.
45. **Environnement de Staging** : Validation fonctionnelle sur environnement miroir avant mise en ligne définitive.
46. **Déploiement Coolify & Configuration Cloudflare** :
    - Déploiement de l'application et de la landing page sur le VPS via Coolify.
    - **Gestion du déploiement base de données** :
      - Si la base de données est **PocketBase** : Prévoir et configurer son déploiement conteneurisé sur Coolify.
      - Si la base de données est **Turso** : Aucun déploiement de base de données nécessaire sur Coolify (service cloud libSQL managé).
    - Activation du proxy Cloudflare (DNS orange) pour le masquage IP et SSL en mode *Full (Strict)*.
    - Tunnels Cloudflare Zero Trust pour sécuriser l'accès aux interfaces d'administration (Coolify, PocketBase).
47. **Monitoring, Alerting & Sauvegardes (RUNBOOK)** :
    - Surveillance de l'uptime et alertes de statut.
    - **Procédure de sauvegarde** : Sauvegarde automatique quotidienne de la base de données et des fichiers médias vers Cloudflare R2.
    - Test régulier de la procédure de restauration des données.
    - **Livrable** : Rédiger **`docs/RUNBOOK.md`** (procédures d'exploitation condensées).

---

## Phase 9 — Lancement & Analytics
48. **Plan de lancement & Communication** : Calendrier éditorial, contenu de démonstration et campagne sur les réseaux sociaux.
49. **Mesure d'audience respectueuse de la vie privée** : Déploiement de Cloudflare Web Analytics ou d'un outil d'analytics auto-hébergé léger.

---

## Phase 10 — Support, Retours Utilisateurs & Maintenance
50. **Support technique intégré (Système de Tickets) & Preuve Sociale** :
    - Intégration d'un **système de tickets et de retours d'expérience** directement dans l'interface de l'application SaaS.
    - Module de collecte des avis clients avec consentement pour **affichage dynamique des retours et témoignages sur la Landing Page du SaaS** (preuve sociale).
51. **Plan de maintenance continue & Synchronisation documentaire** :
    - Mises à jour de sécurité régulières des dépendances, surveillance des quotas Cloudflare R2 et rotation planifiée des clés d'API (Jèko, CinetPay, Brevo, Mailtrap).
    - Maintien continu de la cohérence documentaire lors des correctifs ou refactorings.
