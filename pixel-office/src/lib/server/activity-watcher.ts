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

/** Mémorise la taille du dernier fichier lu pour ne traiter que les nouvelles lignes */
const fileOffsets = new Map<string, number>();

function cleanQuotes(val: unknown): string {
	if (typeof val !== 'string') return '';
	return val.replace(/^"+|"+$/g, '').trim();
}

/**
 * Extrait le nom du projet depuis n'importe quel chemin sous /Users/silveremeya/Projets/
 */
function extractProjectFromPath(str: string): string | null {
	const match = str.match(/\/Projets\/([^/"'\s\\]+)/);
	if (match && match[1] && match[1] !== 'Projets' && match[1] !== '.git') {
		return match[1];
	}
	return null;
}

function extractSkillFromPath(str: string): string | null {
	for (const sk of KNOWN_SKILLS) {
		if (str.includes(sk)) return sk;
	}
	return null;
}

/**
 * Analyse les dernières lignes d'un fichier transcript Antigravity (transcript.jsonl)
 */
function parseAntigravityTranscriptTail(filePath: string, isInitialBoot = false): void {
	try {
		const stat = fs.statSync(filePath);
		const prevSize = fileOffsets.get(filePath) ?? 0;
		if (!isInitialBoot && stat.size <= prevSize) return;
		fileOffsets.set(filePath, stat.size);

		const readSize = Math.min(stat.size, 28_672);
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
		officeState.watcherStatus.lastFileEventAt = Date.now();

		const inputTokens =
			Number(lastEntry.input_tokens || 0) + Number(lastEntry.cache_read_tokens || 0);
		const contextRatio =
			inputTokens > 0 ? Math.min(0.98, +(inputTokens / 300_000).toFixed(2)) : undefined;

		// 1. Appel d'outil (tool_calls)
		if (Array.isArray(lastEntry.tool_calls) && lastEntry.tool_calls.length > 0) {
			const tc = lastEntry.tool_calls[lastEntry.tool_calls.length - 1];
			const toolName = String(tc.name || '');
			const args = (tc.args || {}) as Record<string, unknown>;
			const serializedArgs = JSON.stringify(args);

			const detectedProject =
				extractProjectFromPath(serializedArgs) ??
				extractProjectFromPath(filePath) ??
				officeState.stats.activeProject ??
				'agents-skills';
			const detectedSkill = extractSkillFromPath(serializedArgs);

			if (toolName === 'invoke_subagent') {
				const subType = cleanQuotes(args.TypeName) || 'ops-quality';
				const subRole = cleanQuotes(args.Role) || 'Renfort Spécialisé';
				if (subType === 'ops-quality' || subType === 'integrations') {
					officeState.applyEvent({
						source: 'antigravity',
						type: 'CALL_AGENT',
						agentId: 'lead-dev',
						targetAgentId: subType,
						project: detectedProject,
						contextRatio,
						message: `Délégation: ${subRole}`
					});
				} else {
					officeState.applyEvent({
						source: 'antigravity',
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
					source: 'antigravity',
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
					source: 'antigravity',
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
				/vitest|test|check|lighthouse|lint|cypress/i.test(serializedArgs)
					? 'ops-quality'
					: /payment|turso|migration|db|brevo|webhook/i.test(serializedArgs)
						? 'integrations'
						: 'lead-dev';

			officeState.applyEvent({
				source: 'antigravity',
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
			const detectedProject = extractProjectFromPath(JSON.stringify(lastEntry)) ?? officeState.stats.activeProject ?? 'agents-skills';
			officeState.applyEvent({
				source: 'antigravity',
				type: 'WORK_START',
				agentId: 'lead-dev',
				project: detectedProject,
				activityLabel: 'Analyse de ta demande...',
				contextRatio
			});
			return;
		}

		// 3. Fin de réponse ou Jalon STOP
		if (lastEntry.type === 'PLANNER_RESPONSE' && typeof lastEntry.content === 'string') {
			const detectedProject = extractProjectFromPath(lastEntry.content) ?? officeState.stats.activeProject ?? 'agents-skills';
			if (lastEntry.content.includes('⛔ STOP')) {
				officeState.applyEvent({
					source: 'antigravity',
					type: 'WAITING_HUMAN',
					agentId: 'lead-dev',
					project: detectedProject,
					message: 'STOP Jalon Humain — Validation attendue',
					contextRatio
				});
			} else if (!isInitialBoot) {
				officeState.applyEvent({
					source: 'antigravity',
					type: 'TURN_DONE',
					agentId: 'lead-dev',
					project: detectedProject,
					message: 'Réponse livrée — En attente',
					contextRatio
				});
			}
		}
	} catch {
		// Ignore
	}
}

/**
 * Analyse les sessions Claude Code stockées dans ~/.claude/projects/
 */
function parseClaudeSessionTail(filePath: string, projectName: string, isInitialBoot = false): void {
	try {
		const stat = fs.statSync(filePath);
		const prevSize = fileOffsets.get(filePath) ?? 0;
		if (!isInitialBoot && stat.size <= prevSize) return;
		fileOffsets.set(filePath, stat.size);

		const readSize = Math.min(stat.size, 28_672);
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

		officeState.watcherStatus.lastFileEventAt = Date.now();

		// Scanner les messages récents de la fin vers le début
		for (let i = lines.length - 1; i >= 0; i--) {
			const entry = JSON.parse(lines[i]);
			if (entry.type === 'assistant' && entry.message?.content) {
				const contents = Array.isArray(entry.message.content)
					? entry.message.content
					: [entry.message.content];

				// @ts-expect-error typage souple jsonl claude
				const toolUse = contents.find((c) => c && c.type === 'tool_use');
				// @ts-expect-error typage souple jsonl claude
				const textContent = contents.find((c) => c && c.type === 'text' && c.text);

				const inputTokens = entry.message?.usage?.cache_read_input_tokens || 0;
				const contextRatio =
					inputTokens > 0 ? Math.min(0.98, +(inputTokens / 200_000).toFixed(2)) : 0.35;

				if (toolUse) {
					const toolName = String(toolUse.name || '');
					const toolInput = (toolUse.input || {}) as Record<string, unknown>;
					const toolStr = JSON.stringify(toolInput);

					let activityLabel = `Tool: ${toolName}`;
					let activeAgentId = 'lead-dev';

					if (toolName === 'Bash') {
						const cmd = String(toolInput.command || '');
						if (/test|vitest|check|lint|lighthouse/i.test(cmd)) {
							activeAgentId = 'ops-quality';
							activityLabel = `Tests: ${cmd.slice(0, 26)}`;
						} else if (/git commit|push|deploy|coolify/i.test(cmd)) {
							activeAgentId = 'ops-quality';
							activityLabel = `Git: ${cmd.slice(0, 26)}`;
						} else {
							activityLabel = `Bash: ${cmd.slice(0, 26)}`;
						}
					} else if (toolName === 'Edit' || toolName === 'Write') {
						const file = path.basename(String(toolInput.file_path || 'file'));
						activityLabel = `Editing ${file}`;
					} else if (toolName === 'View') {
						const file = path.basename(String(toolInput.file_path || 'file'));
						activityLabel = `Reading ${file}`;
					}

					if (/payment|wave|orange|turso|migration|db/i.test(toolStr)) {
						activeAgentId = 'integrations';
					}

					officeState.applyEvent({
						source: 'claude',
						type: 'WORK_START',
						agentId: activeAgentId,
						project: projectName,
						activityLabel,
						contextRatio
					});
					return;
				} else if (textContent) {
					const text = String(textContent.text || '');
					if (text.includes('⛔ STOP')) {
						officeState.applyEvent({
							source: 'claude',
							type: 'WAITING_HUMAN',
							agentId: 'lead-dev',
							project: projectName,
							message: 'STOP Jalon Humain — Validation attendue',
							contextRatio
						});
					} else if (!isInitialBoot) {
						officeState.applyEvent({
							source: 'claude',
							type: 'TURN_DONE',
							agentId: 'lead-dev',
							project: projectName,
							message: text.slice(0, 80),
							contextRatio
						});
					}
					return;
				}
			}
		}
	} catch {
		// Ignore
	}
}

/**
 * Scanne toutes les conversations Antigravity actives récemment (multi-projets)
 */
function scanAntigravityTranscripts(antigravityDir: string, isInitial = false): void {
	if (!fs.existsSync(antigravityDir)) return;
	try {
		const convDirs = fs.readdirSync(antigravityDir);
		const candidates: { path: string; mtime: number }[] = [];

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
				// Transcripts actifs au cours des 2 dernières heures
				if (st.mtimeMs > Date.now() - 2 * 3600 * 1000) {
					candidates.push({ path: candidate, mtime: st.mtimeMs });
				}
			}
		}

		candidates.sort((a, b) => b.mtime - a.mtime);
		// Scanner jusqu'aux 8 conversations les plus récentes en parallèle
		for (const item of candidates.slice(0, 8)) {
			parseAntigravityTranscriptTail(item.path, isInitial);
		}
	} catch {
		// Ignore
	}
}

/**
 * Scanne tous les projets surveillés dans ~/.claude/projects/
 */
function scanClaudeProjects(claudeProjectsDir: string, isInitial = false): void {
	if (!fs.existsSync(claudeProjectsDir)) return;
	try {
		const dirs = fs.readdirSync(claudeProjectsDir);
		for (const dirName of dirs) {
			if (!dirName.startsWith('-Users-') || !dirName.includes('-Projets-')) continue;
			const projectDirPath = path.join(claudeProjectsDir, dirName);
			try {
				const stDir = fs.statSync(projectDirPath);
				if (!stDir.isDirectory()) continue;

				// Extraire le nom du projet, ex: '-Users-silveremeya-Projets-lodgi' -> 'lodgi'
				const match = dirName.match(/-Projets-([^-]+(?:-[^-]+)*?)(?:--|$)/);
				const projectName = match ? match[1] : null;
				if (!projectName) continue;

				const files = fs.readdirSync(projectDirPath).filter((f) => f.endsWith('.jsonl'));
				let newestSession: string | null = null;
				let newestMtime = 0;

				for (const f of files) {
					const fPath = path.join(projectDirPath, f);
					const st = fs.statSync(fPath);
					if (st.mtimeMs > newestMtime) {
						newestMtime = st.mtimeMs;
						newestSession = fPath;
					}
				}

				if (newestSession && newestMtime > Date.now() - 2 * 3600 * 1000) {
					parseClaudeSessionTail(newestSession, projectName, isInitial);
				}
			} catch {
				// Ignore
			}
		}
	} catch {
		// Ignore
	}
}

/**
 * Scanne directement le dossier /Users/silveremeya/Projets pour détecter les projets modifiés
 */
function scanDirectProjetsDirectory(): void {
	const projetsRoot = '/Users/silveremeya/Projets';
	if (!fs.existsSync(projetsRoot)) return;
	try {
		const entries = fs.readdirSync(projetsRoot);
		for (const name of entries) {
			if (name.startsWith('.') || name === 'Archive') continue;
			const projDir = path.join(projetsRoot, name);
			try {
				const st = fs.statSync(projDir);
				if (st.isDirectory()) {
					// Si le dossier a été modifié très récemment (< 30s)
					if (st.mtimeMs > Date.now() - 30_000) {
						if (!officeState.stats.activeProjects.includes(name)) {
							officeState.stats.activeProjects = Array.from(
								new Set([name, ...officeState.stats.activeProjects])
							).slice(0, 6);
						}
					}
				}
			} catch {
				// Ignore
			}
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

	const existingPaths: string[] = ['/Users/silveremeya/Projets'];
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

	// Scan initial
	if (hasAntigravity) scanAntigravityTranscripts(antigravityDir, true);
	if (hasClaude) scanClaudeProjects(claudeProjectsDir, true);
	scanDirectProjetsDirectory();

	// Boucle de polling intelligente toutes les 1.2s
	if (pollTimer) clearInterval(pollTimer);
	pollTimer = setInterval(() => {
		if (hasAntigravity) scanAntigravityTranscripts(antigravityDir, false);
		if (hasClaude) scanClaudeProjects(claudeProjectsDir, false);
		scanDirectProjetsDirectory();
	}, 1200);
}
