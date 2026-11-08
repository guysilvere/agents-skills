# Pixel Office v0.4.5 — Cockpit Virtuel Agents IA (Agence Bulles)

Supervision autonome et cockpit de pilotage bi-directionnel des agents IA en **Pixel Art Top-Down 2D rétro (JRPG / 16-bit)** pour écran secondaire ou mode Kiosk.

---

## Tableau des Accès Locaux

| Service | URL Locale | Type / Rôle | Statut / Ports |
| :--- | :--- | :--- | :--- |
| **Pixel Office (HTTPS Caddy)** | [https://pixel-office.test](https://pixel-office.test) | Cockpit supervision & pilotage bi-directionnel | Reverse proxy TLS local (:5173) |
| **Pixel Office (Alias local)** | [https://pixel-office.localhost](https://pixel-office.localhost) | Résolution native macOS (sans `/etc/hosts`) | Reverse proxy TLS local (:5173) |
| **Pixel Office (Dev direct)** | [http://127.0.0.1:5173](http://127.0.0.1:5173) | Serveur Vite / SvelteKit 5 | Direct `127.0.0.1:5173` |
| **API Pont Jalons (Gates)** | `GET/POST http://127.0.0.1:5173/api/gates` | Endpoint JSON de résolution CLI bi-directionnelle | Port :5173 |
| **Flux SSE Temps Réel** | `GET http://127.0.0.1:5173/api/events/stream` | Watchers Antigravity, OpenCode & Claude Code | Port :5173 |

> **Authentification** : Aucune (Cockpit local sur boucle locale `127.0.0.1`).

---

## Fonctionnalités Clés (v0.4.5)

- **Pont Bi-directionnel Armé vs Observateur (Switch Sécurisé)** :
  - **Mode OBSERVATEUR (`[🔒 OBSERVATEUR : OFF]`)** : Visualisation en capsules d'information pures de lecture seule, sans boutons perturbateurs.
  - **Mode PILOTAGE (`[⚡ PILOTAGE : ON]`)** : Les clics sur `[✔ VALIDER]` ou `[↺ RÉVISION]` débloquent instantanément les agents dans leurs terminaux Antigravity, OpenCode ou Claude Code via le protocole partagé `~/.config/pixel-office/gates/`.
- **Hub de Jalons Multi-Projets** :
  - Détection et affichage simultané des blocages sur plusieurs projets distincts (ex: `[LODGI]` en violet/bleu roi et `[AGENCEBULLES]` en rose fuchsia).
  - Validation individuelle par projet ou bouton groupé `[✔ TOUT VALIDER (N PROJETS)]`.
- **Plateau 2D 100% Dégagé & Mini-Pills Rétro** :
  - Remplacement des bulles HUD lourdes par des capsules fines translucides de 18px (voyant d'état, nom, action courte), laissant les bureaux, écrans et meubles entièrement visibles.
  - Suppression des espaces morts sous la boîte de note RPG : canvas adaptatif occupant tout l'espace vertical disponible.
- **Cycle Jour / Nuit Cyberpunk & Ambiance** :
  - Modes `AUTO` (synchronisé avec l'heure réelle de macOS), `JOUR`, `SOIR` et `NUIT` avec néons pixel art dynamiques.
- **Audio Chiptune WebAudio & Foley 8-bit** :
  - Synthétiseur procédural Lo-Fi 72 BPM sans asset MP3 lourd.
  - Bruitages 8-bit rétro : ronronnement GitCat, chimes de validation, frappes claviers et alertes serveurs.
- **Scénarios Réalistes & Idle Roaming Autonome** :
  - Convocations de standup meeting au salon, alertes rack serveur Coolify, coups de fil intercom directs entre collègues, visites en binôme et pauses café.

---

## Configuration Caddy & Domaine Local

Le projet est configuré dans le Caddyfile global (`~/.config/caddy/Caddyfile`) ainsi que dans un Caddyfile local autonome (`pixel-office/Caddyfile`).

### 1. Rechargement du Caddyfile Global

```bash
sudo caddy reload --config ~/.config/caddy/Caddyfile
```

### 2. Ou Lancement Autonome via le dossier du projet

```bash
cd pixel-office
sudo caddy run --config Caddyfile
```

### 3. Résolution DNS locale

- `https://pixel-office.localhost` résout automatiquement vers `127.0.0.1` sur macOS.
- Pour utiliser `https://pixel-office.test`, ajouter dans `/etc/hosts` :
  ```bash
  echo "127.0.0.1 pixel-office.test www.pixel-office.test pixeloffice.test" | sudo tee -a /etc/hosts
  ```

---

## Démarrage du Serveur de Développement

```bash
cd pixel-office
npm install
npm run dev
```

Vite démarre sur `http://127.0.0.1:5173`. Si Caddy est actif, le site est accessible en HTTPS avec certificat local certifié sur `https://pixel-office.test`.

---

## Intégration CLI / Scripts d'Événements

### Émettre un jalon humain STOP depuis un hook ou terminal :

```bash
# Via l'API HTTP REST
curl -X POST http://127.0.0.1:5173/api/gates \
  -H "Content-Type: application/json" \
  -d '{
    "create": true,
    "project": "lodgi",
    "agentId": "lead-dev",
    "title": "Validation schéma Turso",
    "message": "Ajout table reservations",
    "sourceTool": "antigravity"
  }'
```

### Résoudre un jalon par script externe :

```bash
curl -X POST http://127.0.0.1:5173/api/gates \
  -H "Content-Type: application/json" \
  -d '{"gateId": "gate-lodgi-lead-dev", "action": "approve"}'
```

### Ou surveiller le fichier de signalisation :

Les fichiers vivent dans `~/.config/pixel-office/gates/*.json`. Dès qu'un utilisateur clique `VALIDER` sur l'écran, le statut du fichier passe à `APPROVED` avec le timestamp `resolvedAt`.

---

## Stack Technique

- **Framework** : SvelteKit 2 (`adapter-node`) + Svelte 5 (Runes `$state`, `$derived`, `$derived.by`).
- **Langage** : TypeScript strict + schémas Zod.
- **Rendu** : HTML5 Canvas 2D procédural, spritesheets 16x32px et tuiles 16x16px (image-rendering pixelated).
- **Audio** : Web Audio API chiptune procédural.
- **Tests & Qualité** : Vitest (19/19 tests passants) + `svelte-check` 0 erreur.
