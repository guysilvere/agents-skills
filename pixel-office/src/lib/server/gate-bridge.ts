import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { EventSource, PendingGate } from '$lib/types/office';
import { officeState } from './office-state';

const GATES_DIR = path.join(os.homedir(), '.config', 'pixel-office', 'gates');

function ensureGatesDir(): void {
	try {
		if (!fs.existsSync(GATES_DIR)) {
			fs.mkdirSync(GATES_DIR, { recursive: true });
		}
	} catch (err) {
		console.error('[GateBridge] Erreur création dossier gates:', err);
	}
}

/**
 * Lit tous les jalons humains en attente dans ~/.config/pixel-office/gates/
 * et les réconcilie avec les agents actuellement en WAITING_HUMAN dans le bureau.
 */
export function listPendingGates(): PendingGate[] {
	ensureGatesDir();
	const gates: PendingGate[] = [];

	// 1. Lire les fichiers json dans ~/.config/pixel-office/gates/
	try {
		const files = fs.readdirSync(GATES_DIR).filter((f) => f.endsWith('.json'));
		for (const file of files) {
			try {
				const filePath = path.join(GATES_DIR, file);
				const content = fs.readFileSync(filePath, 'utf-8');
				const parsed = JSON.parse(content) as PendingGate;
				if (parsed && parsed.status === 'PENDING') {
					gates.push(parsed);
				}
			} catch {
				// Fichier corrompu ou en cours d'écriture
			}
		}
	} catch (err) {
		console.warn('[GateBridge] Lecture dossier gates échouée:', err);
	}

	// 2. Réconcilier avec les agents en WAITING_HUMAN du bureau (sans récursion getSnapshot)
	const waitingAgents = officeState.getWaitingAgents();

	for (const agent of waitingAgents) {
		const existingGate = gates.find((g) => g.agentId === agent.id);
		if (!existingGate) {
			// Créer une gate virtuelle pour cet agent
			const prj = agent.currentProject ?? officeState.stats.activeProject ?? 'agents-skills';
			const virtualGate: PendingGate = {
				id: `gate-${agent.id}-${prj}`,
				project: prj,
				agentId: agent.id,
				agentName: agent.name,
				title: `Validation requise [${prj.toUpperCase()}]`,
				message: agent.activityLabel || 'Jalon humain STOP en attente d\'approbation',
				timestamp: agent.lastActivityAt || Date.now(),
				status: 'PENDING',
				sourceTool: 'antigravity'
			};
			gates.push(virtualGate);
			// Sauvegarder dans le fichier partagé pour les runners CLI
			saveGateToFile(virtualGate);
		}
	}

	return gates.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Enregistre une gate dans le dossier partagé ~/.config/pixel-office/gates/<id>.json
 */
export function saveGateToFile(gate: PendingGate): void {
	ensureGatesDir();
	try {
		const filePath = path.join(GATES_DIR, `${gate.id}.json`);
		fs.writeFileSync(filePath, JSON.stringify(gate, null, 2), 'utf-8');
	} catch (err) {
		console.error('[GateBridge] Échec écriture gate:', err);
	}
}

/**
 * Crée un jalon STOP et le publie
 */
export function createPendingGate(data: {
	project: string;
	agentId: string;
	agentName?: string;
	title: string;
	message: string;
	sourceTool?: EventSource;
}): PendingGate {
	const id = `gate-${data.project}-${data.agentId}-${Date.now().toString(36)}`;
	const gate: PendingGate = {
		id,
		project: data.project,
		agentId: data.agentId,
		agentName: data.agentName ?? data.agentId,
		title: data.title,
		message: data.message,
		timestamp: Date.now(),
		status: 'PENDING',
		sourceTool: data.sourceTool ?? 'antigravity'
	};

	saveGateToFile(gate);

	// Notifier officeState pour que le sprite de l'agent se positionne en WAITING_HUMAN
	officeState.applyEvent({
		source: gate.sourceTool,
		type: 'WAITING_HUMAN',
		agentId: gate.agentId,
		project: gate.project,
		message: gate.message
	});

	return gate;
}

/**
 * Résout une gate (approve / reject), écrit le résultat pour les runners CLI (Antigravity, Claude Code, OpenCode)
 * et débloque le sprite dans Pixel Office.
 */
export function resolveGate(gateId: string, action: 'approve' | 'reject'): boolean {
	ensureGatesDir();
	let resolved = false;

	// 1. Chercher le fichier correspondant
	try {
		const filePath = path.join(GATES_DIR, `${gateId}.json`);
		if (fs.existsSync(filePath)) {
			const content = fs.readFileSync(filePath, 'utf-8');
			const parsed = JSON.parse(content) as PendingGate;
			parsed.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
			fs.writeFileSync(
				filePath,
				JSON.stringify({ ...parsed, resolvedAt: Date.now(), resolutionAction: action }, null, 2),
				'utf-8'
			);

			// Notifier office-state pour cet agent précis
			officeState.applyEvent({
				source: 'manual',
				type: 'RESOLVE_HUMAN_GATE',
				agentId: parsed.agentId,
				project: parsed.project,
				resolutionAction: action
			});

			resolved = true;
		}
	} catch (err) {
		console.error(`[GateBridge] Erreur résolution gate ${gateId}:`, err);
	}

	// 2. Si non trouvé par nom de fichier direct, chercher par agentId
	if (!resolved) {
		const gates = listPendingGates();
		const match = gates.find((g) => g.id === gateId || g.agentId === gateId);
		if (match) {
			match.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
			saveGateToFile(match);
			officeState.applyEvent({
				source: 'manual',
				type: 'RESOLVE_HUMAN_GATE',
				agentId: match.agentId,
				project: match.project,
				resolutionAction: action
			});
			resolved = true;
		}
	}

	officeState.broadcast();
	return resolved;
}

/**
 * Résout simultanément tous les jalons en attente
 */
export function resolveAllPendingGates(action: 'approve' | 'reject'): number {
	const gates = listPendingGates();
	let count = 0;
	for (const gate of gates) {
		if (resolveGate(gate.id, action)) {
			count++;
		}
	}
	return count;
}

// Enregistrement automatique du provider de gates auprès d'officeState
officeState.registerGateProvider(listPendingGates);

