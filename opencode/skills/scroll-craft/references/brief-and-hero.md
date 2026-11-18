# Step 0 & Bootstrap — Brief créatif & Préparation de l'environnement

## Step 0 : Établir le brief et l'autorité créative

**Établir le brief avant de générer quoi que ce soit.** Réutiliser les réponses et assets déjà fournis dans `docs/CADRAGE.md`. Quand l'utilisateur délègue explicitement la direction créative, rédiger un brief marqué `Self-authored under explicit creative delegation` et continuer sans forcer de checkpoint redondant.

Questions directrices (en une seule passe) :
1. **Vibe en 3 à 5 mots**, plus 3 références hors-web (film, pochette, magazine, architecture).
2. **Parcours de scroll (journey)** : premier contact, enchaînement, résolution finale.
3. **Courbe d'énergie & émotionnelle** : où est le calme, où est l'intensité, quel est le pic unique à retenir (`references/feel.md`).
4. **Signature move** : une interaction singulière qu'aucun autre site n'a (`references/uniqueness.md`).
5. **Aesthetic family** : minimaliste, brutaliste, maximaliste, éditorial, rétro (`references/uniqueness.md §5`).
6. **Monde continu ou scènes distinctes** : flight continu ou chapitres distincts (`references/worldflight.md`).
7. **Assets existants** : photos réelles, logo, vidéo, kit de marque (réduire la génération).

Consigner dans `<workspace>/builds/<name>/BRIEF.md`.

---

## Bootstrap & Workspace

Vérifier les prérequis avant l'étape 1 :
```bash
node <skill>/scripts/doctor.mjs
```

Résolution du workspace (builds + registre des empreintes `FINGERPRINTS.md`) :
```bash
node <skill>/scripts/workspace.mjs --ensure
```

Clés et tokens :
- `KIE_AI_API_KEY` optionnelle dans `~/.config/opencode/.tokens/kie` (`chmod 600`) uniquement si des assets doivent être générés.
- Moteurs : copier `engine/scrollcraft.js` et `engine/scrollcraft.css` sans jamais les modifier par projet (thématisation par tokens CSS).
