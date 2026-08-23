# BLUEPRINT — <Nom du projet>

> Statut : DRAFT / APPROVED · Stack de référence : workflow phases 0–10 · Agence Bulles (agencebulles.net)

## 1. Contexte & problème
- [problème résolu, pour qui, contexte d'usage]

## 2. Proposition de valeur
- [promesse en une phrase]

## 3. Stack technique
| Couche | Choix | Justification |
|--------|-------|---------------|
| Front | [PWA mobile-first] | |
| Back | [API légère] | |
| Base | **PocketBase** (SQLite) / Turso (libSQL) | |
| Auth | [Google par défaut + email/magic link ; Turnstile anti-bot] | |
| Emails | Brevo / Mailtrap | |
| Paiements | Jèko + CinetPay | |
| Stockage | Cloudflare R2 (URLs présignées, AVIF/WebP) | |
| Déploiement | Coolify + Cloudflare (proxy orange, tunnels Zero Trust) | |

## 4. Architecture
- Modules : [liste]
- Flux de données : [schéma texte]
- PocketBase : conteneur sidecar, API REST, admin `db.<domaine>`, hooks `pb_hooks`
- Points d'extension prévus : [API publique, exports, multi-comptes, intégrations, i18n]

## 5. User stories (MoSCoW)
- **Must** :
  - En tant que **[rôle]**, je veux **[action]**, afin de **[valeur]**
- **Should** :
  - ...
- **Could / Won't** : ...

## 6. Exigences PWA
- Manifest complet (standalone, portrait, icônes 192/512 + maskable)
- Service worker offline-first (stale-while-revalidate), page de repli `/offline.html`
- Cibles : LCP < 2.5 s, CLS < 0.1, INP < 200 ms

## 7. Plan de développement
- Jalon 1 : [livrable] → dépend de : [rien]
- Jalon 2 : [livrable] → dépend de : [jalon 1]
- [ordre de construction + dépendances]

## 8. Perspectives d'évolution
- v2 : [piste + point d'extension concerné]
- v3 : [piste + point d'extension concerné]

## 9. Monétisation
- Modèle + paliers (cf. CADRAGE.md)
- Webhooks Jèko/CinetPay, dunning, factures PDF

## 10. Hébergement & domaines
| Usage | Sous-domaine | Cible |
|-------|--------------|-------|
| App prod | `<domaine>` | app (port 80) |
| Admin PocketBase | `db.<domaine>` | PocketBase (port personnalisé) |
| Staging app | `staging.<domaine>` | app staging |
| Staging PocketBase | `db.staging.<domaine>` | PocketBase staging |

## Routes API & webhooks (ajouts à chaque évolution)
- `POST /api/...` : [payload / usage]
- Webhook `Jeko-Signature` / CinetPay : [gestion]

## Questions ouvertes
- [ ] [question]
