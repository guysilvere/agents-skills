import { z } from 'zod';

/**
 * Rôles principaux et sous-agents dans l'écosystème Agence Bulles
 */
export const AgentRoleSchema = z.enum(['lead-dev', 'ops-quality', 'integrations', 'subagent']);
export type AgentRole = z.infer<typeof AgentRoleSchema>;

/**
 * États comportementaux de chaque agent dans le bureau Pixel Art
 * (enrichi avec WAITING_HUMAN pour les jalons ⛔ STOP / permissions et DONE)
 */
export const AgentStateSchema = z.enum([
	'IDLE_DESK',
	'WORKING',
	'WAITING_HUMAN',
	'DONE',
	'CALLING',
	'PHONE_CALL',
	'VISITING',
	'MEETING',
	'CONTEMPLATING',
	'WATERING_PLANT',
	'LIBRARY',
	'SERVER_CHECK',
	'COFFEE',
	'GYM',
	'LOUNGE',
	'ENTERING',
	'LEAVING'
]);
export type AgentState = z.infer<typeof AgentStateSchema>;

/**
 * Sources d'événements supportées par le mode Hybride (C)
 */
export const EventSourceSchema = z.enum([
	'antigravity',
	'opencode',
	'claude',
	'manual',
	'autonomous'
]);
export type EventSource = z.infer<typeof EventSourceSchema>;

/**
 * Modes d'ambiance lumineuse du bureau Pixel Art
 */
export type TimeOfDayMode = 'auto' | 'day' | 'sunset' | 'night';

/**
 * Coordonnées sur la grille Top-Down (tuiles 16x16)
 */
export interface GridPoint {
	x: number;
	y: number;
}

/**
 * Mascotte autonome du bureau (inspiré de GitCat dans pixel-agents)
 */
export interface OfficePet {
	id: string;
	name: string;
	state: 'WANDER' | 'SLEEP' | 'HEART';
	position: GridPoint;
	targetPosition: GridPoint;
	heartUntil: number;
}

/**
 * Pelote de laine jouet pour la mascotte GitCat
 */
export interface YarnBallState {
	x: number;
	y: number;
	z: number;
	targetX: number;
	targetY: number;
	isMoving: boolean;
}


/**
 * Dialogue ou pensée d'un agent affiché dans la boîte de dialogue RPG rétro
 */
export interface AgentDialogue {
	text: string;
	speaker: string;
	type: 'gate' | 'thought' | 'action' | 'done';
	timestamp: number;
}

/**
 * Représentation complète d'un agent dans le bureau
 */
export interface OfficeAgent {
	id: string;
	name: string;
	title: string;
	role: AgentRole;
	isTemporary: boolean;
	state: AgentState;
	currentProject: string | null;
	/** Liste des projets récents sur lesquels cet agent intervient (ex: ['agents-skills', 'lodgi']) */
	activeProjects: string[];
	activeSkills: string[];
	/** Action précise en cours (ex: "Editing +page.svelte", "Running vitest") */
	activityLabel: string | null;
	/** Remplissage estimé de la fenêtre de contexte (0.0 à 1.0) */
	contextRatio: number;
	contextTokens: number;
	maxContextTokens: number;
	targetAgentId: string | null;
	callMessage: string | null;
	deskPosition: GridPoint;
	position: GridPoint;
	targetPosition: GridPoint;
	direction: 'down' | 'up' | 'left' | 'right';
	palette: {
		hair: string;
		shirt: string;
		accent: string;
		skin: string;
	};
	/** Index de sprite forcé (0..5) */
	customSpriteIndex?: number;
	/** Mission / objectifs personnalisés */
	customMission?: string;
	/** Accessoire visuel superposé */
	customAccessory?: 'glasses' | 'headset' | 'coffee' | 'badge' | 'none';
	/** Décoration posée sur le bureau */
	deskDecor?: 'bonsai' | 'mug' | 'robot' | 'neon' | 'dual_monitor' | 'none';
	/** Humeur / Statut personnalisé affiché en bulle au repos */
	moodStatus?: string;
	/** État de coup de fil ou intercom */
	phoneCall?: {
		withAgentId: string;
		withAgentName: string;
		isCaller: boolean;
		topic: string;
	} | null;
	/** Dernier dialogue ou prise de parole (Typewriter RPG) */
	lastDialogue?: AgentDialogue | null;
	/** Effet Matrix Digital Rain au spawn / despawn */
	matrixEffect: 'spawn' | 'despawn' | null;
	matrixStartedAt: number | null;
	lastActivityAt: number;
}

