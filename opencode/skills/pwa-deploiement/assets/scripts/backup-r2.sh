#!/usr/bin/env bash
# backup-r2.sh — Sauvegarde quotidienne Turso + médias vers Cloudflare R2
#
# Usage : ./backup-r2.sh <nom-base-turso> [dossier-medias]
# Cron  : 0 2 * * *  /chemin/backup-r2.sh <db> /chemin/medias
#
# Prérequis : turso CLI authentifié · rclone configuré (remote « r2 ») ou aws CLI
#
# ⚠️ Turso est managé : la sauvegarde passe par un EXPORT LOGIQUE (.dump),
#    jamais par une copie de fichier. Les sauvegardes internes de Turso ne
#    remplacent pas celle-ci — elles ne sont pas exportables hors plateforme.

set -euo pipefail

DB="${1:?Usage: backup-r2.sh <nom-base-turso> [dossier-medias]}"
MEDIA_DIR="${2:-}"
BUCKET="${R2_BUCKET:?Set R2_BUCKET}"
DATE="$(date +%F)"

echo "==> Sauvegarde Turso « ${DB} » → r2:${BUCKET}/turso/${DATE}/dump.sql"
turso db shell "$DB" .dump > "/tmp/${DB}-${DATE}.sql"
gzip -f "/tmp/${DB}-${DATE}.sql"

if command -v rclone >/dev/null 2>&1; then
  rclone copy "/tmp/${DB}-${DATE}.sql.gz" "r2:${BUCKET}/turso/${DATE}/" --transfers 1
else
  aws s3 cp "/tmp/${DB}-${DATE}.sql.gz" "s3://${BUCKET}/turso/${DATE}/" \
    --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
fi
rm -f "/tmp/${DB}-${DATE}.sql.gz"

# Médias utilisateurs — normalement déjà sur R2 (source de vérité).
# Ce bloc ne sert qu'en secours si une copie locale existe.
if [[ -n "$MEDIA_DIR" && -d "$MEDIA_DIR" ]]; then
  echo "==> Médias ${MEDIA_DIR} → r2:${BUCKET}/media/${DATE}"
  if command -v rclone >/dev/null 2>&1; then
    rclone copy "$MEDIA_DIR" "r2:${BUCKET}/media/${DATE}" --transfers 4
  else
    aws s3 sync "$MEDIA_DIR" "s3://${BUCKET}/media/${DATE}" \
      --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
  fi
fi

echo "==> Vérifier la sauvegarde (taille non nulle) :"
if command -v rclone >/dev/null 2>&1; then
  rclone ls "r2:${BUCKET}/turso/${DATE}/"
fi

echo "==> OK. Penser au TEST DE RESTAURATION périodique (voir restore-r2.sh)."

# Rétention : appliquer une politique de cycle de vie sur le bucket R2
# (ex. suppression des dumps de plus de 30 jours) plutôt qu'un nettoyage manuel.
