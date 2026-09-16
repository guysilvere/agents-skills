#!/usr/bin/env bash
# curl-geniuspay.sh — Exemples de requêtes API GeniusPay
# Usage : GP_KEY=... GP_SECRET=... ./curl-geniuspay.sh
# Ne JAMAIS mettre les clés en clair ici : les passer en variables d'env.
#
# SANDBOX : utiliser pk_sandbox_... / sk_sandbox_... (transactions simulées, sans frais)

set -euo pipefail

BASE="${GP_BASE_URL:-https://geniuspay.ci/api/v1/merchant}"   # HTTPS obligatoire (http -> 301)
KEY="${GP_KEY:?Set GP_KEY (pk_sandbox_... ou pk_live_...)}"
SECRET="${GP_SECRET:?Set GP_SECRET (sk_sandbox_... ou sk_live_...)}"

AUTH=(-H "X-API-Key: ${KEY}" -H "X-API-Secret: ${SECRET}" -H "Content-Type: application/json")

echo "==> 1. Informations du compte (vérifie aussi que les clés sont valides)"
curl -s "${AUTH[@]}" "${BASE}/account" | head -c 2000; echo

echo "==> 2. Solde"
curl -s "${AUTH[@]}" "${BASE}/account/balance" | head -c 1000; echo

echo "==> 3. Créer un paiement — mode CHECKOUT (recommandé : pas de payment_method)"
# amount est un ENTIER en XOF, minimum 200 (PAS des centimes)
curl -s "${AUTH[@]}" -X POST "${BASE}/payments" -d '{
  "amount": 5000,
  "currency": "XOF",
  "description": "Commande #12345",
  "customer": {
    "name": "Amadou Diallo",
    "email": "amadou@example.com",
    "phone": "+2250700000000"
  },
  "success_url": "https://app.exemple.com/merci",
  "error_url": "https://app.exemple.com/echec",
  "metadata": { "order_id": "12345" }
}' | head -c 2000; echo
# La reponse contient une URL : payment_url (doc 201) OU checkout_url (exemples).
# Lire les deux avec un fallback, et verifier sur le sandbox.

echo "==> 4. Creer un paiement — mode DIRECT (gateway impose)"
# curl -s "${AUTH[@]}" -X POST "${BASE}/payments" \
#   -d '{"amount":5000,"payment_method":"wave","customer":{"phone":"+2250700000000"}}'

echo "==> 5. Lister les paiements"
# curl -s "${AUTH[@]}" "${BASE}/payments?status=completed&per_page=20"

echo "==> 6. Detail d'une transaction (re-verification avant de crediter)"
# curl -s "${AUTH[@]}" "${BASE}/payments/MTX-A1B2C3D4E5"

echo "==> 7. Gestion des abonnements webhook"
# curl -s "${AUTH[@]}" "${BASE}/webhooks"
# curl -s "${AUTH[@]}" -X POST "${BASE}/webhooks" -d '{"url":"https://app.exemple.com/webhooks/geniuspay","events":["payment.success","payment.failed"]}'
# curl -s "${AUTH[@]}" -X POST "${BASE}/webhooks/{id}/test"
