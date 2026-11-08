import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { officeState } from '$lib/server/office-state';

const KNOWN_SKILLS = [
	'shared-eco-tokens',
	'pwa-cadrage',
	'pwa-developpement',
	'design-pwa-system',
	'design-ux-flow',
	'pwa-validation',
	'pwa-deploiement',
	'api-paiements',
	'api-best-practices',
	'shared-git-conventions',
	'opencode-admin',
	'pwa-test-harness',
	'shared-graft',
	'apple-design',
	'design-3d'
];

let watcherInitialized = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

/** Mémorise la taille du dernier transcript lu pour ne traiter que les nouvelles lignes */
const fileOffsets = new Map<string, number>();

function cleanQuotes(val: unknown): string {
	if (typeof val !== 'string') return '';
	return val.replace(/^"+|"+$/g, '').trim();
}

function extractProjectFromPath(str: string): string | null {
	const match = str.match(/\/Projets\/([^/"'\s/]+)/);
	return match ? match[1] : null;
}

function extractSkillFromPath(str: string): string | null {
	for (const sk of KNOWN_SKILLS) {
		if (str.includes(sk)) return sk;
	}
	return null;
}

/**
 * Analyse les dernières lignes d'un fichier `transcript.jsonl` Antigravity ou Claude Code
 * et déclenche les vrais mouvements/états dans le bureau.
 */
function parseTranscriptTail(filePath: string, isInitialBoot = false): void {
	try {
		const stat = fs.statSync(filePath);
		const prevSize = fileOffsets.get(filePath) ?? 0;
		if (!isInitialBoot && stat.size <= prevSize) return;
		fileOffsets.set(filePath, stat.size);

		const readSize = Math.min(stat.size, 24_576);
		const fd = fs.openSync(filePath, 'r');
		const buffer = Buffer.alloc(readSize);
		fs.readSync(fd, buffer, 0, readSize, stat.size - readSize);
		fs.closeSync(fd);

		const lines = buffer
			.toString('utf-8')
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l.startsWith('{') && l.endsWith('}'));

		if (lines.length === 0) return;

		const lastEntry = JSON.parse(lines[lines.length - 1]);
		const source = filePath.includes('.gemini') ? 'antigravity' : 'claude';
		officeState.watcherStatus.lastFileEventAt = Date.now();

		const inputTokens =
			Number(lastEntry.input_tokens || 0) + Number(lastEntry.cache_read_tokens || 0);
		const contextRatio =
			inputTokens > 0 ? Math.min(0.98, +(inputTokens / 300_000).toFixed(2)) : undefined;

		// 1. Le modèle appelle un outil (tool_calls)
		if (Array.isArray(lastEntry.tool_calls) && lastEntry.tool_calls.length > 0) {
			const tc = lastEntry.tool_calls[lastEntry.tool_calls.length - 1];
			const toolName = String(tc.name || '');
			const args = (tc.args || {}) as Record<string, unknown>;
			const serializedArgs = JSON.stringify(args);

			const detectedProject =
				extractProjectFromPath(serializedArgs) ??
				officeState.stats.activeProject ??
				'agents-skills';
			const detectedSkill = extractSkillFromPath(serializedArgs);

			if (toolName === 'invoke_subagent') {
				const subType = cleanQuotes(args.TypeName) || 'ops-quality';
				const subRole = cleanQuotes(args.Role) || 'Renfort Spécialisé';
				if (subType === 'ops-quality' || subType === 'integrations') {
					officeState.applyEvent({
						source,
						type: 'CALL_AGENT',
						agentId: 'lead-dev',
						targetAgentId: subType,
						project: detectedProject,
						contextRatio,
						message: `Délégation: ${subRole}`
					});
				} else {
					officeState.applyEvent({
						source,
						type: 'SPAWN_SUBAGENT',
						agentId: 'lead-dev',
						subagentName: subType,
						subagentRole: subRole,
						project: detectedProject,
						contextRatio
					});
				}
				return;
			}

			if (toolName === 'send_message') {
				officeState.applyEvent({
					source,
					type: 'VISIT_AGENT',
					agentId: 'lead-dev',
					targetAgentId: 'ops-quality',
					project: detectedProject,
					contextRatio,
					message: 'Échange inter-agents'
				});
				return;
			}

			if (detectedSkill && (toolName === 'view_file' || toolName === 'read_file')) {
				officeState.applyEvent({
					source,
					type: 'SKILL_LOAD',
					agentId: 'lead-dev',
					project: detectedProject,
					skills: [detectedSkill],
					contextRatio
				});
				return;
			}

			let activityLabel = `Tool: ${toolName}`;
			if (toolName === 'run_command') {
				const summary = cleanQuotes(args.toolSummary);
				const cmd = cleanQuotes(args.CommandLine);
				activityLabel = summary ? `Cmd: ${summary}` : `Bash: ${cmd.slice(0, 28)}`;
			} else if (
				toolName === 'write_to_file' ||
				toolName === 'replace_file_content' ||
				toolName === 'multi_replace_file_content'
			) {
				const targetFile = cleanQuotes(args.TargetFile);
				activityLabel = `Editing ${path.basename(targetFile || 'file')}`;
			} else if (toolName === 'view_file') {
				const absPath = cleanQuotes(args.AbsolutePath);
				activityLabel = `Reading ${path.basename(absPath || 'file')}`;
			} else if (toolName === 'grep_search' || toolName === 'find_by_name') {
				const q = cleanQuotes(args.Query || args.Pattern);
				activityLabel = `Searching "${q.slice(0, 20)}"`;
			} else if (toolName === 'read_url_content' || toolName === 'search_web') {
				activityLabel = 'Web Research';
			}

			const activeAgentId =
				toolName === 'run_command' &&
				/vitest|test|check|lighthouse|lint/i.test(serializedArgs)
					? 'ops-quality'
					: 'lead-dev';

			officeState.applyEvent({
				source,
				type: 'WORK_START',
				agentId: activeAgentId,
				project: detectedProject,
				activityLabel,
				contextRatio
			});
			return;
		}

		// 2. Nouveau prompt utilisateur (USER_INPUT)
		if (lastEntry.type === 'USER_INPUT') {
			officeState.applyEvent({
				source,
				type: 'WORK_START',
				agentId: 'lead-dev',
				project: officeState.stats.activeProject ?? 'agents-skills',
				activityLabel: 'Analyse de ta demande...',
				contextRatio
			});
			return;
		}

		// 3. Fin de réponse ou Jalon STOP
		if (lastEntry.type === 'PLANNER_RESPONSE' && typeof lastEntry.content === 'string') {
			if (lastEntry.content.includes('⛔ STOP')) {
				officeState.applyEvent({
					source,
					type: 'WAITING_HUMAN',
					agentId: 'lead-dev',
					project: officeState.stats.activeProject ?? 'agents-skills',
					message: 'STOP Jalon Humain — Validation attendue',
					contextRatio
				});
			} else if (!isInitialBoot) {
				officeState.applyEvent({
					source,
					type: 'TURN_DONE',
					agentId: 'lead-dev',
					project: officeState.stats.activeProject ?? 'agents-skills',
					message: 'Réponse livrée — En attente',
					contextRatio
				});
			}
		}
	} catch {
		// Ignore fichier en cours d'écriture
	}
}

/**
 * Trouve et lit le `transcript.jsonl` Antigravity le plus récent sans ouvrir de watcher récursif (zéro EMFILE)
 */
function scanLatestAntigravityTranscript(antigravityDir: string, isInitial = false): void {
	if (!fs.existsSync(antigravityDir)) return;
	try {
		const convDirs = fs.readdirSync(antigravityDir);
		let newestFile: string | null = null;
		let newestMtime = 0;

		for (const conv of convDirs) {
			const candidate = path.join(
				antigravityDir,
				conv,
				'.system_generated',
				'logs',
				'transcript.jsonl'
			);
			if (fs.existsSync(candidate)) {
				const st = fs.statSync(candidate);
				if (st.mtimeMs > newestMtime) {
					newestMtime = st.mtimeMs;
					newestFile = candidate;
				}
			}
		}

		if (newestFile) {
			parseTranscriptTail(newestFile, isInitial);
		}
	} catch {
		// Ignore
	}
}

export function ensureActivityWatcher(): void {
	if (watcherInitialized) return;
	watcherInitialized = true;

	const home = os.homedir();
	const antigravityDir =
		process.env.ANTIGRAVITY_BRAIN_DIR || path.join(home, '.gemini', 'antigravity', 'brain');
	const opencodeDir =
		process.env.OPENCODE_CONFIG_DIR || path.join(home, '.config', 'opencode');
	const opencodeShareDir = path.join(home, '.local', 'share', 'opencode');
	const claudeProjectsDir = path.join(home, '.claude', 'projects');

	const existingPaths: string[] = [];
	const hasAntigravity = fs.existsSync(antigravityDir);
	const hasOpencode = fs.existsSync(opencodeDir) || fs.existsSync(opencodeShareDir);
	const hasClaude = fs.existsSync(claudeProjectsDir);

	if (hasAntigravity) existingPaths.push(antigravityDir);
	if (fs.existsSync(opencodeDir)) existingPaths.push(opencodeDir);
	if (fs.existsSync(opencodeShareDir)) existingPaths.push(opencodeShareDir);
	if (hasClaude) existingPaths.push(claudeProjectsDir);

	officeState.watcherStatus = {
		antigravityActive: hasAntigravity,
		opencodeActive: hasOpencode,
		claudeActive: hasClaude,
		watchedPaths: existingPaths,
		lastFileEventAt: Date.now()
	};

	if (hasAntigravity) {
		scanLatestAntigravityTranscript(antigravityDir, true);
	}

	if (pollTimer) clearInterval(pollTimer);
	pollTimer = setInterval(() => {
		if (hasAntigravity) {
			scanLatestAntigravityTranscript(antigravityDir, false);
		}
	}, 1200);
}
