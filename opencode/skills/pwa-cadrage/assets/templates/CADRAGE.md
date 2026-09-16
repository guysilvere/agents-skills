# CADRAGE — <Nom du projet>

> Statut : DRAFT / VALIDÉ · Version : 0.1.0 · Projet conçu par **Agence Bulles** (agencebulles.net)

## Contexte
- **Problème** : [besoin métier concret, 1-2 phrases]
- **Cible / personas** : [segments + attentes, irritants, usage mobile/bureau]
- **Concurrence** : [2-3 apps similaires, forces, faiblesses, différenciation UX]

## Objectifs business & KPIs
- Acquisition : [indicateur]
- Activation : [indicateur]
- Rétention : [indicateur]
- Monétisation : [indicateur]

## Modèle économique
- Modèle : [freemium / abonnement / unique / quotas]
- Paliers : [Gratuit / Pro / Équipe — prix FCFA]
- Paiements : **GeniusPay** — Wave, Orange Money, MTN, Moov, cartes bancaires
- Sandbox : `pk_sandbox_…` (toute intégration passe par là) · passage en `live` = **jalon humain**
- Dunning : [relances + lien de paiement — le débit récurrent automatique n'existe pas en Mobile Money]
- Factures PDF : [automatiques — oui/non]

## Scope
- **v0 (bêta fermée)** : [liste]
- **v1 (lancement public)** : [liste]
- **Reporté (v2+)** : [liste]

## Données personnelles & conformité
- **Régime applicable** : Côte d'Ivoire — loi **n°2013-450** relative à la protection des données à caractère personnel, autorité **ARTCI**. ⚠️ Obligations exactes à faire valider par une personne compétente.
- **Données collectées** : [liste — champs strictement nécessaires]
- **Minimisation** : justifier chaque champ ; supprimer tout champ collecté « au cas où »
- **Base légale & durée de conservation** : [consentement / exécution du contrat ; durée]
- **Données sensibles** : numéros Mobile Money, téléphone, email → chiffrement en transit et au repos, **masquage dans les logs**
- **Sous-traitants** : [Brevo, Cloudflare, GeniusPay, Turso, Coolify — nature et localisation de l'hébergement]
- **Droits des personnes** : accès, rectification, suppression → [modalité prévue]

## Hypothèses non confirmées
- [ ] [hypothèse 1]
- [ ] [hypothèse 2]

## Questions ouvertes avant build
- [ ] [question 1]
- [ ] [question 2]
