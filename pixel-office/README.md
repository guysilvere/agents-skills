# Pixel Office v0.3 — Cockpit Virtuel Agents IA (Agence Bulles)

- Application web **100 % locale** pour écran secondaire.
- Simulation d'équipe en **Pixel Art Top-Down 2D rétro (JRPG / SimCity)** : les 3 agents permanents (`lead-dev`, `ops-quality`, `integrations`), les **sous-agents renforts**, et la mascotte **GitCat**.

## Architecture Cockpit 3 Colonnes (v0.3)

- **Barre latérale gauche (64px)** : Navigation rétro compacte (`BUREAU`, `CONSOLE`, `GITCAT`, `SON`, `PLEIN ÉCRAN`).
- **Zone centrale** :
  - **Bandeau supérieur KPI** : Supervision synthétique (agents en activité, jalons `STOP`, projet actif, tokens cumulés, statuts des watchers Antigravity/OpenCode/Claude, horloge).
  - **Plateau 2D Top-Down 100 % libéré** : Plus aucune boîte flottante superposée sur le salon lounge ou GitCat. Les bulles HUD apparaissent uniquement au-dessus de la tête des agents.
  - **Pied de page Journal** : Ticker de logs défilants inspiré des consoles JRPG.
- **Régie latérale droite (310px)** :
  - **Arbre hiérarchique scrollable** : Direction (`lead-dev`), Spécialistes permanents (`ops-quality`, `integrations`), Renforts temporaires (sous-agents).
  - **Fiche d'inspection intégrée permanente** : Rôle, mission, jauges de contexte (mana), skills actives et bouton de customisation.
- **Customisation complète (Dialogue Modale)** :
  - **Style** : Choix de sprite (6 profils rétro 16-bit), couleur du pull, accessoires (laptop, headset, lunettes, tasse).
  - **Rôle & Objectifs** : Titre personnalisé, mission principale, sélection des skills actives.

## Lancement local

```bash
cd pixel-office
npm install
npm run dev
```

- **URL locale directe** : `http://127.0.0.1:5173` (ou `https://pixel-office.test` via Caddy)
- **Authentification** : Aucune (dashboard local sur `127.0.0.1`).

## Envoyer un événement depuis le terminal ou un hook

```bash
# Assigner un agent à un projet avec action précise et skills
node scripts/emit-event.mjs --type=WORK_START --agent=lead-dev --project=lodgi --activity="Editing src/routes/+page.svelte" --skills=pwa-cadrage,shared-eco-tokens

# Déclencher une alerte de jalon humain (⛔ STOP) avec chime sonore
node scripts/emit-event.mjs --type=WAITING_HUMAN --agent=lead-dev --project=lodgi --message="STOP : Valider le schéma DB"

# Faire apparaître un sous-agent avec effet Matrix Digital Rain
node scripts/emit-event.mjs --type=SPAWN_SUBAGENT --subagent=qa-runner --role="Audit Lighthouse" --project=lodgi
```
