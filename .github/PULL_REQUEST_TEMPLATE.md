## Objet

<Pourquoi cette PR — quel problème des agents ou des skills elle résout.>

## Type

- [ ] Permissions / sécurité
- [ ] Skill (ajout, modification)
- [ ] Agent (ajout, modification)
- [ ] MCP — `opencode/mcp.servers.json`
- [ ] Jetons — `WORKFLOW.md`
- [ ] Documentation
- [ ] Correction

## Changements

-

## Impact

- **Breaking ?** oui / non — *détail*
- **Cibles affectées** : OpenCode · Antigravity · Claude
- **Resynchronisation requise ?** oui / non

## Vérifications

- [ ] Frontmatters YAML valides (agents, skills, commandes)
- [ ] Assets référencés présents (`assets/…`)
- [ ] JSON valide (`mcp.servers.json`, `opencode.jsonc.new`)
- [ ] `gitleaks detect --source . --redact` sans résultat
- [ ] `./scripts/sync-skills.sh --local --dry-run` conforme
- [ ] Aucun secret en clair dans le diff

## Checklist

- [ ] `CHANGELOG.md` mis à jour
- [ ] Bump SemVer proposé (MAJOR / MINOR / PATCH)
- [ ] Règle répercutée dans les **3 agents** si elle est transverse
- [ ] `WORKFLOW.md` mis à jour si c'est un contrat partagé

---

> Merge uniquement via PR (`testing` → `main`) : la branche `main` est protégée.
