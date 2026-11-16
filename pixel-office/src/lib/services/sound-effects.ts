/**
 * Module Audio & Foley 8-bit WebAudio procédural pour Pixel Office
 * - Chimes d'état agents (done, permission, spawn, call)
 * - Bande-son Lo-Fi Chiptune générative procédurale (0 Ko d'asset externe, tempo 72 BPM)
 * - Foley bureau : clics de clavier mécanique, extraction de café expresso
 * - Bruitages mascotte GitCat : miaulement, ronronnement, rebond de pelote
 */

let soundEnabled = true;
let audioCtx: AudioContext | null = null;

// État BGM Lo-Fi Chiptune
let bgmPlaying = false;
let bgmVolume = 0.22;
let bgmTimer: ReturnType<typeof setInterval> | null = null;
let bgmMasterGain: GainNode | null = null;
let bgmStep = 0;

export function isSoundEnabled(): boolean {
	return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
	soundEnabled = enabled;
	if (enabled) {
		unlockAudio();
	} else if (bgmPlaying) {
		stopBgm();
	}
}

export function unlockAudio(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	try {
		if (!audioCtx) {
			const AudioContextClass =
				window.AudioContext ||
				// @ts-expect-error fallback Safari historique
				window.webkitAudioContext;
			audioCtx = new AudioContextClass();
		}
		if (audioCtx && audioCtx.state === 'suspended') {
			audioCtx.resume().catch(() => {});
		}
		return audioCtx;
	} catch {
		return null;
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
	gain.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.start(t);
	osc.stop(t + durationSec);
}

// ========================================================
// 1. CHIMES D'ÉVÉNEMENTS AGENTS
// ========================================================

/**
 * Chime ascendant E5 -> B5 quand un agent termine un tour
 */
export async function playDoneChime(): Promise<void> {
	if (!soundEnabled) return;
	const ctx = unlockAudio();
	if (!ctx) return;
	playTone(ctx, 659.25, 0, 0.14, 0.12, 'sine'); // E5
	playTone(ctx, 987.77, 0.11, 0.18, 0.12, 'sine'); // B5
}

/**
 * Double note descendante A5 -> E5 quand un agent attend une validation humaine (⛔ STOP)
 */
export async function playPermissionChime(): Promise<void> {
	if (!soundEnabled) return;
	const ctx = unlockAudio();
	if (!ctx) return;
	playTone(ctx, 880.0, 0, 0.15, 0.16, 'triangle'); // A5
	playTone(ctx, 659.25, 0.13, 0.2, 0.16, 'triangle'); // E5
}

/**
 * Sonnerie rétro arpégée C5 -> E5 -> G5 quand un agent appelle ou fait spawner un sous-agent
 */
export async function playSubagentSpawnChime(): Promise<void> {
	if (!soundEnabled) return;
	const ctx = unlockAudio();
	if (!ctx) return;
	playTone(ctx, 523.25, 0, 0.08, 0.09, 'square'); // C5
	playTone(ctx, 659.25, 0.07, 0.08, 0.09, 'square'); // E5
	playTone(ctx, 783.99, 0.14, 0.12, 0.09, 'square'); // G5
}

// ========================================================
// 2. FOLEY DE BUREAU 8-BIT PROCEDURAL
// ========================================================

/**
 * Clic feutré de touche de clavier mécanique (bruit blanc filtré passe-bande)
 */
export function playKeyboardClick(): void {
	if (!soundEnabled) return;
	const ctx = unlockAudio();
	if (!ctx) return;

	try {
		const bufferSize = ctx.sampleRate * 0.015; // 15ms
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
		}

		const noise = ctx.createBufferSource();
		noise.buffer = buffer;

		const filter = ctx.createBiquadFilter();
		filter.type = 'bandpass';
		filter.frequency.setValueAtTime(2200 + Math.random() * 600, ctx.currentTime);
		filter.Q.setValueAtTime(2.5, ctx.currentTime);

		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.04, ctx.currentTime);

		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);

		noise.start();
	} catch {
		// Ignore
	}
}

/**
 * Son d'extraction de café expresso 8-bit (vapeur + gargouillement)
 */
