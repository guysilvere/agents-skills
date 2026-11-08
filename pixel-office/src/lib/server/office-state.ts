import { OFFICE_LOCATIONS } from '$lib/services/pathfinding';
import type {
	ActivityLogEntry,
	IncomingOfficeEvent,
	OfficeAgent,
	OfficePet,
	OfficeSnapshot
} from '$lib/types/office';

type StateSubscriber = (snapshot: OfficeSnapshot) => void;

const SUBAGENT_PALETTES = [
	{ hair: '#6A1B9A', shirt: '#8E24AA', accent: '#CE93D8', skin: '#F5CBA7' },
	{ hair: '#EF6C00', shirt: '#FB8C00', accent: '#FFE082', skin: '#E59866' },
	{ hair: '#1565C0', shirt: '#1E88E5', accent: '#90CAF9', skin: '#F5CBA7' },
	{ hair: '#2E7D32', shirt: '#43A047', accent: '#A5D6A7', skin: '#D4AC6E' }
];

const PET_SPOTS = [
	{ x: 16, y: 8 },
	{ x: 17, y: 9 },
	{ x: 16, y: 10 },
	{ x: 10, y: 6 },
	{ x: 5, y: 5 }
];

class OfficeStateManager {
	private agents: Map<string, OfficeAgent> = new Map();
	private pet: OfficePet = {
		id: 'gitcat',
		name: 'GitCat',
		state: 'WANDER',
		position: { x: 16, y: 9 },
		targetPosition: { x: 17, y: 9 },
		heartUntil: 0
	};
	private logs: ActivityLogEntry[] = [];
	private subscribers: Set<StateSubscriber> = new Set();
	private idleTimer: ReturnType<typeof setInterval> | null = null;
	private gateProvider: (() => import('$lib/types/office').PendingGate[]) | null = null;

	public watcherStatus = {
		antigravityActive: false,
		opencodeActive: false,
		claudeActive: false,
		watchedPaths: [] as string[],
		lastFileEventAt: null as number | null
	};

	public stats = {
		activeProject: 'agents-skills' as string | null,
		activeProjects: ['agents-skills', 'lodgi'] as string[],
		totalEventsToday: 1,
		subagentsSpawnedToday: 0
	};

	constructor() {
		this.initCoreAgents();
		this.startAutonomousLifeLoop();
	}

	private initCoreAgents(): void {
		const now = Date.now();
		const coreAgents: OfficeAgent[] = [
			{
				id: 'lead-dev',
				name: 'lead-dev',
				title: 'Architecte & Lead Dev',
				role: 'lead-dev',
				isTemporary: false,
				state: 'WORKING',
				currentProject: 'agents-skills',
				activeProjects: ['agents-skills'],
				activeSkills: ['shared-eco-tokens', 'pwa-developpement', 'pwa-cadrage', 'design-pwa-system'],
				activityLabel: 'Editing pixel-office/+page.svelte',
				contextRatio: 0.34,
				contextTokens: 68_000,
				maxContextTokens: 200_000,
				targetAgentId: null,
				callMessage: null,
				deskPosition: { ...OFFICE_LOCATIONS.desks['lead-dev'] },
				position: { ...OFFICE_LOCATIONS.desks['lead-dev'] },
				targetPosition: { ...OFFICE_LOCATIONS.desks['lead-dev'] },
				direction: 'up',
				palette: {
					hair: '#1A1A1A',
					shirt: '#D81B60',
					accent: '#C2E8E8',
					skin: '#D49B6A'
				},
				matrixEffect: null,
				matrixStartedAt: null,
				deskDecor: 'dual_monitor',
				moodStatus: 'Architecte en deep work',
				phoneCall: null,
				lastDialogue: {
					speaker: 'lead-dev',
					text: 'Système opérationnel. Prêt à orchestrer les tâches et valider les specs.',
					type: 'thought',
					timestamp: now
				},
				lastActivityAt: now
			},
			{
				id: 'ops-quality',
				name: 'ops-quality',
				title: 'QA, Sécurité & Déploiement',
				role: 'ops-quality',
				isTemporary: false,
				state: 'COFFEE',
				currentProject: 'agents-skills',
				activeProjects: ['agents-skills'],
				activeSkills: ['pwa-validation', 'shared-git-conventions', 'pwa-deploiement'],
				activityLabel: 'Prêt pour audit QA & Lighthouse',
				contextRatio: 0.12,
				contextTokens: 24_000,
				maxContextTokens: 200_000,
				targetAgentId: null,
				callMessage: null,
				deskPosition: { ...OFFICE_LOCATIONS.desks['ops-quality'] },
				position: { ...OFFICE_LOCATIONS.coffeeSpots[0] },
				targetPosition: { ...OFFICE_LOCATIONS.coffeeSpots[0] },
				direction: 'up',
				palette: {
					hair: '#263238',
					shirt: '#134242',
					accent: '#4DB6AC',
					skin: '#E0AC69'
				},
				matrixEffect: null,
				matrixStartedAt: null,
				deskDecor: 'robot',
				moodStatus: 'Veille QA & Sécurité 100%',
				phoneCall: null,
				lastDialogue: {
					speaker: 'ops-quality',
					text: 'Pause café terminée. Standby pour audits Lighthouse, a11y et tests CI.',
					type: 'thought',
					timestamp: now - 45_000
				},
				lastActivityAt: now - 45_000
			},
			{
				id: 'integrations',
				name: 'integrations',
				title: 'Paiements, DB & Webhooks',
				role: 'integrations',
				isTemporary: false,
				state: 'GYM',
				currentProject: 'lodgi',
				activeProjects: ['lodgi'],
				activeSkills: ['api-paiements', 'api-best-practices', 'shared-graft'],
				activityLabel: 'Veille Webhooks GeniusPay',
				contextRatio: 0.18,
				contextTokens: 36_000,
				maxContextTokens: 200_000,
				targetAgentId: null,
				callMessage: null,
				deskPosition: { ...OFFICE_LOCATIONS.desks.integrations },
				position: { ...OFFICE_LOCATIONS.gymSpots[0] },
				targetPosition: { ...OFFICE_LOCATIONS.gymSpots[0] },
				direction: 'right',
				palette: {
					hair: '#3E2723',
					shirt: '#F59E0B',
					accent: '#FEF08A',
					skin: '#C68642'
				},
				matrixEffect: null,
				matrixStartedAt: null,
				deskDecor: 'bonsai',
				moodStatus: 'Passerelles de paiement parées',
				phoneCall: null,
				lastDialogue: {
					speaker: 'integrations',
					text: 'Session d\'échauffement. Connecteurs de paiement et tables Turso opérationnels.',
					type: 'thought',
					timestamp: now - 60_000
				},
				lastActivityAt: now - 60_000
			}
		];

		for (const agent of coreAgents) {
			this.agents.set(agent.id, agent);
		}

		this.addLog({
			source: 'manual',
			agentId: 'lead-dev',
			agentName: 'lead-dev',
			summary: 'Ouverture du Pixel Office — travail en cours sur agents-skills',
			project: 'agents-skills',
			skills: ['pwa-cadrage', 'shared-eco-tokens'],
			soundCue: null
		});
	}

