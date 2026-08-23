# Stack — Tableau de référence (Agence Bulles)

## Frontend (PWA mobile-first)
| Rôle | Outil | Pourquoi |
|------|-------|----------|
| Bundler | **Vite** | Rapide, standard, PWA native |
| UI framework | **React** (complexe) / **Vanilla JS** (léger) | Selon la complexité |
| CSS | **Tailwind CSS** | Utilitaires, mobile-first |
| Icônes | **Lucide** | SVG, tree-shakeable |
| State | **Zustand** | Minimaliste |
| PWA | **vite-plugin-pwa** (Workbox) | Manifest + SW préconfigurés |

## Backend
| Rôle | Outil | Pourquoi |
|------|-------|----------|
| API légère | **Hono** | TS natif, Node/Bun/Edge |
| API complète | **Fastify** | Middleware, plugins |
| BaaS | **PocketBase** — **défaut** | BDD + auth + fichiers + realtime en 1 binaire Go (~30 Mo, ~20-50 Mo RAM) |

## Base de données
| Cas | Outil |
|-----|-------|
| App simple / PocketBase | SQLite intégré (PocketBase) |
| ORM TypeScript | Drizzle ORM + SQLite/PostgreSQL |
| Relationnel complexe | PostgreSQL (Docker/Coolify) |
| Distribution edge | **Turso** (libSQL) + Cloudflare R2 |

## Auth
| Cas | Outil |
|-----|-------|
| Intégrée | PocketBase Auth (email, OAuth2 Google, magic link) |
| Standalone | Auth.js / Clerk — ⚠️ **Lucia déprécié depuis avril 2025** |

## Tests & déploiement
| Rôle | Outil |
|------|-------|
| Unitaires/intégration | Vitest |
| E2E | Playwright |
| Conteneurs | Docker multi-stage (build → Nginx/Node) |
| Hébergement SaaS | Coolify (déploiement GitHub, SSL auto) |
| Hébergement statique client | o2switch (cPanel) |

## Pourquoi PocketBase > Supabase
- Supabase Cloud : limité à 2 projets gratuits, Pro $25/mois surdimensionné, lock-in
- Supabase self-hosted : lourd (PostgreSQL + GoTrue + Realtime + Storage, 500 Mo+ RAM)
- PocketBase : 1 binaire, SQLite, auth + fichiers + realtime + admin UI embarquée + hooks pb_hooks

## Infrastructure Cloudflare
- Proxy DNS edge (masquage IP), WAF/DDoS, Turnstile sur tous les formulaires
- R2 : médias, uploads, sauvegardes (0 egress)
- Tunnels Zero Trust : consoles d'admin (Coolify, PocketBase) sans ports ouverts

## Exigences PWA installable
- [ ] HTTPS, manifest lié, SW enregistré, start_url hors-ligne, icônes 192/512 + maskable

## Performance cible (Core Web Vitals)
| Métrique | Cible |
|----------|-------|
| LCP | < 2.5 s |
| CLS | < 0.1 |
| INP | < 200 ms |
