# Audit — Checklist SaaS PWA

> Grille d'audit du setup agents & skills, de la checklist « Workflow Agents & Skills (SaaS PWA) ».
> **Date** : 2026-09-27 · **Périmètre** : 13 skills, 3 agents, `WORKFLOW.md`, 9 commandes, 13 templates.
> **Méthode** : recherche des motifs dans le contenu réel, pas d'inférence.

**Score initial** : 14 couverts · 9 partiels · 16 manquants.
**Score après ce lot** : 18 couverts · 10 partiels · 11 manquants.

Légende : ✅ couvert · 🟡 partiel · ❌ manquant · ⚪ divergence assumée

---

## 1. Cadrage fonctionnel & architecture produit

| Item | Statut | Où / quoi faire |
| --- | --- | --- |
| PRD complet depuis l'idée brute | 🟡 | `CADRAGE.md` en tient lieu mais sans structure PRD. **Décision** : garder `CADRAGE.md` (le workflow phases 0-10 s'y réfère) et l'enrichir plutôt que créer un doublon |
| Découpage PRD → Epics → Stories → sous-tâches | ❌ | `BLUEPRINT.md` a les User Stories (MoSCoW), `SPEC-XXX.md` les unités. **Manque** : le niveau Epic |
| Critères d'acceptation Given/When/Then | ❌ | DoD actuelle = cases à cocher. Voir Lot 1 § SPEC-XXX |
| Rôles utilisateurs & matrice RBAC | 🟡 | Matrice d'autorisation **par ressource** (`SPEC-XXX` §5, `DATABASE.md`). **Manque** : la vue rôle × permission |
| États d'interface — *loading* | ✅ | `design-pwa-system` — skeletons |
| États d'interface — *empty* | ✅ | `design-pwa-system/SKILL.md` §Cards, `mobile-pwa.md` |
| États d'interface — *error* / *partial data* | ❌ | À ajouter à `design-pwa-system` (cf. Lot 1) |
| Parcours en mode dégradé (hors ligne) | 🟡 | Stratégie technique dans `BLUEPRINT.md` §6. **Manque** : le parcours UI |
| Bibliothèque d'icônes & typographie | ✅ | `design-pwa-system` — une seule lib, échelle typo |
| ADR dans `/docs/adr/` | ✅ | **Fait** — `pwa-developpement` §3bis, template `ADR.md`, commande `/adr` |
| Schéma de données & stratégie multi-tenant | 🟡 | `DATABASE.md` a une section « si applicable ». **Manque** : trancher `tenant_id` partagé vs bases dédiées |
| Stratégie de cache PWA nommée | ❌ | **0 occurrence** de Cache First / Network First / SWR. À nommer dans `BLUEPRINT.md` §6 |

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
| Sessions sécurisées (HTTP-only, Secure, SameSite) | ❌ | **0 occurrence**. À ajouter à `pwa-validation/assets/checklists/security.md` |
| Middleware de contrôle d'accès par rôle | 🟡 | `authorize.ts` (module unique) couvre l'autorisation. **Manque** : le volet « par rôle dans l'organisation » |
| Webhooks idempotents + signature vérifiée | ✅ | **Point fort** — `checklists/webhook.md` : corps brut, temps constant, unicité en base, machine à états |

## 4. Frontend & spécificités PWA

| Item | Statut | Où / quoi faire |
| --- | --- | --- |
| `manifest.webmanifest` valide | ✅ | `BLUEPRINT.md:40`, `mobile-pwa.md:29` |
| Icônes 192/512 + maskable | ✅ | idem |
| App shortcuts | ❌ | À ajouter aux exigences manifest |
| Stratégies de cache (Cache First / Network First / SWR) | ❌ | À nommer explicitement dans `BLUEPRINT.md` §6 |
| Persistance via IndexedDB | 🟡 | Mentionné (`pwa-developpement` §PWA). **Manque** : quand et pour quoi |
| File d'attente des mutations (Background Sync) | ❌ | À ajouter à `BLUEPRINT.md` §6 |
| Invite de mise à jour sans rechargement forcé | ✅ | `BLUEPRINT.md:45` — `skipWaiting` + notification |

## 5. Qualité, tests & audits

| Item | Statut | Où / quoi faire |
| --- | --- | --- |
| Tests unitaires sur la logique critique | ✅ | `WORKFLOW.md` (attribution) + `pwa-validation` |
| Tests d'intégration (API + base) | ✅ | idem |
| Tests E2E Playwright sur parcours critiques | ✅ | `pwa-validation` §6 + `checklists/e2e.md` |
| Lint sans avertissement ignoré | 🟡 | `npm run lint` bloquant. **Manque** : la règle « aucun warning ignoré » |
| Typecheck strict | ✅ | `pwa-validation` §2 |
| Lighthouse CI (Perf > 90, PWA 100 %, a11y > 95) | 🟡 | Local seulement (`pwa-validation` §8). **Absent de la CI**, et cibles différentes. ⚠️ « PWA = 100 % » n'existe plus depuis Lighthouse ≥ 12 — **la checklist est datée, notre adaptation est correcte** |

## 6. CI/CD, documentation vivante & surveillance

| Item | Statut | Où / quoi faire |
| --- | --- | --- |
| Pipeline sur chaque PR (lint, typecheck, tests, build) | ✅ | `configs/ci.yml` — secrets → lint → typecheck → tests → audit → build |
| Génération auto de version + `CHANGELOG.md` | 🟡 | Manuel via `/release`. **Manque** : l'automatisation en CI |
| Déploiement staging au merge `main` | 🟡 | Documenté (`RUNBOOK`), pas automatisé |
| Déploiement prod automatisé / approbation | ⚪ | **Divergence assumée** : jalon humain obligatoire (`WORKFLOW.md`) — c'est une protection, pas un manque |
| OpenAPI / Swagger à jour | ❌ | Une ligne de checklist dans `api-review.md`. **Approche** : générer depuis le code plutôt qu'écrire à la main |
| Documentation utilisateur synchronisée | ❌ | Hors périmètre technique — prévoir un `docs/USER_GUIDE.md` par projet |
| Capture centralisée des erreurs (Sentry) | 🟡 | Mentionné dans `pwa-deploiement` §6. **Manque** : l'outil nommé + la config |
| Healthchecks & uptime | ✅ | `pwa-deploiement` §6 |
| Core Web Vitals réels (RUM) | 🟡 | Labo couvert (Lighthouse). **Manque** : le terrain |

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

### Lot B — élargir les templates existants (aucun nouveau fichier)

| Gap | Fichier cible |
| --- | --- |
| Error states / partial data | `design-pwa-system/assets/checklists/mobile-pwa.md` |
| Cache strategies nommées + Background Sync + app shortcuts | `pwa-cadrage/assets/templates/BLUEPRINT.md` §6 |
| Given/When/Then | `pwa-developpement/assets/templates/SPEC-XXX.md` §3 |
| RBAC (rôle × permission) | `SPEC-XXX.md` §5 + `DATABASE.md` |
| Multi-tenant — trancher | `DATABASE.md` |
| Cookies de session | `pwa-validation/assets/checklists/security.md` |
| Sentry + RUM | `pwa-deploiement/SKILL.md` §6 |
| Lighthouse en CI | `pwa-developpement/assets/configs/ci.yml` |
| Niveau Epic | `pwa-cadrage/assets/templates/BLUEPRINT.md` (section User stories) |
| Lint sans warning ignoré | `pwa-validation/SKILL.md` §2 |

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
