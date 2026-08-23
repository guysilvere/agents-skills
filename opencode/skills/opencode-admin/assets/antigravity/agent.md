---
name: <identifiant unique — kebab-case>
description: <obligatoire — description utilisée par le planificateur pour décider de déléguer>
tools:
  - view_file
  - grep_search
  - run_command
mainAgent: false      # true = sélectionnable comme agent principal (chat)
subagent: true        # true = invocable via invoke_subagent
model: pro            # inherit | flash | pro
commandExecutionPolicy: sandbox   # off | auto | eager | sandbox
mcpServers: []        # serveurs MCP propres à cet agent
skills:
  - skills/ma-skill   # chemins de skills ou dépendances plugins
---

# System Prompt
<Instructions du sous-agent, organisées en H1/H2 Markdown>

# Règles de travail
1. <règle>
2. <règle>

# Rappel pièges
- Outils `tools[]` : noms EXACTS (`view_file`, `replace_file_content`, `grep_search`, `run_command`) — une faute de frappe fait hanger le subagent.
- Emplacement : `~/.gemini/config/agents/<nom>.md` (global) ou `.agents/agents/<nom>.md` (projet).
