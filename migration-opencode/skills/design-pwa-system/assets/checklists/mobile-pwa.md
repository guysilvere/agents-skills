# Checklist — Qualité mobile / PWA

## Accessibilité
- [ ] Contraste texte ≥ 4.5:1 (WCAG AA) — testé en clair ET sombre
- [ ] Focus visible partout
- [ ] Aucune information transmise par la couleur seule
- [ ] Labels sur toutes les icônes (aria-label)
- [ ] Navigation au clavier et tactile fluide
- [ ] `prefers-reduced-motion` respecté

## Ergonomie tactile
- [ ] Cibles ≥ 44×44 px (48×48 recommandé), espacement ≥ 8 px
- [ ] Feedback au tap < 100 ms
- [ ] Aucune dépendance au survol (hover)
- [ ] Claviers mobiles adaptés : `inputmode="numeric"`, `inputmode="email"`, `autocomplete`

## Performance / CLS
- [ ] Images dimensionnées (width/height ou aspect-ratio)
- [ ] Lazy-loading ; squelettes plutôt que spinners longs
- [ ] CLS < 0.1 ; LCP < 2.5 s ; INP < 200 ms
- [ ] Pas de scroll horizontal ; `min-h-dvh` (pas `100vh`)

## Safe areas & layout
- [ ] Notch / Dynamic Island / barre de gestes respectés (barres fixes + CTA)
- [ ] `viewport-fit=cover` ; `padding-bottom: env(safe-area-inset-bottom, 16px)`
- [ ] Bottom Navigation : 3-5 onglets max, icônes + labels

## PWA & hors-ligne
- [ ] Manifest complet (standalone, portrait, icônes 192/512 + maskable)
- [ ] Service worker actif ; page de repli hors-ligne fonctionnelle
- [ ] Indicateur réseau (en ligne / hors ligne) discret

## Mouvement & mode sombre
- [ ] Animations 150-300 ms ; transform/opacity uniquement
- [ ] Variantes claire et sombre conçues ensemble, contraste testé séparément

## Avant livraison
- [ ] Testé à 375 px (mobile) + paysage + desktop
- [ ] Taille de texte système au maximum (accessibilité)
- [ ] Aucun emoji structurel dans l'interface
