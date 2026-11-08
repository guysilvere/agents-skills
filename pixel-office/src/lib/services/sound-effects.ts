let soundEnabled = true;
let audioCtx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
	return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
	soundEnabled = enabled;
	if (enabled) {
		unlockAudio();
	}
}

export function unlockAudio(): void {
	if (typeof window === 'undefined') return;
	try {
		if (!audioCtx) {
			audioCtx = new AudioContext();
		}
		if (audioCtx.state === 'suspended') {
			audioCtx.resume().catch(() => {});
		}
	} catch {
		// Ignore si WebAudio indisponible
	}
}

function playTone(
	ctx: AudioContext,
	freqHz: number,
	startOffsetSec: number,
	durationSec = 0.14,
	volume = 0.12,
	type: OscillatorType = 'sine'
): void {
	const t = ctx.currentTime + startOffsetSec;
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = type;
	osc.frequency.setValueAtTime(freqHz, t);

	gain.gain.setValueAtTime(volume, t);
	gain.gain.exponentialRampToValueAtTime(0.001, t + durationSec);

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.start(t);
	osc.stop(t + durationSec);
}

/**
 * Chime ascendant E5 -> B5 quand un agent termine un tour (inspiré de pixel-agents)
 */
export async function playDoneChime(): Promise<void> {
	if (!soundEnabled || typeof window === 'undefined') return;
	try {
		unlockAudio();
		if (!audioCtx) return;
		playTone(audioCtx, 659.25, 0, 0.14, 0.12, 'sine'); // E5
		playTone(audioCtx, 987.77, 0.11, 0.18, 0.12, 'sine'); // B5
	} catch {
		// Ignore
	}
}

/**
 * Double note descendante A5 -> E5 quand un agent attend une validation humaine (⛔ STOP / Permission)
 */
export async function playPermissionChime(): Promise<void> {
	if (!soundEnabled || typeof window === 'undefined') return;
	try {
		unlockAudio();
		if (!audioCtx) return;
		playTone(audioCtx, 880.0, 0, 0.15, 0.16, 'triangle'); // A5
		playTone(audioCtx, 659.25, 0.13, 0.2, 0.16, 'triangle'); // E5
	} catch {
		// Ignore
	}
}

/**
 * Sonnerie rétro courte quand un agent appelle un collègue ou fait apparaître un sous-agent
 */
export async function playSubagentSpawnChime(): Promise<void> {
	if (!soundEnabled || typeof window === 'undefined') return;
	try {
		unlockAudio();
		if (!audioCtx) return;
		playTone(audioCtx, 523.25, 0, 0.08, 0.09, 'square'); // C5
		playTone(audioCtx, 659.25, 0.07, 0.08, 0.09, 'square'); // E5
		playTone(audioCtx, 783.99, 0.14, 0.12, 0.09, 'square'); // G5
	} catch {
		// Ignore
	}
}
