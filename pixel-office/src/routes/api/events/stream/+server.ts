import { ensureActivityWatcher } from '$lib/server/activity-watcher';
import { officeState } from '$lib/server/office-state';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	ensureActivityWatcher();

	let unsubscribe: (() => void) | null = null;
	let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			const sendSnapshot = (data: unknown) => {
				try {
					controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
				} catch {
					// Flux fermé côté navigateur
				}
			};

			unsubscribe = officeState.subscribe((snapshot) => {
				sendSnapshot(snapshot);
			});

			keepAliveInterval = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(`: keepalive\n\n`));
				} catch {
					// Ignore
				}
			}, 15_000);
		},
		cancel() {
			if (unsubscribe) unsubscribe();
			if (keepAliveInterval) clearInterval(keepAliveInterval);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive'
		}
	});
};