	private startAutonomousLifeLoop(): void {
		if (this.idleTimer) clearInterval(this.idleTimer);
		this.idleTimer = setInterval(() => {
			const now = Date.now();
			let changed = false;

			// Déplacement autonome de GitCat
			if (Math.random() < 0.65) {
				if (this.pet.state === 'SLEEP' && Math.random() < 0.5) {
					this.pet.state = 'WANDER';
					const nextSpot = PET_SPOTS[Math.floor(Math.random() * PET_SPOTS.length)];
					this.pet.targetPosition = { ...nextSpot };
				} else {
					const nextSpot = PET_SPOTS[Math.floor(Math.random() * PET_SPOTS.length)];
					this.pet.targetPosition = { ...nextSpot };
					this.pet.state = Math.random() < 0.35 ? 'SLEEP' : 'WANDER';
				}
				changed = true;
			}

			for (const agent of this.agents.values()) {
				const idleMs = now - agent.lastActivityAt;

				// Un agent en WAITING_HUMAN reste à son bureau jusqu'à réponse humaine (comme dans pixel-agents)
				if (agent.state === 'WAITING_HUMAN') continue;

				// Un sous-agent temporaire qui a fini depuis >45s quitte le bureau avec effet Matrix despawn
				if (agent.isTemporary && idleMs > 45_000 && agent.state !== 'LEAVING') {
					agent.state = 'LEAVING';
					agent.matrixEffect = 'despawn';
					agent.matrixStartedAt = now;
					agent.targetPosition = { ...OFFICE_LOCATIONS.entranceDoor };
					agent.currentProject = null;
					changed = true;
					setTimeout(() => {
						this.agents.delete(agent.id);
						this.broadcast();
					}, 3200);
					continue;
				}

				if (!agent.isTemporary && idleMs > 12_000) {
					if ((agent.state === 'WORKING' || agent.state === 'DONE') && idleMs > 20_000) {
						this.sendToRandomBreak(agent);
						changed = true;
					} else if (
						agent.state === 'IDLE_DESK' ||
						agent.state === 'COFFEE' ||
						agent.state === 'GYM' ||
						agent.state === 'LOUNGE' ||
						agent.state === 'CONTEMPLATING' ||
						agent.state === 'WATERING_PLANT' ||
						agent.state === 'LIBRARY'
					) {
						if (Math.random() < 0.75) {
							this.sendToRandomBreak(agent);
							changed = true;
						}
					}
				}
			}

			// Détection de rencontre spontanée (Pause café / échange informel entre collègues)
			const restingAgents = Array.from(this.agents.values()).filter(
				(a) =>
					a.state !== 'WORKING' &&
					a.state !== 'WAITING_HUMAN' &&
					a.state !== 'MEETING' &&
					a.state !== 'PHONE_CALL' &&
					!a.isTemporary
			);
			if (restingAgents.length >= 2 && Math.random() < 0.5) {
				const a1 = restingAgents[0];
				const a2 = restingAgents[1];
				const dist = Math.abs(a1.position.x - a2.position.x) + Math.abs(a1.position.y - a2.position.y);
				if (dist <= 4) {
					const casualQuotes = [
						'Tu as vu les benchmarks de réactivité Svelte 5 ? C\'est bluffant.',
						'La base Turso en dev local sans démon, quel gain de temps.',
						'On synchronise les specs avant la prochaine PR ?',
						'Un petit expresso pour recharger les tokens d\'attention.',
						'Tout est vert côté CI/CD et Lighthouse.'
					];
					const quote = casualQuotes[Math.floor(Math.random() * casualQuotes.length)];
					a1.lastDialogue = {
						speaker: a1.name,
						text: `[Échange informel avec ${a2.name}] « ${quote} »`,
						type: 'thought',
						timestamp: now
					};
					changed = true;
				}
			}

			if (changed) {
				this.broadcast();
			}
		}, 8_000);
	}

