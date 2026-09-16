# Référence API — GeniusPay (passerelle unique)

> Agrégateur de paiement : Wave, Orange Money, MTN Money, Moov et cartes bancaires.
> Dashboard : `https://geniuspay.ci/dashboard` · Support : `support@geniuspay.ci`
> MCP : `https://geniuspay.ci/api/mcp` (auth `Authorization: Bearer <clé API>`)

## Base URL

```
https://geniuspay.ci/api/v1/merchant
```

⚠️ La documentation officielle annonce `http://`. **Toujours utiliser HTTPS** — le serveur renvoie un `301` sur HTTP. Vérifié : `https://geniuspay.ci/api/v1/merchant/account` répond `401 MISSING_API_KEY`.

## Environnements

Il existe **un vrai sandbox** (contrairement à d'autres passerelles de la région) :

| Env | Clés | Comportement |
| --- | --- | --- |
| Sandbox | `pk_sandbox_…` / `sk_sandbox_…` | Transactions simulées, sans frais |
| Production | `pk_live_…` / `sk_live_…` | Transactions réelles |

Le champ `environment` (`sandbox` / `live`) est renvoyé dans les réponses et dans les webhooks — **l'utiliser pour ignorer un événement sandbox arrivé en prod**.

## Authentification

| Header | Description |
| --- | --- |
| `X-API-Key` | Clé publique `pk_sandbox_…` / `pk_live_…` |
| `X-API-Secret` | Clé secrète `sk_sandbox_…` / `sk_live_…` |
| `Content-Type` | `application/json` |

- Vérifié : l'API accepte aussi `Authorization: Bearer <clé>` (utilisé par le MCP).
- Les clés sont stockées en variables d'env (Coolify en prod, `.env.local` en dev). Jamais en clair.

## Montants

⚠️ **`amount` est un entier en XOF, pas en centimes.** `amount: 5000` = 5 000 XOF.

| Paramètre | Type | Défaut | Contrainte |
| --- | --- | --- | --- |
| `amount` | number | — | **minimum 200 XOF** |
| `currency` | string | `XOF` | — |

## Endpoints

### Paiements

| Méthode | Path | Description |
| --- | --- | --- |
| POST | `/payments` | Créer un paiement, retourne une URL |
| GET | `/payments` | Lister (`status`, `from`, `to`, `per_page` max 100, défaut 20) |
| GET | `/payments/{reference}` | Détail d'une transaction |

#### POST /payments — paramètres

| Paramètre | Requis | Description |
| --- | --- | --- |
| `amount` | ✓ | Entier, XOF, min 200 |
| `currency` | — | Défaut `XOF` |
| `payment_method` | — | `wave`, `paystack`, `orange_money`, `mtn_money`, `card` |
| `description` | — | Max 500 caractères |
| `customer.name` / `.email` / `.phone` | — | Coordonnées client |
| `success_url` / `error_url` | — | Redirections |
| `metadata` | — | Objet libre (y mettre `order_id`) |

**Deux modes :**

1. **Checkout (recommandé)** — omettre `payment_method` : le client choisit son moyen sur la page GeniusPay hébergée. Meilleure conversion.
2. **Direct** — `payment_method` renseigné : redirection directe vers le gateway.

#### Réponse 201

```json
{
  "success": true,
  "data": {
    "id": 456,
    "reference": "MTX-A1B2C3D4E5",
    "amount": 15000,
    "fees": 450,
    "net_amount": 14550,
    "status": "pending",
    "payment_url": "https://wave.com/...",
    "gateway": "wave",
    "environment": "sandbox"
  }
}
```

⚠️ Le champ d'URL diffère selon la doc : la réponse 201 documente `payment_url`, les exemples de code utilisent `checkout_url`. **Lire les deux avec un fallback** et vérifier sur le sandbox avant de figer le code.

### Compte

| Méthode | Path | Description |
| --- | --- | --- |
| GET | `/account` | Informations marchand |
| GET | `/account/balance` | `available`, `pending`, `total`, `currency` |

## Statuts

| Statut | Signification |
| --- | --- |
| `pending` | En attente de paiement |
| `processing` | En cours de traitement |
| `completed` | Paiement réussi |
| `failed` | Échoué |
| `cancelled` | Annulé |
| `refunded` | Remboursé |

## Méthodes de paiement

| Code | Nom | Pays |
| --- | --- | --- |
| `wave` | Wave | SN, CI, ML, BF |
| `orange_money` | Orange Money | SN, CI, ML, BF |
| `mtn_money` | MTN Mobile Money | CI, BF |
| `card` | Visa / Mastercard | International |

⚠️ `paystack` apparaît dans les paramètres de `payment_method` mais **pas** dans ce tableau — incohérence à clarifier auprès du support.

## Webhooks

### Gestion des abonnements

| Méthode | Endpoint | Description |
| --- | --- | --- |
| GET | `/webhooks` | Lister |
| POST | `/webhooks` | Créer |
| PUT | `/webhooks/{id}` | Modifier |
| DELETE | `/webhooks/{id}` | Supprimer |
| POST | `/webhooks/{id}/test` | Tester |

### Événements

`payment.initiated` · `payment.success` · `payment.failed` · `payment.cancelled` · `payment.refunded`

### Headers

| Header | Description |
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
    "transaction": {
      "id": 456,
      "reference": "MTX-A1B2C3D4E5",
      "amount": 15000,
      "status": "completed",
      "customer": { "name": "Amadou Diallo", "phone": "+221771234567" },
      "metadata": { "order_id": "12345" }
    },
    "merchant": { "id": "uuid-merchant", "name": "Ma Boutique" },
    "environment": "sandbox"
  }
}
```

### Vérification de la signature

```php
function verifySignature($payload, $signature, $secret) {
    $expected = hash_hmac('sha256', $payload, $secret);
    return hash_equals($expected, $signature); // comparaison à temps constant
}
$payload = file_get_contents('php://input'); // CORPS BRUT, pas le JSON reparsé
```

⚠️ **À vérifier auprès du support** : l'exemple officiel ne signe **que le corps**, alors que l'en-tête `X-GeniusPay-Timestamp` existe. Si le timestamp n'est pas inclus dans le HMAC, il est falsifiable et ne protège pas du rejeu. Demander la formule exacte (corps seul, ou `timestamp + corps`) avant de se reposer dessus.

## Codes d'erreur

| Code | HTTP | Description |
| --- | --- | --- |
| `MISSING_API_KEY` | 401 | Clé absente |
| `INVALID_API_KEY` | 401 | Clé invalide |
| `MERCHANT_INACTIVE` | 403 | Compte désactivé |
| `PAYMENT_INIT_FAILED` | 400 | Échec d'initialisation |
| `TRANSACTION_NOT_FOUND` | 404 | Transaction introuvable |
| `VALIDATION_ERROR` | 422 | Données invalides |

## Points non documentés (à clarifier auprès du support)

- **Politique de retry des webhooks** : aucun délai, nombre de tentatives ni timeout publiés.
- **Limites de débit** : non documentées.
- **Signature** : périmètre exact (corps seul ou timestamp inclus) — voir ci-dessus.
- **`payment_url` vs `checkout_url`** : nom du champ d'URL.
- **`paystack`** : méthode réellement disponible ?

## Voir aussi

- Script curl : `../scripts/curl-geniuspay.sh`
- Checklist webhooks : `../checklists/webhook.md`
- Checklist réconciliation : `../checklists/reconciliation.md`
