---
description: Génère une modélisation des menaces STRIDE pour une fonctionnalité ou une architecture.
agent: lead-dev
---

Génère une analyse de menaces STRIDE pour $ARGUMENTS :

1. Charge la skill `pwa-cadrage` (`skill pwa-cadrage`) et le template `assets/templates/THREAT_MODEL.md`.
2. Détermine la surface d'attaque :
   - Endpoints publics et privés
   - Webhooks tiers (GeniusPay, Brevo)
   - Stockage (Cloudflare R2)
   - Base de données Turso (rappel : zéro RLS native → autorisation applicative stricte)
3. Remplis la matrice STRIDE :
   - Spoofing (Usurpation de session / webhook)
   - Tampering (Altération de payload / injection)
   - Repudiation (Traçabilité des transactions)
   - Information Disclosure (IDOR / secrets)
   - Denial of Service (Rate limiting / DDoS)
   - Elevation of Privilege (Rôles / autorisations)
4. Produis ou mets à jour `docs/security/THREAT_MODEL.md` ou la section Sécurité de la spécification concernée.
