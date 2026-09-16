---
name: cadrage
description: Cadrage complet d'un nouveau projet — stress-test d'idée, naming, stack, blueprint, roadmap (phases 0-2).
---

# Cadrage de projet (phases 0-2)

Lance le cadrage d'un nouveau projet pour l'idée mentionnée.

## Étape 1 — Stress-test et questions

Charge la skill `pwa-cadrage` :
- Poser les questions de cadrage pour combler les zones d'ombre.
- Stress-tester l'idée (problème, public, différenciation).
- Identifier personas, KPIs, modèle de monétisation (GeniusPay — sandbox `pk_sandbox_…`).

## Étape 2 — Naming et disponibilité

Toujours avec la skill `pwa-cadrage` :
- Proposer 5 à 10 noms de projet.
- Vérifier la disponibilité (.app, .net, .ci, .com, .dev + GitHub).
- ⛔ Ne pas passer à l'étape suivante sans nom validé par l'utilisateur.

## Étape 3 — Stack et blueprint

- Choisir la stack dans le cadre recommandé (SvelteKit + Turso, Coolify + Cloudflare).
- Produire `docs/CADRAGE.md` et `docs/BLUEPRINT.md`.
- Rédiger `docs/DATABASE.md` (schéma + **matrice d'autorisation** — Turso n'a pas de RLS) et `ROADMAP.md`.

## Étape 4 — Livrables

Présente :
- Nom validé + domaine local `.test`.
- CADRAGE, BLUEPRINT, DATABASE, ROADMAP.
- Prochaine étape suggérée : `/spec` pour découper les fonctionnalités.
