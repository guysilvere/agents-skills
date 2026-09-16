# DATABASE — <Nom du projet>

> Schéma + **règles d'autorisation**. Mis à jour à chaque modification de schéma. Ultra-léger.

## Moteur
- **Turso (libSQL)** — base principale.
- ⚠️ **Turso n'a pas de row-level security.** Contrairement à PocketBase (API rules) ou PostgreSQL (RLS), **aucune règle d'accès n'est déclarée dans la base** : toute l'autorisation est **applicative**.

## Autorisation — règle structurante
- **Un seul runtime possède la base et l'autorisation** : les server routes SvelteKit (`src/lib/server/`).
- Aucun accès Turso ailleurs — pas de client dans le navigateur, pas de second service qui écrirait directement.
- Un module unique `src/lib/server/auth/authorize.ts` : **chaque** lecture/écriture passe par lui.
- **Requêtes scopées par utilisateur** : jamais de `SELECT * FROM orders` sans clause de propriété. C'est là que naissent les IDOR.
- Jeton Turso **scopé** par environnement quand c'est possible (`turso db tokens create <db> --read-only`, `-p <table>:<actions>`).

## Tables

### `users`
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | text | PK |
| email | text | unique, indexé |
| name | text | |
| role | text | admin / éditeur / lecteur |

### `[nom_table]`
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | text | PK |
| user_id | text | FK → users.id, **indexé** |

## Matrice d'autorisation (obligatoire)
> Toute table doit figurer ici. « Aucun accès » est une réponse valide ; une case vide ne l'est pas.

| Table | Lire | Créer | Modifier | Supprimer | Implémenté dans |
|-------|------|-------|----------|-----------|-----------------|
| users | soi-même | inscription | soi-même | admin | `authorize.ts` |
| [table] | | | | | |

## Relations
- `users` 1—N `[nom_table]` (via `user_id`)

## Multi-tenant (si applicable)
- [workspaces / organisations + rôles] — et **comment le `tenant_id` est imposé à chaque requête**

## Paiements (si applicable)
- Idempotence webhook : **contrainte d'unicité sur `geniuspay_reference`**.
- Machine à états des statuts — transitions interdites refusées.
- Montants stockés en **entiers XOF**.

## Stratégie de migration
- Migrations SQL versionnées dans `migrations/` — numérotées, **jamais modifiées après application**.
- Isolation stricte : deux bases Turso (staging / production) et deux jetons distincts.
- Ordre : backup → migration testée sur copie de staging → déploiement → vérification. Rollback documenté dans `RUNBOOK.md`.
- Seeders : `scripts/seed` — **refuse de s'exécuter hors local/staging**.

## Dictionnaire de données (champs calculés / globaux)
- [champ] : [définition / formule]

## Synchronisation
- Toute modification de table, de contrainte **ou de règle d'autorisation** → mise à jour immédiate de ce fichier (Living Documentation).
