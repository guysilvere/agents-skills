# RUNBOOK — <Nom du projet>

> Procédures opérationnelles. Mis à jour à chaque changement d'infra/déploiement. Ultra-léger.

## Topologie
- App prod : `https://<domaine>` (Coolify, port 80)
- Admin PocketBase : `https://db.<domaine>` (tunnel Zero Trust)
- Staging : `https://staging.<domaine>` + `db.staging.<domaine>`
- Stockage : Cloudflare R2 (bucket `<nom>`) — médias + sauvegardes
- Base : [PocketBase (SQLite) / Turso (libSQL)]

## Déploiement (Coolify)
1. Merge `testing` → `main` + tag version (git)
2. Coolify déploie depuis GitHub (branch `main`)
3. Vérifier healthcheck + logs
4. Mettre à jour `docs/RUNBOOK.md` + `CHANGELOG.md` si procédure changée

## Cloudflare
- Proxy orange actif (IP masquée), SSL Full (Strict)
- Turnstile actif sur formulaires ; WAF/DDoS on
- Tunnels : [liste des tunnels / config cloudflared]

## Sauvegardes (quotidiennes, R2)
- Commande : `scripts/backup-r2.sh` (cron 02:00)
- Contenu : `pb_data/data.db` + dossier médias
- Rétention : [7 jours / 30 jours]
- **Test de restauration** : [dernière date testée]

## Restauration
- Commande : `scripts/restore-r2.sh` (préciser snapshot/date)
- Procédure : stop app → restore → start → vérifier

## Monitoring & alertes
- Uptime : [outil] ; alertes vers [email/slack]
- Quotas R2 surveillés (seuil : [X] %)

## Incidents
- Incident 1 : [date] — [symptôme] → [résolution]
- ...

## Rotation des clés (planifiée)
- Jèko / CinetPay / Brevo / Mailtrap : [fréquence]
- VAPID / JWT secret : [fréquence]
- R2 Access Keys : [fréquence]

## Contacts
- Agence Bulles — agencebulles.net
