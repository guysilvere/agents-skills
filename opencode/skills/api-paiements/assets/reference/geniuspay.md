# Référence API — GeniusPay (vérifiée par test)

> Passerelle unique Agence Bulles : Wave, Orange Money, MTN, Moov, cartes.
> Dashboard : `https://geniuspay.ci/dashboard` · Support : `support@geniuspay.ci`
>
> ⚠️ **Ce document est issu de tests directs, pas de la doc fournisseur.** La doc officielle
> comporte plusieurs erreurs ; elles sont signalées « ❌ DOC » ci-dessous.

## Base URL

```
https://geniuspay.ci/api/v1/merchant
```

❌ **DOC** : la documentation écrit `http://`. Toujours HTTPS — HTTP renvoie un `301`.

## Contrainte réseau — Cloudflare bloque certaines signatures

Le domaine est derrière Cloudflare, qui filtre selon la signature du client :

| Client | Résultat |
| --- | --- |
| `curl` | ✅ 200 |
| `fetch` Node / `undici` (SvelteKit, adapter-node) | ✅ 200 |
| **Python `urllib` / `requests`** | ❌ **403 — Error 1010 `browser_signature_banned`** |

**Conséquence** : l'app SvelteKit fonctionne. Un service **Python** qui appellerait GeniusPay
serait bloqué — l'appeler via Node, ou passer par l'app.

## Authentification

| En-tête | Requis | Rôle |
| --- | --- | --- |
| `X-API-Key` | ✅ | `pk_sandbox_…` / `pk_live_…` |
| `X-API-Secret` | ❌ **non nécessaire** | `sk_sandbox_…` / `sk_live_…` |
| `Content-Type` | ✅ | `application/json` |

❌ **DOC** : les exemples montrent `X-API-Key` **+** `X-API-Secret`. Vérifié : **`X-API-Key` seul
suffit** pour `POST /payments` (HTTP 201 sans le secret). Le secret reste utile pour les
endpoints qui l'exigent.

⚠️ **La clé `pk_` n'est pas inoffensive** : elle suffit à créer des paiements. La traiter comme
un secret (fichier `600`, jamais dans un dépôt, un nom de fichier ou un log).

### Environnement

`pk_sandbox_…` → sandbox · `pk_live_…` → **argent réel**.
Le champ `environment` (`live`/`sandbox`) est renvoyé dans chaque réponse. **Vérifier le préfixe
avant tout appel** — il n'existe aucun interrupteur côté API.

## POST /payments — créer un paiement

### Arguments

| Argument | Type | Requis | Comportement vérifié |
| --- | --- | --- | --- |
| `amount` | number | ✅ | Entier, **minimum 200**. Une **chaîne est acceptée et convertie** (`"5000"` → 5 000) |
| `currency` | string | ❌ | Défaut `XOF`. ⚠️ **Les devises étrangères sont acceptées et CONVERTIES** — voir ci-dessous |
| `payment_method` | string | ❌ | `wave`, `orange_money`, `mtn_money`, `card`, `paystack`. Une valeur inconnue → 422 |
| `description` | string | ❌ | Max 500 caractères |
| `customer.name` | string | ❌ | Conservé et renvoyé tel quel |
| `customer.email` | string | ❌ | Conservé et renvoyé tel quel |
| `customer.phone` | string | ❌ | Conservé ; le serveur **ajoute `country: "CI"`** |
| `success_url` | string | ❌ | Conservée côté serveur, **non exposée** dans la page de checkout |
| `error_url` | string | ❌ | Idem |
| `metadata` | object | ❌ | Conservé, **mais enrichi par le serveur** — voir ci-dessous |

**Omettre `payment_method`** = mode checkout : le client choisit son moyen sur la page GeniusPay.
C'est le mode recommandé par la doc, et celui qui offre le plus de conversions.

### ⚠️ Le piège des devises

```json
{ "amount": 200, "currency": "USD" }
→ 201 : amount = 104 410 XOF
```

