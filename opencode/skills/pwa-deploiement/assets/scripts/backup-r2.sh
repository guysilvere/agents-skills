#!/usr/bin/env bash
# backup-r2.sh — Sauvegarde quotidienne PocketBase + médias vers Cloudflare R2
# Usage : ./backup-r2.sh [bucket] [source_dir]
# Prérequis : AWS CLI v2 configuré pour R2 (aws configure sso / credentials), rclone ou aws cli

set -euo pipefail

BUCKET="${1:-${R2_BUCKET_NAME:-sauvegardes}}"
PB_DATA="${2:-./docker/pocketbase/pb_data}"
DATE="$(date +%Y-%m-%d)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> Sauvegarde $DATE"

# 1. Copie de la base PocketBase (SQLite) — copie du fichier pour éviter un dump corrompu
#    (Utiliser pb backup si disponible : ./pocketbase backup create)
if command -v rclone >/dev/null 2>&1; then
  rclone copy "$PB_DATA" "r2:${BUCKET}/$(basename "$PB_DATA")/${DATE}/data" --transfers 1
  echo "==> Base copiée (rclone)"
else
  aws s3 sync "$PB_DATA" "s3://${BUCKET}/$(basename "$PB_DATA")/${DATE}/data" --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
  echo "==> Base copiée (aws s3)"
fi

# 2. Médias / uploads
# aws s3 sync ./docker/pocketbase/pb_data/storage "s3://${BUCKET}/storage/${DATE}" --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# 3. Nettoyage : rétention 30 jours
# aws s3 ls "s3://${BUCKET}/$(basename "$PB_DATA")/" --recursive --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

echo "==> Sauvegarde terminée : ${BUCKET}/${DATE}"
