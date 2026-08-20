# Checklist — Validation d'une skill

## Structure
- [ ] Dossier skill créé à l'emplacement de l'outil ciblé :
  - 🟦 OpenCode global : `~/.config/opencode/skills/<name>/` (projet : `.opencode/skills/` ou `.agents/skills/`)
  - 🟩 Antigravity global : `~/.gemini/config/skills/<name>/` (projet : `.agents/skills/`)
  - ⚪ Projet partagé : `.agents/skills/` (lu par les DEUX outils)
- [ ] Fichier nommé exactement `SKILL.md` (majuscules — pas `skill.md`)

## Frontmatter
- [ ] 🟦 OpenCode : `name` obligatoire == nom du dossier, regex `^[a-z0-9]+(-[a-z0-9]+)*$` (kebab-case minuscules)
- [ ] 🟩 Antigravity : `name` optionnel (défaut = dossier) — un frontmatter conforme OpenCode fonctionne aussi
- [ ] `description` présente (obligatoire dans les deux outils), ≤ 1024 car., orientée déclencheur
- [ ] Optionnels : `license`, `compatibility`, `metadata` (mapping chaîne→chaîne)

## Contenu
- [ ] Corps en listes à puces (pas de texte superflu)
- [ ] Consignes sensibles à l'outil préfixées 🟦 OpenCode / 🟩 Antigravity / ⚪ Partagé
- [ ] Section `## Assets` avec liens RELATIFS (assets/...) si la skill a des assets
- [ ] Les fichiers référencés existent réellement dans `assets/`

## Découverte
- [ ] `name` unique sur tous les emplacements chargés
- [ ] Aucune permission `skill: deny` ne masque cette skill
- [ ] Emplacement reconnu par l'outil cible (cf. liste ci-dessus)

## Intégration future (écosystème flexible)
- [ ] Les agents ont `skill: allow` → aucune modification d'agent nécessaire
- [ ] Documenter dans l'agent la procédure « Intégration de nouvelles skills » (déjà en place sur lead-dev, ops-quality, integrations)

## Duplication multi-outils
- [ ] Skill GLOBALE nécessaire dans les deux outils → dupliquer (ou symlink) le dossier dans `~/.config/opencode/skills/` ET `~/.gemini/config/skills/`
- [ ] Skill PROJET nécessaire dans les deux outils → privilégier `.agents/skills/` (aucune duplication)
