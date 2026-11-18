# Construction, Vérification & Capture

## Step 4 : Construction de la page

- Vrai HTML sémantique (`<h1>`, `<p>`, navigation accessible). Le moteur lit `data-sc-*` et ne génère jamais de DOM.
- Tokens de style dans `:root` (palette de base, typographies text et display).
- Règles de composition et d'espacement : se référer à `references/taste.md` et `references/template.html`.

## Step 5 : Vérification frame-by-frame

Procédure de vérification par scroll complet (détail dans `references/verify.md`) :
```bash
# Dans le projet
node <skill>/scripts/shoot.mjs --url https://<projet>.test --out lab/shots
node <skill>/scripts/shoot.mjs --url https://<projet>.test --out lab/mobile --width 390 --height 844
node <skill>/scripts/shoot.mjs --url https://<projet>.test --out lab/reduced --reduced-motion
```

Points vérifiés automatiquement :
- Absence de **dead scroll** (zones de scroll où rien ne bouge sans intention).
- Cues et titrages atteignant une opacité complète (100 %).
- Contraste mesuré sur le rendu composite réel.
- Contact sheet `sheet.png` pour validation visuelle de chaque acte.

Vérification mobile réelle :
- Les comportements vidéo iOS (décodeur, Low Power Mode, autoplay) diffèrent de Chrome headless.
- Déployer `references/device-diag.html` au moindre doute pour diagnostic sur appareil physique.
