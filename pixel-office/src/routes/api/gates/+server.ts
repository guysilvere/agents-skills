import { json, type RequestHandler } from '@sveltejs/kit';
import {
	createPendingGate,
	listPendingGates,
	resolveAllPendingGates,
	resolveGate
} from '$lib/server/gate-bridge';

export const GET: RequestHandler = async () => {
	const gates = listPendingGates();
	return json({ gates });
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (body.create) {
			const newGate = createPendingGate({
				project: body.project || 'agents-skills',
				agentId: body.agentId || 'lead-dev',
				agentName: body.agentName,
				title: body.title || 'Validation requise',
				message: body.message || 'Jalon STOP en attente',
				sourceTool: body.sourceTool || 'manual'
			});
			return json({ success: true, gate: newGate, gates: listPendingGates() });
		}

		const action = body.action === 'reject' ? 'reject' : 'approve';

		if (body.all) {
			const count = resolveAllPendingGates(action);
			return json({ success: true, resolvedCount: count, gates: listPendingGates() });
		}

		if (body.gateId) {
			const success = resolveGate(body.gateId, action);
			return json({ success, gates: listPendingGates() });
		}

		return json({ error: 'gateId ou all requis' }, { status: 400 });
	} catch (err) {
		console.error('[API Gates] Erreur POST:', err);
		return json({ error: 'Erreur traitement gate' }, { status: 500 });
	}
};
