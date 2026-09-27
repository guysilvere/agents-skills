# Audit — Checklist SaaS PWA

> Grille d'audit du setup agents & skills, de la checklist « Workflow Agents & Skills (SaaS PWA) ».
> **Date** : 2026-09-27 · **Périmètre** : 13 skills, 3 agents, `WORKFLOW.md`, 9 commandes, 13 templates.
> **Méthode** : recherche des motifs dans le contenu réel, pas d'inférence.

**45 items audités.**
**Score initial** : 14 couverts · 9 partiels · 16 manquants.
**Après Lot A** (ADR + GitHub) : 18 · 10 · 11.
**Après Lot B** (élargissement des templates) : **36 couverts · 5 partiels · 2 manquants · 2 divergences assumées.**

Légende : ✅ couvert · 🟡 partiel · ❌ manquant · ⚪ divergence assumée

---

## 1. Cadrage fonctionnel & architecture produit

| Item | Statut | Où / quoi faire |
| --- | --- | --- |
| PRD complet depuis l'idée brute | 🟡 | `CADRAGE.md` en tient lieu mais sans structure PRD. **Décision** : garder `CADRAGE.md` (le workflow phases 0-10 s'y réfère) et l'enrichir plutôt que créer un doublon |
| Découpage PRD → Epics → Stories → sous-tâches | ✅ | **Lot B** — `BLUEPRINT.md` §5 : Epic → User Story (MoSCoW) → SPEC-XXX. Une Epic sans story « Must » ne va pas dans le MVP |
| Critères d'acceptation Given/When/Then | ✅ | **Lot B** — `SPEC-XXX.md` §3 : Étant donné / Quand / Alors par exigence testable |
| Rôles utilisateurs & matrice RBAC | ✅ | **Lot B** — `SPEC-XXX.md` §5 : matrice **par rôle** (périmètre + droits) en plus de la matrice par ressource |
| États d'interface — *loading* | ✅ | `design-pwa-system` — skeletons |
| États d'interface — *empty* | ✅ | `design-pwa-system/SKILL.md` §Cards, `mobile-pwa.md` |
| États d'interface — *error* / *partial data* | ✅ | **Lot B** — `mobile-pwa.md` : les **6 états** exigés, reprise sur erreur, gestion du partiel (pas d'écran blanc) |
| Parcours en mode dégradé (hors ligne) | ✅ | **Lot B** — `BLUEPRINT.md` §6 : file d'attente hors ligne + états explicites |
| Bibliothèque d'icônes & typographie | ✅ | `design-pwa-system` — une seule lib, échelle typo |
| ADR dans `/docs/adr/` | ✅ | **Fait** — `pwa-developpement` §3bis, template `ADR.md`, commande `/adr` |
| Schéma de données & stratégie multi-tenant | ✅ | **Lot B** — `DATABASE.md` : **décision obligatoire** (tenant_id / base dédiée / mono-tenant) + où le filtre s'applique + test de non-régression |
| Stratégie de cache PWA nommée | ✅ | **Lot B** — `BLUEPRINT.md` §6 : tableau par type de ressource — Cache First / Network First / Stale While Revalidate |

## 2. Gouvernance GitHub & initialisation

| Item | Statut | Où / quoi faire |
| --- | --- | --- |
| `.github/ISSUE_TEMPLATE/` | ✅ | **Fait** — 3 templates (`bug`, `feature`, `chore`) en assets + dans `.github/` |
| `.github/PULL_REQUEST_TEMPLATE.md` | ✅ | **Fait** — version repo + asset pour les projets |
| `.env.example` documenté et à jour | ✅ | Template `assets/configs/.env.example` + règle de sync dans `AGENTS.md` |
| `README.md` (install, dépendances, tests) | ✅ | Template `assets/templates/README.md` |
| Branche de travail par tâche | ⚪ | **Divergence assumée** : branche unique `testing`, utilisateur solo, documentée dans `shared-git-conventions` |
| Conventional Commits | ✅ | `shared-git-conventions` |
| Description de PR liant l'issue (`Closes #XX`) | ✅ | `WORKFLOW.md:75`, `shared-git-conventions:65` + `PR-template.md` |
| Protection de branche `main` | ✅ | Active (PR obligatoire, force-push et suppression bloqués, admins soumis) |