export function playCoffeeBrew(): void {
	if (!soundEnabled) return;
	const ctx = unlockAudio();
	if (!ctx) return;

	try {
		const t = ctx.currentTime;
		// 1. Souffle de vapeur (bruit blanc filtré passe-bas)
		const duration = 0.55;
		const bufferSize = Math.floor(ctx.sampleRate * duration);
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = Math.random() * 2 - 1;
		}

		const noise = ctx.createBufferSource();
		noise.buffer = buffer;

		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.setValueAtTime(1400, t);
		filter.frequency.exponentialRampToValueAtTime(600, t + duration);

		const noiseGain = ctx.createGain();
		noiseGain.gain.setValueAtTime(0.06, t);
		noiseGain.gain.linearRampToValueAtTime(0.001, t + duration);

		noise.connect(filter);
		filter.connect(noiseGain);
		noiseGain.connect(ctx.destination);

		noise.start(t);

		// 2. Petits bips de coulée / gouttes 8-bit
		playTone(ctx, 330, 0.1, 0.08, 0.05, 'triangle');
		playTone(ctx, 440, 0.22, 0.08, 0.06, 'triangle');
		playTone(ctx, 523.25, 0.36, 0.1, 0.07, 'sine');
	} catch {
		// Ignore
	}
}

// ========================================================
// 3. BRUITAGES GITCAT & PELOTE DE LAINE
// ========================================================

/**
 * Miaulement 8-bit joyeux et mignon montant puis descendant
 */
export function playCatMeow(): void {
	if (!soundEnabled) return;
	const ctx = unlockAudio();
	if (!ctx) return;

	try {
		const t = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = 'triangle';
		// Modulation de hauteur : ~550Hz -> ~920Hz -> ~720Hz
		osc.frequency.setValueAtTime(560, t);
		osc.frequency.linearRampToValueAtTime(940, t + 0.12);
		osc.frequency.exponentialRampToValueAtTime(680, t + 0.32);

		gain.gain.setValueAtTime(0.001, t);
		gain.gain.linearRampToValueAtTime(0.14, t + 0.05);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(t);
		osc.stop(t + 0.36);
	} catch {
		// Ignore
	}
}

/**
 * Ronronnement basse fréquence de GitCat
 */
