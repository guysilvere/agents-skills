# Checklist — Création d'agent : OpenCode vs Antigravity

## Choix du format (avant d'écrire)
- [ ] L'agent est pour OpenCode → utiliser `assets/opencode/agent.md` (emplacement : `~/.config/opencode/agents/`)
- [ ] L'agent est pour Antigravity → utiliser `assets/antigravity/agent.md` (emplacement : `~/.gemini/config/agents/`)
- [ ] Les deux outils ont besoin du même rôle → créer DEUX fichiers (formats incompatibles)

## 🟦 OpenCode (assets/opencode/agent.md)
- [ ] `description` obligatoire (rôle + quand l'invoquer)
- [ ] `mode` : `primary` (principal, Tab) | `subagent` (invoqué via @ ou task) | `all`
- [ ] `temperature` adaptée au rôle (0.1 validation → 0.3 dev)
- [ ] `permission` : `skill: allow` pour rester flexible (intégration de nouvelles skills sans modifier l'agent)
- [ ] `permission.task` : whitelist des sous-agents autorisés (`"*": deny` + exceptions)
- [ ] `steps` défini si contrôle de coûts nécessaire
- [ ] Ne PAS recréer les agents système cachés : compaction, title, summary

## 🟩 Antigravity (assets/antigravity/agent.md)
- [ ] `name` + `description` obligatoires
- [ ] `tools` : noms EXACTS (`view_file`, `replace_file_content`, `grep_search`, `run_command`, `read_url_content`, `invoke_subagent`) — une faute de frappe fait HANGER le subagent
- [ ] `subagent: true` pour l'invocation via `invoke_subagent` ; `mainAgent: false` pour ne pas l'afficher comme agent principal
- [ ] `model` : `inherit` | `flash` | `pro`
- [ ] `commandExecutionPolicy` : `off` | `auto` | `eager` | `sandbox` (défaut sandbox)
- [ ] `skills:` liste les chemins de skills si nécessaire
- [ ] Emplacements : global `~/.gemini/config/agents/` | projet `.agents/agents/` | plugins `plugins/<name>/agents/`

## ⚪ Commun
- [ ] Corps du fichier = prompt système de l'agent (organisation en sections Markdown)
- [ ] Documenter la procédure « Intégration de nouvelles skills » (flexibilité : skill: allow / skills:)
- [ ] Test de refus : vérifier que l'agent ne peut pas faire ce qu'il ne doit pas faire (edit sur code pour ops-quality, push --force, etc.)
