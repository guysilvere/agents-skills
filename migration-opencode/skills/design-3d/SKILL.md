---
name: design-3d
description: Création de visuels 3D procéduraux Three.js à partir d'une image de référence (héros produits, objets animés, dioramas) pour landings et SaaS Agence Bulles. Wrapper léger du pipeline img2threejs — reconstruction par code (primitives + shaders procéduraux), pas de meshes téléchargés. Charger quand un visuel 3D est requis.
license: MIT
compatibility: opencode
metadata:
  audience: lead-dev
  domain: design
---

# design-3d

## Ce que je fais
- Reconstruit un objet d'une image de référence en modèle Three.js 100 % code (TypeScript).
- Sortie : `THREE.Group` prêt à animer (pivots, sockets, `userData.tick`).
- Pipeline en passes avec gates qualité — jamais de mesh files, jamais de photogrammétrie.

## Quand l'utiliser
- Héros de landing avec objet produit 3D (montre, casque, earbuds, appareil).
- Objet animé en boucle (rotation, idle) sur page SaaS.
- Diorama / scène isométrique (illustration de fonctionnalité).
- NE PAS l'utiliser pour : personnages photoréalistes, environnements, jeux (hors périmètre Agence Bulles).

## Prérequis
- Repo cloné : `git clone https://github.com/img2threejs/img2threejs.git` (sous `~/.config/opencode/skills/design-3d/` ou lien symbolique).
- Python 3.10+ (stdlib uniquement, rien à installer).
- Invocation : image de référence fournie (fichier ou capture).

## Pipeline (une passe à la fois, gates à chaque étape)
1. **Intake** : `python3 forge/stage1_intake/probe_image.py <image>` — métadonnées + problèmes techniques.
2. **Assessment** : `python3 forge/stage2_spec/new_pre_spec_assessment.py "Nom" --image <image> --out assessment.json` — classifier objet, score complexité.
3. **Detail inventory** : énumérer les détails identitaires (gloss, biseaux, vis, lignes gravées, usure). Chaque détail doit être placé sur un composant réel — jamais faker.
4. **Spec** : `python3 forge/stage2_spec/new_sculpt_spec.py "Nom" --image <image> --assessment assessment.json --out spec.json` puis `validate_sculpt_spec.py spec.json --strict-quality` — blocage si spec superficielle.
5. **Build par passes** : `blockout → structural → form → material → surface → lighting → interaction → optimization` via `generate_threejs_factory.py`.
6. **Review** : comparaison côte-à-côte (référence vs render) — passer uniquement si la passe matche. Ne pas avancer sans gate passé.
7. **Runtime** : exposer pivots/sockets pour ce qui bouge + `userData.tick` pour idle loop.

## Matériaux
- Dériver classe de finition + stops de dégradé depuis les pixels de référence, pas de mémoire.
- Flagguer toute couleur qui ne survivra pas au tone-mapping.
- Registry de matériaux Three.js versionné (`docs/materials/README.md`).

## Règles
- **Fidélité honnête** : une image ne révèle pas les faces cachées → inférer par miroir, signaler les zones non vues comme basse confiance. « Impossible d'atteindre cette fidélité depuis cette image » est un résultat valide.
- **Token-efficient** : les scripts Python valident/gatent, le modèle ne juge que visuellement (une sheet de comparaison par passe). Ne pas re-lire tout le modèle à chaque itération.
- **Fail-closed** : le générateur bloque (`BLOCKED` + métriques + cause) plutôt que d'écrire une factory non conforme. `--allow-nonstrict` uniquement pour fixtures de test.
- Charger `shared-eco-tokens` en parallèle.
- Le modèle généré est du TypeScript diffable + spec JSON — versionnable, pas de binaires multi-Mo.

## Assets
- Référence pipeline : `docs/ARCHITECTURE.md` du repo img2threejs.
- Scripts : `forge/` (Python stdlib).
- Rubrics : `grimoire/` (intake, character, review, build).
- Exemples : galerie live https://img2threejs.github.io/img2threejs-showcase/
