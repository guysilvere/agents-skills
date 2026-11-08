import { describe, expect, it } from 'vitest';
import { officeState } from '$lib/server/office-state';
import { findPixelPath, isTileWalkable, OFFICE_LOCATIONS } from '$lib/services/pathfinding';
import { IncomingEventSchema } from '$lib/types/office';

describe('Pathfinding Top-Down Grid', () => {
	it('calcule un chemin valide entre le bureau de lead-dev et la machine à café', () => {
		const start = OFFICE_LOCATIONS.desks['lead-dev'];
		const goal = OFFICE_LOCATIONS.coffeeSpots[0];
		const path = findPixelPath(start, goal);

		expect(path.length).toBeGreaterThan(3);
		expect(path[path.length - 1]).toEqual(goal);
	});

	it('bloque les tuiles de murs extérieurs', () => {
		expect(isTileWalkable(0, 0)).toBe(false);
		expect(isTileWalkable(5, 5)).toBe(true);
	});

	it('bloque l’emplacement du Rack Serveur Coolify en col 17..18, row 2..3', () => {
		expect(isTileWalkable(17, 2)).toBe(false);
		expect(isTileWalkable(18, 3)).toBe(false);
		// Le couloir d'accès reste praticable
		expect(isTileWalkable(14, 5)).toBe(true);
	});
});

describe('OfficeStateManager v0.2 & Schéma Zod', () => {
	it('valide un payload WORK_START via IncomingEventSchema', () => {
		const parsed = IncomingEventSchema.safeParse({
			source: 'antigravity',
			type: 'WORK_START',
			agentId: 'lead-dev',
			project: 'lodgi',
			activityLabel: 'Editing +page.svelte',
			skills: ['pwa-cadrage', 'shared-eco-tokens']
		});
		expect(parsed.success).toBe(true);
	});

	it('met à jour le projet, les skills, l’activityLabel et la jauge de contexte', () => {
		const snap = officeState.applyEvent({
			source: 'manual',
			type: 'WORK_START',
			agentId: 'ops-quality',
			project: 'brvm-radar',
			activityLabel: 'Running Lighthouse CI',
			contextRatio: 0.62,
			skills: ['pwa-validation']
		});
		const qa = snap.agents.find((a) => a.id === 'ops-quality');
		expect(qa?.state).toBe('WORKING');
		expect(qa?.currentProject).toBe('brvm-radar');
		expect(qa?.activityLabel).toBe('Running Lighthouse CI');
		expect(qa?.contextRatio).toBe(0.62);
		expect(qa?.activeSkills).toContain('pwa-validation');
	});

	it('passe en état WAITING_HUMAN avec soundCue permission lors d’un jalon STOP', () => {
		const snap = officeState.applyEvent({
			source: 'antigravity',
			type: 'WAITING_HUMAN',
			agentId: 'lead-dev',
			project: 'agents-skills',
			message: 'Validation du schéma requise'
		});
		const lead = snap.agents.find((a) => a.id === 'lead-dev');
		expect(lead?.state).toBe('WAITING_HUMAN');
		expect(snap.logs[0].soundCue).toBe('permission');
	});

	it('fait entrer un sous-agent temporaire avec matrixEffect=spawn lors de SPAWN_SUBAGENT', () => {
		const beforeCount = officeState.getSnapshot().agents.length;
		const snap = officeState.applyEvent({
			source: 'antigravity',
			type: 'SPAWN_SUBAGENT',
			agentId: 'lead-dev',
			subagentName: 'security-auditor',
			subagentRole: 'Audit OWASP',
			project: 'agents-skills',
			skills: ['pwa-validation']
		});
		expect(snap.agents.length).toBe(beforeCount + 1);
		const spawned = snap.agents.find((a) => a.name === 'security-auditor');
		expect(spawned?.isTemporary).toBe(true);
		expect(spawned?.matrixEffect).toBe('spawn');
	});

	it('fait réagir la mascotte GitCat avec un coeur lors de PET_INTERACT', () => {
		const snap = officeState.applyEvent({
			source: 'manual',
			type: 'PET_INTERACT',
			agentId: 'lead-dev'
		});
		expect(snap.pet.state).toBe('HEART');
	});

	it('applique la customisation de style et de mission lors de UPDATE_AGENT_CONFIG', () => {
		const snap = officeState.applyEvent({
			source: 'manual',
			type: 'UPDATE_AGENT_CONFIG',
			agentId: 'lead-dev',
			config: {
				title: 'Chief AI Architect',
				spriteIndex: 4,
				shirtColor: '#38BDF8',
				accessory: 'badge',
				mission: 'Piloter la roadmap Bulles',
				skills: ['pwa-cadrage', 'pwa-developpement']
			}
		});
		const lead = snap.agents.find((a) => a.id === 'lead-dev');
		expect(lead?.title).toBe('Chief AI Architect');
		expect(lead?.customSpriteIndex).toBe(4);
		expect(lead?.palette.shirt).toBe('#38BDF8');
		expect(lead?.customAccessory).toBe('badge');
		expect(lead?.customMission).toBe('Piloter la roadmap Bulles');
		expect(lead?.activeSkills).toContain('pwa-cadrage');
	});

	it('résout un jalon WAITING_HUMAN via RESOLVE_HUMAN_GATE (approve et reject)', () => {
		// 1. Déclencher un STOP
		officeState.applyEvent({
			source: 'antigravity',
			type: 'WAITING_HUMAN',
			agentId: 'ops-quality',
			message: 'Validation déploiement Coolify'
		});
		let qa = officeState.getSnapshot().agents.find((a) => a.id === 'ops-quality');
		expect(qa?.state).toBe('WAITING_HUMAN');
		expect(qa?.lastDialogue?.type).toBe('gate');

		// 2. Résoudre avec APPROVE
		const snapApproved = officeState.applyEvent({
			source: 'manual',
			type: 'RESOLVE_HUMAN_GATE',
			agentId: 'ops-quality',
			resolutionAction: 'approve'
		});
		qa = snapApproved.agents.find((a) => a.id === 'ops-quality');
		expect(qa?.state).toBe('WORKING');
		expect(qa?.activityLabel).toContain('validé');
		expect(qa?.lastDialogue?.type).toBe('action');
		expect(snapApproved.logs[0].soundCue).toBe('done');

		// 3. Résoudre avec REJECT
		officeState.applyEvent({
			source: 'antigravity',
			type: 'WAITING_HUMAN',
			agentId: 'ops-quality',
			message: 'Validation migration DB'
		});
		const snapRejected = officeState.applyEvent({
			source: 'manual',
			type: 'RESOLVE_HUMAN_GATE',
			agentId: 'ops-quality',
			resolutionAction: 'reject'
		});
		qa = snapRejected.agents.find((a) => a.id === 'ops-quality');
		expect(qa?.state).toBe('WORKING');
		expect(qa?.activityLabel).toContain('Révision demandée');
		expect(snapRejected.logs[0].soundCue).toBe('call');
	});
});

