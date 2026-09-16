# RUNBOOK — <Nom du projet>

> Procédures opérationnelles. Mis à jour à chaque changement d'infra/déploiement. Ultra-léger.

## Topologie
- App prod : `https://<domaine>` (Coolify, port 80)
- Console Coolify : `https://coolify.<domaine>` (tunnel Zero Trust)
- Staging : `https://staging.<domaine>` + `db.staging.<domaine>`
- Stockage : Cloudflare R2 (bucket `<nom>`) — médias + sauvegardes
- Base : **Turso (libSQL)** — `libsql://<db>.turso.io` (managé, aucun conteneur)
- n8n : [absent du MVP / hébergé] — si présent, webhooks entrants authentifiés

## Déploiement (Coolify)
1. Merge `testing` → `main` **via PR** (CI verte + validation humaine) + tag version
2. Coolify déploie depuis GitHub (branch `main`)
3. Vérifier healthcheck + logs
4. Mettre à jour `docs/RUNBOOK.md` + `CHANGELOG.md` si la procédure change

## Migrations de schéma — ordre impératif
> Migrations SQL versionnées dans `migrations/` (Drizzle), **jamais modifiées après application**.
1. **Backup** et **vérifier** que la sauvegarde est lisible
2. Appliquer la migration sur la **base Turso de staging** et tester
3. Déployer le code
4. Appliquer la migration en production
5. **Vérifier** (healthcheck + requêtes de contrôle)
6. **Rollback** : [procédure] — restaurer la sauvegarde, ou appliquer la migration inverse. **À tester en staging.**

> ⛔ Jamais de migration sur une base non locale sans validation humaine explicite.

## Cloudflare
- Proxy orange actif (IP masquée), SSL Full (Strict)
- Turnstile actif sur formulaires ; WAF/DDoS on
- Tunnels : [liste des tunnels / config cloudflared]

## Sauvegardes (quotidiennes, R2)
- Commande : `scripts/backup-r2.sh` (cron 02:00)
- **Cohérence** : export logique `turso db shell <db> .dump` — jamais de copie de fichier. Les sauvegardes internes de Turso ne remplacent pas cette sauvegarde applicative (elles ne sont pas exportables hors plateforme)
- Contenu : sauvegarde de la base + dossier médias
- Rétention : [7 jours / 30 jours]

## Restauration
- Commande : `scripts/restore-r2.sh` (préciser le snapshot / la date)
- Procédure : stop app → restore → start → **vérifier** (healthcheck + données de contrôle)

### Test de restauration (obligatoire et périodique)
- **Dernière date testée** : [AAAA-MM-JJ] · **Fréquence** : [mensuelle]
- Procédure : restaurer sur un environnement jetable → vérifier l'intégrité → détruire
- Une sauvegarde jamais restaurée n'est pas une sauvegarde.

## Monitoring
- **Disponibilité** : check uptime sur `https://<domaine>` + `https://db.<domaine>` — alertes vers [email/slack]
- **Erreurs applicatives** : remontée et suivi (outil : [Sentry / logs Coolify / autre]) — alerte sur pic
- **Jobs critiques** (réconciliation paiements, backups) : alerte si non exécuté
- Quotas R2 surveillés (seuil : [X] %)

## Incidents
- Incident 1 : [date] — [symptôme] → [résolution]
- ...

## Rotation des clés (planifiée)
- GeniusPay / Brevo / Mailtrap / Turso : [fréquence]
- ⚠️ Séparer strictement les jetons `sandbox` et `live` — ne jamais mettre une clé `live` dans un environnement de test
- VAPID / JWT secret : [fréquence]
- R2 Access Keys : [fréquence]

## Contacts
- Agence Bulles — agencebulles.net
