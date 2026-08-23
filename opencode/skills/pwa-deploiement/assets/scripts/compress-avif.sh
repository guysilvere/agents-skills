#!/usr/bin/env bash
# compress-avif.sh — Compression batch d'images en AVIF (obligatoire avant upload R2)
# Usage : ./compress-avif.sh <input_dir> [quality=50]
# Prérequis : cwebp / avifenc ou ImageMagick 7 avec support AVIF
# Fallback WebP si AVIF indisponible.

set -euo pipefail

INPUT_DIR="${1:?Usage: compress-avif.sh <input_dir> [quality]}"
QUALITY="${2:-50}"

echo "==> Compression AVIF de $INPUT_DIR (qualité $QUALITY)"

if command -v avifenc >/dev/null 2>&1; then
  echo "==> Moteur : avifenc"
  while IFS= read -r -d '' img; do
    out="${img%.*}.avif"
    avifenc --min 0 --max 63 -s 6 -q "$QUALITY" "$img" "$out" 2>/dev/null
    echo "    $img -> $out ($(du -h "$out" | cut -f1))"
    rm -f "$img"
  done < <(find "$INPUT_DIR" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0)
else
  echo "==> avifenc absent — fallback WebP (cwebp)"
  command -v cwebp >/dev/null 2>&1 || { echo "❌ ni avifenc ni cwebp trouvés. Installez libavif ou libwebp."; exit 1; }
  while IFS= read -r -d '' img; do
    out="${img%.*}.webp"
    cwebp -q "$QUALITY" "$img" -o "$out" >/dev/null 2>&1
    echo "    $img -> $out ($(du -h "$out" | cut -f1))"
    rm -f "$img"
  done < <(find "$INPUT_DIR" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0)
fi

echo "==> Terminé. Vérifier les dimensions + ratio d'écrasement avant upload."
