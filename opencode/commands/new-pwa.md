---
description: Blueprint complet + scaffold d'une nouvelle PWA Agence Bulles (phases 0-5) via lead-dev et les skills pwa-cadrage et pwa-developpement.
agent: lead-dev
---

Lance la création d'une nouvelle PWA pour le projet mentionné (phases 0-5) :

1. Phase 1 — Cadrage :
   - Charge la skill `pwa-cadrage` (`skill pwa-cadrage`).
   - Stress-teste l'idée et propose 5 à 10 noms (+ vérification domaine/GitHub).
   - ⛔ Attends la validation du nom par l'utilisateur.
   - Produis `docs/CADRAGE.md`, `docs/BLUEPRINT.md` et `ROADMAP.md`.
2. Phase 2 — Construction & Scaffold :
   - Charge la skill `pwa-developpement` (`skill pwa-developpement`).
   - Scaffolde le projet dans son dossier, installe les dépendances, initialise Git (`testing`).
   - Configure `.gitignore` (excluant bases locales et `docs/credentials.md`).
   - Réserve le port hôte dans `~/Projets/PROJECTS_REGISTRY.md`, déclare `<projet>.test` et `<projet>.local` dans `~/.config/caddy/Caddyfile`, et inscrit les hôtes dans `/etc/hosts` sans conflit.
   - Crée dès le départ `docs/credentials.md` (comptes tests réutilisables tout au long du dev, local uniquement, jamais commité).
   - Crée `AGENTS.md` (+ section compatibilité Antigravity `.agents/rules/`) et `README.md`.
3. Présente les livrables validés prêts pour le développement des fonctionnalités.

Contexte additionnel : $ARGUMENTS
