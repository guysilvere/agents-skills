# Identifiants & Accès Locaux — <Nom du projet>

> ⚠️ FICHIER LOCAL UNIQUEMENT — STRICTEMENT EXCLU DU VERSIONING GIT (.gitignore).
> Ne JAMAIS commiter ce fichier ni l'exposer publiquement.
> Ce fichier est la source de vérité pour tous les comptes de test utilisés en local tout au long du développement.
> À maintenir à jour à chaque ajout, suppression ou modification d'accès.

## Accès applicatifs (Dev & Preview locale)

| Interface / Rôle | URL d'accès | Login / Email | Mot de passe | Description / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Front public** | `https://<projet>.test` | — | — | Parcours visiteur libre / landing |
| **Utilisateur standard** | `https://<projet>.test/login` | `user@<projet>.test` | `user123` | Compte test utilisateur classique (données seed) |
| **Super Admin / QA** | `https://<projet>.test/admin` | `admin@<projet>.test` | `admin123` | Cockpit QA, gestion admin, validation |
| **Banc de Tests QA** | `https://<projet>.test/admin/test` | *(session admin)* | *(session admin)* | Exécution des scénarios QA du test-harness |

## Services & Outils locaux

| Service | Accès / Commande | Identifiants | Usage |
| :--- | :--- | :--- | :--- |
| **Base locale SQLite** | `file:<projet>.local.db` | — | SQLite direct libSQL (exclu git) |
| **Proxy HTTPS Caddy** | `https://<projet>.test` | — | Reverse proxy local |
| **Mailpit / Mailtrap (si actif)** | `http://localhost:8025` | — | Capture des emails de test |
