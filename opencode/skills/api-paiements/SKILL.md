---
name: api-paiements
description: Référence d'intégration des passerelles de paiement Agence Bulles — Jèko (principale, Mobile Money) et CinetPay (secours + cartes). Authentification, endpoints, webhooks signés, idempotence, réconciliation, factures PDF. Charger (via integrations) dès qu'un paiement, un webhook de paiement ou une facture est en jeu.
license: MIT
compatibility: opencode
metadata:
  audience: integrations
  domain: api
---

# api-paiements

## Ce que je fais
- Référence d'intégration des 2 passerelles retenues : **Jèko** (principale) + **CinetPay** (secours/cartes).
- Rappelle les règles de sécurité des paiements (signature, idempotence, réconciliation, retry).

## À VÉRIFIER auprès du fournisseur AVANT de coder
> Ne rien présumer — ces points ne sont pas confirmés par la documentation disponible.
- Support du header `Idempotency-Key` sur les écritures (Jèko / CinetPay)
- Présence d'un **horodatage signé** dans les webhooks (protection anti-rejeu)
- Existence d'un **prélèvement récurrent automatique** — en Mobile Money, le paiement exige en général une confirmation de l'utilisateur
- Statuts exacts des notifications CinetPay (`success` / `failed` / `pending` — à confirmer)
- Runtime réel des `pb_hooks` selon la version de PocketBase (voir factures PDF ci-dessous)

## Jèko (principale — Mobile Money)
- Auth : headers `X-API-KEY` + `X-API-KEY-ID` (clés via cockpit.jeko.africa → Paramètres > API & Webhooks).
- Base URL : `https://api.jeko.africa/partner_api`.
- Endpoints : stores, devices (soundbox), payment_requests (redirect/soundbox), payment_links, transactions, banks.
- Montant minimum : 100 centimes (1 XOF).
- Webhooks : header `Jeko-Signature` (HMAC-SHA256, secret webhook) ; retry ×3 backoff exponentiel.
- Modèles : Soundbox (QR terminal) / E-commerce (lien) / In-app (redirect).
- Référence complète : `assets/reference/jeko.md`.

## CinetPay (secours + cartes)
- Auth : `apikey` + `site_id` ; `secret_key` pour vérifier les notifications.
- Endpoints : checkouts (Mobile Money + cartes bancaires), notifications de statut.
- Référence complète : `assets/reference/cinetpay.md`.

## Règles d'intégration (les 2 passerelles)
- **Secrets** : variables d'environnement Coolify (prod), `.env.local` (dev). `{file:...}` est une syntaxe de **config OpenCode** (secrets d'agent) — pas un mécanisme applicatif.
- **Signature vérifiée sur le corps BRUT** de la requête, comparaison à **temps constant**.
- **Idempotence par contrainte d'unicité EN BASE** sur l'id de transaction fournisseur — pas un simple test applicatif.
- **Jamais créditer sur la seule foi du webhook** : re-vérifier le statut via l'API fournisseur + contrôler montant, devise et référence de commande.
- **2xx seulement après persistance durable** de l'événement. Signature invalide → 4xx. Événement inconnu → 2xx + log.
- **Machine à états explicite** (en attente / réussi / échoué / remboursé) ; transitions interdites refusées.
- **Réconciliation périodique** fournisseur ↔ base : `assets/checklists/reconciliation.md`.
- **Montants** : entiers dans l'unité de la devise, devise explicite (XOF sans décimales).
- **Bascule Jèko → CinetPay** : jamais automatique en cours de transaction (double paiement). Sur panne détectée, choix utilisateur, ou carte.
- **Dunning** : relances + lien de paiement (voir la réserve sur le prélèvement récurrent).
- **Factures PDF** : ⚠️ les `pb_hooks` tournent dans un moteur JS embarqué, **pas Node.js** → Handlebars et les libs npm PDF n'y sont pas utilisables. Prévoir un service séparé ou un workflow n8n. Numérotation séquentielle sans trou, factures immuables.
- **Erreurs** : structure `{ "id", "message", "extras" }` ; `extras` ne contient jamais de détail interne.
- **Logs** : numéros Mobile Money **masqués** (données personnelles).
- Un **timeout** sur une création de paiement n'est **pas** un échec : vérifier le statut avant tout retry (risque de double débit).
- Checklist webhook : `assets/checklists/webhook.md`.

## Tests (obligatoires — sandbox uniquement)
- Signature valide / invalide / absente
- Rejeu du même événement (idempotence)
- Montant incohérent, devise divergente
- Transition d'état interdite
- Fournisseur indisponible / timeout
- **Jamais de clés de production** dans l'environnement de test.

## Assets
- `assets/reference/jeko.md`
- `assets/reference/cinetpay.md`
- `assets/checklists/webhook.md`
- `assets/checklists/reconciliation.md`
- `assets/scripts/curl-jeko.sh`
- `assets/templates/invoice.pdf.hbs`
