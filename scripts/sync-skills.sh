#!/usr/bin/env bash
# =============================================================================
# sync-skills.sh — Synchronise l'écosystème IA Agence Bulles depuis GitHub
#                 vers OpenCode (~/.config/opencode/) et Antigravity (~/.gemini/)
#
# Source de vérité : https://github.com/guysilvere/agents-skills
# Usage :
#   ./sync-skills.sh                 # clone/pull + backup + purge + copie
#   ./sync-skills.sh --local         # synchroniser directement depuis les sources locales
#   ./sync-skills.sh --dry-run       # prévisualiser sans rien modifier
#   ./sync-skills.sh --opencode-only # ne toucher qu'à ~/.config/opencode
#   ./sync-skills.sh --antigravity-only # ne toucher qu'à ~/.gemini
#   ./sync-skills.sh --no-backup     # désactiver le backup (déconseillé)
#   ./sync-skills.sh --help
# =============================================================================
set -euo pipefail

# ---- Configuration ---------------------------------------------------------
REPO_URL="${AGENTS_SKILLS_REPO_URL:-https://github.com/guysilvere/agents-skills.git}"
BRANCH="main"
CACHE_DIR="${HOME}/.cache/agents-skills-sync"
REPO_DIR="${CACHE_DIR}/agents-skills"
BACKUP_ROOT="${HOME}/.config/opencode-backups"

# ---- Options ---------------------------------------------------------------
DRY_RUN=0
DO_OPENCODE=1
DO_ANTIGRAVITY=1
DO_BACKUP=1
USE_LOCAL=0

usage() {
  sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
  echo ""
  echo "Options :"
  echo "  --local            Utilise le dossier local courant au lieu du clone git distant"
  echo "  --dry-run          Affiche les actions sans rien modifier"
  echo "  --opencode-only    Ne traite que OpenCode (~/.config/opencode)"
  echo "  --antigravity-only Ne traite que Antigravity (~/.gemini)"
  echo "  --no-backup        Désactive le backup préalable (déconseillé)"
  echo "  --help             Affiche cette aide"
  echo ""
  echo "Variables d'environnement :"
  echo "  AGENTS_SKILLS_REPO_URL  URL du repo GitHub (défaut: $REPO_URL)"
}

for arg in "$@"; do
  case "$arg" in
    --local) USE_LOCAL=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --opencode-only) DO_ANTIGRAVITY=0 ;;
    --antigravity-only) DO_OPENCODE=0 ;;
    --no-backup) DO_BACKUP=0 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Option inconnue : $arg" >&2; usage >&2; exit 1 ;;
  esac
done

# ---- Helpers ---------------------------------------------------------------
log()  { printf '\033[1;34m[SYNC]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[OK]\033[0m   %s\n' "$*"; }
warn() { printf '\033[1;33m[WARN]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[ERR]\033[0m  %s\n' "$*" >&2; exit 1; }

# ---- 1. Résolution des sources (Local vs Remote Git) -----------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if (( USE_LOCAL )) || [[ -d "${WORKSPACE_ROOT}/opencode/skills" && ! -d "${CACHE_DIR}" ]]; then
  log "Mode local actif : utilisation des sources dans ${WORKSPACE_ROOT}"
  BASE_SRC="${WORKSPACE_ROOT}"
else
  mkdir -p "$CACHE_DIR"
  if [[ -d "$REPO_DIR/.git" ]]; then
    log "Pull du repo existant…"
    if (( ! DRY_RUN )); then
      git -C "$REPO_DIR" fetch --quiet origin "$BRANCH" || warn "fetch impossible (réseau ?) — utilisation du cache local"
      git -C "$REPO_DIR" reset --hard --quiet "origin/$BRANCH" 2>/dev/null || true
    fi
  else
    log "Clone du repo ${REPO_URL}…"
    git clone --quiet --branch "$BRANCH" "$REPO_URL" "$REPO_DIR" || die "Clone impossible — vérifie l'URL et tes accès GitHub"
  fi
  BASE_SRC="${REPO_DIR}"
fi

# Sources dans le repo (source de vérité)
SRC_SKILLS="${BASE_SRC}/opencode/skills"
SRC_AGENTS="${BASE_SRC}/opencode/agents"
SRC_COMMANDS="${BASE_SRC}/opencode/commands"
SRC_WORKFLOWS="${BASE_SRC}/antigravity/workflows"
SRC_AG_AGENTS="${BASE_SRC}/antigravity/agents"
SRC_MCP="${BASE_SRC}/opencode/mcp.servers.json"

# Cibles
OC_SKILLS="${HOME}/.config/opencode/skills"
OC_AGENTS="${HOME}/.config/opencode/agents"
OC_COMMANDS="${HOME}/.config/opencode/commands"
OC_CONFIG="${HOME}/.config/opencode/opencode.jsonc"
AG_SKILLS="${HOME}/.gemini/config/skills"
AG_AGENTS="${HOME}/.gemini/config/agents"
AG_WORKFLOWS="${HOME}/.gemini/workflows"
AG_MCP="${HOME}/.gemini/config/mcp_config.json"

