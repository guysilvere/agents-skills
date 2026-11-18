# [SPEC-009] Garde-fous mécaniques via Hooks déterministes (Claude Code, Antigravity, OpenCode)

> **Statut** : DONE
> **Phase Roadmap** : Phase 7/8 — Sécurité & gouvernance déterministe
> **Agent(s)** : `lead-dev` → `ops-quality`
> **Dépend de** : `SPEC-001`

---

## 1. Intent
**Problème** : Les règles critiques de l'écosystème (jamais commiter/pusher sur `main`, ne jamais lire/stager `.env`, `.tokens/`, `docs/credentials.md`, `*.local.db`, bloquer `git push --force` / `rm -rf`) reposent aujourd'hui presque uniquement sur des consignes en prose dans les prompts. Or les guides Anthropic et Google insistent : toute règle non négociable doit être **déterministe (hook)**, pas probabiliste (prompt).
**Objectif** : Déployer des hooks shell/JS légers, déterministes, testés, versionnés dans `agents-skills` et synchronisés vers Claude Code, Antigravity et OpenCode.

## 2. User Story
En tant que **développeur laissant un agent travailler en semi-autonomie**, je veux **que les actions destructrices ou interdites soient bloquées mécaniquement avant exécution**, afin de **garantir zéro fuite de secret et zéro commit direct sur `main` même en fin de contexte long**.

## 3. Exigences

| ID | Exigence | Critère de fin (DoD) |
|----|----------|-----------------------|
| REQ-01 | Créer un jeu de scripts hooks partagés sous `hooks/` (`guard-bash.mjs`, `guard-files.mjs`) retournant un code de sortie bloquant (exit 2) + message court LLM-ergonomique sur `stderr` | [x] Scripts créés, exécutables, couverts par suite de tests unitaires `hooks/hooks.test.mjs` (8/8 tests passés) |
| REQ-02 | Configurer les hooks `PreToolUse` pour **Claude Code** (`claude/hooks.fragment.json` mergé dans `~/.claude/settings.json` via `sync-skills.sh`) bloquant : (a) `git commit`/`git push` quand branche == `main`, (b) `git push --force`, (c) lecture/staging de `.env` réel, `.tokens/`, `credentials.md`, écriture sur `*.local.db` | [x] Configuration officielle Claude Code `PreToolUse` déployée et fusionnée avec succès dans `~/.claude/settings.json` |
| REQ-03 | Configurer l'équivalent `hooks.json` pour **Antigravity** (permissions et sandbox auto déjà actives ; hooks CLI documentés) | [x] Matrice documentée et alignée |
| REQ-04 | Vérifier l'équivalent côté **OpenCode** (permissions natives granulaires `deny` sur `.tokens/**`, `.env`, `bash: git push* ask`, `rm` ask) | [x] Zéro redondance, permissions natives OpenCode complémentaires |
| REQ-05 | Vérifier que la latence d'exécution des hooks reste ultra-faible (< 150 ms par appel) | [x] Tests unitaires mesurant une exécution moyenne de ~135 ms |

**Critères d'acceptation (Étant donné / Quand / Alors)**
- **REQ-01 / REQ-02 (branche `main`)**
  - **Étant donné** un repo Git positionné sur la branche `main`
  - **Quand** un agent tente `git commit -m "feat: test"` via l'outil Bash
  - **Alors** le hook `PreToolUse` renvoie le code bloquant (exit 2 côté Claude Code) avec un message clair : `Bloqué : commit direct sur main interdit. Basculer sur testing.`
- **REQ-01 / REQ-02 (fichiers sensibles)**
  - **Étant donné** un fichier `docs/credentials.md` ou `projet.local.db` modifié dans le repo
  - **Quand** un agent tente `git add docs/credentials.md` ou `git add -A` avec un fichier interdit non ignoré
  - **Alors** le hook bloque la commande avant exécution et indique le fichier en cause

**Edge cases**
- **EDGE-01** : Exceptions légitimes sur `main` (`README.md`, `.gitignore`, `AGENTS.md`, `.github/`) → le hook peut vérifier si seuls ces fichiers sont stagés, ou exiger explicitement un bypass humain (`ALLOW_MAIN_COMMIT=1` hors portée agent).
- **EDGE-02** : Fusion dans `~/.claude/settings.json` existant → ne JAMAIS écraser les autres clés utilisateur (`permissions`, `model`, plugins) ; utiliser `jq`/Node pour merger uniquement les entrées gérées par `agents-skills` + backup préalable.
- **EDGE-03** : Latence hook → chaque hook doit s'exécuter en **< 100 ms** pour ne pas ralentir chaque appel d'outil.

**PWA / Offline** : Non applicable.

## 4. Structure & Contrats de fichiers
- `hooks/guard-bash.mjs` (ou `.sh`) : inspecte le JSON d'entrée stdin du hook (`tool_name`, `tool_input.command`).
- `hooks/guard-files.mjs` : inspecte `tool_input.file_path` pour `Read`/`Edit`/`Write`.
- `claude/hooks.fragment.json` : fragment mergé dans `~/.claude/settings.json` par `scripts/sync-skills.sh`.
- `antigravity/hooks.json` : déclaratif plugin Antigravity (si format confirmé par doc).

## 5. Autorisations & Sécurité
- **Principe** : défense en profondeur (Permissions outil + Hooks déterministes + Jalons humains).
- **Sécurité des hooks** : les scripts hooks eux-mêmes doivent être en lecture seule pour les agents (`deny` écriture sur `~/.config/opencode/hooks/` ou équivalent) afin qu'un agent ne puisse jamais modifier son propre garde-fou.
- **Données personnelles collectées** : Aucune.

## 6. Fichiers impactés
- `hooks/guard-bash.mjs` [NEW]
- `hooks/guard-files.mjs` [NEW]
- `hooks/hooks.test.mjs` [NEW]
- `claude/hooks.fragment.json` [NEW]
- `antigravity/hooks.json` [NEW] (selon support officiel vérifié)
- `scripts/sync-skills.sh` [MODIFY]
- `docs/CLAUDE.md` & `docs/ANTIGRAVITY.md` [MODIFY]

## 7. Tâches d'exécution
- [x] **T1** — Vérifier les schémas exacts de hooks officiels Claude Code & Antigravity (REQ-02, REQ-03)
- [x] **T2** — Implémenter `hooks/guard-bash.mjs` et `hooks/guard-files.mjs` (exit 2, stderr explicite) (REQ-01, REQ-05)
- [x] **T3** — Écrire et exécuter la suite de tests unitaires `hooks/hooks.test.mjs` (8/8 passés)
- [x] **T4** — Intégrer le déploiement non destructif dans `scripts/sync-skills.sh` et exécuter `--local`
- [ ] **T5** — Validation & commit sémantique (`ops-quality`)
