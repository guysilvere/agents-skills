/**
 * Chargeur d'assets PNG authentiques issus de pixel-agents-hq/pixel-agents
 * (Personnages MetroCity JIK-A-4 112x96, Meubles Pixel Office, GitCat 96x96)
 */

export interface PixelAssetsBundle {
	characters: HTMLImageElement[]; // char_0.png .. char_5.png (112x96 : 7 cols de 16px x 3 rows de 32px)
	gitcat: HTMLImageElement; // 96x96
	furniture: Record<string, HTMLImageElement>;
}

const FURNITURE_PATHS: Record<string, string> = {
	BIN: '/assets/furniture/BIN/BIN.png',
	BOOKSHELF: '/assets/furniture/BOOKSHELF/BOOKSHELF.png',
	CACTUS: '/assets/furniture/CACTUS/CACTUS.png',
	CLOCK: '/assets/furniture/CLOCK/CLOCK.png',
	COFFEE: '/assets/furniture/COFFEE/COFFEE.png',
	COFFEE_TABLE: '/assets/furniture/COFFEE_TABLE/COFFEE_TABLE.png',
	CUSHIONED_BENCH: '/assets/furniture/CUSHIONED_BENCH/CUSHIONED_BENCH.png',
	CUSHIONED_CHAIR_FRONT: '/assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_FRONT.png',
	CUSHIONED_CHAIR_BACK: '/assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK.png',
	CUSHIONED_CHAIR_SIDE: '/assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_SIDE.png',
	DESK_FRONT: '/assets/furniture/DESK/DESK_FRONT.png',
	DESK_SIDE: '/assets/furniture/DESK/DESK_SIDE.png',
	DOUBLE_BOOKSHELF: '/assets/furniture/DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF.png',
	HANGING_PLANT: '/assets/furniture/HANGING_PLANT/HANGING_PLANT.png',
	LARGE_PAINTING: '/assets/furniture/LARGE_PAINTING/LARGE_PAINTING.png',
	LARGE_PLANT: '/assets/furniture/LARGE_PLANT/LARGE_PLANT.png',
	PC_FRONT_OFF: '/assets/furniture/PC/PC_FRONT_OFF.png',
	PC_FRONT_ON_1: '/assets/furniture/PC/PC_FRONT_ON_1.png',
	PC_FRONT_ON_2: '/assets/furniture/PC/PC_FRONT_ON_2.png',
	PC_FRONT_ON_3: '/assets/furniture/PC/PC_FRONT_ON_3.png',
	PC_BACK: '/assets/furniture/PC/PC_BACK.png',
	PC_SIDE: '/assets/furniture/PC/PC_SIDE.png',
	PLANT: '/assets/furniture/PLANT/PLANT.png',
	PLANT_2: '/assets/furniture/PLANT_2/PLANT_2.png',
	POT: '/assets/furniture/POT/POT.png',
	SMALL_PAINTING: '/assets/furniture/SMALL_PAINTING/SMALL_PAINTING.png',
	SMALL_PAINTING_2: '/assets/furniture/SMALL_PAINTING_2/SMALL_PAINTING_2.png',
	SMALL_TABLE_FRONT: '/assets/furniture/SMALL_TABLE/SMALL_TABLE_FRONT.png',
	SMALL_TABLE_SIDE: '/assets/furniture/SMALL_TABLE/SMALL_TABLE_SIDE.png',
	SOFA_FRONT: '/assets/furniture/SOFA/SOFA_FRONT.png',
	SOFA_BACK: '/assets/furniture/SOFA/SOFA_BACK.png',
	SOFA_SIDE: '/assets/furniture/SOFA/SOFA_SIDE.png',
	TABLE_FRONT: '/assets/furniture/TABLE_FRONT/TABLE_FRONT.png',
	WHITEBOARD: '/assets/furniture/WHITEBOARD/WHITEBOARD.png',
	WOODEN_BENCH: '/assets/furniture/WOODEN_BENCH/WOODEN_BENCH.png',
	WOODEN_CHAIR_FRONT: '/assets/furniture/WOODEN_CHAIR/WOODEN_CHAIR_FRONT.png',
	WOODEN_CHAIR_BACK: '/assets/furniture/WOODEN_CHAIR/WOODEN_CHAIR_BACK.png',
	WOODEN_CHAIR_SIDE: '/assets/furniture/WOODEN_CHAIR/WOODEN_CHAIR_SIDE.png'
};

let cachedBundle: PixelAssetsBundle | null = null;
let loadingPromise: Promise<PixelAssetsBundle> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = (err) => reject(err);
		img.src = src;
	});
}

export async function loadPixelAssets(): Promise<PixelAssetsBundle> {
	if (cachedBundle) return cachedBundle;
	if (loadingPromise) return loadingPromise;

	loadingPromise = (async () => {
		const charPromises = [0, 1, 2, 3, 4, 5].map((idx) =>
			loadImage(`/assets/characters/char_${idx}.png`)
		);
		const gitcatPromise = loadImage('/assets/pets/gitcat/pet.png');

		const furnitureEntries = await Promise.all(
			Object.entries(FURNITURE_PATHS).map(async ([key, path]) => {
				const img = await loadImage(path);
				return [key, img] as const;
			})
		);

		const [characters, gitcat] = await Promise.all([
			Promise.all(charPromises),
			gitcatPromise
		]);

		cachedBundle = {
			characters,
			gitcat,
			furniture: Object.fromEntries(furnitureEntries)
		};
		return cachedBundle;
	})();

	return loadingPromise;
}
