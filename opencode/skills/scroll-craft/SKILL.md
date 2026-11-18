---
name: scroll-craft
description: Conception de landing pages et sites vitrines premium scrollytelling (8 grammaires, hero multi-plans, scrubbing video et validation frame-by-frame shoot.mjs). Utiliser pour les sites vitrines et landings marketing (Phases 3 et 9). Ne pas utiliser pour les interfaces applicatives ou dashboards SaaS (voir design-pwa-system et design-ux-flow).
license: MIT
compatibility: opencode, antigravity, claude
metadata:
  audience: lead-dev
  domain: design
---

# scroll-craft

## Intégration Agence Bulles (règles prioritaires)
- **Périmètre** : uniquement pour **landing pages & sites vitrines premium** (Phases 3 & 9). L'app/SaaS interne reste sous `design-pwa-system` + `design-ux-flow`.
- **Stack SvelteKit** : monter `engine/scrollcraft.js` côté client (`onMount`) sur du vrai markup Svelte (sans casser le SSR) et importer `engine/scrollcraft.css`. Dériver les tokens `--sc-*` depuis `docs/DESIGN_SYSTEM.md` (`MASTER.md`) pour l'harmonie Landing ↔ SaaS.
- **Brief & Registre** : pré-remplir `BRIEF.md` depuis `docs/CADRAGE.md` (ne pas ré-interviewer ce qui est déjà validé en Phase 0). Utiliser `~/Projets/FINGERPRINTS.md` comme registre central anti-répétition (ou `.scrollcraft.json`).
- **Validation locale (Step 5)** : déléguer à `ops-quality` sur `https://<projet>.test` (Docker/OrbStack + Caddy) — ne pas utiliser `serve.mjs` sur `localhost:4500`.
- **Assets & Secrets** : mode *bring-your-own-assets* ou `design-3d` prioritaire ; `KIE_AI_API_KEY` optionnelle dans `~/.config/opencode/.tokens/kie` (`chmod 600`) ou `.env.local` (jamais commitée). Images fixes en AVIF/WebP ; clips lourds servis via Cloudflare R2 si besoin.

## Principes fondamentaux
1. **Variété obligatoire** : au moins 4 familles de devices distinctes par page, jamais le même device deux fois de suite (`references/devices.md`).
2. **Photographique par défaut** : pas de dioramas 3D ou argile basse définition par défaut (`references/worlds.md`).
3. **Hero multi-plans dimensionnel** : plans d'arrière-plan, sujet, premier plan et atmosphère se déplaçant à vitesses relatives (`references/hero-depth.md`).
4. **Pas de chaîne continue fragile** : scènes et chapitres distincts préférés au vol caméra ininterrompu (`references/uniqueness.md`).

## Étapes de réalisation & Références

| Étape | Rôle & Action clé | Référence détaillée |
|---|---|---|
| **Step 0 & Boot** | Brief d'intention, courbe d'énergie & setup workspace (`scripts/doctor.mjs`) | [references/brief-and-hero.md](references/brief-and-hero.md) |
| **Step 1 & 2** | Journey en 4-7 beats, choix grammaire, signature move & score | [references/grammar-and-scoring.md](references/grammar-and-scoring.md) |
| **Step 3** | Génération des assets (preamble stable, encode scrub dense) | [references/assets.md](references/assets.md) |
| **Step 4** | Intégration HTML/Svelte sémantique & tokens CSS | [references/build-and-verify.md](references/build-and-verify.md) |
| **Step 5** | Vérification frame-by-frame via `shoot.mjs` (dead scroll, opacité, contraste) | [references/build-and-verify.md](references/build-and-verify.md) & [references/verify.md](references/verify.md) |

## Hard rules (invariants non négociables)

| Interdit | Règle obligatoire |
|---|---|
| Diorama argile / low-poly par défaut | Rendu photographique ou direction d'art authentique (`worlds.md`) |
| Indicateur "Scroll to explore", souris animée, flèche | Rien : le visiteur sait scroller dès le hero |
| Compteurs de section `01 / 06` | Supprimer : la pagination n'apporte aucune valeur narrative |
| Tiret cadratin (`—`) visible | Remplacer par point, virgule, deux-points ou parenthèses |
| Même device deux fois de suite | Alterner les familles de devices au score (`devices.md`) |
| Page sans pic émotionnel ou avec 3 pics concurrents | Un pic unique, préparé par un silence et doté du plus grand scroll (`feel.md`) |
| Fin qui s'éteint dans le vide ou simple footer | La fin résout et tient la promesse (`uniqueness.md`) |
| Projet répétant les empreintes antérieures (< 4/6 dimensions) | Modifier le plan avant de générer (`FINGERPRINTS.md`) |
| Altérer le code de l'engine | Logique custom codée dans la page via `--sc-p` et `data-sc-*` |
| Texte incrusté dans une image générée | Vrai texte HTML/Svelte sélectionnable, contrasté et accessible |
| Chiffres inventés dans des compteurs | Uniquement des données réelles et vérifiables |
| `transition: all` ou animation top/left/width/height | Uniquement `transform`, `opacity` et `clip-path` |
| Livrer sans exécuter la validation Step 5 | Exécution `shoot.mjs` obligatoire par `ops-quality` |

## Livrables attendus
- Dossier de build contenant `BRIEF.md` et le code SvelteKit/HTML.
- Rapport court : grammaire choisie, signature move, validation gate `FINGERPRINTS.md`, contact sheet `sheet.png`.
- Ligne ajoutée au registre central des empreintes `FINGERPRINTS.md`.
