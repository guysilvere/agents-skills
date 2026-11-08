import type { GridPoint } from '$lib/types/office';

/**
 * Grille 20x13 (320x208 px natifs) reproduisant exactement l'architecture
 * et les proportions de default-layout-1.json de pixel-agents-hq/pixel-agents.
 */
export const MAP_COLS = 20;
export const MAP_ROWS = 13;
export const TILE_SIZE = 16;

export const OFFICE_LOCATIONS = {
	desks: {
		'lead-dev': { x: 5, y: 4 } satisfies GridPoint,
		'ops-quality': { x: 14, y: 4 } satisfies GridPoint,
		integrations: { x: 4, y: 10 } satisfies GridPoint
	},
	internDesks: [
		{ x: 9, y: 8 },
		{ x: 13, y: 8 },
		{ x: 9, y: 10 },
		{ x: 13, y: 10 }
	] satisfies GridPoint[],
	coffeeSpots: [
		{ x: 17, y: 7 },
		{ x: 17, y: 10 },
		{ x: 2, y: 10 }
	] satisfies GridPoint[],
	loungeSpots: [
		{ x: 16, y: 8 },
		{ x: 17, y: 9 },
		{ x: 16, y: 10 }
	] satisfies GridPoint[],
	gymSpots: [
		{ x: 16, y: 10 },
		{ x: 17, y: 10 }
	] satisfies GridPoint[],
	entranceDoor: { x: 10, y: 6 } satisfies GridPoint
} as const;

/**
 * Obstacles correspondant aux cloisons hiérarchiques et aux meubles :
 * - Bureau Direction Orchestrateur en Haut Gauche (porte en col 5, row 6)
 * - Bureau Spécialiste QA en Haut Droite (porte en col 14, row 6)
 * - Bureau Spécialiste Intégrations en Bas Gauche (porte en col 8, row 8)
 * - Îlot central Sous-agents temporaires
 * - Salon Lounge / Mascotte en Bas Droite
 */
const OBSTACLE_RECTS: Array<{ x: number; y: number; w: number; h: number }> = [
	// Murs extérieurs
	{ x: 0, y: 0, w: 20, h: 2 },
	{ x: 0, y: 12, w: 20, h: 1 },
	{ x: 0, y: 0, w: 1, h: 13 },
	{ x: 19, y: 0, w: 1, h: 13 },

	// Mur vertical central haut (col 10, rows 0..5) séparant Direction et QA
	{ x: 10, y: 0, w: 1, h: 6 },

	// Cloison Sud Bureau Direction (row 6), porte ouverte en col 5
	{ x: 1, y: 6, w: 4, h: 1 },
	{ x: 6, y: 6, w: 4, h: 1 },

	// Cloison Sud Bureau QA (row 6), porte ouverte en col 14
	{ x: 11, y: 6, w: 3, h: 1 },
	{ x: 15, y: 6, w: 4, h: 1 },

	// Cloison Est Bureau Intégrations (col 8, rows 7..11), porte ouverte en row 8
	{ x: 8, y: 7, w: 1, h: 1 },
	{ x: 8, y: 9, w: 1, h: 3 },

	// Démarcation Salon Lounge (col 15, rows 8..11), passage ouvert en row 7
	{ x: 15, y: 8, w: 1, h: 4 },

	// Mobilier Bureau Direction (lead-dev) : Grand bureau en cols 4..5, rows 2..3
	{ x: 4, y: 2, w: 2, h: 2 },
	// Réfrigérateur & Desserte Machine à Café en cols 1..2, rows 2..3
	{ x: 1, y: 2, w: 2, h: 2 },
	// Canapé de Direction en col 8, rows 3..4
	{ x: 8, y: 3, w: 1, h: 2 },

	// Mobilier Bureau QA (ops-quality) : Bureau en cols 13..14, rows 2..3
	{ x: 13, y: 2, w: 3, h: 2 },
	// Rack Serveur Coolify / Infra en cols 17..18, rows 2..3
	{ x: 17, y: 2, w: 2, h: 2 },

	// Mobilier Bureau Intégrations : Bureau en cols 3..4, rows 8..9
	{ x: 3, y: 8, w: 2, h: 2 },
	// Rack serveur / meuble d'angle col 1..2, row 10..11
	{ x: 1, y: 10, w: 2, h: 2 },

	// Mobilier Îlot Sous-agents temporaires : Grande table cols 10..12, rows 8..10
	{ x: 10, y: 8, w: 3, h: 3 },

	// Mobilier Salon Lounge : Table basse
	{ x: 17, y: 8, w: 1, h: 1 }
];

export function isTileWalkable(x: number, y: number): boolean {
	if (x < 1 || x >= MAP_COLS - 1 || y < 2 || y >= MAP_ROWS - 1) {
		return false;
	}
	for (const rect of OBSTACLE_RECTS) {
		if (x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h) {
			return false;
		}
	}
	return true;
}

interface AStarNode {
	x: number;
	y: number;
	g: number;
	h: number;
	f: number;
	parent: AStarNode | null;
}

export function findPixelPath(start: GridPoint, goal: GridPoint): GridPoint[] {
	const startX = Math.round(start.x);
	const startY = Math.round(start.y);
	const goalX = Math.round(goal.x);
	const goalY = Math.round(goal.y);

	if (startX === goalX && startY === goalY) return [];

	const openList: AStarNode[] = [];
	const closedSet = new Set<string>();

	const heuristic = (ax: number, ay: number) => Math.abs(ax - goalX) + Math.abs(ay - goalY);

	openList.push({
		x: startX,
		y: startY,
		g: 0,
		h: heuristic(startX, startY),
		f: heuristic(startX, startY),
		parent: null
	});

	const directions = [
		{ dx: 0, dy: -1 },
		{ dx: 1, dy: 0 },
		{ dx: 0, dy: 1 },
		{ dx: -1, dy: 0 }
	];

	let iterations = 0;
	while (openList.length > 0 && iterations < 500) {
		iterations++;
		openList.sort((a, b) => a.f - b.f);
		const current = openList.shift()!;
		const key = `${current.x},${current.y}`;

		if (current.x === goalX && current.y === goalY) {
			const path: GridPoint[] = [];
			let curr: AStarNode | null = current;
			while (curr && !(curr.x === startX && curr.y === startY)) {
				path.unshift({ x: curr.x, y: curr.y });
				curr = curr.parent;
			}
			return path;
		}

		closedSet.add(key);

		for (const dir of directions) {
			const nx = current.x + dir.dx;
			const ny = current.y + dir.dy;
			const nKey = `${nx},${ny}`;

			if (closedSet.has(nKey)) continue;
			if (!(nx === goalX && ny === goalY) && !isTileWalkable(nx, ny)) continue;

			const gScore = current.g + 1;
			const existing = openList.find((node) => node.x === nx && node.y === ny);

			if (!existing) {
				const hScore = heuristic(nx, ny);
				openList.push({
					x: nx,
					y: ny,
					g: gScore,
					h: hScore,
					f: gScore + hScore,
					parent: current
				});
			} else if (gScore < existing.g) {
				existing.g = gScore;
				existing.f = gScore + existing.h;
				existing.parent = current;
			}
		}
	}

	return [{ x: goalX, y: goalY }];
}
