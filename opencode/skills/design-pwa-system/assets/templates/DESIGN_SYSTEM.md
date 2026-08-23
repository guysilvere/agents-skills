# DESIGN_SYSTEM — <Nom du projet>

> Source de vérité visuelle. Mis à jour à chaque dérive code/doc (Living Documentation). Ultra-léger.

## Direction artistique
- **Thèse** : [en une phrase — ce qui rend cette interface distinctive]
- **Élément signature** : [le risque esthétique assumé, unique]

## Tokens couleurs (hex)
| Token | Valeur | Usage |
|-------|--------|-------|
| `--color-primary` | `#D81B60` | Actions principales, liens |
| `--color-bg` | `#FFFFFF` | Fond principal |
| `--color-surface` | `#FFFFFF` | Cartes, feuilles |
| `--color-text` | `#1A1A1A` | Texte principal |
| `--color-text-muted` | `#134242` | Texte secondaire |
| `--color-accent` | `#C2E8E8` | Surlignages, badges |
| `--color-danger` | `#DC2626` | Erreurs, destructions |
| `--color-*` (dark) | ... | Variante mode sombre |

## Typographie
| Token | Famille | Usage |
|-------|---------|-------|
| `--font-display` | [Product Sans / autre] | Titres, affichage |
| `--font-body` | [Open Sans / autre] | Texte courant |
| `--font-mono` | [mono] | Code, chiffres |

## Espacements & rayons
- Spacing : 4/8/12/16/24/32 px
- Cards : `rounded-xl` (mobile) / `rounded-2xl` (desktop), `p-4` / `p-6`
- Cibles tactiles : ≥ 48×48 px

## Composants standardisés
- Boutons : [variantes primary/secondary/ghost/danger]
- Alertes & toasts : [styles]
- Inputs : [états focus/error/disabled]
- Data tables : cartes empilées mobile / tableau desktop scroll horizontal doux
- Auth : layout dédié centré, boutons OAuth, widget Turnstile

## Layout Signature
- Top App Bar 56px · Bottom Navigation 3-5 onglets · FAB bas droite · Bottom Sheets
- Safe areas : `env(safe-area-inset-bottom, 16px)`

## Icônes
- Bibliothèque unique : **[Lucide]** — pas d'emoji structurel

## Overrides par page
- `design-system/pages/<page>.md` : écart par rapport au MASTER

## Checklist avant livraison
- [ ] Contraste ≥ 4.5:1 (clair + sombre)
- [ ] Tester à 375px + paysage + taille de texte système max
- [ ] `prefers-reduced-motion` respecté
- [ ] Mode hors-ligne OK
