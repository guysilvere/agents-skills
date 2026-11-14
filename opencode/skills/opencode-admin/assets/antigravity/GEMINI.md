# <Règles globales Antigravity — GEMINI.md>

> Fichier : `~/.gemini/GEMINI.md` — appliqué à toutes les sessions Antigravity (équivalent de `~/.config/opencode/AGENTS.md` côté OpenCode). Limite : 12 000 caractères.

## Directives globales
- <règles personnelles que le LLM doit suivre partout>

## Règles Agence Bulles (à adapter selon besoins)
- Ultra-léger : listes à puces dans tous les `.md`, zéro texte superflu.
- Aucun emoji dans l'interface sauf demande explicite ; une seule bibliothèque d'icônes.
- Images compressées AVIF/WebP avant upload R2.
- Travailler sur la branche `testing`, jamais `main`.
- Aucun secret en clair.
- Comptes tests locaux : même comptes tout au long du dev, consignés dans `docs/credentials.md` (local uniquement, obligatoirement dans `.gitignore`, jamais commité). Se référer systématiquement à ce fichier ; le créer et le maintenir s'il n'existe pas.
- Lancement local (Docker, OrbStack & Caddy) : pour voir/tester le site en local, lancer toujours via Docker et OrbStack (`docker compose -f docker-compose.dev.yml up`). Démarrer automatiquement Caddy s'il est arrêté (`caddy run`), créer le site web local en `.test`/`.local` dans `~/.config/caddy/Caddyfile`, et bloquer les ports sans doublon via `~/Projets/PROJECTS_REGISTRY.md`.

## Liens
- Rules projet : `.agents/rules/*.md`
- Skills globales : `~/.gemini/config/skills/`
- Agents globaux : `~/.gemini/config/agents/`
