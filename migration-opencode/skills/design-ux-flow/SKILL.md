---
name: design-ux-flow
description: Méthodologie UX en 10 étapes pour PWA Agence Bulles — du problème chirurgical à la découverte progressive : fonctionnalité principale unique, user flow réaliste, navigation orientée utilisateur, chemins secondaires, micro-victoires, notifications ciblées, onboarding couloir. Charger pour définir l'UX d'un produit, entre le cadrage (pwa-cadrage) et le design system visuel (design-pwa-system).
license: MIT
compatibility: opencode
metadata:
  audience: lead-dev
  domain: design
---

# design-ux-flow

## Ce que je fais
- Structure le parcours utilisateur en 10 étapes, du problème à la découverte progressive.
- S'articule avec `pwa-cadrage` (étapes 1-3) et `design-pwa-system` (persistance visuelle) — zéro duplication.

## Workflow (10 étapes, itératives)

### 1. Problème chirurgical
- Une douleur précise + un utilisateur identifiable + un bénéfice mesurable (en minutes/jours).
- Format : « on aide [qui] à [résultat concret] en [délai] parce que [pourquoi ça bloque] ».
- Interdit : « on aide les entreprises à mieux gérer leurs projets ».
- Cadrage complet → `pwa-cadrage` (stress-test).

### 2. Fonctionnalité principale unique
- Une seule, celle qui résout directement la douleur. Sans elle le produit n'a aucun sens.
- Pas deux, pas trois. Toute ambiguïté = retour étape 1.

### 3. Hiérarchisation autour
- Tout le reste existe pour soutenir la feature principale, pas l'inverse.
- Une feature qui ne sert pas cette vision sort des priorités.
- Priorisation MoSCoW → `pwa-cadrage` (blueprint).

### 4. User flow réaliste
- À chaque arrivée dans l'app : que fait l'utilisateur étape par étape ?
- Ce qu'il **voit**, ce qu'il **fait**, où il peut **bloquer**.
- Réaliste, pas idéal : inclure les hésitations et abandons réels.

### 5. Navigation principale = chemin utilisateur
- Reflète ce que l'utilisateur veut accomplir, pas l'architecture technique ni les catégories internes.
- Les onglets/liens principaux suivent le flow de l'étape 4.
- Visuel (Top App Bar, Bottom Navigation) → `design-pwa-system` (layout signature).

### 6. Chemins secondaires
- Mapper tous les autres parcours : cas limites, erreurs, raccourcis.
- Chaque chemin a une destination claire (jamais d'impasse).
- Les erreurs sont des parcours à part entière, pas des cas oubliés.

### 7. Actions clés + micro-victoires
- Lister les moments où l'utilisateur doit ressentir qu'il avance.
- Chaque action clé → feedback positif : message, animation, confettis.
- Les micro-victoires construisent l'habitude.

### 8. Notifications ciblées
- Aucune notification par défaut.
- Uniquement celles qui ramènent au bon moment pour la bonne raison.
- Une notification mal placée est pire que pas de notification.

### 9. Onboarding = couloir
- Amener au plus vite à la première valeur concrète.
- Pas une visite guidée du produit : retirer tout ce qui ralentit le chemin.
- L'action clé (étape 7) est la cible, pas la découverte du produit.

### 10. Découverte progressive
- Après la première valeur vécue, montrer le reste au bon moment.
- Leviers : tooltips contextuels, suggestions, emails de découverte ciblés.

## Règles
- Itératif : ces étapes ne sont pas linéaires à 100 % — revenir en arrière et ajuster au fil du développement.
- Toujours charger `shared-eco-tokens` en parallèle.
- Ultra-léger : listes à puces, pas de texte superflu.
- Persistance visuelle du résultat → `design-pwa-system` (MASTER.md).

## Assets
- (aucun asset requis — méthodologie auto-suffisante)
