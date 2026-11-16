import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { OFFICE_LOCATIONS } from '$lib/services/pathfinding';
import type { OfficeAgent } from '$lib/types/office';
import { officeState } from './office-state';

export interface SkillMetadata {
	name: string;
	description: string;
	path: string;
}

export interface AgentFileMetadata {
	name: string;
	title: string;
	description: string;
	skills: string[];
	filePath: string;
}

const DYNAMIC_SKILLS = new Map<string, SkillMetadata>();
const DYNAMIC_AGENTS = new Map<string, AgentFileMetadata>();

const AGENT_SEARCH_DIRS = [
	path.join(os.homedir(), 'Projets', 'agents-skills', 'antigravity', 'agents'),
	path.join(os.homedir(), 'Projets', 'agents-skills', 'opencode', 'agents'),
	path.join(os.homedir(), 'Projets', 'agents-skills', 'claude', 'agents'),
	path.join(os.homedir(), '.gemini', 'antigravity', 'agents'),
	path.join(os.homedir(), '.config', 'opencode', 'agents')
];

const SKILL_SEARCH_DIRS = [
	path.join(os.homedir(), '.gemini', 'config', 'skills'),
	path.join(os.homedir(), '.gemini', 'config', 'plugins'),
	path.join(os.homedir(), 'Projets', 'agents-skills', 'opencode', 'skills')
];

const EXTRA_PALETTES = [
	{ hair: '#312E81', shirt: '#4338CA', accent: '#A5B4FC', skin: '#F5CBA7' },
	{ hair: '#064E3B', shirt: '#047857', accent: '#6EE7B7', skin: '#E59866' },
	{ hair: '#701A75', shirt: '#A21CAF', accent: '#F0ABFC', skin: '#D4AC6E' },
	{ hair: '#7C2D12', shirt: '#C2410C', accent: '#FDBA74', skin: '#F5CBA7' }
];