/**
 * Schéma Zod de validation pour tout événement entrant (API POST, Hook ou Watcher)
 */
export const IncomingEventSchema = z.object({
	source: EventSourceSchema.default('manual'),
	type: z.enum([
		'WORK_START',
		'SKILL_LOAD',
		'TOOL_USE',
		'WAITING_HUMAN',
		'RESOLVE_HUMAN_GATE',
		'TURN_DONE',
		'CALL_AGENT',
		'VISIT_AGENT',
		'TEAM_MEETING',
		'PHONE_CALL',
		'END_CALL',
		'SERVER_ALERT',
		'COFFEE_CHAT',
		'SPAWN_SUBAGENT',
		'DISMISS_SUBAGENT',
		'GO_COFFEE',
		'GO_GYM',
		'GO_LOUNGE',
		'RETURN_DESK',
		'PARTY_BREAK',
		'PET_INTERACT',
		'UPDATE_AGENT_CONFIG'
	]),
	agentId: z.string().min(1).default('lead-dev'),
	targetAgentId: z.string().optional(),
	project: z.string().optional(),
	skills: z.array(z.string()).optional(),
	activityLabel: z.string().optional(),
	contextRatio: z.number().min(0).max(1).optional(),
	subagentName: z.string().optional(),
	subagentRole: z.string().optional(),
	message: z.string().optional(),
	resolutionAction: z.enum(['approve', 'reject']).optional(),
	config: z
		.object({
			name: z.string().optional(),
			title: z.string().optional(),
			role: AgentRoleSchema.optional(),
			shirtColor: z.string().optional(),
			hairColor: z.string().optional(),
			skinTone: z.string().optional(),
			spriteIndex: z.number().min(0).max(5).optional(),
			mission: z.string().optional(),
			accessory: z.enum(['glasses', 'headset', 'coffee', 'badge', 'none']).optional(),
			deskDecor: z.enum(['bonsai', 'mug', 'robot', 'neon', 'dual_monitor', 'none']).optional(),
			moodStatus: z.string().optional(),
			skills: z.array(z.string()).optional()
		})
		.optional()
});

export type IncomingOfficeEvent = z.infer<typeof IncomingEventSchema>;

/**
 * Entrée du journal d'activité temps réel affiché en bas de l'écran
 */
export interface ActivityLogEntry {
	id: string;
	timestamp: number;
	source: EventSource;
	agentId: string;
	agentName: string;
	summary: string;
	project: string | null;
	skills: string[];
	soundCue?: 'done' | 'permission' | 'call' | 'spawn' | null;
}

/**
 * Jalon humain en attente de validation (Pont bi-directionnel multi-projets)
 */
export interface PendingGate {
	id: string;
	project: string;
	agentId: string;
	agentName: string;
	title: string;
	message: string;
	timestamp: number;
	status: 'PENDING' | 'APPROVED' | 'REJECTED';
	sourceTool: EventSource;
}

/**
 * Snapshot complet envoyé en SSE au client
 */
export interface OfficeSnapshot {
	agents: OfficeAgent[];
	pet: OfficePet;
	logs: ActivityLogEntry[];
	pendingGates?: PendingGate[];
	watcherStatus: {
		antigravityActive: boolean;
		opencodeActive: boolean;
		claudeActive: boolean;
		watchedPaths: string[];
		lastFileEventAt: number | null;
	};
	stats: {
		activeProject: string | null;
		/** Tous les projets actuellement actifs dans /Users/silveremeya/Projets */
		activeProjects: string[];
		totalEventsToday: number;
		subagentsSpawnedToday: number;
	};
}
