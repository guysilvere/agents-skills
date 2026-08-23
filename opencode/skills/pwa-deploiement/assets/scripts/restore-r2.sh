#!/usr/bin/env bash
# restore-r2.sh — Restauration d'une sauvegarde R2 vers PocketBase
# Usage : ./restore-r2.sh [bucket] [date_YYYY-MM-DD] [target_dir]
# ⚠️ À exécuter app à l'arrêt. Tester régulièrement cette procédure.

set -euo pipefail

BUCKET="${1:-${R2_BUCKET_NAME:-sauvegardes}}"
DATE="${2:?Usage: restore-r2.sh <bucket> <date> [target] — ex: restore-r2.sh sauvegardes 2026-08-19}"
TARGET="${3:-./docker/pocketbase/pb_data}"

echo "==> Restauration de $DATE vers $TARGET"
echo "    (Assurez-vous que l'application et PocketBase sont arrêtés.)"

read -r -p "Confirmer la restauration ? (oui/non) " confirm
[[ "$confirm" == "oui" ]] || { echo "Annulé."; exit 1; }

# Sauvegarde de sécurité de l'état actuel avant écrasement
mv "$TARGET" "$TARGET.before-$DATE" 2>/dev/null || true
mkdir -p "$TARGET"

if command -v rclone >/dev/null 2>&1; then
  rclone copy "r2:${BUCKET}/pb_data/${DATE}/data" "$TARGET" --transfers 1
else
  aws s3 sync "s3://${BUCKET}/pb_data/${DATE}/data" "$TARGET" --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
fi

echo "==> Restauration terminée. Redémarrez PocketBase puis vérifiez :"
echo "    - Healthcheck OK"
echo "    - Nombre d'utilisateurs/enregistrements cohérent"
echo "    - Dernier fichier médias accessible"
echo "    Ancien état conservé dans : $TARGET.before-$DATE"
