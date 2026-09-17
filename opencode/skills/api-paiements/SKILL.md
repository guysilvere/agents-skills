---
name: api-paiements
description: Référence d'intégration de la passerelle de paiement Agence Bulles — GeniusPay (Wave, Orange Money, MTN, Moov, cartes). Authentification, endpoints, sandbox, webhooks signés, idempotence, réconciliation, factures PDF. Charger (via integrations) dès qu'un paiement, un webhook de paiement ou une facture est en jeu.
license: MIT
compatibility: opencode
metadata:
  audience: integrations
  domain: api
---

# api-paiements

## Ce que je fais
- Référence d'intégration de la passerelle unique : **GeniusPay**.
- Rappelle les règles de sécurité des paiements (signature, idempotence, réconciliation).
- Complète le MCP GeniusPay, qui interroge la documentation officielle à jour.

## MCP GeniusPay (source de vérité)
- Serveur : `https://geniuspay.ci/api/mcp` — configuré dans `opencode.jsonc` (auth `Authorization: Bearer <clé>`).
- **L'utiliser en priorité** : il donne la documentation à jour plutôt que la recopie de cette skill, qui peut vieillir.
- La skill reste utile hors-ligne et pour les règles maison (les contraintes de sécurité ci-dessous ne sont pas dans la doc fournisseur).

## Environnements
- **Sandbox** (`pk_sandbox_…` / `sk_sandbox_…`) : transactions simulées, sans frais. **Toute intégration et tout test passe par là.**
- **Production** (`pk_live_…` / `sk_live_…`) : argent réel. **Jalon humain.**
- Le champ `environment` est renvoyé dans les réponses et les webhooks → ignorer un événement `sandbox` reçu en production.

## Vérifié par test direct (2026-09-18)

- **`X-API-Key` SEUL suffit** pour `POST /api/v1/merchant/payments`. La doc montre `X-API-Key` + `X-API-Secret`, mais le secret est **inutile** sur cet endpoint — paiement créé sans lui (HTTP 201).
- **`checkout_url` ET `payment_url`** sont renvoyés, avec **la même valeur**. L'ambiguïté de la doc est levée : lire l'un ou l'autre.
- **`environment`** vaut `live` ou `sandbox` selon la clé utilisée. ⚠️ **`pk_live_` = argent réel** : vérifier le préfixe AVANT tout appel de test.
- **Le MCP GeniusPay ne crée AUCUN paiement.** Il n'expose que les docs (`geniuspay://docs/*`) et l'outil `inspect_recent_errors`. Son échec dans OpenCode (cf. `mcp.servers.json`) n'affecte pas la création de paiements — ce sont deux canaux indépendants.

## À VÉRIFIER auprès du support AVANT de coder
> Ces points ne sont pas documentés — ne rien présumer.
- **Périmètre exact de la signature webhook** : l'exemple officiel signe le corps seul, alors qu'un en-tête `X-GeniusPay-Timestamp` existe. Si le timestamp n'est pas signé, il ne protège pas du rejeu.
- **Politique de retry des webhooks** : aucun délai, nombre de tentatives ni timeout publiés.
- **Limites de débit** : non documentées.
- **`paystack`** : listé dans les paramètres de `payment_method` mais absent du tableau des méthodes.
- **Content-Type du flux SSE** : `/api/mcp` renvoie `application/json` au lieu de `text/event-stream` → tout client MCP conforme le rejette (bug confirmé).

## Frais — toujours raisonner en NET

```
frais = (montant × 1 %) + 100 FCFA fixes + (montant × taux_opérateur)
net   = montant − frais
```

- **1 % + 100 FCFA fixes** (commission GeniusPay, sur chaque transaction)
- **+ taux opérateur** : wave / orange_money / mtn_money / card = **1,5 %** · paystack = **5 %** (mesuré)
- ⚠️ **`net_amount` renvoyé par l'API n'est PAS le net réel** tant que le client n'a pas choisi sa méthode : il ignore les frais opérateur. Le relire **après** le webhook `payment.success`.
- ⚠️ **Les 100 FCFA fixes écrasent les petits montants** : à 200 XOF les frais font **52,5 %**, à 1 000 XOF **12,5 %**, le plancher ~2,5 % n'est atteint qu'au-delà de 50 000 XOF. Ne pas proposer de prix proche du minimum.
- Calcul : `node assets/scripts/frais-calc.mjs <montant> [méthode]` ou `--table`
- Détail, taux mesurés et services du dashboard : `assets/reference/frais.md`

## Règles d'intégration (non négociables)
- **Montants** : `amount` est un **entier en XOF, minimum 200** — pas des centimes. Ne jamais convertir en centimes (piège classique : d'autres passerelles de la région le font).
- **Signature vérifiée sur le corps BRUT** de la requête, comparaison à **temps constant**.
- **Idempotence par contrainte d'unicité EN BASE** sur `data.transaction.reference` (format `MTX-…`) — pas un simple test applicatif.
- **Ne jamais créditer sur la seule foi du webhook** : re-vérifier via `GET /payments/{reference}` + contrôler montant, devise et `metadata.order_id`.
- **Persister l'événement brut AVANT toute logique métier**, puis répondre 2xx. Signature invalide → 4xx. Événement inconnu → 2xx + log.
- **Machine à états explicite** : `pending` → `processing` → `completed` / `failed` / `cancelled` / `refunded`. Toute transition arrière est refusée.
- **Ne jamais faire confiance à l'ordre de livraison** : trier par `timestamp` du payload.
- **Réconciliation périodique** fournisseur ↔ base : `assets/checklists/reconciliation.md`.
- **Erreurs** : structure `{ "id", "message", "extras" }` ; `extras` ne contient jamais de détail interne.
- **Logs** : numéros de téléphone Mobile Money **masqués** (données personnelles).
- Un **timeout** sur un `POST /payments` n'est **pas** un échec : la transaction a peut-être été créée. Re-vérifier via `GET /payments` avant tout retry (risque de double paiement).
- **Factures PDF** : numérotation séquentielle sans trou, factures immuables. Générées **côté SvelteKit serveur** (runtime Node, cf. choix de stack) — pas de contrainte de moteur embarqué.
- Checklist webhook : `assets/checklists/webhook.md`.

## Tests (obligatoires — sandbox uniquement)
- Signature valide / invalide / absente
- Rejeu du même événement (idempotence)
- Montant incohérent, devise divergente
- Transition d'état interdite
- Fournisseur indisponible / timeout
- **Jamais de clés `live` dans l'environnement de test.**

## Assets
- `assets/reference/geniuspay.md`
- `assets/reference/frais.md`
- `assets/scripts/frais-calc.mjs`
- `assets/checklists/webhook.md`
- `assets/checklists/reconciliation.md`
- `assets/scripts/curl-geniuspay.sh`
- `assets/templates/invoice.pdf.hbs`
