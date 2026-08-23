# Référence API — Jèko (principale)

> Passerelle de paiement Mobile Money (Afrique). Source : api-reference-jeko (archivée) — condensé.

## Authentification
- Headers : `X-API-KEY` + `X-API-KEY-ID`
- Obtention : https://cockpit.jeko.africa → Paramètres > API & Webhooks
- Ne jamais exposer en clair → `{file:...}` ou variables d'env

## Base URL
`https://api.jeko.africa/partner_api`

## Endpoints

### Stores
| Méthode | Path | Description |
|---------|------|-------------|
| GET | `/stores` | Lister les magasins |
| GET | `/stores/{storeId}/balance` | Solde du magasin |

### Devices (soundbox)
| Méthode | Path | Description |
|---------|------|-------------|
| GET | `/devices` | Lister les appareils soundbox |

### Payment Requests
| Méthode | Path | Description |
|---------|------|-------------|
| POST | `/payment_requests` | Créer une demande de paiement |
| GET | `/payment_requests/{id}` | Statut d'une demande |

- Types : `redirect` (URL web) ou `soundbox` (QR code terminal)
- Montant minimum : 100 centimes (1 XOF)

### Payment Links
| Méthode | Path | Description |
|---------|------|-------------|
| POST | `/payment_links` | Créer un lien de paiement |
| GET | `/payment_links/{id}` | Statut d'un lien |

### Transactions
| Méthode | Path | Description |
|---------|------|-------------|
| GET | `/transactions` | Lister les transactions (paginé, filtre par date) |

### Banks
| Méthode | Path | Description |
|---------|------|-------------|
| GET | `/banks` | Banques supportées pour virements |

## Webhooks
- Header `Jeko-Signature` : HMAC-SHA256 avec le secret webhook
- Payload : `id`, `amount`, `fees`, `status`, `counterpartLabel`, `paymentMethod`, `transactionDetails`
- Retry : jusqu'à 3 fois, backoff exponentiel
- Types : paiements (redirect, soundbox, lien) et virements

## Modèles d'intégration
1. **Soundbox** : QR code sur terminal → client scanne → webhook
2. **E-commerce** : lien de paiement → client paie → webhook
3. **In-app** : redirect → app mobile money → callback URLs

## Codes d'erreur
| Code | Description |
|------|-------------|
| 401 | Clé API invalide/missing |
| 403 | Permission refusée |
| 422 | Validation error |
| E_PAYMENT_LINK_IS_INVALID | Lien de paiement à usage unique déjà utilisé |

## Voir aussi
- Script curl : `../scripts/curl-jeko.sh`
- Checklist webhooks : `../checklists/webhook.md`
