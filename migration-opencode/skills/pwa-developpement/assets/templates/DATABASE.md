# DATABASE — <Nom du projet>

> Schéma relationnel succinct + règles d'accès. Mis à jour à chaque modification de schéma. Ultra-léger.

## Moteur
- [PocketBase (SQLite) — défaut] / [Turso (libSQL)] / [PostgreSQL]

## Collections / Tables
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

## Relations
- `users` 1—N `[nom_table]` (via `user_id`)

## Règles d'accès (RLS / règles PocketBase)
- Lecture : [règle]
- Écriture : [règle]
- Multi-tenant : [workspaces/organisations + rôles si applicable]

## Stratégie de migration
- Migrations versionnées : `pb_migrations/` (PocketBase) ou SQL versionné (Turso)
- Isolation stricte : base `testing` vs `production`
- Seeders : jeu de données réalistes pour tests (`scripts/seed`)

## Dictionnaire de données (champs calculés / globaux)
- [champ] : [définition / formule]

## Synchronisation
- Toute modification de champs/tables/règles → mise à jour immédiate de ce fichier (Living Documentation).
