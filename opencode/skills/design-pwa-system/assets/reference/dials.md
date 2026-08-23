# Dials — configuration design (VARIANCE / MOTION / DENSITY)

> Mécanique condensée de taste-skill (Leonxlnx). Fixer les 3 dials après le Design Read ; chaque décision layout/motion/densité en découle.
> Baseline : 7 / 6 / 4. Override conversationnel, jamais via édition de fichier.

## Les 3 dials
- **DESIGN_VARIANCE** : 1 = symétrie parfaite · 10 = chaos artistique
- **MOTION_INTENSITY** : 1 = statique · 10 = cinématique / physique
- **VISUAL_DENSITY** : 1 = galerie d'art · 10 = cockpit / données denses

## Inférence par signal (Design Read → dials)
| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| minimaliste / calme / éditorial / Linear | 5-6 | 3-4 | 2-3 |
| premium consumer / Apple-like / luxe | 7-8 | 5-7 | 3-4 |
| joueur / Awwwards / expérimental / agence | 9-10 | 8-10 | 3-4 |
| landing / portfolio / marketing (défaut) | 7-9 | 6-8 | 3-5 |
| trust-first / secteur public / réglementé | 3-4 | 2-3 | 4-5 |
| redesign — préserver | = existant | +1 | = existant |
| redesign — refondre | +2 | +2 | = existant |

## Presets par use-case
| Use case | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Landing SaaS grand public | 7 | 6 | 4 |
| Landing agence / créative | 9 | 8 | 3 |
| Landing premium consumer | 7 | 6 | 3 |
| Portfolio designer / studio | 8 | 7 | 3 |
| Portfolio développeur | 6 | 5 | 4 |
| Éditorial / blog | 6 | 4 | 3 |
| Service public | 3 | 2 | 5 |
| SaaS dashboard / app (pwa-validation zone) | 5 | 4 | 6 |

## Lien avec design-pwa-system
- VARIANCE ≤ 4 → centré/équilibré OK. VARIANCE > 4 → anti-centré : split screen, asymétrie, whitespace maîtrisé.
- MOTION ≥ 5 → la page DOIT bouger (reveals, hover physique). `prefers-reduced-motion` obligatoire au-delà de 3. Jamais de scroll-hijack sans GSAP `start: "top top"`.
- DENSITY > 7 → bannir les cards génériques : 1px lines, `font-mono` pour les chiffres, hiérarchie par espacement.
- Mobile : toute asymétrie desktop > md DOIT se replier en colonne unique < 768px.