# Tokens locaux (jamais commités)
TOKENS_DIR="${HOME}/.config/opencode/.tokens"

[[ -d "$SRC_SKILLS" ]] || die "Sources skills introuvables dans $BASE_SRC"

purge_and_copy() {
  local src="$1" dst="$2" label="$3"
  [[ -d "$src" ]] || { warn "Source absente ($label) : $src — ignorée"; return 0; }
  [[ -d "$dst" ]] || mkdir -p "$dst"
  if (( DRY_RUN )); then
    log "[dry-run] Purgé + copié : ${label}"
    log "[dry-run]   src : $src"
    log "[dry-run]   dst : $dst"
    return 0
  fi
  # Purge du contenu géré
  find "$dst" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  # Copie (exclut .DS_Store)
  cp -R "$src"/. "$dst"/ 2>/dev/null || true
  find "$dst" -name ".DS_Store" -delete 2>/dev/null || true
  ok "${label} : $(ls "$dst" | wc -l | tr -d ' ') éléments installés → $dst"
}

# ---- MCP : génération depuis mcp.servers.json (source de vérité) ------------
resolve_mcp_oc() {
  python3 - "$SRC_MCP" "$TOKENS_DIR" <<'PY'
import json, sys, re
src, tdir = sys.argv[1], sys.argv[2]
data = json.load(open(src))
out = {}
for s in data["servers"]:
    name = s["name"]
    entry = {"enabled": s.get("enabled", True)}
    if s["transport"] == "local":
        entry["type"] = "local"
        entry["command"] = [s["command"]] + [
            re.sub(r"\{\{TOKEN:([^}]+)\}\}", lambda m: "{file:%s/%s}" % (tdir, m.group(1)), a)
            for a in s.get("args", [])
        ]
        if s.get("environment"):
            entry["environment"] = {
                k: re.sub(r"\{\{TOKEN:([^}]+)\}\}", lambda m: "{file:%s/%s}" % (tdir, m.group(1)), v)
                for k, v in s["environment"].items()
            }
    else:
        entry["type"] = "remote"
        entry["url"] = s["url"]
        if "oauth" in s:
            entry["oauth"] = s["oauth"]
    if s.get("headers"):
        entry["headers"] = {
            k: re.sub(r"\{\{TOKEN:([^}]+)\}\}", lambda m: "{file:%s/%s}" % (tdir, m.group(1)), v)
            for k, v in s["headers"].items()
        }
    out[name] = entry
print(json.dumps(out, ensure_ascii=False, indent=2))
PY
}

resolve_mcp_ag() {
  python3 - "$SRC_MCP" "$TOKENS_DIR" <<'PY'
import json, sys, re, pathlib
src, tdir = sys.argv[1], sys.argv[2]
data = json.load(open(src))
def subst(m):
    tok = m.group(1)
    f = pathlib.Path(tdir) / tok
    if not f.exists():
        sys.stderr.write("WARN: token manquant %s — placeholder laissé\n" % f)
        return "{{TOKEN:%s}}" % tok
    return f.read_text().strip()
out = {}
for s in data["servers"]:
    name = s["name"]
    entry = {}
    if s["transport"] == "local":
        entry["command"] = s["command"]
        entry["args"] = [re.sub(r"\{\{TOKEN:([^}]+)\}\}", subst, a) for a in s.get("args", [])]
        if s.get("environment"):
            entry["env"] = {k: re.sub(r"\{\{TOKEN:([^}]+)\}\}", subst, v) for k, v in s["environment"].items()}
    else:
        entry["serverUrl"] = s["url"]
    if s.get("headers"):
        entry["headers"] = {k: re.sub(r"\{\{TOKEN:([^}]+)\}\}", subst, v) for k, v in s["headers"].items()}
    if not s.get("enabled", True):
        entry["disabled"] = True
    out[name] = entry
print(json.dumps(out, ensure_ascii=False, indent=2))
PY
}

# Fusionne la clé "mcp" générée dans opencode.jsonc existant (préserve les MCP existants comme turso)
merge_oc_mcp() {
  local block="$1" cfg="$2"
  if [[ ! -f "$cfg" ]]; then
    warn "opencode.jsonc absent ($cfg) — génération d'un fichier minimal"
    python3 -c "import json,sys; print(json.dumps({'mcp': json.loads('''$block''')}, ensure_ascii=False, indent=2))"
    return 0
  fi
  python3 - "$cfg" <<PY
import json, sys
cfg_path = sys.argv[1]
block = json.loads('''$block''')
with open(cfg_path) as f:
    cfg = json.load(f)
if "mcp" not in cfg:
    cfg["mcp"] = {}
cfg["mcp"].update(block)
print(json.dumps(cfg, ensure_ascii=False, indent=2))
PY
}

