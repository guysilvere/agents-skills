import { json } from '@sveltejs/kit';
import { ensureActivityWatcher } from '$lib/server/activity-watcher';
import { officeState } from '$lib/server/office-state';
import { IncomingEventSchema } from '$lib/types/office';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	ensureActivityWatcher();
	return json(officeState.getSnapshot());
};

export const POST: RequestHandler = async ({ request }) => {
	ensureActivityWatcher();
	try {
		const rawBody = await request.json();
		const parsed = IncomingEventSchema.safeParse(rawBody);
		if (!parsed.success) {
			return json(
				{ error: 'Payload invalide', details: parsed.error.flatten() },
				{ status: 400 }
			);
		}
		const snapshot = officeState.applyEvent(parsed.data);
		return json({ ok: true, snapshot });
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Erreur serveur' },
			{ status: 500 }
		);
	}
};
