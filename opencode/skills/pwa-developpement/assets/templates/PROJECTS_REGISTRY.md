# Registre des Projets Web Locaux (Caddy & Docker OrbStack)

> ⚠️ **SOURCE DE VÉRITÉ LOCALE UNIQUE — RÉSERVATION STRICTE DES PORTS SANS DOUBLON**
> 
> Tout nouveau projet, service ou conteneur local **doit obligatoirement réserver son port ici** avant sa configuration dans Caddy (`~/.config/caddy/Caddyfile`) et dans `docker-compose.dev.yml`.
> À chaque lancement local ou ajout de service, se référer à ce registre pour vérifier et bloquer les ports sans conflit.

---

## 🔌 Plages de ports réservées par technologie

| Plage de ports | Technologie / Usage |
| :--- | :--- |
| **5170 – 5189** | Frontends Vite / SvelteKit / React SPAs |
| **3000 – 3019** | Node.js / Next.js / Nuxt / Web UIs |
| **8000 – 8019** | Micro-services Python / FastAPI / Django |
| **8080 – 8089** | Sites statiques / Nginx / Landing pages marketing |
| **8090 – 8099** | Backends PocketBase / Go / APIs dédiées & bases locales |

---

## 🗂️ Répertoire des projets (ordre alphabétique)

### 1. Agence Bulles
- **Dossier local** : `~/Projets/agencebulles-website`
- **Stack** : SvelteKit + TailwindCSS (PWA / Plateforme SaaS studio)
- **Liens & Ports** :

| Service / Rôle | Domaine principal | Alias (.local / .localhost) | Port Hôte (réservé) | Port Conteneur | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Plateforme Web / SaaS** | `https://agencebulles.test` | `agencebulles.local`, `agencebulles.localhost` | **5176** | `5173` | Site officiel & espace client |

---

### 2. BRVM Radar
- **Dossier local** : `~/Projets/brvmradar`
- **Stack** : SvelteKit v3 + Turso libSQL (Dashboard financier BRVM)
- **Liens & Ports** :

| Service / Rôle | Domaine principal | Alias (.local / .localhost) | Port Hôte (réservé) | Port Conteneur | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Application Principale** | `https://brvmradar.test` | `brvmradar.local`, `brvmradar.localhost`, `brvm-radar.test` | **5175** | `5173` | Dashboard & analyses boursières |

---

### 3. DeepSeek Harness (DSH)
- **Dossier local** : `~/Projets/dsh`
- **Stack** : Next.js / Node.js
- **Liens & Ports** :

| Service / Rôle | Domaine principal | Alias (.local / .localhost) | Port Hôte (réservé) | Port Conteneur | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Browser Web UI** | `https://dsh.test` | `dsh.local`, `dsh.localhost` | **3000** | `3000` | Interface web officielle DeepSeek |

---

### 4. Lodgi
- **Dossier local** : `~/Projets/lodgi`
- **Stack** : Multi-tenant (React Vite PWA + Go PocketBase + Nginx Landing)
- **Liens & Ports** :

| Service / Rôle | Domaine principal | Alias (.local / .localhost) | Port Hôte (réservé) | Port Conteneur | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Landing Marketing** | `https://lodgi.test` | `lodgi.local`, `lodgi.localhost` | **8080** | `80` | Site vitrine & tarifs |
| **Site Public Voyageurs** | `https://*.lodgi.test` (racine) | `*.lodgi.local` | **8081** | `80` | Réservations voyageurs |
| **Back-office PWA** | `https://*.lodgi.test/gestion/` | `*.lodgi.local/gestion/` | **5173** | `5173` | Gestion hôtelière hôtelier |
| **Console Superadmin** | `https://admin.lodgi.test` | `admin.lodgi.local` | **5174** | `5174` | Dashboard plateforme MRR |
| **PocketBase Master** | `https://master.lodgi.test` | `master.lodgi.local` | **8090** | `8090` | API & BDD master |
| **Tenant Production-like** | `https://hotel-ivoire.lodgi.test` | `hotel-ivoire.lodgi.local` | **8091** | `8090` | Instance hôtel Ivoire |
| **Tenant Test / Dev** | `https://hotel-test.lodgi.test` | `hotel-test.lodgi.local` | **8095** | `8090` | Instance hôtel de test |
| **Backend Go (Turso)** | `https://api.lodgi.test` | `api.lodgi.local` | **8096** | `8096` | API Go connectée à Turso |
| **Optimiseur d'images** | `https://*.lodgi.test/images/*` | `*.lodgi.local/images/*` | **8099** | `8099` | Service Sharp cache immutable |

---

### 5. Pixel Office
- **Dossier local** : `~/Projets/agents-skills/pixel-office`
- **Stack** : SvelteKit + Canvas 2D + WebAudio (Cockpit pixel art des agents IA)
- **Liens & Ports** :

| Service / Rôle | Domaine principal | Alias (.local / .localhost) | Port Hôte (réservé) | Port Conteneur | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cockpit Supervision** | `https://pixel-office.test` | `pixel-office.local`, `pixeloffice.test` | **5177** | `5173` | Bureau virtuel & suivi agents |

---

## 📊 Matrice d'allocation des ports (Blocage anti-doublon)

| Port Hôte | Projet associé | Domaine assigné | Statut |
| :--- | :--- | :--- | :--- |
| **3000** | DeepSeek Harness | `dsh.test` | 🔴 Réservé |
| **3001 – 3019** | — | *(Disponible pour futures apps Node/Next)* | 🟢 Libre |
| **5173** | Lodgi (Back-office PWA) | `*.lodgi.test/gestion/` | 🔴 Réservé |
| **5174** | Lodgi (Superadmin) | `admin.lodgi.test` | 🔴 Réservé |
| **5175** | BRVM Radar | `brvmradar.test` | 🔴 Réservé |
| **5176** | Agence Bulles | `agencebulles.test` | 🔴 Réservé |
| **5177** | Pixel Office | `pixel-office.test` | 🔴 Réservé |
| **5178 – 5189** | — | *(Disponible pour nouveaux frontends Vite/Svelte)* | 🟢 Libre |
| **8000 – 8019** | — | *(Disponible pour backends Python/FastAPI)* | 🟢 Libre |
| **8080** | Lodgi (Landing) | `lodgi.test` | 🔴 Réservé |
| **8081** | Lodgi (Site public) | `*.lodgi.test` (racine) | 🔴 Réservé |
| **8082 – 8089** | — | *(Disponible pour sites statiques/landing)* | 🟢 Libre |
| **8090** | Lodgi (Master PocketBase) | `master.lodgi.test` | 🔴 Réservé |
| **8091** | Lodgi (Tenant Ivoire) | `hotel-ivoire.lodgi.test` | 🔴 Réservé |
| **8095** | Lodgi (Tenant Test) | `hotel-test.lodgi.test` | 🔴 Réservé |
| **8096** | Lodgi (Backend Go) | `api.lodgi.test` | 🔴 Réservé |
| **8099** | Lodgi (Images Sharp) | `*.lodgi.test/images/*` | 🔴 Réservé |