## 3. Développement backend & logique SaaS

| Item | Statut | Où / quoi faire |
| --- | --- | --- |
| Filtres multi-tenant systématiques / RLS | ✅ | **Point fort** : `SPEC-XXX` §5, `DATABASE.md`, règle « Turso n'a pas de RLS → autorisation applicative, un seul runtime » |
| Migrations reproductibles, versionnées, rétrocompatibles | ✅ | `DATABASE.md` + `pwa-deploiement` §5 (ordre + rollback) |
| Seeders pour dev et staging | ✅ | `integrations` (garde-fou hors local/staging) + `DATABASE.md` |
| Sessions sécurisées (HTTP-only, Secure, SameSite) | ✅ | **Lot B** — `security.md` §Sessions : HttpOnly, Secure, SameSite, rotation post-auth, invalidation serveur, pas de jeton en localStorage |
| Middleware de contrôle d'accès par rôle | 🟡 | `authorize.ts` (module unique) couvre l'autorisation. **Manque** : le volet « par rôle dans l'organisation » |
| Webhooks idempotents + signature vérifiée | ✅ | **Point fort** — `checklists/webhook.md` : corps brut, temps constant, unicité en base, machine à états |

## 4. Frontend & spécificités PWA

| Item | Statut | Où / quoi faire |
| --- | --- | --- |
| `manifest.webmanifest` valide | ✅ | `BLUEPRINT.md:40`, `mobile-pwa.md:29` |
| Icônes 192/512 + maskable | ✅ | idem |
| App shortcuts | ✅ | **Lot B** — `BLUEPRINT.md` §6 (manifest) |
| Stratégies de cache (Cache First / Network First / SWR) | ❌ | À nommer explicitement dans `BLUEPRINT.md` §6 |
| Persistance via IndexedDB | 🟡 | Mentionné (`pwa-developpement` §PWA). **Manque** : quand et pour quoi |
| File d'attente des mutations (Background Sync) | ✅ | **Lot B** — `BLUEPRINT.md` §6 : file, rejeu réseau, résolution de conflits, état visible pour l'utilisateur |
| Invite de mise à jour sans rechargement forcé | ✅ | `BLUEPRINT.md:45` — `skipWaiting` + notification |

## 5. Qualité, tests & audits

| Item | Statut | Où / quoi faire |
| --- | --- | --- |
| Tests unitaires sur la logique critique | ✅ | `WORKFLOW.md` (attribution) + `pwa-validation` |
| Tests d'intégration (API + base) | ✅ | idem |
| Tests E2E Playwright sur parcours critiques | ✅ | `pwa-validation` §6 + `checklists/e2e.md` |
| Lint sans avertissement ignoré | ✅ | **Lot B** — `pwa-validation` §2 : zéro `eslint-disable` / `# noqa` sans justification écrite |
| Typecheck strict | ✅ | `pwa-validation` §2 |
| Lighthouse CI (Perf > 90, PWA 100 %, a11y > 95) | ✅ | **Lot B** — étape Lighthouse dans `ci.yml` + `lighthouserc.json` (Perf ≥ 0.8, a11y ≥ 0.9, LCP/CLS/TBT). ⚠️ « PWA = 100 % » n'existe plus depuis Lighthouse ≥ 12 |

## 6. CI/CD, documentation vivante & surveillance

| Item | Statut | Où / quoi faire |
| --- | --- | --- |
| Pipeline sur chaque PR (lint, typecheck, tests, build) | ✅ | `configs/ci.yml` — secrets → lint → typecheck → tests → audit → build |
| Génération auto de version + `CHANGELOG.md` | 🟡 | Manuel via `/release`. **Manque** : l'automatisation en CI |
| Déploiement staging au merge `main` | 🟡 | Documenté (`RUNBOOK`), pas automatisé |
| Déploiement prod automatisé / approbation | ⚪ | **Divergence assumée** : jalon humain obligatoire (`WORKFLOW.md`) — c'est une protection, pas un manque |
| OpenAPI / Swagger à jour | ❌ | Une ligne de checklist dans `api-review.md`. **Approche** : générer depuis le code plutôt qu'écrire à la main |
| Documentation utilisateur synchronisée | ❌ | Hors périmètre technique — prévoir un `docs/USER_GUIDE.md` par projet |
| Capture centralisée des erreurs (Sentry) | ✅ | **Lot B** — `pwa-deploiement` §6 : Sentry **serveur ET client**, alerte sur pic, corrélation à la version déployée |
| Healthchecks & uptime | ✅ | `pwa-deploiement` §6 |
| Core Web Vitals réels (RUM) | ✅ | **Lot B** — `pwa-deploiement` §6 : distinction labo/terrain explicite, cibles p75 (LCP, INP, CLS) |