	private sendToRandomBreak(agent: OfficeAgent): void {
		const choices: Array<
			| 'COFFEE'
			| 'CONTEMPLATING'
			| 'WATERING_PLANT'
			| 'LIBRARY'
			| 'LOUNGE'
			| 'GYM'
			| 'IDLE_DESK'
		> = [
			'COFFEE',
			'COFFEE',
			'CONTEMPLATING',
			'WATERING_PLANT',
			'LIBRARY',
			'LOUNGE',
			'GYM',
			'IDLE_DESK',
			'IDLE_DESK'
		];
		const nextState = choices[Math.floor(Math.random() * choices.length)];
		agent.state = nextState;
		agent.targetAgentId = null;
		agent.callMessage = null;
		agent.phoneCall = null;

		if (nextState === 'COFFEE') {
			const spot =
				OFFICE_LOCATIONS.coffeeSpots[
					Math.floor(Math.random() * OFFICE_LOCATIONS.coffeeSpots.length)
				];
			agent.targetPosition = { ...spot };
			agent.activityLabel = 'Pause café & expresso';
		} else if (nextState === 'CONTEMPLATING') {
			const spot =
				OFFICE_LOCATIONS.windowSpots[
					Math.floor(Math.random() * OFFICE_LOCATIONS.windowSpots.length)
				];
			agent.targetPosition = { ...spot };
			agent.activityLabel = 'Regarde la vue par la baie vitrée';
		} else if (nextState === 'WATERING_PLANT') {
			const spot =
				OFFICE_LOCATIONS.plantSpots[
					Math.floor(Math.random() * OFFICE_LOCATIONS.plantSpots.length)
				];
			agent.targetPosition = { ...spot };
			agent.activityLabel = 'Arrose la plante Monstera';
		} else if (nextState === 'LIBRARY') {
			const spot =
				OFFICE_LOCATIONS.librarySpots[
					Math.floor(Math.random() * OFFICE_LOCATIONS.librarySpots.length)
				];
			agent.targetPosition = { ...spot };
			agent.activityLabel = 'Feuillette la documentation d\'architecture';
		} else if (nextState === 'GYM') {
			const spot =
				OFFICE_LOCATIONS.gymSpots[Math.floor(Math.random() * OFFICE_LOCATIONS.gymSpots.length)];
			agent.targetPosition = { ...spot };
			agent.activityLabel = 'Cardio & Haltères';
		} else if (nextState === 'LOUNGE') {
			const spot =
				OFFICE_LOCATIONS.loungeSpots[
					Math.floor(Math.random() * OFFICE_LOCATIONS.loungeSpots.length)
				];
			agent.targetPosition = { ...spot };
			agent.activityLabel = 'Détente sur le canapé';
		} else {
			agent.targetPosition = { ...agent.deskPosition };
			agent.activityLabel = agent.moodStatus || 'En veille active au poste';
		}
	}

	private bumpContextUsage(agent: OfficeAgent, explicitRatio?: number): void {
		if (explicitRatio !== undefined) {
			agent.contextRatio = Math.max(0.02, Math.min(1, explicitRatio));
		} else {
			agent.contextRatio = Math.min(0.96, +(agent.contextRatio + 0.03).toFixed(2));
		}
		agent.contextTokens = Math.round(agent.contextRatio * agent.maxContextTokens);
	}

