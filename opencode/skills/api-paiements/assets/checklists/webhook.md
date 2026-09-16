# Checklist — Webhook GeniusPay

> Un webhook mal vérifié = fraude possible. À appliquer à chaque événement.

## Réception
- [ ] Endpoint HTTPS uniquement
- [ ] Signature `X-GeniusPay-Signature` vérifiée sur le **corps BRUT** de la requête (avant tout parsing JSON)
- [ ] Comparaison à **temps constant** (`crypto.timingSafeEqual` / `hash_equals`) — jamais `===`
- [ ] Signature invalide → **4xx** : aucun traitement, aucun crédit
- [ ] Ne pas loguer le payload complet (données personnelles)

## Anti-rejeu
- [ ] `X-GeniusPay-Timestamp` contrôlé (fenêtre ~5 min) — ⚠️ **à vérifier auprès du support** : le timestamp est-il inclus dans le HMAC ? Sinon il est falsifiable et ne protège de rien
- [ ] Contrainte d'unicité **EN BASE** sur `data.transaction.reference` — pas un simple test applicatif (conditions de course)
- [ ] Événement `environment: "sandbox"` reçu en production → **ignoré** et logué

## Traitement (ordre impératif)
- [ ] 1. Persister l'événement brut (statut « reçu ») — **avant** toute logique métier
- [ ] 2. Répondre **2xx** dès que la persistance durable est confirmée
- [ ] 3. Traiter le métier ensuite (asynchrone si long)
- [ ] **Jamais créditer sur la seule foi du webhook** : re-vérifier via `GET /payments/{reference}`
- [ ] Contrôler montant (entier XOF), devise et `metadata.order_id`
- [ ] Machine à états explicite — `pending` → `processing` → `completed` / `failed` / `cancelled` / `refunded` ; toute transition arrière refusée
- [ ] **Ordre de livraison non garanti** : trier par `timestamp` du payload, ne pas supposer la chronologie
- [ ] Événement inconnu → **2xx + log** (ne pas faire échouer le fournisseur)

## Événements à gérer
| Événement | Traitement |
| --- | --- |
| `payment.initiated` | Marquer la transaction `pending` (ne rien créditer) |
| `payment.success` | Vérifier puis créditer, une seule fois |
| `payment.failed` | Marquer `failed` + déclencher le dunning |
| `payment.cancelled` | Marquer `cancelled` |
| `payment.refunded` | Marquer `refunded` + révoquer l'accès |

## Fiabilité
- [ ] Retry : ⚠️ **politique non documentée** — à clarifier avec le support ; prévoir un backoff exponentiel côté sortant
- [ ] Reconstitution : pouvoir interroger le statut via `GET /payments/{reference}` si un webhook est manqué
- [ ] Journalisation : référence, statut, montant, gateway, horodatage — **téléphones masqués**
- [ ] **Réconciliation périodique** fournisseur ↔ base + alerte sur écarts → `reconciliation.md`
- [ ] Abonnement webhook testable via `POST /webhooks/{id}/test`

## Dunning (échec d'abonnement)
- [ ] Le prélèvement récurrent automatique n'existe pas en Mobile Money → dunning = **relances + lien de paiement**, pas des retries de débit
- [ ] Calendrier défini (ex. J+1, J+3, J+7)
- [ ] Emails de relance via Brevo avec lien de paiement actualisé
- [ ] Suspension progressive (dégradé → bloqué) documentée

## Facture
- [ ] Facture/reçu PDF généré après `payment.success` — numérotation séquentielle **sans trou**, facture immuable
- [ ] Génération **côté serveur SvelteKit** (runtime Node), pas de contrainte de moteur embarqué
- [ ] Envoi par email (Brevo) + conservation dans le compte utilisateur
- [ ] Mentions obligatoires (fisc. ivoirienne) à valider avec un comptable
