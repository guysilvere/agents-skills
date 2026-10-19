# Checklist — Stress-Test UI & Résilience Visuelle

> Inspiré des principes `break-ui` (Emil Kowalski) et des exigences PWA Agence Bulles.
> Objectif : Valider qu'aucune disposition ne casse face à des données réelles hostiles.

---

## 1. Données textuelles hostiles
- [ ] **Chaînes ultra-longues sans espace** : URL complètes, identifiants UUID, e-mails longs (vérifier `overflow-wrap: break-word` / `text-overflow: ellipsis`).
- [ ] **Titres multi-lignes** : Noms de produits ou d'articles de plus de 4 lignes (vérifier le clampage `-webkit-line-clamp`).
- [ ] **Caractères accentués & alphabets spéciaux** : Caractères diacritiques, ligatures, chiffres arabes, symboles monétaires.
- [ ] **Noms très courts ou mono-caractère** : Initiales seules dans les avatars / pastilles (alignement centré conservé).

## 2. Valeurs numériques et financières
- [ ] **Grands montants monétaires** : Test avec des sommes FCFA à 8 ou 9 chiffres (ex: `12 500 000 FCFA`) sur badges, tableaux et cartes.
- [ ] **Montants nuls ou négatifs** : Affichage correct de `0 FCFA`, soldes négatifs, réductions `-100%`.
- [ ] **Décimales et arrondis** : Formatage des séparateurs de milliers et de décimales cohérent.

## 3. États de collection & Chargement
- [ ] **État vide (Empty State)** : Message explicite, illustration légère ou icône, action principale claire (pas d'écran blanc).
- [ ] **Un seul élément** : Mise en page stable (ne s'étire pas de manière disproportionnée).
- [ ] **Grand volume d'éléments (+100)** : Pas de ralentissement du scroll ; virtualisation ou pagination fluide.
- [ ] **Skeleton / État de chargement** : Structure identique au composant final pour éviter tout Content Layout Shift (CLS).

## 4. Contraintes d'écran & Appareils
- [ ] **Écrans ultra-étroits (360px - 320px)** : Aucun débordement horizontal involontaire du viewport.
- [ ] **Mode paysage mobile** : Clavier virtuel ouvert ne masquant pas le champ actif ou le bouton de soumission.
- [ ] **Safe Areas iOS/Android** : Prise en compte de `env(safe-area-inset-top)` et `env(safe-area-inset-bottom)` sur barres fixes.

## 5. Accessibilité & Agrandissement
- [ ] **Zoom texte 200% (Dynamic Type)** : Mise en page fluide en unités relatives (`rem` / `em`) sans texte tronqué illisible.
- [ ] **Mode sombre & contraste élevé** : Textes et bordures bien distincts avec `prefers-contrast: more`.
- [ ] **Contrôles tactiles minimum** : Cibles de tap d'au moins 44x44px.