Aucune validation : la devise est acceptée, **convertie au taux du jour**, et le montant
stocké devient le montant XOF. Le serveur trace la conversion dans `metadata` :

```json
"metadata": { "exchange_rate": 1, "original_amount": 200, "original_currency": "XOF", ... }
```

**Toujours envoyer `currency: "XOF"` explicitement** pour éviter une surprise de ce type.

### Validation (bornes testées)

| Cas | Résultat |
| --- | --- |
| `amount` absent, `0`, négatif, ou `< 200` | **422** |
| `payment_method` inconnu | **422** |
| `amount` en chaîne de caractères | ⚠️ **201 — accepté** |
| devise non-XOF | ⚠️ **201 — accepté et converti** |

### Réponse 201

```json
{
  "success": true,
  "data": {
    "id": 191984,
    "reference": "MTX-7LM3NRSQWJ",
    "amount": 200,
    "currency": "XOF",
    "status": "pending",
    "checkout_url": "https://geniuspay.ci/checkout/MTX-7LM3NRSQWJ",
    "payment_url": "https://geniuspay.ci/checkout/MTX-7LM3NRSQWJ",
    "customer": { "name": "…", "email": "…", "phone": "…", "country": "CI" },
    "environment": "live",
    "expires_at": "2026-09-18T22:20:32Z"
  }
}
```

✅ **`checkout_url` ET `payment_url` sont renvoyés, avec la même valeur.**
❌ **DOC** : la réponse documentée n'affiche que `payment_url`, les exemples utilisent
`checkout_url`. Les deux existent — lire l'un ou l'autre.

**Le lien est partageable tel quel.** Un paiement `pending` non payé **n'est pas facturé**.

## GET /payments — lister

| Query | Valeurs |
| --- | --- |
| `status` | `pending`, `processing`, `completed`, `failed`, `cancelled`, `refunded` |
| `from` / `to` | `YYYY-MM-DD` |
| `per_page` | défaut 20, max 100 |

**Pagination** dans `meta` : `current_page`, `per_page`, `total`, `last_page`.

⚠️ **Les champs de la liste sont à plat**, ceux du détail sont imbriqués :

| Liste (`GET /payments`) | Détail (`GET /payments/{ref}`) |
| --- | --- |
| `customer_name`, `customer_email`, `customer_phone` | `customer.name`, `customer.email`, `customer.phone` |
| `merchant_id`, `payment_method`, `environment` | + `success_url`, `error_url`, `metadata`, `payment_provider` |

## GET /payments/{reference} — détail

```json
{
  "success": true,
  "data": {
    "reference": "MTX-7LM3NRSQWJ",
    "amount": 200, "currency": "XOF",
    "fees": 102, "net_amount": 98,
    "status": "pending",
    "payment_method": null, "payment_provider": null,
    "customer": { "name": "…", "email": "…", "phone": "…" },
    "success_url": "…", "error_url": "…",
    "metadata": { "order_id": "…", "exchange_rate": 1, "original_amount": 200, "original_currency": "XOF" },
    "created_at": "…", "completed_at": null
  }
}
```

- `payment_method` / `payment_provider` restent `null` tant que le client n'a pas choisi sur la page de checkout.
- `fees`/`net_amount` sont renseignés **dès la création**. ⚠️ Sur 200 XOF : `fees = 102` (51 %). La commission a une **composante fixe** qui écrase les petits montants — ne pas se fier au « 1,5 % » annoncé pour un montant proche du minimum.
- `metadata` est **enrichi** par le serveur : les clés envoyées sont conservées, et `exchange_rate`, `original_amount`, `original_currency` sont ajoutées.

## GET /account et /account/balance

`/account` renvoie, en plus de la doc : `type`, `environment`, `api_mode`, `balance`, `limits`,
`commission_rate`, `is_early_adopter`, `pin_enabled`.

`limits` : `{ "monthly": 5000000, "used": 0, "available": 5000000 }`.

## Webhooks

