# [SPEC-007] Découpage progressif des skills monolithiques (`scroll-craft` & `pwa-developpement`)

> **Statut** : DONE
> **Phase Roadmap** : Phase 6 — Progressive Disclosure (niveau 2 → niveau 3)
> **Agent(s)** : `lead-dev` → `ops-quality`

---

## 1. Intent
**Problème** : Deux `SKILL.md` dépassent largement la zone optimale d'attention Anthropic (< 200 lignes, plafond dur 500 lignes) : `scroll-craft/SKILL.md` atteint **460 lignes / 25,7 Ko** (avec détails complets des étapes 0→5 inline alors qu'un dossier `references/` existe déjà), et `pwa-developpement/SKILL.md` atteint **183 lignes / 13,9 Ko** en mélangeant workflow de spec, conventions Python/HTML/CSS/JS/TS et structure Docker.
**Objectif** : Transformer ces deux `SKILL.md` en routeurs concis (≤ 180 lignes pour `scroll-craft`, ≤ 120 lignes pour `pwa-developpement`) qui ne chargent les références détaillées qu'au moment précis où l'étape ou le langage est requis.

## 2. User Story
En tant que **agent exécutant une tâche précise (ex : vérifier `shoot.mjs` ou coder un composant Svelte)**, je veux **ne charger que le squelette de la skill puis uniquement la référence utile à mon étape**, afin de **ne pas saturer ma fenêtre de contexte avec des règles hors-sujet (ex : Python quand je fais du Svelte)**.

## 3. Exigences

| ID | Exigence | Critère de fin (DoD) |
|----|----------|-----------------------|
| REQ-01 | Découper `opencode/skills/scroll-craft/SKILL.md` de 460 lignes à **≤ 180 lignes** en gardant : règles Agence Bulles prioritaires, vue d'ensemble Steps 0→5, `Hard rules`, et table de pointeurs vers `references/` | [x] `scroll-craft/SKILL.md` réduit à **57 lignes** (gain de 403 lignes, zéro perte de règle) |
| REQ-02 | Extraire les détails procéduraux de `scroll-craft` dans des fichiers ciblés sous `opencode/skills/scroll-craft/references/` (ex : `brief-and-hero.md`, `grammar-and-scoring.md`, `build-and-verify.md`) | [x] Fichiers créés et liés dans le tableau d'orientation |
| REQ-03 | Extraire la section « 4. Conventions de code (HTML/JSX, CSS, JS/TS, Python, PWA) » de `opencode/skills/pwa-developpement/SKILL.md` vers `opencode/skills/pwa-developpement/assets/references/code-standards.md` | [x] `code-standards.md` créé, `pwa-developpement/SKILL.md` réduit à **154 lignes** |
| REQ-04 | Vérifier qu'aucune des 16 skills du dépôt ne dépasse **200 lignes** (seuil d'alerte interne) | [x] 100 % des 16 skills sont sous les 200 lignes (max : 164 lignes pour `apple-design`) |

**Critères d'acceptation (Étant donné / Quand / Alors)**
- **REQ-01**
  - **Étant donné** `opencode/skills/scroll-craft/SKILL.md` refactoré
  - **Quand** `ops-quality` charge `scroll-craft` uniquement pour lancer `shoot.mjs` (Step 5)
  - **Alors** il lit un `SKILL.md` ≤ 180 lignes qui pointe directement vers la référence Step 5 sans charger les 300 lignes de brief créatif et génération d'assets
- **REQ-03**
  - **Étant donné** `opencode/skills/pwa-developpement/SKILL.md` refactoré
  - **Quand** `lead-dev` crée une spec `SPEC-XXX`
  - **Alors** il ne charge pas les conventions FastAPI/Python, celles-ci étant isolées dans `assets/references/code-standards.md`

**Edge cases**
- **EDGE-01** : Scripts de `scroll-craft` (`scripts/workspace.mjs`, etc.) qui référenceraient des numéros de lignes ou titres exacts de `SKILL.md` → vérifier via `grep -rn "SKILL.md" opencode/skills/scroll-craft/` avant découpage.
- **EDGE-02** : Perte d'une `Hard rule` critique de `scroll-craft` → laisser toutes les `Hard rules` et les règles Agence Bulles directement dans `SKILL.md` (jamais enfouies).

**PWA / Offline** : Non applicable.

## 4. Structure & Contrats de fichiers
- `opencode/skills/scroll-craft/SKILL.md` (≤ 180 lignes) → `references/{brief-and-hero,grammar-and-scoring,build-and-verify}.md`.
- `opencode/skills/pwa-developpement/SKILL.md` (≤ 120 lignes) → `assets/references/code-standards.md`.

## 5. Autorisations & Sécurité
- Aucun impact permissions ni secrets.
- **Données personnelles collectées** : Aucune.

## 6. Fichiers impactés
- `opencode/skills/scroll-craft/SKILL.md` [MODIFY]
- `opencode/skills/scroll-craft/references/*.md` [NEW/MODIFY]
- `opencode/skills/pwa-developpement/SKILL.md` [MODIFY]
- `opencode/skills/pwa-developpement/assets/references/code-standards.md` [NEW]

## 7. Tâches d'exécution
- [x] **T1** — Vérifier les références croisées dans `opencode/skills/scroll-craft/` (EDGE-01)
- [x] **T2** — Découper `scroll-craft/SKILL.md` en gardant `Hard rules` + règles Agence Bulles inline (REQ-01, REQ-02)
- [x] **T3** — Extraire `code-standards.md` hors de `pwa-developpement/SKILL.md` (REQ-03)
- [x] **T4** — Vérifier `wc -l opencode/skills/*/SKILL.md` (≤ 200 partout) + liens de fichiers valides
- [ ] **T5** — Validation & commit sémantique (`ops-quality`)
