# Spécifications — Optimisation Setup Agents & Skills

> Feuille de route incrémentale (pas à pas) basée sur les bonnes pratiques Anthropic (*Building Effective Agents*, *Context Engineering*, *Agent Skills*) et Google (*Antigravity / Gemini CLI*).
> Branche de travail : `testing` (jamais `main`).

| ID | Titre | Priorité | Statut | Dépend de |
|----|-------|----------|--------|-----------|
| [SPEC-001](./SPEC-001.md) | Living Doc, parité multi-outils & versionnage `GEMINI.md` | 🔴 Haute | DONE | — |
| [SPEC-002](./SPEC-002.md) | Isolation & hygiène des serveurs MCP (PROD & tokens) | 🔴 Haute | DONE | — |
| [SPEC-003](./SPEC-003.md) | Plafonds d'exécution (`steps`/`maxTurns`) & routage modèles | 🔴 Haute | DONE | — |
| [SPEC-004](./SPEC-004.md) | Alignement outils & permissions agents (OC / AG / Claude) | 🟠 Moyenne | DONE | — |
| [SPEC-005](./SPEC-005.md) | Déduplication du contexte permanent (*Context Engineering*) | 🔴 Haute | DONE | SPEC-001 |
| [SPEC-006](./SPEC-006.md) | Suppression du paradoxe `shared-eco-tokens` | 🟠 Moyenne | DONE | SPEC-005 |
| [SPEC-007](./SPEC-007.md) | Découpage progressif des skills monolithiques (`scroll-craft`, `pwa-developpement`) | 🟠 Moyenne | DONE | — |
| [SPEC-008](./SPEC-008.md) | Optimisation CSO des descriptions & frontières des 5 skills design | 🟠 Moyenne | DONE | SPEC-007 |
| [SPEC-009](./SPEC-009.md) | Garde-fous mécaniques via Hooks déterministes (Claude / AG / OC) | 🔴 Haute | DONE | SPEC-001 |
| [SPEC-010](./SPEC-010.md) | Génération des 9 agents depuis 3 sources canoniques & CI validation/evals | 🟢 Basse | DONE | SPEC-001..009 |

## Ordre d'exécution recommandé

1. **Lot 1 — Assainissement & sécurité immédiate** : `SPEC-001` → `SPEC-002` → `SPEC-003` → `SPEC-004`
2. **Lot 2 — Optimisation contexte & skills** : `SPEC-005` → `SPEC-006` → `SPEC-007` → `SPEC-008`
3. **Lot 3 — Garde-fous mécaniques & industrialisation** : `SPEC-009` → `SPEC-010`
