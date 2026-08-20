---
name: design-pwa-system
description: Intelligence de design UI/UX pour PWA mobiles Agence Bulles — direction artistique anti-générique, recherche de références (palettes, styles, typographies, responsive), persistance d'un design system (MASTER.md + overrides) et checklist qualité mobile/PWA. Charger pour concevoir, construire ou revoir toute interface (landing + SaaS).
license: MIT
compatibility: opencode
metadata:
  audience: lead-dev
  domain: design
---

# design-pwa-system

## Ce que je fais
- Fusionne les anciennes skills design-pwa, design-pwa-direction, design-pwa-data et responsive-design.
- Fixe une direction esthétique distinctive (anti-générique) et la persiste en design system.

## 1. Direction artistique (avant de coder)
- **Couleur** : palette ancrée dans le contexte réel de l'app (pas Bootstrap/Material par défaut). Stack Agence Bulles : `#D81B60` (rose framboise) · `#1A1A1A` · `#FFFFFF` · `#C2E8E8` · `#134242` — adapter par projet.
- **Typographie** : police d'affichage caractérielle (avec retenue) + police de texte lisible. Référence : Product Sans (titres) + Open Sans (corps).
- **Layout** : structure qui hiérarchise l'information ; élément « signature » unique (un seul risque esthétique justifié).
- **Critique anti-générique** : « Ce design pourrait-il appartenir à n'importe quelle autre app ? » → si oui, recommencer.

## 2. Méthode en 2 passes
1. **Plan** : mini-système de tokens — 4-6 couleurs nommées (hex), 2+ familles typo (affichage/texte/utilitaire), concept de layout, élément signature.
2. **Critique** : réviser ce qui ressemble au défaut générique, expliquer pourquoi, puis coder en dérivant chaque choix du plan.

## 3. Recherche de références
- Assets : `assets/data/palettes.json` (96 palettes) et `assets/data/styles.json` (67 styles) pour trouver des références concrètes avant de figer les choix.
- Typos : 57 font pairings référencés ; choisir une paire puis la figer dans le design system.

## 4. Persistance (MASTER + overrides)
- Écrire le design system validé dans `design-system/MASTER.md` (source de vérité : couleurs, typo, espacements, effets, états).
- Page spécifique → `design-system/pages/<page>.md` qui surcharge le MASTER.
- Avant de construire une page : lire l'override de la page s'il existe, sinon appliquer le MASTER exclusivement.
- Template : `assets/templates/DESIGN_SYSTEM.md`.

## 5. Layout Signature PWA (mobile-first, adaptatif desktop)
- **Top App Bar** : 56px max, titre contextuel, bouton retour auto en sous-page, actions à droite.
- **Bottom Navigation** : ancrée en bas, 3-5 onglets max, `padding-bottom: env(safe-area-inset-bottom, 16px)`, sidebar ≥ 768px.
- **FAB** : action créatrice centrale, bas droite au-dessus de la nav.
- **Bottom Sheets** : panneaux coulissants au lieu de modales centrées sur mobile.
- **Cards** : `border-neutral-200 dark:border-neutral-800`, `rounded-xl/2xl`, `p-4` mobile / `p-6` desktop ; empty states + skeletons soignés.
- CSS de référence : `assets/configs/layout-signature.css`.

## 6. Responsive design
- Grid/Flexbox, Container Queries, typographie fluide, images adaptatives.
- Mobile-first ; breakpoints `min-width` ; jamais de scroll horizontal.
- Ergonomie tactile : cibles ≥ 48×48px, feedback au tap < 100 ms.
- Ne pas désactiver le zoom ; `viewport-fit=cover` ; `min-h-dvh`.

## 7. Checklist qualité mobile/PWA (grille de revue)
- Accessibilité : contraste texte ≥ 4.5:1, focus visible, jamais d'info par couleur seule, labels sur icônes.
- Tactile : cibles ≥ 44×44px, espacement ≥ 8px, pas de dépendance au survol.
- CLS : images dimensionnées, lazy-loading, CLS < 0.1, skeletons.
- Safe areas : notch, Dynamic Island, barre de gestes.
- Mouvement : 150-300 ms, animer transform/opacity, `prefers-reduced-motion`.
- Hors-ligne : message d'état + fonctionnalités de base.
- Icônes : SVG (Lucide/Heroicons), jamais d'emoji structurel, trait cohérent.
- Mode sombre : variantes conçues ensemble, contraste testé séparément.
- Checklist : `assets/checklists/mobile-pwa.md`.

## Règles
- Toujours charger `shared-eco-tokens` en parallèle.
- Harmonie absolue landing + SaaS : mêmes couleurs, polices, icônes.
- Une seule bibliothèque d'icônes : Lucide, Tabler, Phosphor, React Icons ou Remix.
- Aucun emoji dans l'interface sauf demande explicite.

## Assets
- `assets/templates/DESIGN_SYSTEM.md`
- `assets/configs/layout-signature.css`
- `assets/checklists/mobile-pwa.md`
- `assets/data/palettes.json`
- `assets/data/styles.json`