	public applyEvent(event: IncomingOfficeEvent): OfficeSnapshot {
		const now = Date.now();
		this.stats.totalEventsToday++;
		if (event.project) {
			this.stats.activeProject = event.project;
			const mergedStats = [
				event.project,
				...(this.stats.activeProjects || []).filter((p) => p !== event.project)
			];
			this.stats.activeProjects = mergedStats.slice(0, 8);
		}

		if (event.type === 'PET_INTERACT') {
			this.pet.state = 'HEART';
			this.pet.heartUntil = now + 4000;
			this.addLog({
				source: event.source,
				agentId: 'gitcat',
				agentName: 'GitCat',
				summary: 'GitCat ronronne et affiche un coeur pixelisé !',
				project: this.stats.activeProject,
				skills: [],
				soundCue: 'done'
			});
			this.broadcast();
			return this.getSnapshot();
		}

		let agent = this.agents.get(event.agentId);
		if (!agent) {
			agent = this.agents.get('lead-dev')!;
		}
		agent.lastActivityAt = now;
		if (event.project) {
			agent.currentProject = event.project;
			const currentList = agent.activeProjects || [];
			const mergedAgent = [
				event.project,
				...currentList.filter((p) => p !== event.project)
			];
			agent.activeProjects = mergedAgent.slice(0, 5);
		}
		this.bumpContextUsage(agent, event.contextRatio);

		switch (event.type) {
			case 'WORK_START': {
				agent.state = 'WORKING';
				agent.targetPosition = { ...agent.deskPosition };
				agent.targetAgentId = null;
				agent.callMessage = null;
				if (event.project) agent.currentProject = event.project;
				if (event.activityLabel) {
					agent.activityLabel = event.activityLabel;
				} else {
					agent.activityLabel = `Coding ${agent.currentProject ?? 'workspace'}`;
				}
				if (event.skills && event.skills.length > 0) {
					const merged = [...event.skills, ...(agent.activeSkills || [])];
					agent.activeSkills = Array.from(new Set(merged)).slice(0, 5);
				}
				agent.lastDialogue = {
					speaker: agent.name,
					text: `Mission en cours sur ${agent.currentProject ?? 'le projet'} : ${agent.activityLabel}`,
					type: 'action',
					timestamp: now
				};
				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `${agent.name} travaille sur ${agent.currentProject ?? 'le projet actif'} (${agent.activityLabel})`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: null
				});
				break;
			}

