# Checklist — Webhook de paiement

> À appliquer pour Jèko ET CinetPay. Un webhook mal vérifié = fraude possible.

## Réception
- [ ] Endpoint HTTPS uniquement
- [ ] Signature vérifiée AVANT tout traitement (Jeko-Signature HMAC-SHA256 / secret CinetPay)
- [ ] Rejeter silencieusement les requêtes non signées (ne pas loguer le payload complet)

## Traitement
- [ ] Idempotence : même `id` de transaction → même résultat (dédupliquer)
- [ ] Vérifier le montant reçu == montant attendu (commande/abonnement)
- [ ] Vérifier la devise
- [ ] Vérifier le statut attendu (success avant de créditer)
- [ ] Ne créditer l'utilisateur qu'une seule fois (flag / table de transactions)
- [ ] Cas d'échec : marquer la transaction échouée + déclencher dunning le cas échéant

## Réponse
- [ ] Répondre 2xx rapidement pour accuser réception
- [ ] Timeout de traitement court (répondre 202 puis traiter en tâche de fond si long)

## Fiabilité
- [ ] Retry client : backoff exponentiel + jitter, max 3-5 tentatives
- [ ] Reconstitution : possibilité d'interroger le statut d'une transaction (API GET) en cas de webhook manqué
- [ ] Journalisation : id, statut, montant, méthode, horodatage (pas de données sensibles)

## Dunning (échec d'abonnement)
- [ ] Calendrier défini : J+1, J+3, J+7 (exemple)
- [ ] Emails de relance via Brevo avec lien de paiement actualisé
- [ ] Suspension progressive (dégradé → bloqué) documentée

## Facture
- [ ] Facture/reçu PDF généré après succès (template invoice.pdf.hbs)
- [ ] Envoi par email (Brevo) + conservation dans le compte utilisateur
