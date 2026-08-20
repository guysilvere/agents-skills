---
name: pwa-cadrage
description: Cadrage complet d'un projet PWA Agence Bulles — définition du problème, stress-test de l'idée, naming, blueprint, stack, monétisation, copywriting landing et feuille de route. Charger au démarrage de tout nouveau projet (phase 0–1 du workflow) ou avant une refonte majeure.
license: MIT
compatibility: opencode
metadata:
  audience: lead-dev
  domain: planification
---

# pwa-cadrage

## Ce que je fais
- Orchestre le cadrage de bout en bout d'un projet PWA : problème → stress-test → naming → blueprint → roadmap.
- Centralise les 8 anciennes skills de planification en un seul workflow.

## Workflow

### 1. Définir le problème (avant toute production)
- Poser les questions UNE à une : problème résolu ? cible (personas PME/TPE ivoiriennes) ? contraintes (délai, budget, stack) ? monétisation ?
- Formaliser personas : attentes, irritants, habitudes mobile/bureau.

### 2. Stress-test de l'idée
- Interroger l'utilisateur méthodiquement, une question à la fois, jusqu'à résoudre chaque branche décisionnelle.
- Toujours proposer une réponse recommandée avec la question.
- Si la réponse est dans le code existant, lire le code avant de demander.
- Ne pas passer au blueprint tant qu'il reste des zones d'ombre.
- Checklist : `assets/checklists/stress-test.md`.

### 3. Naming (validation obligatoire avant la suite)
- Proposer 5–10 noms : court, mémorable, prononçable, sans connotation négative FR+EN.
- Techniques : mot-valise, métaphore, néologisme, préfixe/suffixe.
- Vérifier disponibilité : domaines (.app .net .ci .com .dev), Google Play, App Store, INPI, **OAPI** (priorité en CI), Namechk.
- Checklist : `assets/checklists/naming.md`.
- Livrable : nom validé + dossier local `/Projets/<nom>` + repo GitHub au nom du projet.

### 4. Blueprint (docs/BLUEPRINT.md)
- Contexte & problème → proposition de valeur → stack justifiée → architecture (flux de données, modules) → user stories MoSCoW → exigences PWA → plan de développement (jalons) → perspectives d'évolution → monétisation → hébergement.
- Stack : suivre `assets/data/stack-table.md` (PocketBase par défaut ; Turso option ; Coolify + Docker ; Cloudflare proxy/R2/Turnstile).
- Architecture PocketBase : conteneur sidecar, API REST publique, admin UI sur `db.<domaine>`, hooks `pb_hooks`.
- Template : `assets/templates/BLUEPRINT.md`.

### 5. Cadrage produit (docs/CADRAGE.md)
- Synthèse : personas, KPIs, modèle économique, scope MVP v0/v1, arbitrages.
- Template : `assets/templates/CADRAGE.md`.

### 6. Monétisation
- Est-ce monétisable ? (gagne du temps/argent ou en fait perdre s'il s'arrête)
- Modèles : freemium, abonnement mensuel/annuel, paiement unique, quotas.
- Paliers : Gratuit / Pro / Équipe (repère CI : 2 000–15 000 FCFA/mois, 1 € ≈ 655 FCFA).
- Passerelles : **Jèko** principale (Mobile Money), **CinetPay** secours + cartes. Abonnements, webhooks, dunning, factures PDF.

### 7. Copywriting landing
- Hero (promesse + sous-titre + 1 CTA) → bénéfices (résultats, pas fonctionnalités) → preuve (véridique uniquement) → fonctionnement (3 étapes) → tarifs → CTA final + « Conçu par Agence Bulles ».
- Voix active, phrases courtes, zéro remplissage. Ne jamais inventer de preuves.

### 8. Feuille de route (ROADMAP.md)
- Jalons court/moyen/long terme ; points d'extension d'architecture dès la conception.
- Exemples d'évolution : API publique, exports CSV/PDF, multi-comptes, intégrations, i18n.
- Priorisation : score = Impact × confiance ÷ effort (1–5).
- Template : `assets/templates/ROADMAP.md`.

## Règles
- Toujours charger `shared-eco-tokens` en parallèle.
- Marché : PME/TPE ivoiriennes, mobile-first, simplicité et robustesse.
- Ultra-léger : listes à puces, pas de texte superflu.
- Ne jamais inventer de chiffres ou de faits ; marquer les hypothèses non confirmées.

## Assets
- `assets/templates/CADRAGE.md`
- `assets/templates/BLUEPRINT.md`
- `assets/templates/ROADMAP.md`
- `assets/checklists/stress-test.md`
- `assets/checklists/naming.md`
- `assets/data/stack-table.md`