---

## Divergences assumées — à ne pas « corriger »

| La checklist attend | Notre choix | Verdict |
| --- | --- | --- |
| Une branche par tâche | Branche unique `testing` (solo) | Délibéré, documenté |
| Déploiement prod automatisé | Jalon humain | Protection volontaire |
| Lighthouse « PWA = 100 % » | Catégorie retirée + DevTools | **Notre version est à jour**, la checklist est datée |
| Revue de code obligatoire | 0 approbation (solo) — mais PR imposée | Assumé |

---

## Plan d'intégration

Principe : respecter le pattern existant — **skills = procédures & templates**, **agents = rôles**,
**`mcp.servers.json` / sync = infra**, **`WORKFLOW.md` = contrats transverses**. Pas de nouvelle couche.

### ✅ Lot A — fait

- **ADR** : `pwa-developpement` §3bis (déclencheurs + règles), template `assets/templates/ADR.md`, commande `/adr`, `docs/adr/` ajouté au mapping `AGENTS.md` et à la structure projet.
- **`.github/`** : 3 templates d'issue créés côté assets **et** dans le repo, `PULL_REQUEST_TEMPLATE.md` (version repo), copie prévue au scaffold dans `pwa-developpement`.

> Manque comblé : des décisions lourdes (Jèko→GeniusPay, PocketBase→Turso, React→SvelteKit) ne vivaient que dans des CHANGELOG et des conversations.

### ✅ Lot B — fait (aucun nouveau fichier sauf la config Lighthouse)

| Gap comblé | Fichier touché |
| --- | --- |
| 6 états d'interface, reprise sur erreur, partiel | `design-pwa-system/assets/checklists/mobile-pwa.md` |
| Niveau **Epic** → User Story → SPEC | `pwa-cadrage/assets/templates/BLUEPRINT.md` §5 |
| Cache strategies nommées + Background Sync + app shortcuts + RUM | `pwa-cadrage/assets/templates/BLUEPRINT.md` §6 |
| **Étant donné / Quand / Alors** | `pwa-developpement/assets/templates/SPEC-XXX.md` §3 |
| **RBAC** (rôle × permission) | `SPEC-XXX.md` §5 |
| **Multi-tenant** — décision obligatoire + où le filtre s'applique | `pwa-developpement/assets/templates/DATABASE.md` |
| **Sessions** : HttpOnly, Secure, SameSite, rotation | `pwa-validation/assets/checklists/security.md` |
| **Lint sans warning ignoré** | `pwa-validation/SKILL.md` §2 |
| **Sentry + RUM** (labo vs terrain, cibles p75) | `pwa-deploiement/SKILL.md` §6 |
| **Lighthouse en CI** + cibles | `assets/configs/ci.yml` + **nouveau** `assets/configs/lighthouserc.json` |

### Lot C — outillage à spécifier

| Gap | Approche |
| --- | --- |
| OpenAPI | Générer depuis le code (endpoint SvelteKit) → `api-best-practices` |
| Documentation utilisateur | `docs/USER_GUIDE.md` par projet, alimenté au fil des specs |
| SemVer + CHANGELOG auto | Étape CI, ou garder `/release` manuel |
| Déploiement staging auto | Déclencheur Coolify au merge `main` |

---

## Comment relancer cet audit

```bash
# depuis la racine du repo agents-skills
for t in "Given" "RBAC" "error state" "Cache First" "Sentry" "openapi" "SameSite" "shortcut" "Background Sync"; do
  printf "%-18s %s\n" "$t" "$(grep -rli "$t" opencode/skills opencode/agents 2>/dev/null | wc -l | tr -d ' ')"
done
```

Un compteur qui passe de `0` à `n` = le gap est comblé.
