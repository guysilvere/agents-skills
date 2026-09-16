# Checklist — Réconciliation des paiements GeniusPay

> Sans réconciliation, un webhook perdu = un client débité mais non crédité.

## Job périodique
- [ ] Fréquence définie (ex. toutes les heures + un passage quotidien sur J-1)
- [ ] Fenêtre glissante : re-vérifier les transactions non finalisées depuis > 15 min
- [ ] Idempotent : peut être relancé sans effet de bord
- [ ] Exécution planifiée **via une tâche planifiée Coolify** (SvelteKit n'a pas de scheduler natif)

## Comparaison fournisseur ↔ base
- [ ] Lister les transactions GeniusPay sur la période : `GET /payments?from=…&to=…&per_page=100`
- [ ] Comparer : montant, devise, statut, `metadata.order_id`
- [ ] Détecter les 3 écarts : payé côté GeniusPay et non crédité côté app · crédité côté app et absent côté GeniusPay · montant ou devise divergents

## Traitement des écarts
- [ ] Crédit manquant → régulariser via la **même machine à états**, ou alerter
- [ ] Statut divergent → **alerter**, ne jamais corriger en aveugle
- [ ] Journaliser chaque écart avec la `reference` (téléphones masqués)

## Alerte
- [ ] Alerte au-delà d'un seuil (ex. tout écart critique)
- [ ] Tableau de bord : écarts ouverts / résolus
- [ ] Rapport périodique consultable pour audit

## Tests
- [ ] Simuler un webhook perdu → la réconciliation doit créditer
- [ ] Simuler un montant divergent → l'alerte doit se déclencher
- [ ] Rejouer le job → aucun double crédit (idempotence)
- [ ] Tout se teste en **sandbox** (`pk_sandbox_…`)
