#!/usr/bin/env bash
# =============================================================================
# export-mcp-tokens.sh — Expose les jetons MCP Agence Bulles en variables d'env
#                        pour Claude Code (seul mécanisme de secret supporté :
#                        ${VAR}, pas de syntaxe {file:...} comme OpenCode).
#
# À SOURCER (pas exécuter) dans le profil shell, AVANT tout lancement de
# `claude` :
#
#   source ~/agents-skills/scripts/export-mcp-tokens.sh
#
# Lit opencode/mcp.servers.json (source de vérité), en extrait les jetons
# référencés ({{TOKEN:nom}}), et exporte pour chacun MCP_<NOM>_TOKEN à partir
# de ~/.config/opencode/.tokens/<nom> — la même convention de noms que
# `resolve_mcp_claude()` dans sync-skills.sh.
#
# N'écrit jamais de secret sur disque ni dans les configs versionnées ; ne
# modifie aucun fichier — se contente d'exporter des variables dans le shell
# courant.
# =============================================================================

# Localisation portable du script, que ce soit sourcé en bash ou en zsh.
if [ -n "${ZSH_VERSION:-}" ]; then
  __embt_self="${(%):-%N}"
else
  __embt_self="${BASH_SOURCE[0]:-$0}"
fi
__embt_script_dir="$(cd "$(dirname "${__embt_self}")" >/dev/null 2>&1 && pwd)"
__embt_repo_root="${AGENTS_SKILLS_DIR:-$(cd "${__embt_script_dir}/.." >/dev/null 2>&1 && pwd)}"
__embt_src_mcp="${__embt_repo_root}/opencode/mcp.servers.json"
__embt_tokens_dir="${HOME}/.config/opencode/.tokens"

if [ ! -f "${__embt_src_mcp}" ]; then
  echo "[export-mcp-tokens] Source introuvable : ${__embt_src_mcp} (AGENTS_SKILLS_DIR pointe-t-il vers le bon repo ?)" >&2
else
  __embt_exports="$(python3 - "${__embt_src_mcp}" "${__embt_tokens_dir}" <<'PY'
import json, re, sys, pathlib

src, tdir = sys.argv[1], sys.argv[2]
data = json.load(open(src))
pat = re.compile(r"\{\{TOKEN:([^}]+)\}\}")

def token_var(tok):
    return "MCP_" + re.sub(r"[^A-Za-z0-9]+", "_", tok).upper() + "_TOKEN"

seen = set()
for s in data["servers"]:
    if not s.get("enabled", True):
        continue
    blobs = list(s.get("args", [])) + list(s.get("headers", {}).values()) + list(s.get("environment", {}).values())
    for blob in blobs:
        for tok in pat.findall(blob):
            if tok in seen:
                continue
            seen.add(tok)
            var = token_var(tok)
            path = pathlib.Path(tdir) / tok
            if path.exists() and path.stat().st_size > 0:
                value = path.read_text().strip()
                # échappe les apostrophes pour une ré-injection sûre en shell (export VAR='...')
                print("%s\t%s" % (var, value.replace("'", "'\\''")))
            else:
                sys.stderr.write("[export-mcp-tokens] jeton manquant : %s (%s) — %s non défini\n" % (tok, path, var))
PY
)"

  while IFS=$'\t' read -r __embt_var __embt_val; do
    [ -z "${__embt_var}" ] && continue
    export "${__embt_var}=${__embt_val}"
  done <<< "${__embt_exports}"

  unset __embt_exports __embt_var __embt_val
fi

unset __embt_self __embt_script_dir __embt_repo_root __embt_src_mcp __embt_tokens_dir
