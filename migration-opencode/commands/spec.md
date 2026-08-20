---
description: Génère une spécification fonctionnelle docs/specs/SPEC-XXX-nom.md depuis le template standard.
agent: lead-dev
---

Génère une spécification fonctionnelle unitaire pour $ARGUMENTS (nom de la fonctionnalité) :

1. Charge la skill `pwa-developpement` (`skill pwa-developpement`) et lis le template `assets/templates/SPEC-XXX.md`.
2. Produis `docs/specs/SPEC-XXX-<nom>.md` avec le template standard obligatoire :
   - Intent (Problème/Objectif), User Story, Exigences (table ID/Exigence/DoD), Edge cases, PWA/Offline, Modèle de données & API, Fichiers impactés, Tâches d'exécution.
3. Statut initial : DRAFT.
4. Si des décisions sont ouvertes, liste-les en fin de fichier ; sinon passe le statut à APPROVED après validation utilisateur.
5. Respecte la living documentation : si la spec impacte DB/API/UI, signale les fichiers docs à mettre à jour.