| Méthode | Endpoint |
| --- | --- |
| GET / POST | `/webhooks` |
| PUT / DELETE | `/webhooks/{id}` |
| POST | `/webhooks/{id}/test` |

⚠️ **Aucun webhook n'est configuré par défaut** (`GET /webhooks` → `[]`). Un paiement peut donc
aboutir **sans qu'aucune notification ne parte** — c'est l'état actuel du compte.

### Événements

`payment.initiated` · `payment.success` · `payment.failed` · `payment.cancelled` · `payment.refunded`

### En-têtes reçus

| En-tête | Contenu |
| --- | --- |
| `X-GeniusPay-Signature` | HMAC-SHA256 |
| `X-GeniusPay-Timestamp` | Timestamp Unix |
| `X-GeniusPay-Event` | Type d'événement |

### Payload

```json
{
  "event": "payment.success",
  "timestamp": "2025-12-08T10:32:15.000000Z",
  "data": {
    "transaction": { "id": 456, "reference": "MTX-…", "amount": 15000, "status": "completed",
                     "customer": { "name": "…", "phone": "…" }, "metadata": { "order_id": "…" } },
    "merchant": { "id": "uuid-merchant", "name": "…" },
    "environment": "sandbox"
  }
}
```

### Vérification de la signature

```php
$payload = file_get_contents('php://input');            // CORPS BRUT, jamais le JSON reparsé
$expected = hash_hmac('sha256', $payload, $secret);
hash_equals($expected, $_SERVER['HTTP_X_GENIUSPAY_SIGNATURE']);  // temps constant
```

⚠️ **À CLARIFIER auprès du support** : l'exemple officiel signe **le corps seul**, alors qu'un
en-tête `X-GeniusPay-Timestamp` existe. Si le timestamp n'est pas inclus dans le HMAC, il est
falsifiable et ne protège pas du rejeu.

❌ **DOC** : aucun délai de retry, nombre de tentatives ni timeout publiés.
❌ **DOC** : aucune limite de débit publiée.

## Statuts

`pending` · `processing` · `completed` · `failed` · `cancelled` · `refunded`

Machine à états attendue : `pending` → `processing` → `completed` / `failed` / `cancelled` / `refunded`.
Toute transition arrière doit être refusée côté application.

## Codes d'erreur

| Code | HTTP |
| --- | --- |
| `MISSING_API_KEY` | 401 |
| `INVALID_API_KEY` | 401 |
| `MERCHANT_INACTIVE` | 403 |
| `PAYMENT_INIT_FAILED` | 400 |
| `TRANSACTION_NOT_FOUND` | 404 |
| `VALIDATION_ERROR` | 422 |

⚠️ **Les erreurs 422 ne renvoient PAS le détail** : la réponse est un message générique
(`"Une erreur est survenue"`), sans indiquer le champ fautif. Prévoir une validation côté
application avant l'appel — sinon le débogage est à l'aveugle.

## Redirection après paiement

- `success_url` / `error_url` sont **stockées côté serveur**, jamais renvoyées dans la page de checkout.
- Elles ne s'utilisent qu'**après un paiement effectif** — impossible à tester sans payer.
- ⚠️ **Vérifier que l'URL cible répond 200 avant de créer le paiement.** Une URL 404 fait atterrir le client sur une page d'erreur *après* avoir été débité.

## Le MCP GeniusPay n'encaisse pas

Le serveur MCP (`https://geniuspay.ci/api/mcp`) n'expose que la documentation
(`geniuspay://docs/api`, `/subscription`, `/payout`) et l'outil `inspect_recent_errors`.
**Aucun outil de création de paiement.** Son échec dans OpenCode (bug `Content-Type`, cf.
`mcp.servers.json`) n'affecte donc pas l'encaissement — deux canaux indépendants.

## Voir aussi

- Script : `../scripts/curl-geniuspay.sh`
- Checklist webhooks : `../checklists/webhook.md`
- Checklist réconciliation : `../checklists/reconciliation.md`
