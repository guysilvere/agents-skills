# CHANGELOG

> Versioning SemVer — les changements notables sont listés par version.

## [1.1.0] — 2026-08-20

### Ajouté
- **Skill `design-3d`** : visuels 3D procéduraux Three.js depuis une image (wrapper léger img2threejs, héros produits/objets animés).
- **`design-pwa-system`** : 3 nouveaux assets de référence — `brief-inference.md` (Design Read avant de coder), `dials.md` (VARIANCE/MOTION/DENSITY + presets), `design-md-library.md` (15 références DESIGN.md de sites réels, par lien).
- **`pwa-validation`** : tests E2E playwright-cli (nouvelle checklist `e2e.md`) + audit design automatisé `npx impeccable detect` dans la séquence de validation.
- **`ops-quality`** : workflow enrichi — étapes E2E (playwright-cli) et audit design (impeccable) avant Lighthouse ; permission `playwright-cli *`.

### Modifié
- README : liste des skills 10 → 11.

### Sources externes référencées (non copiées)
- taste-skill (Leonxlnx) — mécanique brief inference + dials, condensée.
- impeccable (pbakaus) — outil CLI `detect` (npm), 59 règles déterministes.
- playwright-cli (microsoft) — tests E2E (npm global).
- awesome-design-md (voltagent) — bibliothèque DESIGN.md par liens.
- img2threejs — pipeline 3D, cloné pour la skill `design-3d`.
