---
name: api-paiements
description: Référence d'intégration de la passerelle de paiement Agence Bulles (Wave, Orange Money, MTN, Moov, cartes). Authentification, endpoints, sandbox, webhooks signés, idempotence, réconciliation, factures PDF. Charger (via integrations) dès qu'un paiement, un webhook de paiement ou une facture est en jeu.
license: MIT
compatibility: opencode
metadata:
  audience: integrations
  domain: api
---

# api-paiements

## Ce que je fais
- Référence d'intégration de la passerelle de paiement unifiée.
- Rappelle les règles de sécurité des paiements (signature, idempotence, réconciliation).

## Environnements
- **Sandbox** : transactions simulées, sans frais. **Toute intégration et tout test passe par là.**
- **Production** : argent réel. **Jalon humain.**
- Le champ `environment` est renvoyé dans les réponses et les webhooks → ignorer un événement `sandbox` reçu en production.

## Frais — toujours raisonner en NET

```
frais = commission_passerelle + (montant × taux_opérateur)
net   = montant − frais
```

- Modéliser et séparer les frais opérateur (Mobile Money / cartes) et la commission de la passerelle.
- Ne pas proposer de prix trop proche du seuil plancher où les frais fixes écrasent la rentabilité.

## Règles d'intégration (non négociables)
- **Montants** : stockés en entiers avec devise explicite (ex: XOF). Ne pas convertir arbitrairement.
- **Signature vérifiée sur le corps BRUT** de la requête, comparaison à **temps constant**.
- **Idempotence par contrainte d'unicité EN BASE** sur la référence de transaction — pas un simple test applicatif.
- **Ne jamais créditer sur la seule foi du webhook** : re-vérifier via l'API de consultation de la transaction + contrôler montant, devise et ID de commande.
- **Persister l'événement brut AVANT toute logique métier**, puis répondre 2xx. Signature invalide → 4xx. Événement inconnu → 2xx + log.
- **Machine à états explicite** : `pending` → `processing` → `completed` / `failed` / `cancelled` / `refunded`. Toute transition arrière est refusée.
- **Ne jamais faire confiance à l'ordre de livraison** : trier par `timestamp` du payload.
- **Réconciliation périodique** fournisseur ↔ base : `assets/checklists/reconciliation.md`.
- **Erreurs** : structure `{ "id", "message", "extras" }` ; `extras` ne contient jamais de détail interne.
- **Logs** : coordonnées et numéros de téléphone **masqués** (données personnelles).
- Un **timeout** sur la création d'un paiement n'est **pas** un échec : la transaction a peut-être été créée. Re-vérifier avant tout retry (risque de double débit).
- **Factures PDF** : numérotation séquentielle sans trou, factures immuables. Générées **côté SvelteKit serveur** (runtime Node).
- Checklist webhook : `assets/checklists/webhook.md`.

## Tests (obligatoires — sandbox uniquement)
- Signature valide / invalide / absente
- Rejeu du même événement (idempotence)
- Montant incohérent, devise divergente
- Transition d'état interdite
- Fournisseur indisponible / timeout
- **Jamais de clés `live` dans l'environnement de test.**

## Assets
- `assets/checklists/webhook.md`
- `assets/checklists/reconciliation.md`
- `assets/templates/invoice.pdf.hbs`