# Fusionne dans mcp_config.json Antigravity (préserve d'autres configurations éventuelles)
merge_ag_mcp() {
  local block="$1" cfg="$2"
  if [[ ! -f "$cfg" ]]; then
    python3 -c "import json,sys; print(json.dumps({'mcpServers': json.loads('''$block''')}, ensure_ascii=False, indent=2))"
    return 0
  fi
  python3 - "$cfg" <<PY
import json, sys
cfg_path = sys.argv[1]
block = json.loads('''$block''')
with open(cfg_path) as f:
    try:
        cfg = json.load(f)
    except Exception:
        cfg = {}
if "mcpServers" not in cfg:
    cfg["mcpServers"] = {}
cfg["mcpServers"].update(block)
print(json.dumps(cfg, ensure_ascii=False, indent=2))
PY
}

# ---- 2. Backup -------------------------------------------------------------
TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/bak/${TIMESTAMP}"
if (( DO_BACKUP )) && (( ! DRY_RUN )); then
  mkdir -p "$BACKUP_DIR"
  if (( DO_OPENCODE )); then
    [[ -d "$OC_SKILLS" ]] && cp -R "$OC_SKILLS" "$BACKUP_DIR/opencode-skills" 2>/dev/null || true
    [[ -d "$OC_AGENTS" ]] && cp -R "$OC_AGENTS" "$BACKUP_DIR/opencode-agents" 2>/dev/null || true
    [[ -d "$OC_COMMANDS" ]] && cp -R "$OC_COMMANDS" "$BACKUP_DIR/opencode-commands" 2>/dev/null || true
    [[ -f "$OC_CONFIG" ]] && cp -R "$OC_CONFIG" "$BACKUP_DIR/opencode-opencode.jsonc" 2>/dev/null || true
  fi
  if (( DO_ANTIGRAVITY )); then
    [[ -d "$AG_SKILLS" ]] && cp -R "$AG_SKILLS" "$BACKUP_DIR/antigravity-skills" 2>/dev/null || true
    [[ -d "$AG_AGENTS" ]] && cp -R "$AG_AGENTS" "$BACKUP_DIR/antigravity-agents" 2>/dev/null || true
    [[ -d "$AG_WORKFLOWS" ]] && cp -R "$AG_WORKFLOWS" "$BACKUP_DIR/antigravity-workflows" 2>/dev/null || true
    [[ -f "$AG_MCP" ]] && cp -R "$AG_MCP" "$BACKUP_DIR/antigravity-mcp_config.json" 2>/dev/null || true
  fi
  log "Backup : $BACKUP_DIR"
elif (( DRY_RUN )); then
  log "[dry-run] Backup serait créé dans ${BACKUP_DIR}"
fi

# ---- 3+4. Purge & copie ----------------------------------------------------
if (( DO_OPENCODE )); then
  log "── OpenCode ─────────────────────────────────────────"
  purge_and_copy "$SRC_SKILLS"   "$OC_SKILLS"   "Skills OpenCode (12)"
  purge_and_copy "$SRC_AGENTS"   "$OC_AGENTS"   "Agents OpenCode (3)"
  purge_and_copy "$SRC_COMMANDS" "$OC_COMMANDS" "Commandes OpenCode (8)"
  if [[ -f "$SRC_MCP" ]]; then
    MCP_OC="$(resolve_mcp_oc)"
    if (( DRY_RUN )); then
      log "[dry-run] MCP OpenCode : mcp généré (${#MCP_OC} octets) → $OC_CONFIG"
    else
      merge_oc_mcp "$MCP_OC" "$OC_CONFIG" > "${OC_CONFIG}.tmp" && mv "${OC_CONFIG}.tmp" "$OC_CONFIG"
      ok "MCP OpenCode : clé mcp fusionnée → $OC_CONFIG"
    fi
  else
    warn "Source MCP absente : $SRC_MCP — ignorée"
  fi
fi

if (( DO_ANTIGRAVITY )); then
  log "── Antigravity ──────────────────────────────────────"
  purge_and_copy "$SRC_SKILLS"    "$AG_SKILLS"    "Skills Antigravity (12)"
  purge_and_copy "$SRC_AG_AGENTS" "$AG_AGENTS"    "Agents Antigravity (3)"
  purge_and_copy "$SRC_WORKFLOWS" "$AG_WORKFLOWS" "Workflows Antigravity (8)"
  if [[ -f "$SRC_MCP" ]]; then
    MCP_AG="$(resolve_mcp_ag)"
    if (( DRY_RUN )); then
      log "[dry-run] MCP Antigravity : mcpServers généré (${#MCP_AG} octets) → $AG_MCP"
    else
      mkdir -p "$(dirname "$AG_MCP")"
      merge_ag_mcp "$MCP_AG" "$AG_MCP" > "${AG_MCP}.tmp" && mv "${AG_MCP}.tmp" "$AG_MCP"
      ok "MCP Antigravity : mcpServers fusionné → $AG_MCP"
    fi
  else
    warn "Source MCP absente : $SRC_MCP — ignorée"
  fi
fi

# ---- 5. Rapport ------------------------------------------------------------
echo ""
log "Terminé."
if (( DRY_RUN )); then
  log "Mode dry-run : aucune modification appliquée."
else
  log "Pour restaurer en cas de problème :"
  [[ -d "$BACKUP_DIR" ]] && echo "  cp -R ${BACKUP_DIR}/* ~/  (restauration manuelle)"
fi
