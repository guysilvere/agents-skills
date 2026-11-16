# BLUEPRINT — Pixel Office (Local Secondary Screen Dashboard)

- **Contexte** : Visualiser sur un second écran l'activité temps réel des agents IA Agence Bulles (`lead-dev`, `ops-quality`, `integrations` + sous-agents temporaires) dans un bureau en Pixel Art vue de dessus (Top-Down Pokémon).
- **Stack** :
  - SvelteKit (`adapter-node`) + TypeScript strict + Zod
  - Canvas HTML5 2D Pixel Art (`512x320` natif, `image-rendering: pixelated`, bridé à 18 FPS pour préserver le CPU/GPU)
  - Server-Sent Events (`/api/events/stream`)
  - Watcher local `chokidar` (`~/.gemini/antigravity/brain` + `~/.config/opencode`)
- **Zones de la carte (32×20 tuiles de 16×16 px)** :
  - Open Space Titulaires (`lead-dev`, `ops-quality`, `integrations`)
  - Îlot Sous-agents temporaires (4 postes flexibles + porte d'entrée/sortie)
  - Coin Café (machine à expresso, distributeur)
  - Salon Détente (canapé, table basse)
  - Salle de Sport / Gym (tapis de course, rack d'haltères, tapis de stretching)
- **Endpoints API locaux** :
  - `GET /api/events/stream` : flux SSE temps réel (`OfficeSnapshot`).
  - `GET /api/events` : état courant du bureau.
  - `POST /api/events` : injection d'événement validé par `IncomingEventSchema`.