			case 'TOOL_USE': {
				agent.state = 'WORKING';
				agent.targetPosition = { ...agent.deskPosition };
				if (event.project) agent.currentProject = event.project;
				if (event.activityLabel) {
					agent.activityLabel = event.activityLabel;
				}
				agent.lastDialogue = {
					speaker: agent.name,
					text: `Exécution : ${agent.activityLabel ?? 'outil système'}`,
					type: 'action',
					timestamp: now
				};
				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `${agent.name} → ${agent.activityLabel ?? 'Exécution outil'}`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: null
				});
				break;
			}

			case 'SKILL_LOAD': {
				agent.state = 'WORKING';
				agent.targetPosition = { ...agent.deskPosition };
				if (event.project) agent.currentProject = event.project;
				if (event.skills && event.skills.length > 0) {
					const merged = [...event.skills, ...agent.activeSkills];
					agent.activeSkills = Array.from(new Set(merged)).slice(0, 4);
					agent.activityLabel = `Reading ${event.skills[0]}/SKILL.md`;
				}
				agent.lastDialogue = {
					speaker: agent.name,
					text: `Skill chargée : [${(event.skills ?? []).join(', ')}] — Mise en conformité des règles de travail.`,
					type: 'thought',
					timestamp: now
				};
				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `${agent.name} charge la skill [${(event.skills ?? []).join(', ')}]`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: null
				});
				break;
			}

			case 'WAITING_HUMAN': {
				agent.state = 'WAITING_HUMAN';
				agent.targetPosition = { ...agent.deskPosition };
				agent.activityLabel = event.message || 'STOP Jalon Humain — Validation requise';
				agent.lastDialogue = {
					speaker: agent.name,
					text: event.message || 'Arrêt obligatoire (Jalon Humain) : validation requise avant de poursuivre.',
					type: 'gate',
					timestamp: now
				};
				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `${agent.name} attend ta validation : "${agent.activityLabel}"`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: 'permission'
				});
				break;
			}

			case 'RESOLVE_HUMAN_GATE': {
				const isApproved = event.resolutionAction !== 'reject';
				agent.state = 'WORKING';
				agent.targetPosition = { ...agent.deskPosition };
				agent.activityLabel = isApproved ? 'Jalon validé par l\'humain ✔' : 'Révision demandée ↺';
				agent.lastDialogue = {
					speaker: agent.name,
					text: isApproved
						? `Jalon humain validé par l'opérateur ! Reprise des opérations sur ${agent.currentProject ?? 'le projet'}.`
						: `Révision demandée par l'opérateur. Ajustement de la trajectoire en cours.`,
					type: isApproved ? 'action' : 'thought',
					timestamp: now
				};
				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `${agent.name} : ${isApproved ? 'Jalon validé par l\'humain ✔' : 'Révision demandée ↺'}`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: isApproved ? 'done' : 'call'
				});
				break;
			}

			case 'TURN_DONE': {
				agent.state = 'DONE';
				agent.targetPosition = { ...agent.deskPosition };
				agent.activityLabel = event.message || 'Tour terminé avec succès';
				agent.lastDialogue = {
					speaker: agent.name,
					text: event.message || `Tâche terminée avec succès sur ${agent.currentProject ?? 'le projet'}. Prêt pour le relais !`,
					type: 'done',
					timestamp: now
				};
				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `${agent.name} a terminé sa tâche sur ${agent.currentProject ?? 'le projet'}`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: 'done'
				});
				break;
			}

			case 'CALL_AGENT':
			case 'PHONE_CALL': {
				const targetId = event.targetAgentId ?? 'ops-quality';
				const target = this.agents.get(targetId);
				const topic = event.message ?? `Relais vers ${targetId}`;
				agent.state = 'CALLING';
				agent.targetPosition = { ...agent.deskPosition };
				agent.targetAgentId = targetId;
				agent.callMessage = topic;
				agent.activityLabel = `En appel avec ${target?.name ?? targetId}`;
				agent.phoneCall = {
					withAgentId: targetId,
					withAgentName: target?.name ?? targetId,
					isCaller: true,
					topic
				};
				if (event.project) agent.currentProject = event.project;

				if (target) {
					target.state = 'PHONE_CALL';
					target.targetPosition = { ...target.deskPosition };
					target.targetAgentId = agent.id;
					target.callMessage = `En ligne avec ${agent.name}`;
					target.activityLabel = `Répond à ${agent.name}`;
					target.currentProject = agent.currentProject;
					target.lastActivityAt = now;
					target.phoneCall = {
						withAgentId: agent.id,
						withAgentName: agent.name,
						isCaller: false,
						topic
					};
					target.lastDialogue = {
						speaker: target.name,
						text: `📞 [Intercom ${agent.name}] « Reçu 5/5 pour : ${topic} »`,
						type: 'action',
						timestamp: now
					};
				}

				agent.lastDialogue = {
					speaker: agent.name,
					text: `📞 [Appel ${target?.name ?? targetId}] « Point direct : ${topic} »`,
					type: 'action',
					timestamp: now
				};

				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `${agent.name} appelle ${target?.name ?? targetId} au téléphone (« ${topic} »)`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: 'call'
				});

				setTimeout(() => {
					const callerNow = this.agents.get(agent.id);
					const receiverNow = this.agents.get(targetId);
					if (callerNow && (callerNow.state === 'CALLING' || callerNow.state === 'PHONE_CALL')) {
						callerNow.state = 'WORKING';
						callerNow.targetAgentId = null;
						callerNow.callMessage = null;
						callerNow.phoneCall = null;
					}
					if (receiverNow && (receiverNow.state === 'CALLING' || receiverNow.state === 'PHONE_CALL')) {
						receiverNow.state = 'WORKING';
						receiverNow.targetAgentId = null;
						receiverNow.callMessage = null;
						receiverNow.phoneCall = null;
					}
					this.broadcast();
				}, 10_000);
				break;
			}

			case 'END_CALL': {
				agent.state = 'WORKING';
				agent.phoneCall = null;
				if (event.targetAgentId) {
					const target = this.agents.get(event.targetAgentId);
					if (target) {
						target.state = 'WORKING';
						target.phoneCall = null;
					}
				}
				break;
			}

			case 'VISIT_AGENT': {
				const targetId = event.targetAgentId ?? 'ops-quality';
				const target = this.agents.get(targetId);
				agent.state = 'VISITING';
				agent.targetAgentId = targetId;
				agent.callMessage = event.message ?? `Point rapide avec ${targetId}`;
				agent.activityLabel = `Briefing au bureau de ${target?.name ?? targetId}`;

				if (target) {
					target.state = 'WORKING';
					target.targetPosition = { ...target.deskPosition };
					target.lastActivityAt = now;
					const vSpot = (OFFICE_LOCATIONS.visitorSpots as Record<string, { x: number; y: number }>)[targetId];
					if (vSpot) {
						agent.targetPosition = { ...vSpot };
					} else {
						agent.targetPosition = {
							x: target.deskPosition.x - 1,
							y: target.deskPosition.y + 1
						};
					}
					target.lastDialogue = {
						speaker: target.name,
						text: `Reçu ${agent.name} au bureau : synchronisation en binôme.`,
						type: 'action',
						timestamp: now
					};
				}

				agent.lastDialogue = {
					speaker: agent.name,
					text: `En visite chez ${target?.name ?? targetId} : ${agent.callMessage}`,
					type: 'action',
					timestamp: now
				};

				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `${agent.name} se déplace au bureau de ${target?.name ?? targetId}`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: null
				});

				setTimeout(() => {
					const visitorNow = this.agents.get(agent.id);
					if (visitorNow && visitorNow.state === 'VISITING') {
						visitorNow.state = 'WORKING';
						visitorNow.targetPosition = { ...visitorNow.deskPosition };
						visitorNow.targetAgentId = null;
						visitorNow.callMessage = null;
						this.broadcast();
					}
				}, 10_000);
				break;
			}

			case 'TEAM_MEETING': {
				const meetingTopic = event.message ?? 'Standup & Revue d\'Architecture Globale';
				let spotIdx = 0;
				for (const ag of this.agents.values()) {
					ag.state = 'MEETING';
					ag.activityLabel = `En réunion : ${meetingTopic}`;
					ag.targetAgentId = 'lead-dev';
					ag.phoneCall = null;
					const spot = OFFICE_LOCATIONS.meetingSpots[spotIdx % OFFICE_LOCATIONS.meetingSpots.length];
					ag.targetPosition = { ...spot };
					ag.lastDialogue = {
						speaker: ag.name,
						text:
							ag.id === 'lead-dev'
								? `Point d'équipe convoqué : « ${meetingTopic} ». Priorités alignées !`
								: `Présent au salon : revue de code et synchronisation des modules en cours.`,
						type: 'action',
						timestamp: now
					};
					spotIdx++;
				}

				this.addLog({
					source: event.source,
					agentId: 'lead-dev',
					agentName: 'lead-dev',
					summary: `Convocation d'équipe par lead-dev : "${meetingTopic}"`,
					project: this.stats.activeProject,
					skills: ['pwa-cadrage', 'pwa-developpement'],
					soundCue: 'call'
				});

				setTimeout(() => {
					for (const ag of this.agents.values()) {
						if (ag.state === 'MEETING') {
							ag.state = 'WORKING';
							ag.targetPosition = { ...ag.deskPosition };
							ag.activityLabel = 'Fin de réunion — Reprise du code';
						}
					}
					this.broadcast();
				}, 16_000);
				break;
			}

			case 'SERVER_ALERT': {
				const qa = this.agents.get('ops-quality') ?? agent;
				qa.state = 'SERVER_CHECK';
				qa.targetPosition = { ...OFFICE_LOCATIONS.serverRackSpot };
				qa.activityLabel = '🚨 Alerte Baie Serveur Coolify !';
				qa.lastDialogue = {
					speaker: qa.name,
					text: '🚨 Alerte monitoring sur le Rack Coolify ! Examen des conteneurs et des tunnels Zero Trust.',
					type: 'gate',
					timestamp: now
				};

				this.addLog({
					source: event.source,
					agentId: qa.id,
					agentName: qa.name,
					summary: `Alerte infrastructure sur le Rack Serveur Coolify — ${qa.name} intervient`,
					project: this.stats.activeProject,
					skills: ['pwa-deploiement', 'pwa-validation'],
					soundCue: 'permission'
				});

				setTimeout(() => {
					const qaNow = this.agents.get(qa.id);
					if (qaNow && qaNow.state === 'SERVER_CHECK') {
						qaNow.state = 'DONE';
						qaNow.targetPosition = { ...qaNow.deskPosition };
						qaNow.activityLabel = 'Serveurs Coolify nominaux [OK]';
						qaNow.lastDialogue = {
							speaker: qaNow.name,
							text: 'Conteneurs vérifiés, santé verte : proxy Cloudflare et Turso 100% nominaux.',
							type: 'done',
							timestamp: Date.now()
						};
						this.broadcast();
					}
				}, 11_000);
				break;
			}

			case 'COFFEE_CHAT': {
				const spot1 = OFFICE_LOCATIONS.coffeeSpots[0];
				const spot2 = { x: spot1.x - 1, y: spot1.y };
				agent.state = 'COFFEE';
				agent.targetPosition = { ...spot1 };
				agent.activityLabel = 'Pause café partagée';
				const partnerId = event.targetAgentId ?? 'ops-quality';
				const partner = this.agents.get(partnerId);
				if (partner) {
					partner.state = 'COFFEE';
					partner.targetPosition = { ...spot2 };
					partner.activityLabel = 'Discussion café informelle';
					partner.lastDialogue = {
						speaker: partner.name,
						text: `Pause avec ${agent.name} : « Les tests CI passent à la vitesse de l'éclair ! »`,
						type: 'thought',
						timestamp: now
					};
				}
				agent.lastDialogue = {
					speaker: agent.name,
					text: `Au coin café avec ${partner?.name ?? partnerId} : « Les specs sont verrouillées pour la suite. »`,
					type: 'thought',
					timestamp: now
				};
				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `Pause café partagée entre ${agent.name} et ${partner?.name ?? partnerId}`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: null
				});
				break;
			}

			case 'SPAWN_SUBAGENT': {
				this.stats.subagentsSpawnedToday++;
				const activeSubagents = Array.from(this.agents.values()).filter((a) => a.isTemporary);
				const deskIndex = activeSubagents.length % OFFICE_LOCATIONS.internDesks.length;
				const deskPos = OFFICE_LOCATIONS.internDesks[deskIndex];
				const palette =
					SUBAGENT_PALETTES[this.stats.subagentsSpawnedToday % SUBAGENT_PALETTES.length];
				const subId = `sub-${Date.now().toString(36).slice(-4)}`;
				const subName = event.subagentName || `subagent-${activeSubagents.length + 1}`;
				const subTitle = event.subagentRole || 'Renfort Spécialisé';

				const newSubagent: OfficeAgent = {
					id: subId,
					name: subName,
					title: subTitle,
					role: 'subagent',
					isTemporary: true,
					state: 'WORKING',
					currentProject: event.project ?? this.stats.activeProject ?? 'agents-skills',
					activeProjects: event.project ? [event.project] : ['agents-skills'],
					activeSkills: event.skills?.length ? event.skills : ['shared-eco-tokens'],
					activityLabel: event.activityLabel ?? `Mission: ${subTitle}`,
					contextRatio: 0,
					contextTokens: 0,
					maxContextTokens: 128_000,
					targetAgentId: null,
					callMessage: null,
					deskPosition: { ...deskPos },
					position: { ...OFFICE_LOCATIONS.entranceDoor },
					targetPosition: { ...deskPos },
					direction: 'up',
					palette,
					matrixEffect: 'spawn',
					matrixStartedAt: now,
					lastActivityAt: now
				};

				this.agents.set(subId, newSubagent);
				setTimeout(() => {
					const currentSub = this.agents.get(subId);
					if (currentSub && currentSub.matrixEffect === 'spawn') {
						currentSub.matrixEffect = null;
						this.broadcast();
					}
				}, 1800);

				this.addLog({
					source: event.source,
					agentId: subId,
					agentName: subName,
					summary: `Sous-agent [${subName} — ${subTitle}] se matérialise (Matrix Spawn) en renfort`,
					project: newSubagent.currentProject,
					skills: newSubagent.activeSkills,
					soundCue: 'spawn'
				});
				break;
			}

			case 'DISMISS_SUBAGENT': {
				const tempAgents = Array.from(this.agents.values()).filter(
					(a) => a.isTemporary && a.state !== 'LEAVING'
				);
				const targetSub =
					this.agents.get(event.agentId) && this.agents.get(event.agentId)!.isTemporary
						? this.agents.get(event.agentId)!
						: tempAgents[0];

				if (targetSub) {
					targetSub.state = 'LEAVING';
					targetSub.matrixEffect = 'despawn';
					targetSub.matrixStartedAt = now;
					targetSub.targetPosition = { ...OFFICE_LOCATIONS.entranceDoor };
					targetSub.currentProject = null;
					this.addLog({
						source: event.source,
						agentId: targetSub.id,
						agentName: targetSub.name,
						summary: `Mission terminée : ${targetSub.name} se dématérialise et quitte le bureau`,
						project: null,
						skills: [],
						soundCue: 'done'
					});
					setTimeout(() => {
						this.agents.delete(targetSub.id);
						this.broadcast();
					}, 2500);
				}
				break;
			}

			case 'GO_COFFEE': {
				const spot =
					OFFICE_LOCATIONS.coffeeSpots[
						Math.floor(Math.random() * OFFICE_LOCATIONS.coffeeSpots.length)
					];
				agent.state = 'COFFEE';
				agent.targetPosition = { ...spot };
				agent.targetAgentId = null;
				agent.callMessage = null;
				agent.activityLabel = 'Expresso au Coin Café';
				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `${agent.name} va se préparer un expresso au Coin Café`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: null
				});
				break;
			}

			case 'GO_GYM': {
				const spot =
					OFFICE_LOCATIONS.gymSpots[Math.floor(Math.random() * OFFICE_LOCATIONS.gymSpots.length)];
				agent.state = 'GYM';
				agent.targetPosition = { ...spot };
				agent.targetAgentId = null;
				agent.callMessage = null;
				agent.activityLabel = 'Séance Tapis & Haltères';
				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `${agent.name} fait une séance d'exercice dans la zone Gym`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: null
				});
				break;
			}

			case 'GO_LOUNGE': {
				const spot =
					OFFICE_LOCATIONS.loungeSpots[
						Math.floor(Math.random() * OFFICE_LOCATIONS.loungeSpots.length)
					];
				agent.state = 'LOUNGE';
				agent.targetPosition = { ...spot };
				agent.targetAgentId = null;
				agent.callMessage = null;
				agent.activityLabel = 'Pause lecture Salon';
				this.addLog({
					source: event.source,
					agentId: agent.id,
					agentName: agent.name,
					summary: `${agent.name} se détend sur le canapé`,
					project: agent.currentProject,
					skills: agent.activeSkills,
					soundCue: null
				});
				break;
			}

			case 'RETURN_DESK': {
				agent.state = 'IDLE_DESK';
				agent.targetPosition = { ...agent.deskPosition };
				agent.targetAgentId = null;
				agent.callMessage = null;
				agent.activityLabel = 'En poste';
				break;
			}

			case 'PARTY_BREAK': {
				let i = 0;
				for (const ag of this.agents.values()) {
					if (i % 2 === 0) {
						ag.state = 'COFFEE';
						ag.activityLabel = 'Pause café équipe';
						ag.targetPosition = {
							...OFFICE_LOCATIONS.coffeeSpots[i % OFFICE_LOCATIONS.coffeeSpots.length]
						};
					} else {
						ag.state = 'GYM';
						ag.activityLabel = 'Challenge Gym équipe';
						ag.targetPosition = {
							...OFFICE_LOCATIONS.gymSpots[i % OFFICE_LOCATIONS.gymSpots.length]
						};
					}
					i++;
				}
				this.addLog({
					source: event.source,
					agentId: 'lead-dev',
					agentName: 'Équipe',
					summary: 'Pause générale : tout le bureau part au café ou à la salle de sport',
					project: this.stats.activeProject,
					skills: [],
					soundCue: 'done'
				});
				break;
			}

			case 'UPDATE_AGENT_CONFIG': {
				if (event.config) {
					if (event.config.name) agent.name = event.config.name;
					if (event.config.title) agent.title = event.config.title;
					if (event.config.role) agent.role = event.config.role;
					if (event.config.spriteIndex !== undefined)
						agent.customSpriteIndex = event.config.spriteIndex;
					if (event.config.shirtColor) agent.palette.shirt = event.config.shirtColor;
					if (event.config.hairColor) agent.palette.hair = event.config.hairColor;
					if (event.config.skinTone) agent.palette.skin = event.config.skinTone;
					if (event.config.mission) agent.customMission = event.config.mission;
					if (event.config.accessory) agent.customAccessory = event.config.accessory;
					if (event.config.deskDecor) agent.deskDecor = event.config.deskDecor;
					if (event.config.moodStatus) {
						agent.moodStatus = event.config.moodStatus;
						if (agent.state === 'IDLE_DESK') agent.activityLabel = event.config.moodStatus;
					}
					if (event.config.skills && event.config.skills.length > 0) {
						agent.activeSkills = event.config.skills;
					}
					this.addLog({
						source: event.source,
						agentId: agent.id,
						agentName: agent.name,
						summary: `Profil mis à jour : ${agent.name} (${agent.title}) [Sprite char_${agent.customSpriteIndex ?? 'auto'} | Décor: ${agent.deskDecor ?? 'standard'}]`,
						project: agent.currentProject,
						skills: agent.activeSkills,
						soundCue: 'done'
					});
				}
				break;
			}
		}

		this.broadcast();
		return this.getSnapshot();
	}

	private addLog(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): void {
		this.logs.unshift({
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			timestamp: Date.now(),
			...entry
		});
		if (this.logs.length > 30) {
			this.logs.length = 30;
		}
	}

	public registerGateProvider(provider: () => import('$lib/types/office').PendingGate[]): void {
		this.gateProvider = provider;
	}

	public getWaitingAgents(): OfficeAgent[] {
		return Array.from(this.agents.values()).filter((a) => a.state === 'WAITING_HUMAN');
	}

	public getSnapshot(): OfficeSnapshot {
		return {
			agents: Array.from(this.agents.values()),
			pet: this.pet,
			logs: this.logs,
			pendingGates: this.gateProvider ? this.gateProvider() : undefined,
			watcherStatus: this.watcherStatus,
			stats: this.stats
		};
	}

	public subscribe(cb: StateSubscriber): () => void {
		this.subscribers.add(cb);
		cb(this.getSnapshot());
		return () => {
			this.subscribers.delete(cb);
		};
	}

	public broadcast(): void {
		const snap = this.getSnapshot();
		for (const sub of this.subscribers) {
			try {
				sub(snap);
			} catch {
				// Ignore subscriber déconnecté
			}
		}
	}
}

export const officeState = new OfficeStateManager();
