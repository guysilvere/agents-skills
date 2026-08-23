# <Nom du projet>

> <Tagline : une phrase — ce que fait l'app, pour qui, en quoi c'est utile>

## Contexte
<1-2 paragraphes : le problème résolu, la cible, le contexte d'usage>

## Stack
| Couche | Technologie |
|--------|-------------|
| Front | Vite + React + TypeScript (PWA) |
| Back | [Hono / Fastify / PocketBase] |
| Base | PocketBase (SQLite) / Turso |
| Auth | [Google + email/magic link + Turnstile] |
| Paiements | Jèko + CinetPay |
| Emails | Brevo / Mailtrap |
| Stockage | Cloudflare R2 |
| Déploiement | Coolify + Cloudflare |

## Fonctionnalités
- [x] Feature 1 (MVP)
- [ ] Feature 2 (v1)
- [ ] Feature 3 (v2)

## Démarrage
```bash
npm install
npm run dev        # preview locale : http://<projet>.test via Caddy
```

## Architecture
<brève description + lien vers docs/BLUEPRINT.md>

## Évolutions prévues
- v2 : ...
- v3 : ...

---
*Conçu et développé par **Agence Bulles** (agencebulles.net).*
