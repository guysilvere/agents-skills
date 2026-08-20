# Référence API — CinetPay (secours + cartes)

> Passerelle secondaire : Mobile Money (secours) + paiement par carte bancaire.

## Authentification
- Credentials : `apikey` + `site_id` (dashboard CinetPay)
- `secret_key` : utilisée pour vérifier les notifications de statut
- Ne jamais exposer en clair → `{file:...}` ou variables d'env

## Flux principal (checkout)
1. Créer une transaction de paiement (Mobile Money ou carte) avec montant, devise (XOF), description, identifiant de commande.
2. Rediriger l'utilisateur vers la page de paiement CinetPay (ou intégrer le widget).
3. CinetPay notifie le statut via webhook / notification de statut → vérifier la signature.
4. Confirmer côté serveur avec une requête de statut (idempotent).

## Notifications (webhooks)
- Type : notification de statut de transaction
- Vérifier : signature / secret avant traitement
- Statuts : [à confirmer selon doc dashboard — success/failed/pending]
- Idempotence obligatoire : une transaction ne doit être créditée qu'une seule fois

## Cas d'usage Agence Bulles
- **Secours Mobile Money** : si Jèko est indisponible ou en erreur → basculer sur CinetPay.
- **Cartes bancaires** : les clients sans Mobile Money paient par carte.
- Abstraction recommandée : une interface `PaymentGateway` unique (createPayment, verifyWebhook, getStatus) avec implémentation Jèko et CinetPay.

## Bonnes pratiques
- Garder un mapping commande → transaction (id unique côté app).
- Journaliser les événements reçus (id, statut, montant) pour audit.
- Ne jamais exposer les secrets dans les logs ou réponses d'erreur.
- Configurer les URLs de callback en HTTPS uniquement.

## Voir aussi
- Checklist webhooks : `../checklists/webhook.md`
- Skill `api-best-practices` pour retry/idempotence/erreurs