describe('Cycle Ambiance Jour / Nuit Cyberpunk', () => {
	it('respecte les modes manuels explicites', async () => {
		const { getEffectiveAmbientMode } = await import('$lib/services/pixel-renderer');
		expect(getEffectiveAmbientMode('day')).toBe('day');
		expect(getEffectiveAmbientMode('sunset')).toBe('sunset');
		expect(getEffectiveAmbientMode('night')).toBe('night');
	});

	it('calcule un mode effectif valide en mode auto', async () => {
		const { getEffectiveAmbientMode } = await import('$lib/services/pixel-renderer');
		const autoResult = getEffectiveAmbientMode('auto');
		expect(['day', 'sunset', 'night']).toContain(autoResult);
	});
});

describe('Phase 4 : Audio Chiptune Lo-Fi & Foley 8-bit', () => {
	it('permet de contrôler le volume et le statut du son global et de la musique Lo-Fi', async () => {
		const {
			isSoundEnabled,
			setSoundEnabled,
			setBgmVolume,
			getBgmVolume,
			isBgmPlaying
		} = await import('$lib/services/sound-effects');

		expect(isSoundEnabled()).toBe(true);
		setSoundEnabled(false);
		expect(isSoundEnabled()).toBe(false);
		setSoundEnabled(true);
		expect(isSoundEnabled()).toBe(true);

		setBgmVolume(0.45);
		expect(getBgmVolume()).toBeCloseTo(0.45);

		// Clamp entre 0 et 1
		setBgmVolume(1.8);
		expect(getBgmVolume()).toBe(1);
		setBgmVolume(-0.2);
		expect(getBgmVolume()).toBe(0);

		setBgmVolume(0.25);
		expect(isBgmPlaying()).toBe(false);
	});
});

