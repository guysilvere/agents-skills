#!/usr/bin/env bash
# =============================================================================
# sync-skills.sh — Synchronise l'écosystème IA Agence Bulles depuis GitHub
#                 vers OpenCode (~/.config/opencode/) et Antigravity (~/.gemini/)
#
# Source de vérité : https://github.com/guysilvere/agents-skills
# Usage :
#   ./sync-skills.sh                 # clone/pull + backup + purge + copie
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

# Sources dans le repo (source de vérité)
SRC_SKILLS="${REPO_DIR}/migration-opencode/skills"
SRC_AGENTS="${REPO_DIR}/migration-opencode/agents"
SRC_COMMANDS="${REPO_DIR}/migration-opencode/commands"
SRC_WORKFLOWS="${REPO_DIR}/antigravity/workflows"
SRC_AG_AGENTS="${REPO_DIR}/antigravity/agents"

# Cibles
OC_SKILLS="${HOME}/.config/opencode/skills"
OC_AGENTS="${HOME}/.config/opencode/agents"
OC_COMMANDS="${HOME}/.config/opencode/commands"
AG_SKILLS="${HOME}/.gemini/config/skills"
AG_AGENTS="${HOME}/.gemini/config/agents"
AG_WORKFLOWS="${HOME}/.gemini/workflows"

# ---- Options ---------------------------------------------------------------
DRY_RUN=0
DO_OPENCODE=1
DO_ANTIGRAVITY=1
DO_BACKUP=1

usage() {
  sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
  echo ""
  echo "Options :"
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
  # Purge du contenu géré (jamais le dossier lui-même, pour préserver .DS_Store etc.)
  find "$dst" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  # Copie (exclut .DS_Store)
  cp -R "$src"/. "$dst"/ 2>/dev/null || true
  find "$dst" -name ".DS_Store" -delete 2>/dev/null || true
  ok "${label} : $(ls "$dst" | wc -l | tr -d ' ') éléments installés → $dst"
}

# ---- 1. Clone / pull -------------------------------------------------------
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
[[ -d "$SRC_SKILLS" ]] || die "Sources skills introuvables dans $REPO_DIR (clone échoué ?)"

# ---- 2. Backup -------------------------------------------------------------
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/sync-${TIMESTAMP}"
if (( DO_BACKUP )) && (( ! DRY_RUN )); then
  mkdir -p "$BACKUP_DIR"
  if (( DO_OPENCODE )); then
    [[ -d "$OC_SKILLS" ]] && cp -R "$OC_SKILLS" "$BACKUP_DIR/opencode-skills" 2>/dev/null || true
    [[ -d "$OC_AGENTS" ]] && cp -R "$OC_AGENTS" "$BACKUP_DIR/opencode-agents" 2>/dev/null || true
    [[ -d "$OC_COMMANDS" ]] && cp -R "$OC_COMMANDS" "$BACKUP_DIR/opencode-commands" 2>/dev/null || true
  fi
  if (( DO_ANTIGRAVITY )); then
    [[ -d "$AG_SKILLS" ]] && cp -R "$AG_SKILLS" "$BACKUP_DIR/antigravity-skills" 2>/dev/null || true
    [[ -d "$AG_AGENTS" ]] && cp -R "$AG_AGENTS" "$BACKUP_DIR/antigravity-agents" 2>/dev/null || true
    [[ -d "$AG_WORKFLOWS" ]] && cp -R "$AG_WORKFLOWS" "$BACKUP_DIR/antigravity-workflows" 2>/dev/null || true
  fi
  log "Backup : $BACKUP_DIR"
elif (( DRY_RUN )); then
  log "[dry-run] Backup serait créé dans ${BACKUP_ROOT}/sync-${TIMESTAMP}"
fi

# ---- 3+4. Purge & copie ----------------------------------------------------
if (( DO_OPENCODE )); then
  log "── OpenCode ─────────────────────────────────────────"
  purge_and_copy "$SRC_SKILLS"   "$OC_SKILLS"   "Skills OpenCode (10)"
  purge_and_copy "$SRC_AGENTS"   "$OC_AGENTS"   "Agents OpenCode (3)"
  purge_and_copy "$SRC_COMMANDS" "$OC_COMMANDS" "Commandes OpenCode (6)"
fi

if (( DO_ANTIGRAVITY )); then
  log "── Antigravity ──────────────────────────────────────"
  purge_and_copy "$SRC_SKILLS"    "$AG_SKILLS"    "Skills Antigravity (10)"
  purge_and_copy "$SRC_AG_AGENTS" "$AG_AGENTS"    "Agents Antigravity (3)"
  purge_and_copy "$SRC_WORKFLOWS" "$AG_WORKFLOWS" "Workflows Antigravity (6)"
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
