#!/usr/bin/env bash
# curl-jeko.sh — Exemples de requêtes API Jèko (partenaire)
# Usage : JEKO_API_KEY=... JEKO_API_KEY_ID=... ./curl-jeko.sh
# Ne JAMAIS mettre les clés en clair ici : les passer en variables d'env ou {file:...}.

set -euo pipefail

BASE="${JEKO_BASE_URL:-https://api.jeko.africa/partner_api}"
KEY="${JEKO_API_KEY:?Set JEKO_API_KEY}"
KEY_ID="${JEKO_API_KEY_ID:?Set JEKO_API_KEY_ID}"

AUTH=(-H "X-API-KEY: ${KEY}" -H "X-API-KEY-ID: ${KEY_ID}" -H "Content-Type: application/json")

echo "==> 1. Lister les magasins"
curl -s "${AUTH[@]}" "${BASE}/stores" | head -c 2000; echo

echo "==> 2. Créer une demande de paiement (redirect)"
curl -s "${AUTH[@]}" -X POST "${BASE}/payment_requests" -d '{
  "amount": 5000,
  "currency": "XOF",
  "type": "redirect",
  "reference": "CMD-12345",
  "callback_url": "https://app.exemple.com/webhooks/jeko"
}' | head -c 2000; echo

echo "==> 3. Statut d'une demande (remplacer {id})"
# curl -s "${AUTH[@]}" "${BASE}/payment_requests/{id}"

echo "==> 4. Lister les transactions"
# curl -s "${AUTH[@]}" "${BASE}/transactions?limit=10"
