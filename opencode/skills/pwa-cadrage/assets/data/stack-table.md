# Stack — Tableau de référence (Agence Bulles)

## Frontend (PWA mobile-first)
| Rôle | Outil | Pourquoi |
|------|-------|----------|
| Framework | **SvelteKit** — défaut | PWA mobile-first, server routes incluses, bundle minimal |
| Langage | **TypeScript strict** | Contrats de données explicites |
| Validation | **Zod** | Schémas partagés client/serveur |
| CSS | **Tailwind CSS** | Utilitaires, mobile-first |
| Icônes | **Lucide** | SVG, tree-shakeable |
| State | **Svelte runes / stores** | Natif, zéro dépendance |
| PWA | **@vite-pwa/sveltekit** (Workbox) | Manifest + service worker |
| Serveur | `@sveltejs/adapter-node` | Runtime Node.js réel → npm complet (pdf-lib, sharp, R2, Brevo) |

## Base de données
| Cas | Outil |
|-----|-------|
| **Défaut** | **Turso (libSQL)** — répliques edge, compatible SQLite |
| ORM TypeScript | **Drizzle ORM** + `@libsql/client` |
| Dev local | `file:local.db` ou `turso dev` |
| Relationnel complexe | PostgreSQL (Docker/Coolify) — cas rare |

⚠️ **Turso n'a pas de row-level security** → l'autorisation est **applicative**, concentrée dans un seul runtime. Voir `DATABASE.md`.

## Auth
| Cas | Outil |
|-----|-------|
| Défaut | **Auth.js** ou sessions signées maison, adossées à Drizzle |
| ⚠️ Déprécié | **Lucia** (avril 2025) — ne pas démarrer dessus |

## Backend
| Cas | Outil |
|-----|-------|
| **Défaut** | **Server routes SvelteKit** (`+server.ts`) — un seul conteneur, webhooks et endpoints de jobs inclus |
| Service séparé | Hono / Fastify — seulement si les jobs deviennent lourds |
| Cerveau IA / Data | **Python (FastAPI + Pydantic v2)** — calcul isolé, **sans accès à l'autorisation ni au flux d'argent** |

⚠️ Ne jamais dupliquer l'accès à la base entre deux runtimes : deux implémentations d'autorisation = IDOR.

## Tâches de fond
| Cas | Outil |
|-----|-------|
| **Défaut** | **Tâche planifiée Coolify** appelant un endpoint protégé (SvelteKit n'a pas de scheduler natif) |
| Si volume important | Worker Node dédié (BullMQ) ou Python (Celery / ARQ) |

## Tests & outillage
| Rôle | Outil |
|------|-------|
| Dev local (1er choix) | **Docker Compose (Docker Desktop)** — parité dev/prod, hot-reload, isolation |
| Unitaires / intégration | **Vitest** |
| Tests Python (IA/Data) | Pytest |
| Lint & formatage Python | Ruff / uv |
| E2E | Playwright (`playwright-cli`) |
| Conteneurs | Docker multi-stage (SvelteKit Node ou Python/FastAPI) |
| CI | GitHub Actions — secrets → lint → typecheck → tests → build |
| Hébergement SaaS | Coolify (déploiement GitHub, SSL auto) |

## Paiements
| Cas | Outil |
|-----|-------|
| **Passerelle unique** | **GeniusPay** — Wave, Orange Money, MTN, Moov, cartes bancaires |
| Sandbox | `pk_sandbox_…` / `sk_sandbox_…` — **toute intégration passe par là** |
| Doc à jour | MCP `https://geniuspay.ci/api/mcp` |

## Infrastructure Cloudflare
- Proxy DNS edge (masquage IP), WAF/DDoS, Turnstile sur tous les formulaires
- R2 : médias, uploads, sauvegardes (0 egress)
- Tunnels Zero Trust : consoles d'admin (Coolify) sans ports ouverts

## Exigences PWA installable
- [ ] HTTPS, manifest lié, SW enregistré, start_url hors-ligne, icônes 192/512 + maskable
- [ ] Installabilité vérifiée via **DevTools → Application** (Lighthouse ≥ 12 n'audite plus la catégorie PWA)

## Performance cible
| Métrique | Cible |
|----------|-------|
| LCP | < 2.5 s |
| CLS | < 0.1 |
| TBT (labo) | < 200 ms |
| INP | **terrain uniquement** — non mesurable en audit Lighthouse |
| Budget JS initial | < 150 KB gzip |
