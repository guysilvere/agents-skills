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

## Liens
- Rules projet : `.agents/rules/*.md`
- Skills globales : `~/.gemini/config/skills/`
- Agents globaux : `~/.gemini/config/agents/`
