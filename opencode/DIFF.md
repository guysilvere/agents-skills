# Diff opencode.jsonc — avant / après

> La config proposée est dans `opencode.jsonc.new` (JSON pur, validé). Ce fichier documente le diff.

## Changements

| # | Clé | AVANT | APRÈS | Raison |
|---|-----|-------|-------|--------|
| 1 | `default_agent` | `maestro` | `lead-dev` | lead-dev (mode primary) remplace maestro comme agent par défaut |
| 2 | `mcp.Notion.enabled` | `true` | `false` | Notion inutilisé dans les flux actuels ; désactivé (pas supprimé) — réactivable en 1 ligne, rien n'est cassé |
| 3 | `mcp.github` | inchangé | inchangé | Conservé — tokens sécurisés via `{file:...}` |
| 4 | `mcp.n8n` | inchangé | inchangé | Conservé — MCP n8n.agencebulles.net |
| 5 | `mcp.supabase` | inchangé | inchangé | Conservé |
| 6 | `mcp.supabase-agencebulles` | inchangé | inchangé | Conservé — db.agencebulles.net |
| 7 | `mcp.brevo` | inchangé | inchangé | Conservé — emails transactionnels |
| 8 | `plugin` | 7 plugins | 7 plugins (inchangés) | `@sveltejs/opencode` CONSERVÉ (choix conservateur) — à désactiver uniquement si la stack finale d'un projet n'est pas Svelte |
| 9 | `model` / `small_model` | `deepseek/deepseek-v4-flash` | inchangé | Provider conservé |

## Non-modifiés (volontairement)
- Les tokens MCP restent en `{file:/Users/silveremeya/.config/opencode/.tokens/...}` (sécurisés, chmod 600/700) — rien à changer.
- Aucun serveur MCP supprimé : Notion est désactivé mais sa configuration reste.
- Aucun plugin retiré.

## Application
```bash
cp ~/.config/opencode/opencode.jsonc ~/.config/opencode-backups/bak/2026-08-20/opencode.jsonc
cp opencode.jsonc.new ~/.config/opencode/opencode.jsonc
```

## Réversibilité
```bash
cp ~/.config/opencode-backups/bak/2026-08-20/opencode.jsonc ~/.config/opencode/opencode.jsonc
```
