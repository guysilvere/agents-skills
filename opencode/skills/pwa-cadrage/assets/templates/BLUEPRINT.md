# BLUEPRINT — <Nom du projet>

> Statut : DRAFT / APPROVED · Stack de référence : workflow phases 0–10 · Agence Bulles (agencebulles.net)

## 1. Contexte & problème
- [problème résolu, pour qui, contexte d'usage]

## 2. Proposition de valeur
- [promesse en une phrase]

## 3. Stack technique
| Couche | Choix | Justification |
|--------|-------|---------------|
| Front | PWA mobile-first — **SvelteKit par défaut** (justifier tout autre choix) + **TypeScript strict** | |
| Validation | [Zod] — nommer explicitement, pas de validation implicite | |
| Back API | **Server routes SvelteKit** (`+server.ts`) — défaut. Hono / Fastify seulement si les jobs deviennent lourds | |
| Cerveau Data/IA (option) | [Python (FastAPI / Celery / Scripts)] | Calculs financiers, OCR, pipelines IA, scraping, nesting |
| Base | **Turso** (libSQL) + Drizzle ORM — ⚠️ **pas de row-level security** → autorisation applicative | |
| Auth | [Google par défaut + email/magic link ; Turnstile anti-bot] | |
| Emails | Brevo / Mailtrap | |
| Paiements | **GeniusPay** (sandbox `pk_sandbox_…`) | |
| Stockage | Cloudflare R2 (URLs présignées, AVIF/WebP) | |
| Déploiement | Coolify + Cloudflare (proxy orange, tunnels Zero Trust) | |

## 4. Architecture
- Modules : [liste]
- Flux de données : [schéma texte]
- **Autorisation** : applicative, concentrée dans les server routes (Turso n'a pas de RLS) → matrice dans `docs/DATABASE.md`
- Jobs planifiés : tâche planifiée Coolify appelant un endpoint protégé (pas de scheduler natif dans SvelteKit)
- Points d'extension prévus : [API publique, exports, multi-comptes, intégrations, i18n]

## 5. User stories (MoSCoW)

> Découpage : **Epic** (un domaine fonctionnel) → **User Story** (une capacité) → **SPEC-XXX** (l'unité livrable).
> Une Epic sans aucune story `Must` ne devrait pas figurer dans le MVP.

### Epic 1 — [nom du domaine]
- **Must** — En tant que **[rôle]**, je veux **[action]**, afin de **[valeur]** → SPEC-XXX
- **Should** — En tant que **[rôle]**, je veux **[action]**, afin de **[valeur]**
- **Could** — ...
- **Won't (cette version)** — ...

### Epic 2 — [nom du domaine]
- **Must** — ...

## 6. Exigences PWA

### Manifest
- Complet : `display: "standalone"`, `start_url`, `theme_color`, `background_color`, portrait
- Icônes **192/512 + variante `maskable`**
- **Raccourcis d'actions rapides** (`shortcuts`) : [2-3 actions les plus utiles, accessibles par appui long sur l'icône]

### Stratégies de cache (décision explicite, par type de ressource)
| Ressource | Stratégie | Pourquoi |
| --- | --- | --- |
| App shell (HTML, JS, CSS) | **Cache First** | l'app doit démarrer sans réseau |
| Assets immuables (polices, icônes, images versionnées) | **Cache First**, nommés par hash | jamais invalidés |
| Données d'API (lecture) | **Network First**, repli cache | données fraîches prioritaires |
| Données peu changeantes (référentiels) | **Stale While Revalidate** | affichage instantané + rafraîchissement |
| Navigation hors ligne | page de repli `/offline.html` | message clair, pas une erreur navigateur |

> Ne pas laisser les valeurs par défaut décider : chaque type de ressource a une stratégie **choisie**.

### File d'attente hors ligne (mutations)
- Les écritures (POST/PUT/DELETE) faites hors ligne sont **mises en file** : [IndexedDB / autre]
- **Rejeu au retour du réseau** : Background Sync si supporté, sinon rejeu sur l'événement `online`
- **Résolution des conflits** : [dernière écriture gagne / versionnage / rejet]
- L'utilisateur **voit l'état** de sa file : en attente / envoyé / échoué

### Mise à jour du service worker
- Jamais de version figée chez l'utilisateur : `skipWaiting` + notification « nouvelle version disponible »

### Performance
- **Budget** : JS initial < [150] KB gzip · images AVIF/WebP · cible réseau lent (3G). Toute régression au-delà bloque la PR.
- **Labo** : LCP < 2.5 s · CLS < 0.1 · **TBT < 200 ms** — l'**INP** est une métrique terrain, non mesurable en audit Lighthouse
- **Terrain (RUM)** : cibles p75 — LCP < 2.5 s · INP < 200 ms · CLS < 0.1
- **Installabilité** : vérifiée via **DevTools → Application** (Lighthouse ≥ 12 n'audite plus la catégorie PWA)

## 7. Plan de développement
- Jalon 1 : [livrable] → dépend de : [rien]
- Jalon 2 : [livrable] → dépend de : [jalon 1]
- [ordre de construction + dépendances]

## 8. Perspectives d'évolution
- v2 : [piste + point d'extension concerné]
- v3 : [piste + point d'extension concerné]

## 9. Monétisation
- Modèle + paliers (cf. CADRAGE.md)
- Webhooks GeniusPay (`X-GeniusPay-Signature`), dunning, factures PDF

## 10. Hébergement & domaines
| Usage | Sous-domaine | Cible |
|-------|--------------|-------|
| App prod | `<domaine>` | app (port 80) |
| Staging app | `staging.<domaine>` | app staging + base Turso de staging |
| Console Coolify | `coolify.<domaine>` | tunnel Zero Trust |

## Routes API & webhooks (ajouts à chaque évolution)
- `POST /api/...` : [payload / usage]
- Webhook `X-GeniusPay-Signature` : [signature, idempotence, machine à états]

## Questions ouvertes
- [ ] [question]
