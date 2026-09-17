#!/usr/bin/env bash
# curl-geniuspay.sh — Exemples de requêtes API GeniusPay
#
# Usage : ./curl-geniuspay.sh
#   Les clés sont lues depuis ~/.config/opencode/.tokens/geniuspay-key
#   (et geniuspay-secret si présent). Variables d'env GP_KEY / GP_SECRET prioritaires.
#
# ⚠️ pk_live_ / sk_live_ = ARGENT REEL. Tester en sandbox avant.
# X-API-Key suffit pour POST /payments (vérifié) ; le secret sert aux autres endpoints.

set -euo pipefail

BASE="${GP_BASE_URL:-https://geniuspay.ci/api/v1/merchant}"   # HTTPS obligatoire (http -> 301)

# Clé : variable d'env prioritaire, sinon fichier de jeton (convention .tokens)
TDIR="${HOME}/.config/opencode/.tokens"
KEY="${GP_KEY:-$(cat "$TDIR/geniuspay-key" 2>/dev/null || echo '')}"
SECRET="${GP_SECRET:-$(cat "$TDIR/geniuspay-secret" 2>/dev/null || echo '')}"
[ -n "$KEY" ] || { echo "Cle GeniusPay absente (GP_KEY ou $TDIR/geniuspay-key)"; exit 1; }

# ⚠️ Verifier l'environnement AVANT tout appel : pk_live_ = argent reel.
case "$KEY" in
  pk_sandbox_*|pk_test_*) echo "==> SANDBOX ($(printf '%s' "$KEY" | cut -c1-11)...)" ;;
  pk_live_*)              echo "==> !!! PRODUCTION — ARGENT REEL ($(printf '%s' "$KEY" | cut -c1-11)...)" ;;
  *)                      echo "==> prefixe de cle non reconnu : $(printf '%s' "$KEY" | cut -c1-11)..." ;;
esac

# X-API-Key suffit pour POST /payments (verifie). Le secret est transmis s'il existe,
# pour les endpoints qui l'exigent.
AUTH=(-H "X-API-Key: ${KEY}" -H "Content-Type: application/json")
[ -n "$SECRET" ] && AUTH+=(-H "X-API-Secret: ${SECRET}")

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
