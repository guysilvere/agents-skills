---
name: apple-design
description: Principes de design Apple et motion physique appliqués au web et PWA — latence zéro au pointerdown, manipulation directe 1:1, ressorts physiques interruptibles (springs), transfert de vélocité/momentum, matières translucides, typographie optique et accessibilité.
license: MIT
compatibility: opencode, antigravity, claude
metadata:
  audience: tous
  domain: frontend-ui
---

# Apple Design — Interfaces fluides & Motion physique

Principes issus des talks design WWDC (*Designing Fluid Interfaces*, *The Details of UI Typography*, *Principles of Great Design*), traduits pour le web (SvelteKit, CSS natif, Pointer Events, Svelte motion / Web Animations API / Motion).

L'interface prend vie quand le mouvement part de la valeur courante à l'écran, hérite de la vitesse de l'utilisateur, projette son inertie et peut être attrapé ou inversé à tout instant.

## 1. Réactivité — Tuer la latence (Kill Latency)

Le sentiment de directness s'effondre à la moindre latence.
- **Répondre au pointer-down, pas au release** : Surligner ou enfoncer un bouton dès l'appui initial. Attendre le `click` ou le touch-up donne une sensation d'inertie molle.
- **Éliminer les délais artificiels** : Auditer les debounces trop lents, timers superflus, et le délai de tap mobile (~300ms via `touch-action: manipulation`).
- **Retour continu pendant l'interaction** : Pour un drag, slider ou drawer, mettre à jour l'UI 1:1 pendant le geste, jamais seulement quand le geste se termine.

```css
/* Feedback instantané sur l'appui */
.btn-action:active {
  transform: scale(0.97);
  transition: transform 80ms ease-out;
}
```

## 2. Manipulation directe — Suivi 1:1

L'élément doit rester collé au doigt et respecter le décalage de saisie initial (*grab offset*). Un élément qui saute pour se centrer sous le doigt casse l'immersion.

- Utiliser les Pointer Events avec `setPointerCapture` pour garantir le suivi même si le curseur sort de l'élément.
- Conserver un historique glissant de position + timestamp (les 3-5 derniers événements `pointermove`) pour calculer la vitesse réelle au relâchement.

```js
el.addEventListener('pointerdown', (e) => {
  el.setPointerCapture(e.pointerId);
  const grabOffset = e.clientY - el.getBoundingClientRect().top;
});
```

## 3. Interruptibilité — Règle cardinale

Chaque animation doit être interruptible et réorientable à tout moment. L'utilisateur doit pouvoir attraper un élément en plein vol et l'inverser sans attendre la fin de l'animation.

- **Ne jamais verrouiller les entrées utilisateur** pendant une transition.
- **Toujours animer depuis la valeur affichée réelle (*presentation value*)**, jamais depuis la valeur cible. Lire le `transform` calculé en direct pour éviter tout saut visuel.
- **Éviter les transitions CSS fixes et keyframes** pour les gestes tactiles : préférer des ressorts physiques (*springs*) qui conservent et fusionnent la vitesse.
- **Décomposer les mouvements 2D** en ressorts X et Y indépendants.

## 4. Comportement physique — Ressorts (Springs)

Remplacer les durées fixes par deux paramètres physiques :
- **Damping ratio** : Contrôle le rebond / oscillation.
  - `1.0` = Critiquement amorti (*critically damped*), arrêt doux sans rebond (défaut recommandé).
  - `< 1.0` = Sous-amorti, rebondit.
- **Response** : Rapidité à atteindre la cible (en secondes).

**Valeurs de référence :**

| Interaction | Damping | Response |
|---|---|---|
| Repositionnement / déplacement | `1.0` | `0.4` |
| Rotation / flip | `0.8` | `0.4` |
| Drawer / bottom-sheet | `0.8` | `0.3` |

Réserver le rebond (`damping ~0.8`) **uniquement lorsque le geste initial portait de l'élan** (flick, lancer, relâchement vif de drag). Un menu qui s'ouvre ne doit pas rebondir.

## 5. Transfert de vélocité (Velocity Handoff)

Quand le doigt quitte l'écran, l'animation doit continuer à la vitesse exacte du geste pour supprimer toute discontinuité de vitesse.

```
relativeVelocity = gestureVelocity / (targetValue - currentValue)
```

## 6. Projection de momentum

Ne pas ancrer au point le plus proche du lieu de relâchement, mais **projeter le point d'atterrissage** selon la vitesse :

```js
// Décélération exponentielle scroll
function project(initialVelocity, decelerationRate = 0.998) {
  return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
}

const projectedEndpoint = currentPosition + project(releaseVelocity);
const target = nearestSnapPoint(projectedEndpoint);
```

## 7. Cohérence spatiale

- **Entrée et sortie par le même chemin** : Un panneau qui entre par la droite doit se fermer vers la droite.
- **Ancrer l'interaction à sa source** : Menus, popovers et bulles doivent naître de l'élément déclencheur (`transform-origin` sur le bouton déclencheur).
- **Courbes miroirs sur transitions réversibles** : Inverser les points de contrôle Bézier pour le retour.

## 8. Typographie optique, Tracking & Leading

- **Le tracking (letter-spacing) dépend de la taille** :
  - Grands titres : tracking légèrement négatif (`-0.02em` à `-0.03em`) pour resserrer les glyphes.
  - Texte courant / petit texte : tracking neutre ou légèrement positif pour préserver la lisibilité.
- **L'interlignage (line-height) varie inversement à la taille** :
  - Grands titres : interlignage serré (`1.05` à `1.15`).
  - Corps de texte : interlignage aéré (`1.5` à `1.6`).
- **Unités relatives (`rem` / `em`)** pour s'adapter au Dynamic Type et aux réglages d'accessibilité de l'appareil.

```css
:root { font: 100%/1.5 system-ui, -apple-system, sans-serif; }

.heading-display {
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.1;
  letter-spacing: -0.025em;
}
```

## 9. Matières & Flous (Depth & Materials)

- Utiliser `backdrop-filter: blur(12px) saturate(180%)` pour laisser transparaître le contenu sous les barres de navigation et sheets.
- Prévoir un fallback solide pour la réduction de transparence :

```css
@media (prefers-reduced-transparency: reduce) {
  .translucent-chrome {
    background: var(--surface-solid);
    backdrop-filter: none;
  }
}
```

## 10. Accessibilité & Mouvements réduits

- Désactiver les translations et rebonds pour les utilisateurs sensibles :

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .sheet {
    transform: none !important;
    transition: opacity 150ms ease !important;
  }
}
```

## Quick Reference

| Besoin | Technique | Valeur cible |
|---|---|---|
| Ressort UI par défaut | Critiquement amorti | `damping 1.0`, `response 0.3–0.4` |
| Ressort avec impulsion | Sous-amorti léger | `damping ~0.8`, `response 0.3` |
| Interruption propre | Partir de la valeur affichée | Calcul `getComputedStyle` / matrice transform |
| Drag 1:1 | Pointer Events | Conserver `grabOffset` + `setPointerCapture` |
| Titres d'affichage | Tracking serré | `-0.02em`, `line-height: 1.1` |
| Mouvements réduits | Fondu enchaîné simple | `opacity` uniquement via `prefers-reduced-motion` |
