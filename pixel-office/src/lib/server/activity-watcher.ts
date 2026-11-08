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

/** Mémorise le projet associé à chaque session active (fichier transcript) */
const sessionProjects = new Map<string, string>();

/** Mémorise les timestamps de dernière modification des .git/index des projets locaux */
const gitProjectMtimes = new Map<string, number>();

const PROJETS_ROOT = '/Users/silveremeya/Projets';

function cleanQuotes(val: unknown): string {
	if (typeof val !== 'string') return '';
	return val.replace(/^"+|"+$/g, '').trim();
}

export function extractProjectFromPath(str: string): string | null {
	if (!str) return null;
	const match = str.match(/\/Projets\/([^/"'\s\\]+)/i);
	if (match) return match[1];

	const claudeMatch = str.match(/-Users-[^-]+-Projets-([a-zA-Z0-9._-]+)/i);
	if (claudeMatch) return claudeMatch[1];

	return null;
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

			let detectedProject =
				extractProjectFromPath(serializedArgs) ??
				extractProjectFromPath(filePath) ??
				sessionProjects.get(filePath);

			if (!detectedProject) {
				detectedProject = officeState.stats.activeProject ?? 'agents-skills';
			}

			// Mémoriser le projet pour cette session
			sessionProjects.set(filePath, detectedProject);

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
						message: `Délégation [${detectedProject}]: ${subRole}`
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
					message: `Échange [${detectedProject}]`
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
				/vitest|test|check|lighthouse|lint|build/i.test(serializedArgs)
					? 'ops-quality'
					: /db|turso|migration|payment|webhook|stripe|geniuspay/i.test(serializedArgs)
						? 'integrations'
						: 'lead-dev';

			officeState.applyEvent({
				source,
				type: 'WORK_START',
				agentId: activeAgentId,
				project: detectedProject,
				activityLabel: `[${detectedProject}] ${activityLabel}`,
				skills: detectedSkill ? [detectedSkill] : undefined,
				contextRatio
			});
			return;
		}

		// 2. Nouveau prompt utilisateur (USER_INPUT)
		if (lastEntry.type === 'USER_INPUT') {
			const project =
				sessionProjects.get(filePath) ??
				extractProjectFromPath(filePath) ??
				officeState.stats.activeProject ??
				'agents-skills';

			officeState.applyEvent({
				source,
				type: 'WORK_START',
				agentId: 'lead-dev',
				project,
				activityLabel: `[${project}] Analyse de ta demande...`,
				contextRatio
			});
			return;
		}

		// 3. Fin de réponse ou Jalon STOP
		if (lastEntry.type === 'PLANNER_RESPONSE' && typeof lastEntry.content === 'string') {
			const project =
				sessionProjects.get(filePath) ??
				extractProjectFromPath(filePath) ??
				officeState.stats.activeProject ??
				'agents-skills';

			if (lastEntry.content.includes('⛔ STOP')) {
				officeState.applyEvent({
					source,
					type: 'WAITING_HUMAN',
					agentId: 'lead-dev',
					project,
					message: `STOP Jalon Humain sur [${project}] — Validation attendue`,
					contextRatio
				});
			} else if (!isInitialBoot) {
				officeState.applyEvent({
					source,
					type: 'TURN_DONE',
					agentId: 'lead-dev',
					project,
					message: `[${project}] Réponse livrée — En attente`,
					contextRatio
				});
			}
		}
	} catch {
		// Ignore fichier en cours d'écriture
	}
}

/**
 * Scanne toutes les sessions Antigravity récentes (modifiées dans les dernières 6h)
 * pour détecter l'activité multi-projets en temps réel.
 */
function scanActiveAntigravityTranscripts(antigravityDir: string, isInitial = false): void {
	if (!fs.existsSync(antigravityDir)) return;
	try {
		const convDirs = fs.readdirSync(antigravityDir);
		const candidates: { file: string; mtime: number }[] = [];
		const now = Date.now();

		for (const conv of convDirs) {
			if (conv.startsWith('.')) continue;
			const candidate = path.join(
				antigravityDir,
				conv,
				'.system_generated',
				'logs',
				'transcript.jsonl'
			);
			if (fs.existsSync(candidate)) {
				const st = fs.statSync(candidate);
				// Sessions actives au cours des dernières 6 heures
				if (now - st.mtimeMs < 6 * 3600 * 1000) {
					candidates.push({ file: candidate, mtime: st.mtimeMs });
				}
			}
		}

		// Trier par fraîcheur et traiter les 8 sessions les plus récentes
		candidates.sort((a, b) => b.mtime - a.mtime);
		for (const item of candidates.slice(0, 8)) {
			parseTranscriptTail(item.file, isInitial);
		}
	} catch {
		// Ignore
	}
}

/**
 * Scanne les projets Claude Code (~/.claude/projects/-Users-silveremeya-Projets-*)
 */
function scanClaudeCodeProjects(claudeProjectsDir: string, isInitial = false): void {
	if (!fs.existsSync(claudeProjectsDir)) return;
	try {
		const projDirs = fs.readdirSync(claudeProjectsDir);
		const now = Date.now();

		for (const pDir of projDirs) {
			if (!pDir.includes('-Projets-')) continue;
			const fullProjDir = path.join(claudeProjectsDir, pDir);
			const files = fs.readdirSync(fullProjDir);

			for (const f of files) {
				if (f.endsWith('.jsonl')) {
					const filePath = path.join(fullProjDir, f);
					const st = fs.statSync(filePath);
					if (now - st.mtimeMs < 6 * 3600 * 1000) {
						parseTranscriptTail(filePath, isInitial);
					}
				}
			}
		}
	} catch {
		// Ignore
	}
}

/**
 * Surveillance directe et ultra-rapide des dépôts Git dans /Users/silveremeya/Projets/
 * (détecte instantanément les commits, status, switch de branches sur lodgi, meya.me, brvmradar, etc.)
 */
function scanProjetsGitActivity(): void {
	if (!fs.existsSync(PROJETS_ROOT)) return;
	try {
		const dirs = fs.readdirSync(PROJETS_ROOT);
		for (const dir of dirs) {
			if (
				dir.startsWith('.') ||
				dir === 'Archive' ||
				dir === 'Briefs Clients' ||
				dir === 'n8n'
			)
				continue;

			const gitIndexPath = path.join(PROJETS_ROOT, dir, '.git', 'index');
			if (fs.existsSync(gitIndexPath)) {
				const st = fs.statSync(gitIndexPath);
				const prev = gitProjectMtimes.get(dir);
				if (prev !== undefined && st.mtimeMs > prev) {
					// Détecte une action Git locale active sur ce projet !
					officeState.applyEvent({
						source: 'manual',
						type: 'WORK_START',
						agentId: 'lead-dev',
						project: dir,
						activityLabel: `Git: activité sur [${dir}]`
					});
				}
				gitProjectMtimes.set(dir, st.mtimeMs);
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

	const existingPaths: string[] = [];
	const hasAntigravity = fs.existsSync(antigravityDir);
	const hasOpencode = fs.existsSync(opencodeDir) || fs.existsSync(opencodeShareDir);
	const hasClaude = fs.existsSync(claudeProjectsDir);

	if (hasAntigravity) existingPaths.push(antigravityDir);
	if (fs.existsSync(opencodeDir)) existingPaths.push(opencodeDir);
	if (fs.existsSync(opencodeShareDir)) existingPaths.push(opencodeShareDir);
	if (hasClaude) existingPaths.push(claudeProjectsDir);
	if (fs.existsSync(PROJETS_ROOT)) existingPaths.push(PROJETS_ROOT);

	officeState.watcherStatus = {
		antigravityActive: hasAntigravity,
		opencodeActive: hasOpencode,
		claudeActive: hasClaude,
		watchedPaths: existingPaths,
		lastFileEventAt: Date.now()
	};

	// Scan initial
	if (hasAntigravity) {
		scanActiveAntigravityTranscripts(antigravityDir, true);
	}
	if (hasClaude) {
		scanClaudeCodeProjects(claudeProjectsDir, true);
	}
	scanProjetsGitActivity();

	// Polling réactif toutes les 1200ms
	if (pollTimer) clearInterval(pollTimer);
	pollTimer = setInterval(() => {
		if (hasAntigravity) {
			scanActiveAntigravityTranscripts(antigravityDir, false);
		}
		if (hasClaude) {
			scanClaudeCodeProjects(claudeProjectsDir, false);
		}
		scanProjetsGitActivity();
	}, 1200);
}