function parseYamlFrontmatter(content: string): Record<string, string | string[]> {
	const result: Record<string, string | string[]> = {};
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return result;

	const yamlBlock = match[1];
	const lines = yamlBlock.split('\n');
	let currentArrayKey: string | null = null;
	const currentArray: string[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		if (trimmed.startsWith('- ') && currentArrayKey) {
			currentArray.push(trimmed.slice(2).trim());
			continue;
		}

		if (currentArrayKey && !trimmed.startsWith('- ')) {
			result[currentArrayKey] = [...currentArray];
			currentArrayKey = null;
			currentArray.length = 0;
		}

		const colonIdx = trimmed.indexOf(':');
		if (colonIdx > 0) {
			const key = trimmed.slice(0, colonIdx).trim();
			const val = trimmed.slice(colonIdx + 1).trim();
			if (!val) {
				currentArrayKey = key;
			} else {
				result[key] = val.replace(/^["']|["']$/g, '');
			}
		}
	}

	if (currentArrayKey) {
		result[currentArrayKey] = [...currentArray];
	}

	return result;
}

/**
 * Scanne les répertoires de skills pour découvrir toutes les skills déclarées localement
 */
export function scanSkillsCatalog(): Map<string, SkillMetadata> {
	function exploreDir(dir: string, depth = 0): void {
		if (depth > 4 || !fs.existsSync(dir)) return;
		try {
			const entries = fs.readdirSync(dir, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
					exploreDir(fullPath, depth + 1);
				} else if (entry.isFile() && entry.name.toLowerCase() === 'skill.md') {
					try {
						const content = fs.readFileSync(fullPath, 'utf-8');
						const meta = parseYamlFrontmatter(content);
						const parentDirName = path.basename(path.dirname(fullPath));
						const skillName = typeof meta.name === 'string' ? meta.name : parentDirName;
						const skillDesc =
							typeof meta.description === 'string'
								? meta.description
								: `Skill locale ${skillName}`;

						DYNAMIC_SKILLS.set(skillName, {
							name: skillName,
							description: skillDesc,
							path: fullPath
						});
					} catch {
						// Ignore
					}
				}
			}
		} catch {
			// Ignore
		}
	}

	for (const searchDir of SKILL_SEARCH_DIRS) {
		exploreDir(searchDir);
	}

	return DYNAMIC_SKILLS;
}

/**
 * Scanne les répertoires d'agents pour découvrir les agents définis dans Antigravity, OpenCode et Claude Code.
 * Crée automatiquement un sprite et un poste de bureau pour chaque nouvel agent détecté.
 */
export function scanAgentsCatalog(): Map<string, AgentFileMetadata> {
	let createdCount = 0;

	for (const dir of AGENT_SEARCH_DIRS) {
		if (!fs.existsSync(dir)) continue;
		try {
			const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
			for (const file of files) {
				const fullPath = path.join(dir, file);
				try {
					const content = fs.readFileSync(fullPath, 'utf-8');
					const meta = parseYamlFrontmatter(content);
					const agentId = typeof meta.name === 'string' ? meta.name : path.basename(file, '.md');
					const desc =
						typeof meta.description === 'string'
							? meta.description
							: `Agent spécialisé ${agentId}`;
					const skills = Array.isArray(meta.skills)
						? meta.skills.map((s) => s.replace(/^skills\//, ''))
						: ['shared-eco-tokens'];

					// Déduire un titre court à partir de la description
					let title = agentId;
					if (desc.includes('—')) {
						title = desc.split('—')[0].trim().replace(/^Agent principal\s*/i, '').trim() || agentId;
					} else if (desc.length > 0) {
						title = desc.slice(0, 24);
					}

					DYNAMIC_AGENTS.set(agentId, {
						name: agentId,
						title,
						description: desc,
						skills,
						filePath: fullPath
					});

					// S'assurer que l'agent existe dans officeState
					const currentAgents = officeState.getSnapshot().agents;
					const exists = currentAgents.some((a) => a.id === agentId);

					if (!exists) {
						// Créer automatiquement le nouvel agent avec son bureau
						const deskIndex = currentAgents.length % OFFICE_LOCATIONS.internDesks.length;
						const deskPos = OFFICE_LOCATIONS.internDesks[deskIndex];
						const palette = EXTRA_PALETTES[currentAgents.length % EXTRA_PALETTES.length];

						const newAgent: OfficeAgent = {
							id: agentId,
							name: agentId,
							title,
							role: (agentId === 'lead-dev' || agentId === 'ops-quality' || agentId === 'integrations') ? agentId : 'subagent',
							isTemporary: false, // Résident permanent découvert
							state: 'IDLE_DESK',
							currentProject: officeState.stats.activeProject ?? 'agents-skills',
							activeProjects: [officeState.stats.activeProject ?? 'agents-skills'],
							activeSkills: skills,
							activityLabel: 'Prêt pour assignation',
							contextRatio: 0.1,
							contextTokens: 10_000,
							maxContextTokens: 200_000,
							targetAgentId: null,
							callMessage: null,
							deskPosition: { ...deskPos },
							position: { ...deskPos },
							targetPosition: { ...deskPos },
							direction: 'down',
							palette,
							deskDecor: 'bonsai',
							moodStatus: 'Prêt à intervenir',
							phoneCall: null,
							lastDialogue: {
								speaker: agentId,
								text: `Agent ${agentId} initialisé et prêt pour vos missions.`,
								type: 'thought',
								timestamp: Date.now()
							},
							matrixEffect: null,
							matrixStartedAt: null,
							lastActivityAt: Date.now()
						};

						officeState.registerDiscoveredAgent(newAgent);
						createdCount++;
					}
				} catch {
					// Ignore fichier illisible
				}
			}
		} catch {
			// Ignore
		}
	}

	if (createdCount > 0) {
		officeState.broadcast();
	}

	return DYNAMIC_AGENTS;
}

/**
 * Retourne la liste de tous les noms de skills connues dynamiquement
 */
export function getAllKnownSkillsList(): string[] {
	if (DYNAMIC_SKILLS.size === 0) {
		scanSkillsCatalog();
	}
	return Array.from(DYNAMIC_SKILLS.keys());
}

/**
 * Retourne le mapping complet des skills { nom: description }
 */
export function getSkillsCatalogDictionary(): Record<string, string> {
	if (DYNAMIC_SKILLS.size === 0) {
		scanSkillsCatalog();
	}
	const dict: Record<string, string> = {};
	for (const [name, meta] of DYNAMIC_SKILLS.entries()) {
		dict[name] = meta.description;
	}
	return dict;
}
