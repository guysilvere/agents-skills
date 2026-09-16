# Checklist — Webhook de paiement

> À appliquer pour Jèko ET CinetPay. Un webhook mal vérifié = fraude possible.

## Réception
- [ ] Endpoint HTTPS uniquement
- [ ] Signature vérifiée sur le **corps BRUT** de la requête (avant tout parsing JSON)
- [ ] Comparaison à **temps constant** (`crypto.timingSafeEqual`) — jamais `===`
- [ ] Signature invalide → **4xx** : aucun traitement, aucun crédit
- [ ] Ne pas loguer le payload complet (données personnelles)

## Anti-rejeu
- [ ] Si le fournisseur fournit un **horodatage signé** : rejeter les événements trop anciens (fenêtre ~5 min) — **à vérifier auprès de Jèko/CinetPay**
- [ ] Contrainte d'unicité **EN BASE** sur l'id de transaction du fournisseur — pas un simple test applicatif (conditions de course)

## Traitement (ordre impératif)
- [ ] 1. Persister l'événement brut (statut « reçu ») — **avant** toute logique métier
- [ ] 2. Répondre **2xx** dès que la persistance durable est confirmée
- [ ] 3. Traiter le métier ensuite (asynchrone si long)
- [ ] **Jamais créditer sur la seule foi du webhook** : re-vérifier le statut via l'API du fournisseur
- [ ] Contrôler montant reçu == montant attendu, **devise** et **référence de commande**
- [ ] Machine à états explicite (en attente / réussi / échoué / remboursé) — toute transition interdite est refusée
- [ ] Événement inconnu → **2xx + log** (ne pas faire échouer le fournisseur)

## Fiabilité
- [ ] Retry client : backoff exponentiel + jitter, max 3-5 tentatives
- [ ] Reconstitution : pouvoir interroger le statut d'une transaction (API GET) si un webhook est manqué
- [ ] Journalisation : id, statut, montant, méthode, horodatage — **numéros Mobile Money masqués**
- [ ] **Réconciliation périodique** fournisseur ↔ base + alerte sur écarts → `reconciliation.md`

## Dunning (échec d'abonnement)
- [ ] ⚠️ Vérifier que le **prélèvement récurrent automatique existe réellement** (en Mobile Money, le paiement exige en général une confirmation utilisateur) — **à vérifier auprès de Jèko**
- [ ] Si non : le dunning = **relances + lien de paiement**, pas des retries de débit
- [ ] Calendrier défini : J+1, J+3, J+7 (exemple)
- [ ] Emails de relance via Brevo avec lien de paiement actualisé
- [ ] Suspension progressive (dégradé → bloqué) documentée

## Facture
- [ ] Facture/reçu PDF généré après succès — numérotation séquentielle **sans trou**, facture immuable
- [ ] Envoi par email (Brevo) + conservation dans le compte utilisateur
- [ ] ⚠️ **Pas de génération dans les `pb_hooks`** (moteur JS embarqué, pas Node.js) → service séparé ou workflow n8n
