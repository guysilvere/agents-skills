# Checklist E2E — playwright-cli

> Tests de parcours réels dans un vrai navigateur, avant commit. Complète Lighthouse (perf statique) par la vérification fonctionnelle.
> Prérequis : `npm install -g @playwright/cli@latest` + `playwright-cli install --skills`.

## Scénarios types SaaS (adapter par projet)
- [ ] **Auth** : inscription → vérification email → login → logout (capture screenshot chaque étape)
- [ ] **Paiement Jèko/CinetPay** : sélection montant → redirection passerelle → retour succès → état commande mis à jour (mock réseau si sandbox indisponible)
- [ ] **CRUD principal** : créer → lister → éditer → supprimer (vérifier les empty states)
- [ ] **Navigation** : bottom nav 3-5 onglets, retour en sous-page, FAB
- [ ] **Hors-ligne** : page de repli + fonctionnalités de base (Service Worker)
- [ ] **Responsive** : mobile émulation (`--device="iPhone 15"`) + desktop ≥ 768px
- [ ] **Formulaires** : validation, erreurs inline, contraste boutons (cf. checklist a11y)

## Commandes essentielles
- `playwright-cli open <url> --headed` / `--mobile` / `--device="iPhone 15"`
- `playwright-cli snapshot` → refs éléments ; `snapshot --filename=after-click.yaml`
- `playwright-cli click e15` / `fill e20 "texte" --submit` / `press Enter`
- `playwright-cli find "Texte"` / `find --regex "/regex/i"`
- `playwright-cli screenshot --filename=ok-checkout.png --hires`
- Sessions : `playwright-cli -s=todo open <url>` · `list` · `close-all`
- Mock réseau : `playwright-cli route <pattern>` / `route-list` / `unroute`

## Sorties attendues (par scénario)
- [ ] Screenshots succès ET échec nommés (`ok-*.png`, `fail-*.png`)
- [ ] Snapshot YAML après chaque action clé
- [ ] Console : aucun `error` bloquant (`playwright-cli console error`)
- [ ] Pas de scroll horizontal, pas de cibles < 44px (croiser avec Lighthouse a11y)

## Vérification de la démo
- Parcours todomvc : `https://demo.playwright.dev/todomvc/` — add → check → clear completed → screenshot.
