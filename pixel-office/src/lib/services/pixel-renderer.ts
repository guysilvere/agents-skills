import { MAP_COLS, MAP_ROWS, TILE_SIZE } from '$lib/services/pathfinding';
import type { PixelAssetsBundle } from '$lib/services/sprite-loader';
import type { OfficeAgent, OfficePet } from '$lib/types/office';

export interface AnimatedAgentView extends OfficeAgent {
	renderX: number;
	renderY: number;
	isMoving: boolean;
}

export interface AnimatedPetView extends OfficePet {
	renderX: number;
	renderY: number;
	isMoving: boolean;
}

function pxRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	color: string
): void {
	ctx.fillStyle = color;
	ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawFlippedImage(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	sx: number,
	sy: number,
	sw: number,
	sh: number,
	dx: number,
	dy: number,
	dw: number,
	dh: number
): void {
	ctx.save();
	ctx.translate(Math.round(dx + dw), Math.round(dy));
	ctx.scale(-1, 1);
	ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
	ctx.restore();
}

interface RenderableEntity {
	zY: number;
	draw: (ctx: CanvasRenderingContext2D) => void;
}

/**
 * Associe chaque agent à un personnage distinct parmi char_0..char_5
 * (Basé sur les 6 personnages JIK-A-4 MetroCity de pixel-agents)
 */
export function getAgentCharIndex(agent: OfficeAgent): number {
	if (agent.customSpriteIndex !== undefined && agent.customSpriteIndex >= 0 && agent.customSpriteIndex <= 5) {
		return agent.customSpriteIndex;
	}
	if (agent.id === 'lead-dev') return 0;
	if (agent.id === 'ops-quality') return 2;
	if (agent.id === 'integrations') return 4;
	let hash = 0;
	for (let i = 0; i < agent.id.length; i++) {
		hash = (hash * 31 + agent.id.charCodeAt(i)) & 0xff;
	}
	const subIndices = [1, 3, 5];
	return subIndices[hash % subIndices.length];
}

/**
 * Rendu fidèle au bureau de référence pixel-agents-hq/pixel-agents (320x208 natifs)
 * restructuré selon la hiérarchie stricte des agents Agence Bulles :
 * - Bureau Direction Orchestrateur (lead-dev) en Haut Gauche (clos)
 * - Bureau Spécialiste QA & Sécurité (ops-quality) en Haut Droite (clos)
 * - Bureau Spécialiste Intégrations & DB (integrations) en Bas Gauche (clos)
 * - Îlot central dédié aux Sous-agents temporaires
 * - Espace Lounge / Café & GitCat en Bas Droite
 */
export function renderPixelOfficeScene(
	ctx: CanvasRenderingContext2D,
	agents: AnimatedAgentView[],
	pet: AnimatedPetView | null,
	selectedAgentId: string | null,
	frameCount: number,
	assets: PixelAssetsBundle | null
): void {
	const width = MAP_COLS * TILE_SIZE;
	const height = MAP_ROWS * TILE_SIZE;

	ctx.imageSmoothingEnabled = false;
	ctx.clearRect(0, 0, width, height);

	// 1. Sols zonés et Murs hiérarchiques avec portes
	drawAuthenticFloorsAndWalls(ctx);

	if (!assets) return;

	// 2. Décorations murales (Bibliothèques, Horloge, Tableaux, Signalétique)
	drawWallDecorations(ctx, assets.furniture);

	// 3. Liste Y-sorted de tous les meubles, personnages et mascottes pour une profondeur 3/4 parfaite
	const entities: RenderableEntity[] = [];

	addOfficeFurnitureEntities(entities, assets.furniture, agents, frameCount);

	if (pet) {
		entities.push({
			zY: (pet.renderY + 1) * TILE_SIZE,
			draw: (c) => drawAuthenticGitCat(c, assets.gitcat, pet, frameCount)
		});
	}

	for (const agent of agents) {
		entities.push({
			zY: (agent.renderY + 1) * TILE_SIZE + 2,
			draw: (c) =>
				drawAuthenticCharacter(
					c,
					assets.characters,
					agent,
					agent.id === selectedAgentId,
					frameCount
				)
		});
	}

	entities.sort((a, b) => a.zY - b.zY);
	for (const item of entities) {
		item.draw(ctx);
	}

	// 4. Faisceaux d'appels téléphoniques entre collègues
	drawPhoneConnectionBeams(ctx, agents, frameCount);
}

function drawAuthenticFloorsAndWalls(ctx: CanvasRenderingContext2D): void {
	const width = MAP_COLS * TILE_SIZE;
	const height = MAP_ROWS * TILE_SIZE;

	// Fond sombre général (Murs d'enceinte bleu-nuit ardoise)
	pxRect(ctx, 0, 0, width, height, '#131A24');

	// Bandeau mural supérieur (rows 0..1 = 32px)
	pxRect(ctx, 16, 4, 9 * 16, 28, '#243042');
	pxRect(ctx, 16, 28, 9 * 16, 4, '#141B26');

	pxRect(ctx, 11 * 16, 4, 8 * 16, 28, '#243042');
	pxRect(ctx, 11 * 16, 28, 8 * 16, 4, '#141B26');

	// ZONE 1 : Bureau Direction Orchestrateur (cols 1..9, rows 2..5)
	// Parquet noble en chêne foncé avec grand tapis pourpre de direction
	for (let r = 2; r <= 5; r++) {
		for (let c = 1; c <= 9; c++) {
			const tx = c * TILE_SIZE;
			const ty = r * TILE_SIZE;
			const baseColor = (r + c) % 2 === 0 ? '#6E4324' : '#643C1F';
			pxRect(ctx, tx, ty, TILE_SIZE, TILE_SIZE, baseColor);
			for (let py = 3; py < 16; py += 4) {
				pxRect(ctx, tx, ty + py, TILE_SIZE, 1, '#4A2A14');
			}
		}
	}
	// Tapis pourpre de direction sous le bureau de l'orchestrateur (cols 3..7, rows 3..5)
	pxRect(ctx, 3 * TILE_SIZE + 4, 3 * TILE_SIZE + 4, 5 * TILE_SIZE - 8, 3 * TILE_SIZE - 8, '#701A40');
	ctx.strokeStyle = '#D81B60';
	ctx.lineWidth = 1;
	ctx.strokeRect(3 * TILE_SIZE + 4, 3 * TILE_SIZE + 4, 5 * TILE_SIZE - 8, 3 * TILE_SIZE - 8);

	// ZONE 2 : Bureau Spécialiste QA & Sécurité (cols 11..18, rows 2..5)
	// Sol ardoise technique / moquette bleu marine
	for (let r = 2; r <= 5; r++) {
		for (let c = 11; c <= 18; c++) {
			const tx = c * TILE_SIZE;
			const ty = r * TILE_SIZE;
			pxRect(ctx, tx, ty, TILE_SIZE, TILE_SIZE, '#2B425C');
			pxRect(ctx, tx, ty, TILE_SIZE, 1, '#213347');
			pxRect(ctx, tx, ty, 1, TILE_SIZE, '#213347');
		}
	}

	// COULOIR CENTRAL / CARREFOUR (row 6, cols 1..18)
	// Marbre sombre de circulation avec bande centrale d'orientation
	for (let c = 1; c <= 18; c++) {
		const tx = c * TILE_SIZE;
		const ty = 6 * TILE_SIZE;
		pxRect(ctx, tx, ty, TILE_SIZE, TILE_SIZE, '#1C2533');
		pxRect(ctx, tx, ty + 7, TILE_SIZE, 2, '#334155');
	}

	// ZONE 3 : Bureau Spécialiste Intégrations & DB (cols 1..7, rows 7..11)
	// Carrelage technique cyan / émeraude foncé
	for (let r = 7; r <= 11; r++) {
		for (let c = 1; c <= 7; c++) {
			const tx = c * TILE_SIZE;
			const ty = r * TILE_SIZE;
			pxRect(ctx, tx, ty, TILE_SIZE, TILE_SIZE, '#133939');
			pxRect(ctx, tx, ty, TILE_SIZE, 1, '#0C2626');
			pxRect(ctx, tx, ty, 1, TILE_SIZE, '#0C2626');
		}
	}

	// ZONE 4 : Îlot Dédié Sous-agents Temporaires (cols 9..14, rows 7..11)
	// Parquet clair atelier d'équipe
	for (let r = 7; r <= 11; r++) {
		for (let c = 9; c <= 14; c++) {
			const tx = c * TILE_SIZE;
			const ty = r * TILE_SIZE;
			const baseColor = (r + c) % 2 === 0 ? '#7C5233' : '#734A2D';
			pxRect(ctx, tx, ty, TILE_SIZE, TILE_SIZE, baseColor);
			for (let py = 3; py < 16; py += 4) {
				pxRect(ctx, tx, ty + py, TILE_SIZE, 1, '#57341C');
			}
		}
	}

	// ZONE 5 : Salon Lounge / Détente & GitCat (cols 15..18, rows 7..11)
	// Carrelage Damier Noir & Blanc Rétro
	for (let r = 7; r <= 11; r++) {
		for (let c = 15; c <= 18; c++) {
			const tx = c * TILE_SIZE;
			const ty = r * TILE_SIZE;
			for (let sy = 0; sy < 2; sy++) {
				for (let sx = 0; sx < 2; sx++) {
					const isLight = (sx + sy) % 2 === 0;
					pxRect(
						ctx,
						tx + sx * 8,
						ty + sy * 8,
						8,
						8,
						isLight ? '#D4D8DD' : '#2A2E37'
					);
				}
			}
		}
	}

	// 5. CLOISONS ET MURS HIÉRARCHIQUES AVEC OUVERTURES DE PORTES (Style 3/4)
	// Mur vertical central haut (col 10, rows 0..5) séparant Direction et QA
	pxRect(ctx, 10 * TILE_SIZE, 0, TILE_SIZE, 6 * TILE_SIZE, '#17202B');
	pxRect(ctx, 10 * TILE_SIZE + 14, 0, 2, 6 * TILE_SIZE, '#2B394E');

	// Cloison Sud Bureau Direction (row 6) : cols 1..4 et cols 6..9 (porte ouverte en col 5)
	pxRect(ctx, 1 * TILE_SIZE, 6 * TILE_SIZE - 3, 4 * TILE_SIZE, 5, '#17202B');
	pxRect(ctx, 1 * TILE_SIZE, 6 * TILE_SIZE + 2, 4 * TILE_SIZE, 2, '#2B394E');

	pxRect(ctx, 6 * TILE_SIZE, 6 * TILE_SIZE - 3, 4 * TILE_SIZE, 5, '#17202B');
	pxRect(ctx, 6 * TILE_SIZE, 6 * TILE_SIZE + 2, 4 * TILE_SIZE, 2, '#2B394E');

	// Encadrement de porte Direction (col 5, row 6)
	pxRect(ctx, 5 * TILE_SIZE - 2, 6 * TILE_SIZE - 4, 3, 8, '#D81B60');
	pxRect(ctx, 6 * TILE_SIZE - 1, 6 * TILE_SIZE - 4, 3, 8, '#D81B60');

	// Cloison Sud Bureau QA (row 6) : cols 11..13 et cols 15..18 (porte ouverte en col 14)
	pxRect(ctx, 11 * TILE_SIZE, 6 * TILE_SIZE - 3, 3 * TILE_SIZE, 5, '#17202B');
	pxRect(ctx, 11 * TILE_SIZE, 6 * TILE_SIZE + 2, 3 * TILE_SIZE, 2, '#2B394E');

	pxRect(ctx, 15 * TILE_SIZE, 6 * TILE_SIZE - 3, 4 * TILE_SIZE, 5, '#17202B');
	pxRect(ctx, 15 * TILE_SIZE, 6 * TILE_SIZE + 2, 4 * TILE_SIZE, 2, '#2B394E');

	// Encadrement de porte QA (col 14, row 6)
	pxRect(ctx, 14 * TILE_SIZE - 2, 6 * TILE_SIZE - 4, 3, 8, '#38BDF8');
	pxRect(ctx, 15 * TILE_SIZE - 1, 6 * TILE_SIZE - 4, 3, 8, '#38BDF8');

	// Cloison Est Bureau Intégrations (col 8, rows 7..11) : porte en row 8
	pxRect(ctx, 8 * TILE_SIZE, 7 * TILE_SIZE, 4, 1 * TILE_SIZE, '#17202B');
	pxRect(ctx, 8 * TILE_SIZE, 9 * TILE_SIZE, 4, 3 * TILE_SIZE, '#17202B');
	// Encadrement porte Intégrations
	pxRect(ctx, 8 * TILE_SIZE, 8 * TILE_SIZE - 2, 4, 2, '#10B981');
	pxRect(ctx, 8 * TILE_SIZE, 9 * TILE_SIZE, 4, 2, '#10B981');

	// Démarcation basse Lounge (col 15, rows 8..11), passage ouvert en row 7
	pxRect(ctx, 15 * TILE_SIZE - 2, 8 * TILE_SIZE, 3, 4 * TILE_SIZE, '#17202B');

	// Cadre intérieur sombre
	ctx.strokeStyle = '#0B0F15';
	ctx.lineWidth = 2;
	ctx.strokeRect(1, 1, width - 2, height - 2);
}

function drawWallDecorations(
	ctx: CanvasRenderingContext2D,
	f: Record<string, HTMLImageElement>
): void {
	// Bureau Direction (Haut Gauche) : Bibliothèques nobles + Horloge + Plante
	if (f.HANGING_PLANT) {
		ctx.drawImage(f.HANGING_PLANT, 1 * TILE_SIZE, 0);
	}
	if (f.DOUBLE_BOOKSHELF) {
		ctx.drawImage(f.DOUBLE_BOOKSHELF, 2 * TILE_SIZE, 0);
	}
	if (f.CLOCK) {
		ctx.drawImage(f.CLOCK, 5 * TILE_SIZE, 0);
	}

	// Bureau QA (Haut Droite) : Tableaux de surveillance + Diplômes
	if (f.SMALL_PAINTING) {
		ctx.drawImage(f.SMALL_PAINTING, 12 * TILE_SIZE, 0);
	}
	if (f.LARGE_PAINTING) {
		ctx.drawImage(f.LARGE_PAINTING, 14 * TILE_SIZE, 0);
	}
	if (f.SMALL_PAINTING_2) {
		ctx.drawImage(f.SMALL_PAINTING_2, 17 * TILE_SIZE, 0);
	}
	if (f.PLANT) {
		ctx.drawImage(f.PLANT, 18 * TILE_SIZE, 1 * TILE_SIZE);
	}

	// Signalétique Pixel Art sur les portes
	ctx.font = "6px 'Press Start 2P', monospace";
	ctx.fillStyle = '#D81B60';
	ctx.fillText('LEAD', 5 * TILE_SIZE - 1, 6 * TILE_SIZE - 6);

	ctx.fillStyle = '#38BDF8';
	ctx.fillText('QA', 14 * TILE_SIZE + 2, 6 * TILE_SIZE - 6);

	ctx.fillStyle = '#10B981';
	ctx.fillText('API', 8 * TILE_SIZE - 10, 7 * TILE_SIZE + 10);
}

function drawExecutiveDualMonitors(
	ctx: CanvasRenderingContext2D,
	deskX: number,
	deskY: number,
	isWorking: boolean,
	frameCount: number
): void {
	// Support double bras articulé en métal sombre (fixé au plateau)
	pxRect(ctx, deskX + 15, deskY - 2, 2, 8, '#334155');
	pxRect(ctx, deskX + 13, deskY + 5, 6, 2, '#1E293B');
	pxRect(ctx, deskX + 7, deskY - 1, 18, 2, '#475569');

	// --- ÉCRAN GAUCHE (Moniteur 1 ultra-plat 16:9, 14x10 px) ---
	const m1X = deskX + 1;
	const m1Y = deskY - 8;
	pxRect(ctx, m1X, m1Y, 14, 10, '#090D16');
	pxRect(ctx, m1X + 1, m1Y + 1, 12, 8, '#1E293B');
	if (isWorking) {
		pxRect(ctx, m1X + 2, m1Y + 2, 10, 6, '#061C19');
		const step = Math.floor(frameCount / 4) % 3;
		pxRect(ctx, m1X + 3, m1Y + 3, 5, 1, '#22C55E');
		pxRect(ctx, m1X + 3, m1Y + 5, step === 0 ? 8 : 5, 1, '#38BDF8');
		pxRect(ctx, m1X + 3, m1Y + 7, step === 1 ? 7 : 6, 1, '#4ADE80');
	} else {
		pxRect(ctx, m1X + 2, m1Y + 2, 10, 6, '#0D1520');
		pxRect(ctx, m1X + 2, m1Y + 2, 1, 6, '#1E293B');
		pxRect(ctx, m1X + 12, m1Y + 9, 1, 1, '#F59E0B');
	}

	// --- ÉCRAN DROIT (Moniteur 2 ultra-plat 16:9, 14x10 px) ---
	const m2X = deskX + 17;
	const m2Y = deskY - 8;
	pxRect(ctx, m2X, m2Y, 14, 10, '#090D16');
	pxRect(ctx, m2X + 1, m2Y + 1, 12, 8, '#1E293B');
	if (isWorking) {
		pxRect(ctx, m2X + 2, m2Y + 2, 10, 6, '#1A0A18');
		const pulse = Math.floor(frameCount / 5) % 2;
		pxRect(ctx, m2X + 3, m2Y + 5, 2, 3, '#D81B60');
		pxRect(ctx, m2X + 6, m2Y + (pulse ? 3 : 4), 2, pulse ? 5 : 4, '#F472B6');
		pxRect(ctx, m2X + 9, m2Y + 4, 2, 4, '#38BDF8');
	} else {
		pxRect(ctx, m2X + 2, m2Y + 2, 10, 6, '#0D1520');
		pxRect(ctx, m2X + 6, m2Y + 4, 3, 3, '#D81B60');
		pxRect(ctx, m2X + 12, m2Y + 9, 1, 1, '#22C55E');
	}

	// Clavier ultra-plat compact & souris ergonomique (zéro gros desktop beige !)
	pxRect(ctx, deskX + 7, deskY + 6, 11, 4, '#0F172A');
	pxRect(ctx, deskX + 8, deskY + 7, 6, 2, '#CBD5E1');
	pxRect(ctx, deskX + 15, deskY + 7, 2, 3, '#475569');
}

function drawExecutiveChair(ctx: CanvasRenderingContext2D, chairX: number, chairY: number): void {
	// 1. Pied étoilé 5 branches chromé avec roulettes
	pxRect(ctx, chairX + 7, chairY + 10, 2, 4, '#64748B');
	pxRect(ctx, chairX + 4, chairY + 13, 8, 2, '#475569');
	pxRect(ctx, chairX + 3, chairY + 14, 2, 2, '#0F172A');
	pxRect(ctx, chairX + 11, chairY + 14, 2, 2, '#0F172A');
	pxRect(ctx, chairX + 7, chairY + 14, 2, 2, '#0F172A');

	// 2. Assise ergonomique en cuir noir
	pxRect(ctx, chairX + 3, chairY + 6, 10, 5, '#111827');
	pxRect(ctx, chairX + 4, chairY + 7, 8, 3, '#1E293B');
	pxRect(ctx, chairX + 4, chairY + 8, 8, 1, '#334155');

	// 3. Accoudoirs rembourrés
	pxRect(ctx, chairX + 2, chairY + 5, 2, 5, '#1E293B');
	pxRect(ctx, chairX + 12, chairY + 5, 2, 5, '#1E293B');
	pxRect(ctx, chairX + 2, chairY + 4, 2, 1, '#475569');
	pxRect(ctx, chairX + 12, chairY + 4, 2, 1, '#475569');

	// 4. Dossier haut exécutif capitonné avec appui-tête
	pxRect(ctx, chairX + 3, chairY - 1, 10, 6, '#0F172A');
	pxRect(ctx, chairX + 4, chairY, 8, 5, '#1E293B');
	pxRect(ctx, chairX + 5, chairY - 3, 6, 3, '#0F172A');
	pxRect(ctx, chairX + 6, chairY - 2, 4, 2, '#334155');
	pxRect(ctx, chairX + 3, chairY + 2, 1, 3, '#D81B60');
	pxRect(ctx, chairX + 12, chairY + 2, 1, 3, '#D81B60');
}

function drawExecutiveRefrigerator(ctx: CanvasRenderingContext2D, x: number, y: number): void {
	pxRect(ctx, x, y, 14, 24, '#0F172A');
	pxRect(ctx, x + 1, y + 1, 12, 22, '#334155');
	// Porte freezer haute
	pxRect(ctx, x + 2, y + 2, 10, 6, '#475569');
	pxRect(ctx, x + 2, y + 2, 10, 1, '#64748B');
	pxRect(ctx, x + 10, y + 4, 1, 3, '#E2E8F0');
	// Séparation
	pxRect(ctx, x + 1, y + 9, 12, 1, '#1E293B');
	// Porte réfrigérateur basse
	pxRect(ctx, x + 2, y + 10, 10, 11, '#334155');
	pxRect(ctx, x + 2, y + 10, 1, 11, '#64748B');
	pxRect(ctx, x + 10, y + 12, 1, 6, '#E2E8F0');
	// Grille basse & voyant
	pxRect(ctx, x + 3, y + 21, 8, 1, '#0F172A');
	pxRect(ctx, x + 3, y + 3, 1, 1, '#22C55E');
}

function drawEspressoCoffeeMachine(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	frameCount: number
): void {
	// Meuble desserte en bois noble
	pxRect(ctx, x, y + 8, 16, 12, '#4A2A14');
	pxRect(ctx, x + 1, y + 9, 14, 10, '#643C1F');
	pxRect(ctx, x, y + 8, 16, 2, '#7C5233');

	// Machine Expresso Pro (12x12 px)
	const mX = x + 2;
	const mY = y - 2;
	pxRect(ctx, mX, mY, 12, 12, '#0F172A');
	pxRect(ctx, mX + 1, mY + 1, 10, 10, '#D81B60');
	pxRect(ctx, mX + 2, mY + 2, 8, 3, '#E2E8F0');
	pxRect(ctx, mX + 3, mY + 3, 2, 1, '#0F172A');
	pxRect(ctx, mX + 7, mY + 3, 1, 1, '#22C55E');
	pxRect(ctx, mX + 3, mY + 5, 6, 2, '#475569');
	pxRect(ctx, mX + 4, mY + 7, 4, 1, '#334155');
	pxRect(ctx, mX + 2, mY + 9, 8, 2, '#94A3B8');
	pxRect(ctx, mX + 5, mY + 7, 3, 2, '#FFFFFF');

	// Vapeur animée
	const steamPhase = Math.floor(frameCount / 6) % 3;
	if (steamPhase === 0) {
		pxRect(ctx, mX + 6, mY + 5, 1, 1, 'rgba(255,255,255,0.7)');
	} else if (steamPhase === 1) {
		pxRect(ctx, mX + 5, mY + 4, 1, 1, 'rgba(255,255,255,0.5)');
		pxRect(ctx, mX + 6, mY + 3, 1, 1, 'rgba(255,255,255,0.6)');
	} else {
		pxRect(ctx, mX + 6, mY + 3, 1, 1, 'rgba(255,255,255,0.4)');
		pxRect(ctx, mX + 7, mY + 2, 1, 1, 'rgba(255,255,255,0.5)');
	}
}

function addOfficeFurnitureEntities(
	entities: RenderableEntity[],
	f: Record<string, HTMLImageElement>,
	agents: AnimatedAgentView[],
	frameCount: number
): void {
	const leadWorking = agents.find((a) => a.id === 'lead-dev')?.state === 'WORKING';
	const qaWorking = agents.find((a) => a.id === 'ops-quality')?.state === 'WORKING';
	const apiWorking = agents.find((a) => a.id === 'integrations')?.state === 'WORKING';
	const onSprites = [f.PC_FRONT_ON_1, f.PC_FRONT_ON_2, f.PC_FRONT_ON_3];
	const activePcSprite = onSprites[Math.floor(frameCount / 3) % onSprites.length] || f.PC_FRONT_ON_1;

	// 1. Bureau Direction Orchestrateur (lead-dev) en Haut Gauche (cols 4..5, rows 2..3)
	// Bureau + Double écran moderne ultra-plat (sans desktop)
	entities.push({
		zY: 4 * TILE_SIZE,
		draw: (ctx) => {
			ctx.drawImage(f.DESK_FRONT, 4 * TILE_SIZE, 2 * TILE_SIZE);
			drawExecutiveDualMonitors(
				ctx,
				4 * TILE_SIZE,
				2 * TILE_SIZE,
				leadWorking,
				frameCount
			);
		}
	});

	// Vrai Fauteuil Exécutif de Direction en (5, 4) (au lieu du tabouret sans dossier)
	entities.push({
		zY: 4 * TILE_SIZE + 12,
		draw: (ctx) => {
			drawExecutiveChair(ctx, 5 * TILE_SIZE, 4 * TILE_SIZE);
		}
	});

	// Réfrigérateur Minibar de Direction en col 1, row 2..3
	entities.push({
		zY: 3 * TILE_SIZE + 8,
		draw: (ctx) => {
			drawExecutiveRefrigerator(ctx, 1 * TILE_SIZE, 2 * TILE_SIZE);
		}
	});

	// Desserte & Machine à Café Expresso Pro en col 2, row 2..3
	entities.push({
		zY: 3 * TILE_SIZE + 8,
		draw: (ctx) => {
			drawEspressoCoffeeMachine(ctx, 2 * TILE_SIZE, 2 * TILE_SIZE, frameCount);
		}
	});

	// Canapé de Direction en col 8, rows 3..4
	entities.push({
		zY: 4 * TILE_SIZE + 8,
		draw: (ctx) => {
			if (f.SOFA_SIDE) {
				ctx.drawImage(f.SOFA_SIDE, 8 * TILE_SIZE, 3 * TILE_SIZE);
				// Coussin pourpre d'ornement exécutif
				pxRect(ctx, 8 * TILE_SIZE + 4, 3 * TILE_SIZE + 10, 8, 8, '#701A40');
				pxRect(ctx, 8 * TILE_SIZE + 5, 3 * TILE_SIZE + 11, 6, 6, '#D81B60');
			}
		}
	});

	// Plante de direction en col 9, row 2
	entities.push({
		zY: 3 * TILE_SIZE,
		draw: (ctx) => {
			ctx.drawImage(f.PLANT_2, 9 * TILE_SIZE - 4, 2 * TILE_SIZE);
		}
	});

	// 2. Bureau Spécialiste QA & Sécurité (ops-quality) en Haut Droite (cols 13..14, rows 2..3)
	entities.push({
		zY: 4 * TILE_SIZE,
		draw: (ctx) => {
			ctx.drawImage(f.DESK_FRONT, 13 * TILE_SIZE, 2 * TILE_SIZE);
			ctx.drawImage(
				qaWorking ? activePcSprite : f.PC_FRONT_OFF,
				14 * TILE_SIZE,
				1 * TILE_SIZE + 6
			);
		}
	});
	// Siège QA en (14, 4)
	entities.push({
		zY: 4 * TILE_SIZE + 12,
		draw: (ctx) => {
			ctx.drawImage(f.CUSHIONED_BENCH, 14 * TILE_SIZE, 4 * TILE_SIZE + 2);
		}
	});
	// Plante bureau QA en col 11, row 2
	entities.push({
		zY: 3 * TILE_SIZE,
		draw: (ctx) => {
			ctx.drawImage(f.PLANT_2, 11 * TILE_SIZE, 2 * TILE_SIZE);
		}
	});

	// 3. Bureau Spécialiste Intégrations & DB (integrations) en Bas Gauche (cols 3..4, rows 8..9)
	entities.push({
		zY: 10 * TILE_SIZE,
		draw: (ctx) => {
			ctx.drawImage(f.DESK_FRONT, 3 * TILE_SIZE, 8 * TILE_SIZE);
			ctx.drawImage(
				apiWorking ? activePcSprite : f.PC_FRONT_OFF,
				4 * TILE_SIZE,
				7 * TILE_SIZE + 6
			);
		}
	});
	// Siège d'ingénieur API en (4, 10)
	entities.push({
		zY: 10 * TILE_SIZE + 12,
		draw: (ctx) => {
			ctx.drawImage(f.WOODEN_CHAIR_SIDE, 4 * TILE_SIZE, 10 * TILE_SIZE);
		}
	});
	// Rack serveur et café d'appoint en col 1..2, rows 9..11
	entities.push({
		zY: 11 * TILE_SIZE,
		draw: (ctx) => {
			ctx.drawImage(f.SMALL_TABLE_SIDE, 1 * TILE_SIZE, 9 * TILE_SIZE);
			ctx.drawImage(f.COFFEE, 1 * TILE_SIZE, 9 * TILE_SIZE + 6);
			ctx.drawImage(f.BIN, 1 * TILE_SIZE, 11 * TILE_SIZE);
		}
	});

	// 4. Îlot Dédié Sous-agents Temporaires (cols 10..12, rows 8..9)
	entities.push({
		zY: 10 * TILE_SIZE,
		draw: (ctx) => {
			ctx.drawImage(f.TABLE_FRONT, 10 * TILE_SIZE, 8 * TILE_SIZE);
			// 4 PC latéraux pour les sous-agents
			ctx.drawImage(f.PC_SIDE, 10 * TILE_SIZE, 7 * TILE_SIZE + 4);
			ctx.drawImage(f.PC_SIDE, 10 * TILE_SIZE, 9 * TILE_SIZE + 4);
			drawFlippedImage(
				ctx,
				f.PC_SIDE,
				0,
				0,
				16,
				32,
				12 * TILE_SIZE,
				7 * TILE_SIZE + 4,
				16,
				32
			);
			drawFlippedImage(
				ctx,
				f.PC_SIDE,
				0,
				0,
				16,
				32,
				12 * TILE_SIZE,
				9 * TILE_SIZE + 4,
				16,
				32
			);
		}
	});
	// 4 Chaises d'équipe autour de l'îlot
	for (const row of [8, 10]) {
		entities.push({
			zY: (row + 1) * TILE_SIZE,
			draw: (ctx) => {
				ctx.drawImage(f.WOODEN_CHAIR_SIDE, 9 * TILE_SIZE, row * TILE_SIZE);
				drawFlippedImage(
					ctx,
					f.WOODEN_CHAIR_SIDE,
					0,
					0,
					16,
					32,
					13 * TILE_SIZE,
					row * TILE_SIZE,
					16,
					32
				);
			}
		});
	}

	// 5. Salon Lounge, Café & Mascotte en Bas Droite (cols 16..17, rows 8..9)
	entities.push({
		zY: 8 * TILE_SIZE,
		draw: (ctx) => {
			ctx.drawImage(f.SOFA_FRONT, 16 * TILE_SIZE, 7 * TILE_SIZE);
		}
	});
	entities.push({
		zY: 9 * TILE_SIZE + 8,
		draw: (ctx) => {
			ctx.drawImage(f.COFFEE_TABLE, 16 * TILE_SIZE, 8 * TILE_SIZE + 4);
			ctx.drawImage(f.COFFEE, 16 * TILE_SIZE + 4, 8 * TILE_SIZE + 6);
			drawFlippedImage(
				ctx,
				f.SOFA_SIDE,
				0,
				0,
				16,
				32,
				17 * TILE_SIZE + 8,
				8 * TILE_SIZE,
				16,
				32
			);
		}
	});
	entities.push({
		zY: 10 * TILE_SIZE + 8,
		draw: (ctx) => {
			ctx.drawImage(f.SOFA_BACK, 16 * TILE_SIZE, 9 * TILE_SIZE + 8);
		}
	});
	// Fontaine à eau / meuble d'angle en col 18, row 10
	entities.push({
		zY: 12 * TILE_SIZE,
		draw: (ctx) => {
			ctx.drawImage(f.SMALL_TABLE_SIDE, 18 * TILE_SIZE - 4, 10 * TILE_SIZE);
		}
	});
}

/**
 * Dessine un personnage authentique à partir de sa spritesheet PNG 112x96 (7 cols x 3 rows de 16x32)
 * Row 0 = DOWN, Row 1 = UP, Row 2 = RIGHT (et LEFT par symétrie horizontale)
 * Cols 0..2 = Marche, Cols 3..4 = Frappe au clavier (Typing), Cols 5..6 = Lecture (Reading)
 */
function drawAuthenticCharacter(
	ctx: CanvasRenderingContext2D,
	charSheets: HTMLImageElement[],
	agent: AnimatedAgentView,
	isSelected: boolean,
	frameCount: number
): void {
	const charIdx = getAgentCharIndex(agent);
	const sheet = charSheets[charIdx % charSheets.length];
	if (!sheet) return;

	// Détermination de l'orientation (ligne de la spritesheet) et de la frame (colonne)
	let row = 0; // 0: DOWN, 1: UP, 2: RIGHT
	let flipLeft = false;

	if (agent.isMoving) {
		if (agent.direction === 'up') row = 1;
		else if (agent.direction === 'right') row = 2;
		else if (agent.direction === 'left') {
			row = 2;
			flipLeft = true;
		} else row = 0;
	} else {
		// Orientation naturelle selon le poste hiérarchique
		if (agent.id === 'lead-dev' || agent.id === 'ops-quality' || agent.id === 'integrations') {
			row = 1; // Assis face aux bureaux (de dos)
		} else if (agent.position.x <= 10 && agent.position.y >= 7) {
			row = 2; // Assis à gauche de la table d'îlot -> regarde à droite
		} else if (agent.position.x >= 12 && agent.position.y >= 7 && agent.position.x <= 14) {
			row = 2;
			flipLeft = true; // Assis à droite de la table d'îlot -> regarde à gauche
		} else if (agent.state === 'LOUNGE') {
			row = 2;
			flipLeft = agent.position.x >= 16;
		} else {
			row = 0;
		}
	}

	let col = 1; // Frame neutre debout par défaut
	if (agent.isMoving) {
		const walkSeq = [0, 1, 2, 1];
		col = walkSeq[Math.floor(frameCount / 2) % walkSeq.length];
	} else if (agent.state === 'WORKING' || agent.state === 'CALLING') {
		col = 3 + (Math.floor(frameCount / 3) % 2); // Frames 3 et 4 : Typing
	} else if (agent.state === 'LOUNGE' || agent.state === 'COFFEE') {
		col = 5 + (Math.floor(frameCount / 6) % 2); // Frames 5 et 6 : Reading / Pause
	}

	const sittingOffsetY =
		!agent.isMoving && (agent.state === 'WORKING' || agent.state === 'LOUNGE') ? 4 : 0;
	const drawX = Math.round(agent.renderX * TILE_SIZE);
	const drawY = Math.round(agent.renderY * TILE_SIZE - 16 + sittingOffsetY);

	// Halo pixelisé blanc si l'agent est sélectionné
	if (isSelected) {
		ctx.save();
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 1;
		ctx.strokeRect(drawX - 1, drawY + 2, 18, 30);
		ctx.restore();
	}

	if (flipLeft) {
		drawFlippedImage(ctx, sheet, col * 16, row * 32, 16, 32, drawX, drawY, 16, 32);
	} else {
		ctx.drawImage(sheet, col * 16, row * 32, 16, 32, drawX, drawY, 16, 32);
	}

	// Accessoires personnalisés superposés en pixel art
	if (agent.customAccessory === 'badge' || agent.id === 'lead-dev') {
		// Étoile / Badge doré de leadership sur la poitrine
		pxRect(ctx, drawX + 6, drawY + 16, 2, 2, '#F59E0B');
	}
	if (agent.customAccessory === 'glasses') {
		// Lunettes technologiques bleues
		pxRect(ctx, drawX + 4, drawY + 8, 8, 2, '#0F172A');
		pxRect(ctx, drawX + 5, drawY + 8, 2, 2, '#38BDF8');
		pxRect(ctx, drawX + 9, drawY + 8, 2, 2, '#38BDF8');
	} else if (agent.customAccessory === 'headset') {
		// Casque audio développeur
		pxRect(ctx, drawX + 3, drawY + 4, 10, 2, '#E11D48');
		pxRect(ctx, drawX + 2, drawY + 6, 2, 4, '#BE123C');
		pxRect(ctx, drawX + 12, drawY + 6, 2, 4, '#BE123C');
	} else if (agent.customAccessory === 'coffee') {
		// Tasse à café dans la main
		pxRect(ctx, drawX + 13, drawY + 18, 3, 4, '#FFFFFF');
		pxRect(ctx, drawX + 14, drawY + 19, 1, 2, '#78350F');
	}

	// Effet Matrix Digital Rain au spawn / despawn
	if (agent.matrixEffect) {
		for (let c = 0; c < 8; c++) {
			const dropY = drawY + 4 + ((frameCount * 3 + c * 5) % 24);
			pxRect(ctx, drawX + c * 2, dropY, 2, 2, '#CCFFCC');
			pxRect(ctx, drawX + c * 2, dropY - 2, 2, 2, 'rgba(0, 255, 65, 0.85)');
		}
	}
}

/**
 * Dessine la mascotte GitCat depuis sa spritesheet officielle 96x96
 */
function drawAuthenticGitCat(
	ctx: CanvasRenderingContext2D,
	gitcatSheet: HTMLImageElement,
	pet: AnimatedPetView,
	frameCount: number
): void {
	const drawX = Math.round(pet.renderX * TILE_SIZE);
	const drawY = Math.round(pet.renderY * TILE_SIZE - 14);

	const col = pet.isMoving
		? Math.floor(frameCount / 2) % 3
		: 3 + (Math.floor(frameCount / 5) % 3);
	ctx.drawImage(gitcatSheet, col * 16, 0, 16, 32, drawX, drawY, 16, 32);

	if (pet.state === 'HEART' || pet.heartUntil > Date.now()) {
		const hy = drawY + 2 - (frameCount % 3);
		pxRect(ctx, drawX + 5, hy, 2, 2, '#FB7185');
		pxRect(ctx, drawX + 8, hy, 2, 2, '#FB7185');
		pxRect(ctx, drawX + 4, hy + 1, 7, 2, '#E11D48');
		pxRect(ctx, drawX + 5, hy + 3, 5, 1, '#E11D48');
		pxRect(ctx, drawX + 6, hy + 4, 3, 1, '#E11D48');
	}
}

function drawPhoneConnectionBeams(
	ctx: CanvasRenderingContext2D,
	agents: AnimatedAgentView[],
	frameCount: number
): void {
	for (const agent of agents) {
		if (agent.state === 'CALLING' && agent.targetAgentId) {
			const target = agents.find((a) => a.id === agent.targetAgentId);
			if (!target) continue;

			const x1 = agent.renderX * TILE_SIZE + 8;
			const y1 = agent.renderY * TILE_SIZE;
			const x2 = target.renderX * TILE_SIZE + 8;
			const y2 = target.renderY * TILE_SIZE;

			ctx.save();
			ctx.strokeStyle = frameCount % 4 < 2 ? '#C2E8E8' : '#D81B60';
			ctx.lineWidth = 1.5;
			ctx.setLineDash([3, 3]);
			ctx.lineDashOffset = -(frameCount * 2);
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
			ctx.restore();
		}
	}
}