describe('Supervision Multi-Projets Dynamique & Skills', () => {
	it('accumule dynamiquement les projets actifs sous /Users/silveremeya/Projets et conserve les skills', () => {
		// 1. Simuler une activité de lead-dev sur lodgi
		let snap = officeState.applyEvent({
			source: 'antigravity',
			type: 'WORK_START',
			agentId: 'lead-dev',
			project: 'lodgi',
			skills: ['pwa-developpement'],
			activityLabel: 'Refonte page accueil lodgi'
		});

		let lead = snap.agents.find((a) => a.id === 'lead-dev');
		expect(lead?.currentProject).toBe('lodgi');
		expect(lead?.activeProjects).toContain('lodgi');
		expect(lead?.activeSkills).toContain('pwa-developpement');
		expect(snap.stats.activeProjects).toContain('lodgi');

		// 2. Simuler une activité simultanée sur brvmradar
		snap = officeState.applyEvent({
			source: 'antigravity',
			type: 'WORK_START',
			agentId: 'lead-dev',
			project: 'brvmradar',
			skills: ['api-best-practices'],
			activityLabel: 'Analyse flux BRVM'
		});

		lead = snap.agents.find((a) => a.id === 'lead-dev');
		expect(lead?.currentProject).toBe('brvmradar');
		expect(lead?.activeProjects).toContain('brvmradar');
		expect(lead?.activeProjects).toContain('lodgi');
		expect(lead?.activeSkills).toContain('api-best-practices');
		expect(lead?.activeSkills).toContain('pwa-developpement');
		expect(snap.stats.activeProjects).toContain('brvmradar');
		expect(snap.stats.activeProjects).toContain('lodgi');
	});
});

describe('Scénarios Réalistes de Bureau & Customisation Étendue', () => {
	it('déclenche un TEAM_MEETING et regroupe tous les agents au salon', () => {
		const snap = officeState.applyEvent({
			source: 'manual',
			type: 'TEAM_MEETING',
			agentId: 'lead-dev',
			message: 'Sprint Review & Architecture'
		});

		for (const ag of snap.agents) {
			expect(ag.state).toBe('MEETING');
			expect(ag.activityLabel).toContain('Sprint Review');
		}
		expect(snap.logs[0].summary).toContain('Convocation d\'équipe');
	});

	it('établit un coup de fil PHONE_CALL bidirectionnel avec phoneCall state', () => {
		const snap = officeState.applyEvent({
			source: 'manual',
			type: 'PHONE_CALL',
			agentId: 'lead-dev',
			targetAgentId: 'ops-quality',
			message: 'Validation déploiement'
		});

		const lead = snap.agents.find((a) => a.id === 'lead-dev');
		const qa = snap.agents.find((a) => a.id === 'ops-quality');
		expect(lead?.state).toBe('CALLING');
		expect(lead?.phoneCall?.isCaller).toBe(true);
		expect(lead?.phoneCall?.withAgentId).toBe('ops-quality');

		expect(qa?.state).toBe('PHONE_CALL');
		expect(qa?.phoneCall?.isCaller).toBe(false);
		expect(qa?.phoneCall?.withAgentId).toBe('lead-dev');
	});

	it('envoie ops-quality au rack serveur lors d’une SERVER_ALERT', () => {
		const snap = officeState.applyEvent({
			source: 'manual',
			type: 'SERVER_ALERT',
			agentId: 'ops-quality'
		});

		const qa = snap.agents.find((a) => a.id === 'ops-quality');
		expect(qa?.state).toBe('SERVER_CHECK');
		expect(qa?.targetPosition.x).toBe(16);
		expect(qa?.targetPosition.y).toBe(4);
	});

	it('enregistre les options étendues hairColor, skinTone, deskDecor et moodStatus', () => {
		const snap = officeState.applyEvent({
			source: 'manual',
			type: 'UPDATE_AGENT_CONFIG',
			agentId: 'lead-dev',
			config: {
				hairColor: '#D81B60',
				skinTone: '#8D5524',
				deskDecor: 'bonsai',
				moodStatus: 'Architecte zen et concentré'
			}
		});

		const lead = snap.agents.find((a) => a.id === 'lead-dev');
		expect(lead?.palette.hair).toBe('#D81B60');
		expect(lead?.palette.skin).toBe('#8D5524');
		expect(lead?.deskDecor).toBe('bonsai');
		expect(lead?.moodStatus).toBe('Architecte zen et concentré');
	});
});


