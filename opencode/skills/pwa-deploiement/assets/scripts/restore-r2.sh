#!/usr/bin/env bash
# restore-r2.sh — Restauration d'un dump Turso depuis Cloudflare R2
#
# Usage : ./restore-r2.sh <date AAAA-MM-JJ> <nom-base-turso-cible>
#
# ⚠️ NE JAMAIS exécuter directement sur la production.
#    Restaurer d'abord sur une base jetable, vérifier l'intégrité, puis décider.
#    Un test de restauration périodique est obligatoire (voir RUNBOOK.md) :
#    une sauvegarde jamais restaurée n'est pas une sauvegarde.

set -euo pipefail

DATE="${1:?Usage: restore-r2.sh <date AAAA-MM-JJ> <nom-base-turso-cible>}"
DB="${2:?Nom de la base Turso cible requis}"
BUCKET="${R2_BUCKET:?Set R2_BUCKET}"

echo "==> Restauration de turso/${DATE}/dump.sql.gz → base « ${DB} »"
echo "    Vérifiez que la cible est bien une base JETABLE ou de staging."

read -r -p "Confirmer ? (oui/non) " CONFIRM
[[ "$CONFIRM" == "oui" ]] || { echo "Annulé."; exit 1; }

if command -v rclone >/dev/null 2>&1; then
  rclone copy "r2:${BUCKET}/turso/${DATE}/" "/tmp/restore-${DATE}/" --transfers 1
else
  aws s3 sync "s3://${BUCKET}/turso/${DATE}/" "/tmp/restore-${DATE}/" \
    --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
fi

gunzip -f "/tmp/restore-${DATE}/dump.sql.gz"

echo "==> Application du dump sur « ${DB} »"
turso db shell "$DB" < "/tmp/restore-${DATE}/dump.sql"

echo "==> Vérifications (à adapter au schéma) :"
# turso db shell "$DB" "SELECT COUNT(*) FROM users;"
# turso db shell "$DB" "SELECT COUNT(*) FROM payments WHERE status='completed';"

echo "==> Restauration terminée."
echo "    - Comparer les volumes avec l'attendu"
echo "    - Tracer la date du test dans docs/RUNBOOK.md"
echo "    - Détruire la base jetable si c'était un test"
