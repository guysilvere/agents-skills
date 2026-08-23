---
name: api-paiements
description: Référence d'intégration des passerelles de paiement Agence Bulles — Jèko (principale, Mobile Money) et CinetPay (secours + cartes). Authentification, endpoints, webhooks signés, retry, idempotence, factures PDF. Charger (via integrations) dès qu'un paiement, un webhook de paiement ou une facture est en jeu.
license: MIT
compatibility: opencode
metadata:
  audience: integrations
  domain: api
---

# api-paiements

## Ce que je fais
- Référence d'intégration des 2 passerelles retenues : **Jèko** (principale) + **CinetPay** (secours/cartes).
- Rappelle les règles de sécurité des paiements (signatures, idempotence, retry).

## Jèko (principale — Mobile Money)
- Auth : headers `X-API-KEY` + `X-API-KEY-ID` (clés via cockpit.jeko.africa → Paramètres > API & Webhooks).
- Base URL : `https://api.jeko.africa/partner_api`.
- Endpoints : stores, devices (soundbox), payment_requests (redirect/soundbox), payment_links, transactions, banks.
- Montant minimum : 100 centimes (1 XOF).
- Webhooks : header `Jeko-Signature` (HMAC-SHA256, secret webhook) ; retry ×3 backoff exponentiel.
- Modèles : Soundbox (QR terminal) / E-commerce (lien) / In-app (redirect).
- Référence complète : `assets/reference/jeko.md`.

## CinetPay (secours + cartes)
- Auth : `apikey` + `site_id` ; secret pour les webhooks.
- Endpoints : checkouts (Mobile Money + cartes bancaires), notifications de statut.
- Webhooks : vérifier la signature, traiter une seule fois (idempotence).
- Référence complète : `assets/reference/cinetpay.md`.

## Règles d'intégration (les 2 passerelles)
- **Jamais de secret en clair** : variables d'env / `{file:...}`.
- **Vérifier la signature** de chaque webhook AVANT traitement.
- **Idempotence** : même payload = même résultat (clé de dedupe : `id` de transaction).
- **Répondre 2xx** pour accuser réception ; retry avec backoff exponentiel + jitter (max 3-5).
- **Dunning** : relance automatique en cas d'échec de prélèvement/renouvellement (calendrier J+1, J+3, J+7).
- **Factures PDF** : génération automatique post-paiement (template `assets/templates/invoice.pdf.hbs`), envoi par email (Brevo).
- **Erreurs** : structure `{ "id", "message", "extras" }`, message français pour l'utilisateur final.
- Journaliser chaque événement webhook reçu (id, statut, montant, méthode) pour audit.
- Checklist webhook : `assets/checklists/webhook.md`.

## Tests
- Mode test Jèko/CinetPay pour valider les flux sans argent réel.
- Tests d'intégration webhooks (payloads de référence) avant mise en production.

## Assets
- `assets/reference/jeko.md`
- `assets/reference/cinetpay.md`
- `assets/checklists/webhook.md`
- `assets/scripts/curl-jeko.sh`
- `assets/templates/invoice.pdf.hbs`
