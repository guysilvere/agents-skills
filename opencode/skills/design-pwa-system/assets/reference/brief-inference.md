# Brief Inference — lire le contexte avant de coder

> Mécanique condensée de taste-skill (Leonxlnx) — anti-slop. Appliquer AVANT tout choix de design.
> Règle : rien ne se déclenche automatiquement. Lire le brief, puis ne tirer que ce qui correspond.

## 0.A Signaux à lire (dans l'ordre)
1. **Type de page** : landing (SaaS / consommateurs / agence / événement), portfolio, redesign (préserver vs refondre), éditorial / blog.
2. **Mots d'ambiance** de l'utilisateur : "minimaliste", "calme", "style Linear", "Awwwards", "brutaliste", "premium", "Apple-like", "joueur", "B2B sérieux", "éditorial", "glassmorphism", "dark tech".
3. **Signaux de référence** : URLs liées, captures collées, produits nommés, marques concurrentes.
4. **Audience** : comité d'achat B2B vs consommateur design-conscious vs recruteur. L'audience choisit l'esthétique, pas le goût de l'agent.
5. **Assets de marque existants** : logo, couleur, type, photo. Pour un redesign : matériau de départ, pas optionnel.
6. **Contraintes silencieuses** : accessibilité d'abord, secteur public, secteurs réglementés, commerce trust-first, produits enfants. Ces contraintes PRIMENT sur la préférence esthétique.

## 0.B Design Read — 1 ligne avant de générer
État avant tout code : **« Je lis ceci comme : \<type de page> pour \<audience>, avec un langage \<ambiance>, penchant vers \<famille de design system ou esthétique>. »**

Exemples :
- *"Je lis ceci comme : landing B2B SaaS pour acheteurs techniques, langage minimaliste type Linear, vers Tailwind + Geist + motion retenue."*
- *"Je lis ceci comme : refonte d'un service public, langage trust-first, vers GOV.UK Frontend."*
- *"Je lis ceci comme : SaaS Mobile Money pour jeunes actifs, langage premium + teal/rose, vers design system maison + phosphor icons."*

## 0.C Ambiguïté : 1 question max
Si le brief est ambigu et que la lecture diverge vraiment : poser EXACTEMENT 1 question de clarification (jamais une salve). Si inférence possible : ne pas demander, déclarer le Design Read et avancer.

## 0.D Anti-défauts (ne PAS retomber dedans)
- Dégradés violet AI, hero centré sur mesh sombre, 3 cards features identiques, glassmorphism partout, micro-animations infinies, Inter + slate-900.
- Atteindre délibérément au-delà de ces défauts, guidé par le Design Read.