export function playCatPurr(): void {
	if (!soundEnabled) return;
	const ctx = unlockAudio();
	if (!ctx) return;

	try {
		const t = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		// Vibreur LFO basse fréquence
		osc.type = 'sine';
		osc.frequency.setValueAtTime(75, t);
		osc.frequency.linearRampToValueAtTime(85, t + 0.2);
		osc.frequency.linearRampToValueAtTime(70, t + 0.4);

		gain.gain.setValueAtTime(0.09, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(t);
		osc.stop(t + 0.46);
	} catch {
		// Ignore
	}
}

/**
 * Rebond 8-bit élastique de la pelote de laine
 */
export function playYarnBounce(): void {
	if (!soundEnabled) return;
	const ctx = unlockAudio();
	if (!ctx) return;

	try {
		const t = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(420, t);
		osc.frequency.exponentialRampToValueAtTime(140, t + 0.1);

		gain.gain.setValueAtTime(0.12, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(t);
		osc.stop(t + 0.11);
	} catch {
		// Ignore
	}
}

// ========================================================
// 4. BANDE-SON LO-FI CHIPTUNE PROCÉDURALE (72 BPM)
// ========================================================

/**
 * Accords jazz Lo-Fi relaxants :
 * 0: Cmaj7  (C3, G3, B3, E4)
 * 1: Am7    (A2, E3, G3, C4)
 * 2: Dm7    (D3, A3, C4, F4)
 * 3: G7sus4 (G2, D3, F3, C4)
 */
const CHORD_PROGRESSION = [
	{ bass: 130.81, notes: [196.0, 246.94, 329.63, 392.0] }, // Cmaj7
	{ bass: 110.0, notes: [164.81, 196.0, 261.63, 329.63] }, // Am7
	{ bass: 146.83, notes: [220.0, 261.63, 349.23, 440.0] }, // Dm7
	{ bass: 98.0, notes: [146.83, 174.61, 261.63, 392.0] } // G7sus4
];

export function isBgmPlaying(): boolean {
	return bgmPlaying;
}

export function getBgmVolume(): number {
	return bgmVolume;
}

export function setBgmVolume(volume: number): void {
	bgmVolume = Math.max(0, Math.min(1, volume));
	if (bgmMasterGain && audioCtx) {
		bgmMasterGain.gain.setValueAtTime(bgmVolume * 0.18, audioCtx.currentTime);
	}
}

export function toggleBgm(): boolean {
	if (bgmPlaying) {
		stopBgm();
		return false;
	} else {
		startBgm();
		return true;
	}
}

export function startBgm(): void {
	if (typeof window === 'undefined') return;
	const ctx = unlockAudio();
	if (!ctx) return;

	if (bgmPlaying) return;
	bgmPlaying = true;

	if (!bgmMasterGain) {
		bgmMasterGain = ctx.createGain();
		bgmMasterGain.gain.setValueAtTime(bgmVolume * 0.18, ctx.currentTime);

		// Filtre passe-bas global doux pour une couleur Lo-Fi Game Boy chaleureuse
		const lofiFilter = ctx.createBiquadFilter();
		lofiFilter.type = 'lowpass';
		lofiFilter.frequency.setValueAtTime(1100, ctx.currentTime);
		lofiFilter.Q.setValueAtTime(1.2, ctx.currentTime);

		bgmMasterGain.connect(lofiFilter);
		lofiFilter.connect(ctx.destination);
	}

	const beatMs = Math.round((60 / 72) * 1000 * 0.5); // Double croche à 72 BPM (~416ms)

	bgmTimer = setInterval(() => {
		if (!bgmPlaying || !audioCtx || !bgmMasterGain) return;
		renderBgmStep(audioCtx, bgmMasterGain, bgmStep);
		bgmStep = (bgmStep + 1) % 32; // Cycle de 4 mesures (8 pas par mesure)
	}, beatMs);
}

export function stopBgm(): void {
	bgmPlaying = false;
	if (bgmTimer) {
		clearInterval(bgmTimer);
		bgmTimer = null;
	}
}

function renderBgmStep(ctx: AudioContext, destination: GainNode, step: number): void {
	const measure = Math.floor(step / 8) % CHORD_PROGRESSION.length;
	const stepInMeasure = step % 8;
	const chord = CHORD_PROGRESSION[measure];
	const t = ctx.currentTime;

	// 1. Basse triangulaire Lo-Fi sur le 1er et 5ème temps
	if (stepInMeasure === 0 || stepInMeasure === 4) {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'triangle';
		osc.frequency.setValueAtTime(chord.bass, t);

		const noteDur = 0.38;
		gain.gain.setValueAtTime(0.28, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur);

		osc.connect(gain);
		gain.connect(destination);

		osc.start(t);
		osc.stop(t + noteDur);
	}

	// 2. Arpège 8-bit doux (ondes sine/triangle feutrées)
	if (stepInMeasure % 2 === 0) {
		const noteIdx = (stepInMeasure / 2) % chord.notes.length;
		const freq = chord.notes[noteIdx];

		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(freq, t);

		const dur = 0.32;
		gain.gain.setValueAtTime(0.18, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

		osc.connect(gain);
		gain.connect(destination);

		osc.start(t);
		osc.stop(t + dur);
	}

	// 3. Petit shaker vinyle feutré sur les temps 2 et 6 (Hi-hat Lo-Fi)
	if (stepInMeasure === 2 || stepInMeasure === 6) {
		try {
			const bufSize = Math.floor(ctx.sampleRate * 0.02);
			const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
			const d = buf.getChannelData(0);
			for (let i = 0; i < bufSize; i++) {
				d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
			}
			const noise = ctx.createBufferSource();
			noise.buffer = buf;

			const flt = ctx.createBiquadFilter();
			flt.type = 'highpass';
			flt.frequency.setValueAtTime(3500, t);

			const g = ctx.createGain();
			g.gain.setValueAtTime(0.035, t);

			noise.connect(flt);
			flt.connect(g);
			g.connect(destination);

			noise.start(t);
		} catch {
			// Ignore
		}
	}
}
