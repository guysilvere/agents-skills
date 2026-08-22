# CHANGELOG

> Versioning SemVer — les changements notables sont listés par version.

## [1.3.0] — 2026-08-22

### Ajouté
- **Skill `design-ux-flow`** : méthodologie UX en 10 étapes pour PWA — problème chirurgical, fonctionnalité principale unique, user flow réaliste, navigation orientée utilisateur, micro-victoires, notifications ciblées, onboarding couloir. S'articule entre `pwa-cadrage` (étapes 1-3) et `design-pwa-system` (persistance visuelle).

### Modifié
- **`design-pwa-system`** : référence croisée vers `design-ux-flow` en amont du design visuel (parcours UX d'abord).

## [1.2.0] — 2026-08-20

### Ajouté
- **`ops-quality` (Antigravity + OpenCode)** : nouvelle capacité « Lancement des serveurs locaux » à la demande — démarrage du serveur dev + base de données (PocketBase/Turso) en arrière-plan, activation Caddy pour les URLs `.test` (`caddy run` / `caddy reload`), vérification de disponibilité et affichage d'un tableau récapitulatif (service, lien `.test`, accès dev, description ; identifiants depuis `.env`/`RUNBOOK.md`/`AGENTS.md`, jamais de secrets de prod).
- **`ops-quality` (Antigravity)** : `commandExecutionPolicy` `sandbox` → `auto` pour permettre le lancement de serveurs persistants (cohérent avec `lead-dev`).
- **`ops-quality` (OpenCode)** : permissions `docker *`, `pocketbase *`, `kill *` pour la gestion des services locaux.

### Modifié
- **`workflow-projet-vibe-code.md`** : nettoyage des références aux anciens agents (`architecte`, `chef-pwa`, `pwa-tester`, `gestionnaire-git`) → `lead-dev` (développement) et `ops-quality` (validation + livraison) dans le modèle de SPEC et les tâches d'exécution.

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
