# Modélisation des menaces — STRIDE & Surface d'attaque

> Document d'analyse de risques et de mitigation de sécurité (inspiré de la méthodologie STRIDE / Fabric).
> Projet : `<nom-du-projet>`
> Date : `<YYYY-MM-DD>`
> Auteur : `lead-dev` / `ops-quality`

---

## 1. Vue d'ensemble & Surface d'attaque

### Acteurs et niveaux de privilèges
- **Visiteur anonyme** : Accès landing, pages publiques, routes d'authentification.
- **Utilisateur authentifié** : Accès à ses propres ressources uniquement.
- **Administrateur** : Accès consoles de gestion / métriques internes.
- **Passerelle tierce (passerelle de paiement, Brevo)** : Webhooks entrants avec signature HMAC.

### Points d'entrée (Attack Surface)
- **Routes HTTP publiques** : Formulaires, login/signup, landing.
- **Routes API serveur** : SvelteKit `+server.ts` et Server Actions `+page.server.ts`.
- **Webhooks entrants** : `/api/webhooks/passerelle de paiement`, `/api/webhooks/brevo`.
- **Stockage d'objets** : Uploads directs ou signés vers Cloudflare R2.
- **Base de données** : Base Turso (libSQL) — ⚠️ **Aucune Row-Level Security native**.

---

## 2. Analyse des menaces STRIDE

| Catégorie | Menace potentielle | Impact | Mesure de mitigation requise | Vérifié |
|---|---|---|---|---|
| **S**poofing (Usurpation) | Vol ou falsification de session utilisateur | Critique | Cookies `HttpOnly`, `Secure`, `SameSite=Lax`. Rotation de session post-login. | [ ] |
| **S**poofing | Faux appel webhook de paiement | Critique | Vérification de la signature HMAC (`timingSafeEqual`) avec secret webhook. | [ ] |
| **T**ampering (Altération) | Modification de charge utile / manipulation de prix | Critique | Validation stricte Zod côté serveur sur tous les payloads ; recalcul du montant côté serveur (jamais confiance au client). | [ ] |
| **T**ampering | Injection SQL dans les requêtes de base | Critique | Requêtes paramétrées obligatoires via Drizzle/libSQL. Zéro concaténation de chaînes SQL. | [ ] |
| **R**epudiation (Répudiation) | Contestations de transactions ou d'actions critiques | Moyen | Journalisation d'audit immuable avec ID utilisateur, horodatage UTC, IP (Cloudflare) et ID transaction passerelle de paiement. | [ ] |
| **I**nformation Disclosure (Fuite) | IDOR : accès aux données d'un autre utilisateur | Critique | **Autorisation applicative obligatoire** sur chaque server route (`WHERE id = ? AND user_id = ?`). Jamais d'accès direct par ID sans filtre propriétaire. | [ ] |
| **I**nformation Disclosure | Exposition de jetons ou stack traces | Majeur | Secrets via variables d'env serveur uniquement (jamais de préfixe `PUBLIC_`). Erreurs génériques au client. | [ ] |
| **D**enial of Service (Déni de service) | Brute force auth / épuisement de ressources | Majeur | Rate limiting applicatif + Cloudflare Turnstile / WAF sur login, register et création de paiement. | [ ] |
| **E**levation of Privilege (Élévation) | Accès aux actions admin par un utilisateur standard | Critique | Vérification de rôle côté serveur (`session.user.role === 'admin'`) avant tout traitement. | [ ] |

---

## 3. Matrice de mitigation spécifique Agence Bulles

### A. Règle absolue Turso (Anti-IDOR)
- **Principe** : Turso/libSQL n'a pas de RLS. Un seul runtime possède la connexion et la règle d'autorisation.
- **Mitigation** : Chaque requête de lecture, modification ou suppression DOIT inclure `userId` extrait de la session serveur vérifiée.

### B. Sécurité des Paiements passerelle de paiement
- **Principe** : Traitement de fonds monétaires réels (Wave, Orange Money, MTN, Moov, cartes).
- **Mitigation** :
  1. Comparaison sécurisée HMAC : `crypto.timingSafeEqual` pour contrer les attaques temporelles.
  2. Idempotence : Table `processed_events` pour rejeter tout doublon de webhook.
  3. Réconciliation asynchrone : Vérification de statut actif via l'API passerelle de paiement avant livraison du service.

---

## 4. Checklist de validation

- [ ] Matrice STRIDE revue pour chaque nouvelle entité de données.
- [ ] Endpoints serveur protégés contre les IDOR.
- [ ] Webhooks sécurisés avec vérification cryptographique et idempotence.
- [ ] Zéro secret dans les bundles clients ou le dépôt Git.
