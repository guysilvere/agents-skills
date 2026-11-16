#!/usr/bin/env node
/**
 * Script CLI local pour pousser un événement vers Pixel Office v0.2 depuis un hook,
 * un workflow ou un terminal.
 *
 * Exemples :
 *   node scripts/emit-event.mjs --type=WORK_START --agent=lead-dev --project=lodgi --activity="Editing +page.svelte" --skills=pwa-cadrage,shared-eco-tokens
 *   node scripts/emit-event.mjs --type=WAITING_HUMAN --agent=lead-dev --project=lodgi --message="STOP: Valider le schéma DB"
 *   node scripts/emit-event.mjs --type=CALL_AGENT --agent=lead-dev --target=ops-quality --project=lodgi
 *   node scripts/emit-event.mjs --type=SPAWN_SUBAGENT --subagent=qa-bot --role="Audit Lighthouse" --project=lodgi
 */

const args = Object.fromEntries(
	process.argv.slice(2).map((arg) => {
		const [k, v] = arg.replace(/^--/, '').split('=');
		return [k, v ?? 'true'];
	})
);

const port = process.env.PORT || '5173';
const url = `http://127.0.0.1:${port}/api/events`;

const payload = {
	source: args.source || 'manual',
	type: args.type || 'WORK_START',
	agentId: args.agent || 'lead-dev',
	targetAgentId: args.target,
	project: args.project,
	activityLabel: args.activity,
	contextRatio: args.context ? Number(args.context) : undefined,
	skills: args.skills ? args.skills.split(',').map((s) => s.trim()) : undefined,
	subagentName: args.subagent,
	subagentRole: args.role,
	message: args.message
};

try {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	const data = await res.json();
	if (!res.ok) {
		console.error('Erreur Pixel Office:', data);
		process.exit(1);
	}
	console.log(`Événement [${payload.type}] envoyé à Pixel Office (${url}).`);
} catch (err) {
	console.error(`Impossible de joindre Pixel Office sur ${url}:`, err.message);
	process.exit(1);
}
