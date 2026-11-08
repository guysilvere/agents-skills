<script lang="ts">
	import { onMount } from 'svelte';
	import { findPixelPath, MAP_COLS, MAP_ROWS, TILE_SIZE } from '$lib/services/pathfinding';
	import {
		type AnimatedAgentView,
		type AnimatedPetView,
		getAgentCharIndex,
		renderPixelOfficeScene
	} from '$lib/services/pixel-renderer';
	import {
		getBgmVolume,
		isBgmPlaying,
		isSoundEnabled,
		playCatMeow,
		playCatPurr,
		playCoffeeBrew,
		playDoneChime,
		playKeyboardClick,
		playPermissionChime,
		playSubagentSpawnChime,
		playYarnBounce,
		setBgmVolume,
		setSoundEnabled,
		toggleBgm,
		unlockAudio
	} from '$lib/services/sound-effects';
	import { loadPixelAssets, type PixelAssetsBundle } from '$lib/services/sprite-loader';
	import type {
		GridPoint,
		IncomingOfficeEvent,
		OfficeAgent,
		OfficeSnapshot,
		TimeOfDayMode,
		YarnBallState
	} from '$lib/types/office';

	const NATIVE_WIDTH = MAP_COLS * TILE_SIZE; // 320px
	const NATIVE_HEIGHT = MAP_ROWS * TILE_SIZE; // 208px
	const FPS_INTERVAL = 1000 / 18; // 18 FPS : authentique pixel art + très sobre sur CPU Mac

	let canvasEl: HTMLCanvasElement | undefined = $state();
	let assetsBundle: PixelAssetsBundle | null = $state(null);
	let snapshot: OfficeSnapshot | null = $state(null);
	let animatedAgents: AnimatedAgentView[] = $state([]);
	let animatedPet: AnimatedPetView | null = $state(null);
	let selectedAgentId: string | null = $state('lead-dev');
	let showControlDrawer = $state(false);
	let isFullscreen = $state(false);
	let audioOn = $state(true);
	let currentTime = $state('');
	let lastPlayedLogId = '';

	// Nouveaux états de contrôle de layout (repli & extension)
	let leftSidebarExpanded = $state(false);
	let rightSidebarCollapsed = $state(false);
	let inspectorCollapsed = $state(false);

	function toggleAgentSelection(agentId: string): void {
		selectedAgentId = selectedAgentId === agentId ? null : agentId;
	}

	function handleCanvasClick(e: MouseEvent): void {
		if (!canvasEl) return;
		const rect = canvasEl.getBoundingClientRect();
		const scaleX = NATIVE_WIDTH / rect.width;
		const scaleY = NATIVE_HEIGHT / rect.height;
		const clickX = (e.clientX - rect.left) * scaleX;
		const clickY = (e.clientY - rect.top) * scaleY;
		const clickedTileX = clickX / TILE_SIZE;
		const clickedTileY = clickY / TILE_SIZE;

		// 1. Clic sur un agent ?
		const clickedAgent = animatedAgents.find((a) => {
			const dx = a.renderX + 0.5 - clickedTileX;
			const dy = a.renderY + 0.5 - clickedTileY;
			return Math.sqrt(dx * dx + dy * dy) <= 1.2;
		});

		if (clickedAgent) {
			toggleAgentSelection(clickedAgent.id);
			return;
		}

		// 2. Clic sur GitCat ou la pelote de laine ?
		const petDist = Math.hypot(
			petRenderCoord.x + 0.5 - clickedTileX,
			petRenderCoord.y + 0.5 - clickedTileY
		);
		const yarnDist = Math.hypot(
			yarnBall.x + 0.3 - clickedTileX,
			yarnBall.y + 0.3 - clickedTileY
		);
		if (petDist <= 1.3 || yarnDist <= 1.2) {
			playCatMeow();
			throwYarnBall();
			return;
		}

		// 3. Clic sur le tapis du salon (cols 14.8..19, rows 7..10.5) -> lancer la pelote là où l'utilisateur clique
		if (
			clickedTileX >= 14.8 &&
			clickedTileX <= 19.2 &&
			clickedTileY >= 7.0 &&
			clickedTileY <= 10.5
		) {
			throwYarnBall(clickedTileX, clickedTileY);
			return;
		}

		// 4. Clic sur le Tableau Kanban 8-bit mural (bureau QA : cols 11..13, rows 0..2)
		if (clickedTileX >= 11 && clickedTileX <= 14 && clickedTileY >= 0 && clickedTileY <= 2.2) {
			showKanbanModal = true;
			return;
		}

		// 5. Clic sur le Rack Serveur Coolify / Infra (bureau QA : cols 17..18, rows 2..4)
		if (clickedTileX >= 16.8 && clickedTileX <= 18.8 && clickedTileY >= 2 && clickedTileY <= 4.2) {
			showServerModal = true;
			return;
		}

		// Clic dans le vide -> désélection
		selectedAgentId = null;
	}

	// Modales Phase 2 : Tableau Kanban 8-bit & Rack Serveur Coolify
	let showKanbanModal = $state(false);
	let showServerModal = $state(false);
	let isSimulatingDeploy = $state(false);

	async function triggerDeploySimulation(): Promise<void> {
		isSimulatingDeploy = true;
		playSubagentSpawnChime();
		await triggerEvent({
			type: 'TOOL_USE',
			agentId: 'ops-quality',
			activityLabel: 'Coolify: Build & Deploy Docker Container (Port 3000)',
			project: 'pixel-office'
		});
		setTimeout(() => {
			isSimulatingDeploy = false;
			playDoneChime();
			triggerEvent({
				type: 'TURN_DONE',
				agentId: 'ops-quality',
				project: 'pixel-office',
				message: 'Conteneur déployé sur Coolify avec succès (Proxy Orange actif)'
			});
		}, 5000);
	}

	// Phase 3 : Cycle Jour / Nuit Cyberpunk & Mode Kiosk Ambiant
	let ambientMode: TimeOfDayMode = $state('auto');
	let isKioskMode = $state(false);
	let kioskControlsVisible = $state(true);
	let kioskIdleTimer: ReturnType<typeof setTimeout> | null = null;

	function toggleKioskMode(): void {
		isKioskMode = !isKioskMode;
		kioskControlsVisible = true;
		if (kioskIdleTimer) clearTimeout(kioskIdleTimer);
		if (isKioskMode) {
			resetKioskIdleTimer();
		}
	}

	function resetKioskIdleTimer(): void {
		if (!isKioskMode) return;
		kioskControlsVisible = true;
		if (kioskIdleTimer) clearTimeout(kioskIdleTimer);
		kioskIdleTimer = setTimeout(() => {
			if (isKioskMode) {
				kioskControlsVisible = false;
			}
		}, 3500);
	}

	// Phase 4 : Lo-Fi Chiptune WebAudio & Pelote de laine GitCat
	let isLofiBgmOn = $state(false);
	let bgmVol = $state(0.25);

	let yarnBall: YarnBallState = $state({
		x: 16.5,
		y: 8.5,
		z: 0,
		targetX: 16.5,
		targetY: 8.5,
		isMoving: false
	});

	function toggleLofiMusic(): void {
		unlockAudio();
		isLofiBgmOn = toggleBgm();
	}

	function handleBgmVolumeChange(e: Event): void {
		const target = e.target as HTMLInputElement;
		bgmVol = parseFloat(target.value);
		setBgmVolume(bgmVol);
	}

	function throwYarnBall(targetTileX?: number, targetTileY?: number): void {
		unlockAudio();
		playYarnBounce();
		const destX =
			targetTileX !== undefined
				? Math.max(14.8, Math.min(18.2, targetTileX))
				: 15.2 + Math.random() * 2.4;
		const destY =
			targetTileY !== undefined
				? Math.max(7.2, Math.min(9.8, targetTileY))
				: 7.6 + Math.random() * 2.0;

		yarnBall.targetX = destX;
		yarnBall.targetY = destY;
		yarnBall.isMoving = true;

		// Faire courir GitCat vers la pelote de laine !
		if (snapshot?.pet) {
			const goal = { x: Math.round(destX), y: Math.round(destY) };
			petPath = findPixelPath(
				{ x: Math.round(petRenderCoord.x), y: Math.round(petRenderCoord.y) },
				goal
			);
		}
	}


	// Formulaire de simulation rapide (Option C Hybride)
	let simAgentId = $state('lead-dev');
	let simTargetAgentId = $state('ops-quality');
	let simProject = $state('agents-skills');
	let simSkill = $state('pwa-cadrage');
	let simActivityLabel = $state('Editing src/routes/+page.svelte');
	let simSubagentName = $state('audit-runner');
	let simSubagentRole = $state('Auditeur Lighthouse');

	// Customisation des Agents (Style & Rôles/Objectifs)
	let showCustomizerModal = $state(false);
	let customizerTab: 'style' | 'role' | 'desk' = $state('style');
	let editSpriteIndex = $state(0);
	let editShirtColor = $state('#D81B60');
	let editHairColor = $state('#1A1A1A');
	let editSkinTone = $state('#D49B6A');
	let editAccessory: 'glasses' | 'headset' | 'coffee' | 'badge' | 'none' = $state('none');
	let editDeskDecor: 'bonsai' | 'mug' | 'robot' | 'neon' | 'dual_monitor' | 'none' = $state('dual_monitor');
	let editMoodStatus = $state('');
	let editTitle = $state('');
	let editMission = $state('');
	let editRole: 'lead-dev' | 'ops-quality' | 'integrations' | 'subagent' = $state('lead-dev');
	let editSkills: string[] = $state([]);

	const BULLES_SKILLS = [
		'shared-eco-tokens',
		'pwa-cadrage',
		'pwa-developpement',
		'design-pwa-system',
		'pwa-validation',
		'pwa-deploiement',
		'api-paiements',
		'shared-git-conventions',
		'opencode-admin',
		'shared-graft'
	];

	const PRESET_COLORS = [
		'#D81B60',
		'#38BDF8',
		'#F59E0B',
		'#10B981',
		'#A855F7',
		'#EF4444',
		'#64748B',
		'#F8FAFC'
	];

	const HAIR_COLORS = [
		'#1A1A1A', // Noir ébène
		'#3E2723', // Châtain foncé
		'#78350F', // Brun chaud
		'#D97706', // Roux / Auburn
		'#FBBF24', // Blond doré
		'#0284C7', // Bleu Cyberpunk
		'#D81B60', // Rose fluo
		'#E2E8F0'  // Blanc argenté
	];

	const SKIN_TONES = [
		'#F5CBA7', // Très claire
		'#E59866', // Pêche dorée
		'#D49B6A', // Métisse claire
		'#C68642', // Ambrée
		'#8D5524'  // Ébène foncée
	];

	const MOOD_PRESETS = [
		'Architecte en deep work',
		'Besoin urgent d\'un café',
		'Mode Ninja Débug 100%',
		'Zen & Spécifications alignées',
		'Sprint final vers la release'
	];

	function getHierarchyRoleLabel(ag: OfficeAgent): string {
		if (ag.id === 'lead-dev') return 'ORCHESTRATEUR';
		if (ag.id === 'ops-quality') return 'SPÉCIALISTE QA';
		if (ag.id === 'integrations') return 'SPÉCIALISTE DATA';
		return 'SOUS-AGENT';
	}

	function openCustomizer(agent: OfficeAgent): void {
		selectedAgentId = agent.id;
		editSpriteIndex = agent.customSpriteIndex ?? getAgentCharIndex(agent);
		editShirtColor = agent.palette.shirt;
		editHairColor = agent.palette.hair;
		editSkinTone = agent.palette.skin;
		editAccessory = agent.customAccessory ?? (agent.id === 'lead-dev' ? 'badge' : 'none');
		editDeskDecor = agent.deskDecor ?? 'none';
		editMoodStatus = agent.moodStatus ?? '';
		editTitle = agent.title;
		editMission = agent.customMission ?? '';
		editRole = agent.role;
		editSkills = [...agent.activeSkills];
		showCustomizerModal = true;
	}

	function toggleEditSkill(skill: string): void {
		if (editSkills.includes(skill)) {
			editSkills = editSkills.filter((s) => s !== skill);
		} else {
			editSkills = [...editSkills, skill];
		}
	}

	async function saveCustomizerConfig(): Promise<void> {
		if (!selectedAgent) return;
		await triggerEvent({
			type: 'UPDATE_AGENT_CONFIG',
			agentId: selectedAgent.id,
			config: {
				title: editTitle,
				role: editRole,
				spriteIndex: editSpriteIndex,
				shirtColor: editShirtColor,
				hairColor: editHairColor,
				skinTone: editSkinTone,
				accessory: editAccessory,
				deskDecor: editDeskDecor,
				moodStatus: editMoodStatus,
				mission: editMission,
				skills: editSkills
			}
		});
		showCustomizerModal = false;
	}

	// Scénarios de vie et interactions d'équipe
	function triggerTeamMeeting(): void {
		triggerEvent({
			type: 'TEAM_MEETING',
			agentId: 'lead-dev',
			message: 'Standup & Revue d\'Architecture Globale'
		});
	}

	function triggerPhoneCall(callerId: string = 'lead-dev', targetId: string = 'ops-quality'): void {
		triggerEvent({
			type: 'PHONE_CALL',
			agentId: callerId,
			targetAgentId: targetId,
			message: 'Synchronisation specs et validation continue'
		});
	}

	function triggerDeskVisit(visitorId: string = 'lead-dev', targetId: string = 'ops-quality'): void {
		triggerEvent({
			type: 'VISIT_AGENT',
			agentId: visitorId,
			targetAgentId: targetId,
			message: 'Briefing en binôme au poste'
		});
	}

	function triggerServerAlert(): void {
		triggerEvent({
			type: 'SERVER_ALERT',
			agentId: 'ops-quality',
			message: 'Diagnostic Baie Coolify & Cloudflare'
		});
	}

	function triggerCoffeeChat(): void {
		triggerEvent({
			type: 'COFFEE_CHAT',
			agentId: 'lead-dev',
			targetAgentId: 'ops-quality',
			message: 'Pause café et échange technique'
		});
	}

	const agentPaths = new Map<string, GridPoint[]>();
	const agentRenderCoords = new Map<string, { x: number; y: number }>();
	const agentDirections = new Map<string, 'down' | 'up' | 'left' | 'right'>();
	let petPath: GridPoint[] = [];
	let petRenderCoord = { x: 12, y: 8 };

	const selectedAgent = $derived(
		selectedAgentId ? (animatedAgents.find((a) => a.id === selectedAgentId) ?? null) : null
	);

	const activeAgentsCount = $derived(
		animatedAgents.filter((a) => a.state === 'WORKING' || a.state === 'CALLING').length
	);
	const waitingHumanCount = $derived(
		animatedAgents.filter((a) => a.state === 'WAITING_HUMAN').length
	);
	const waitingAgents = $derived(animatedAgents.filter((a) => a.state === 'WAITING_HUMAN'));
	const totalTokensK = $derived(
		Math.round(animatedAgents.reduce((acc, a) => acc + (a.contextTokens || 0), 0) / 1000)
	);
	const leadAgent = $derived(animatedAgents.find((a) => a.id === 'lead-dev') ?? null);
	const specialistAgents = $derived(
		animatedAgents.filter((a) => !a.isTemporary && a.id !== 'lead-dev')
	);
	const subAgents = $derived(animatedAgents.filter((a) => a.isTemporary));

	// Gestion Boîte de Dialogue RPG Rétro
	let rpgDialogueVisible = $state(true);
	let typewriterText = $state('');
	let typewriterTargetText = $state('');
	let typewriterTimer: ReturnType<typeof setInterval> | null = null;

	const activeDialogueAgent = $derived.by(() => {
		if (selectedAgent?.lastDialogue) return selectedAgent;
		const waiting = animatedAgents.find((a) => a.state === 'WAITING_HUMAN' && a.lastDialogue);
		if (waiting) return waiting;
		const withDialogue = animatedAgents.filter((a) => a.lastDialogue);
		if (withDialogue.length > 0) {
			return [...withDialogue].sort(
				(a, b) => (b.lastDialogue?.timestamp || 0) - (a.lastDialogue?.timestamp || 0)
			)[0];
		}
		return selectedAgent || leadAgent;
	});

	const SKILL_LABELS: Record<string, string> = {
		'shared-eco-tokens': 'Optimisation continue des tokens',
		'pwa-cadrage': 'Cadrage, Naming & Blueprint',
		'pwa-developpement': 'Développement, Specs & Code SvelteKit',
		'design-pwa-system': 'Design System UI/UX Mobile-First',
		'design-ux-flow': 'Méthodologie UX en 10 étapes',
		'pwa-validation': 'Validation QA, Lighthouse & Sécurité',
		'pwa-deploiement': 'Déploiement Coolify & Cloudflare',
		'api-paiements': 'Passerelle Paiement Wave, OM, MTN & Moov',
		'api-best-practices': 'Design RESTful, Idempotence & Webhooks',
		'shared-git-conventions': 'Conventions Git & PRs GitHub',
		'opencode-admin': 'Administration IA OpenCode & Antigravity',
		'pwa-test-harness': 'Cockpit de tests & Specs vivantes',
		'shared-graft': 'Indexation du graphe de code Graft',
		'apple-design': 'Motion physique & Principes Apple',
		'design-3d': '3D Procédural Three.js'
	};

	const activeSkillsList = $derived.by(() => {
		if (activeDialogueAgent?.activeSkills && activeDialogueAgent.activeSkills.length > 0) {
			return activeDialogueAgent.activeSkills;
		}
		const role = activeDialogueAgent?.role ?? 'lead-dev';
		if (role === 'lead-dev') return ['shared-eco-tokens', 'pwa-developpement', 'pwa-cadrage', 'design-pwa-system'];
		if (role === 'ops-quality') return ['pwa-validation', 'shared-git-conventions', 'pwa-deploiement'];
		if (role === 'integrations') return ['api-paiements', 'api-best-practices', 'shared-graft'];
		return ['shared-eco-tokens', 'pwa-developpement'];
	});

	$effect(() => {
		const target = activeDialogueAgent?.lastDialogue?.text || '';
		if (target !== typewriterTargetText) {
			typewriterTargetText = target;
			typewriterText = '';
			if (typewriterTimer) {
				clearInterval(typewriterTimer);
				typewriterTimer = null;
			}
			if (target) {
				let idx = 0;
				typewriterTimer = setInterval(() => {
					if (idx < target.length) {
						typewriterText += target[idx];
						idx++;
					} else {
						if (typewriterTimer) {
							clearInterval(typewriterTimer);
							typewriterTimer = null;
						}
					}
				}, 16);
			}
		}
	});

	function completeTypewriterImmediately(): void {
		if (typewriterText.length < typewriterTargetText.length) {
			if (typewriterTimer) {
				clearInterval(typewriterTimer);
				typewriterTimer = null;
			}
			typewriterText = typewriterTargetText;
		}
	}

	async function resolveHumanGate(
		agentId: string,
		resolutionAction: 'approve' | 'reject' = 'approve'
	): Promise<void> {
		await triggerEvent({
			type: 'RESOLVE_HUMAN_GATE',
			agentId,
			resolutionAction
		});
	}

	function formatStateLabel(state: string): string {
		switch (state) {
			case 'WORKING':
				return 'ACTIF';
			case 'WAITING_HUMAN':
				return 'STOP / VALIDATION';
			case 'DONE':
				return 'TERMINÉ';
			case 'CALLING':
				return 'APPEL INTERCOM';
			case 'PHONE_CALL':
				return '📞 EN LIGNE';
			case 'MEETING':
				return '📢 STANDUP';
			case 'VISITING':
				return 'VISITE BINÔME';
			case 'CONTEMPLATING':
				return 'VUE EXTÉRIEURE';
			case 'WATERING_PLANT':
				return 'ARROSAGE PLANTE';
			case 'LIBRARY':
				return 'DOCUMENTATION';
			case 'SERVER_CHECK':
				return '🚨 RACK COOLIFY';
			case 'COFFEE':
				return 'PAUSE CAFÉ';
			case 'GYM':
				return 'SPORT GYM';
			case 'LOUNGE':
				return 'SALON';
			case 'LEAVING':
				return 'DÉPART';
			default:
				return 'EN POSTE';
		}
	}

	function getContextGaugeColor(ratio: number): string {
		if (ratio >= 0.85) return '#ef4444';
		if (ratio >= 0.7) return '#f97316';
		if (ratio >= 0.5) return '#eab308';
		return '#22c55e';
	}

	function toggleAudio(): void {
		audioOn = !audioOn;
		setSoundEnabled(audioOn);
		if (audioOn) {
			playDoneChime();
		}
	}

	async function triggerEvent(payload: Partial<IncomingOfficeEvent>): Promise<void> {
		try {
			const res = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					source: 'manual',
					...payload
				})
			});
			if (res.ok) {
				const data = await res.json();
				if (data.snapshot) {
					syncSnapshot(data.snapshot);
				}
			}
		} catch {
			// Ignore erreur réseau locale
		}
	}

	function syncSnapshot(nextSnap: OfficeSnapshot): void {
		snapshot = nextSnap;

		const newestLog = nextSnap.logs[0];
		if (newestLog && newestLog.id !== lastPlayedLogId) {
			lastPlayedLogId = newestLog.id;
			if (newestLog.soundCue === 'permission') {
				playPermissionChime();
			} else if (newestLog.soundCue === 'done') {
				playDoneChime();
			} else if (newestLog.soundCue === 'spawn' || newestLog.soundCue === 'call') {
				playSubagentSpawnChime();
			}
			if (
				newestLog.summary.toLowerCase().includes('café') ||
				newestLog.summary.toLowerCase().includes('expresso')
			) {
				playCoffeeBrew();
			}
		}

		for (const ag of nextSnap.agents) {
			const existing = agentRenderCoords.get(ag.id);
			if (!existing) {
				agentRenderCoords.set(ag.id, { x: ag.position.x, y: ag.position.y });
			}
			const currentCoord = agentRenderCoords.get(ag.id)!;
			const currentPath = agentPaths.get(ag.id);
			const lastGoal =
				currentPath && currentPath.length > 0
					? currentPath[currentPath.length - 1]
					: { x: Math.round(currentCoord.x), y: Math.round(currentCoord.y) };

			if (lastGoal.x !== ag.targetPosition.x || lastGoal.y !== ag.targetPosition.y) {
				const newPath = findPixelPath(
					{ x: Math.round(currentCoord.x), y: Math.round(currentCoord.y) },
					ag.targetPosition
				);
				agentPaths.set(ag.id, newPath);
			}
		}

		if (nextSnap.pet) {
			const lastPetGoal =
				petPath.length > 0
					? petPath[petPath.length - 1]
					: { x: Math.round(petRenderCoord.x), y: Math.round(petRenderCoord.y) };
			if (
				lastPetGoal.x !== nextSnap.pet.targetPosition.x ||
				lastPetGoal.y !== nextSnap.pet.targetPosition.y
			) {
				petPath = findPixelPath(
					{ x: Math.round(petRenderCoord.x), y: Math.round(petRenderCoord.y) },
					nextSnap.pet.targetPosition
				);
			}
		}
	}

	function stepPositions(): void {
		if (!snapshot) return;
		const speed = 0.18;
		const views: AnimatedAgentView[] = [];

		for (const ag of snapshot.agents) {
			const pos = agentRenderCoords.get(ag.id) ?? { x: ag.position.x, y: ag.position.y };
			const path = agentPaths.get(ag.id) ?? [];
			let isMoving = false;
			let dir = agentDirections.get(ag.id) ?? ag.direction;

			if (path.length > 0) {
				const nextTile = path[0];
				const dx = nextTile.x - pos.x;
				const dy = nextTile.y - pos.y;
				const dist = Math.hypot(dx, dy);

				if (Math.abs(dx) > Math.abs(dy)) {
					dir = dx > 0 ? 'right' : 'left';
				} else if (Math.abs(dy) > 0.01) {
					dir = dy > 0 ? 'down' : 'up';
				}
				agentDirections.set(ag.id, dir);

				if (dist <= speed) {
					pos.x = nextTile.x;
					pos.y = nextTile.y;
					path.shift();
				} else {
					pos.x += (dx / dist) * speed;
					pos.y += (dy / dist) * speed;
				}
				isMoving = true;
			}

			agentRenderCoords.set(ag.id, pos);
			views.push({
				...ag,
				direction: dir,
				renderX: pos.x,
				renderY: pos.y,
				isMoving
			});
		}

		animatedAgents = views;

		// 1. Déplacement de GitCat
		if (snapshot.pet) {
			const petSpeed = 0.12;
			let petMoving = false;
			if (petPath.length > 0) {
				const nextTile = petPath[0];
				const dx = nextTile.x - petRenderCoord.x;
				const dy = nextTile.y - petRenderCoord.y;
				const dist = Math.hypot(dx, dy);
				if (dist <= petSpeed) {
					petRenderCoord.x = nextTile.x;
					petRenderCoord.y = nextTile.y;
					petPath.shift();
				} else {
					petRenderCoord.x += (dx / dist) * petSpeed;
					petRenderCoord.y += (dy / dist) * petSpeed;
				}
				petMoving = true;
			}
			animatedPet = {
				...snapshot.pet,
				renderX: petRenderCoord.x,
				renderY: petRenderCoord.y,
				isMoving: petMoving
			};
		}

		// 2. Trajectoire physique et rebonds de la pelote de laine
		if (yarnBall.isMoving) {
			const dx = yarnBall.targetX - yarnBall.x;
			const dy = yarnBall.targetY - yarnBall.y;
			const dist = Math.hypot(dx, dy);
			if (dist <= 0.16) {
				yarnBall.x = yarnBall.targetX;
				yarnBall.y = yarnBall.targetY;
				yarnBall.z = 0;
				yarnBall.isMoving = false;
				playYarnBounce();
			} else {
				yarnBall.x += (dx / dist) * 0.16;
				yarnBall.y += (dy / dist) * 0.16;
				yarnBall.z = Math.sin(Math.min(Math.PI, (1 - dist / 3) * Math.PI)) * 8;
			}
		}

		// 3. Interaction physique joueur entre GitCat et la pelote de laine
		const petDistToYarn = Math.hypot(petRenderCoord.x - yarnBall.x, petRenderCoord.y - yarnBall.y);
		if (
			petDistToYarn <= 0.9 &&
			!yarnBall.isMoving &&
			snapshot?.pet &&
			snapshot.pet.state !== 'HEART'
		) {
			playCatMeow();
			playCatPurr();
			triggerEvent({
				type: 'PET_INTERACT',
				agentId: 'lead-dev'
			});
			// GitCat renvoie joyeusement la pelote un peu plus loin sur le tapis
			yarnBall.targetX = 15.2 + Math.random() * 2.5;
			yarnBall.targetY = 7.6 + Math.random() * 2.0;
			yarnBall.isMoving = true;
			playYarnBounce();
		}
	}

	function toggleFullscreen(): void {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch(() => {});
			isFullscreen = true;
		} else {
			document.exitFullscreen().catch(() => {});
			isFullscreen = false;
		}
	}

	onMount(() => {
		audioOn = isSoundEnabled();
		loadPixelAssets()
			.then((bundle) => {
				assetsBundle = bundle;
			})
			.catch(() => {});

		const updateClock = () => {
			const now = new Date();
			currentTime = now.toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		};
		updateClock();
		const clockTimer = setInterval(updateClock, 1000);

		const evtSource = new EventSource('/api/events/stream');
		evtSource.onmessage = (e) => {
			try {
				const parsed = JSON.parse(e.data) as OfficeSnapshot;
				syncSnapshot(parsed);
			} catch {
				// Ignore
			}
		};

		let animId = 0;
		let lastTime = performance.now();
		let frameCount = 0;

		const renderLoop = (now: number) => {
			animId = requestAnimationFrame(renderLoop);
			const elapsed = now - lastTime;
			if (elapsed < FPS_INTERVAL) return;
			lastTime = now - (elapsed % FPS_INTERVAL);
			frameCount++;

			stepPositions();

			// Bruitage subtil de frappes de clavier mécanique occasionnelles pendant le travail
			if (frameCount % 65 === 0 && Math.random() < 0.35) {
				const hasWorkingAgent = animatedAgents.some((a) => a.state === 'WORKING');
				if (hasWorkingAgent) {
					playKeyboardClick();
				}
			}

			if (canvasEl) {
				const ctx = canvasEl.getContext('2d');
				if (ctx) {
					renderPixelOfficeScene(
						ctx,
						animatedAgents,
						animatedPet,
						selectedAgentId,
						frameCount,
						assetsBundle,
						ambientMode,
						yarnBall
					);
				}
			}
		};

		animId = requestAnimationFrame(renderLoop);

		const handleKioskActivity = () => {
			if (isKioskMode) {
				resetKioskIdleTimer();
			}
		};
		const handleKioskKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isKioskMode) {
				isKioskMode = false;
				kioskControlsVisible = true;
			} else if (isKioskMode) {
				resetKioskIdleTimer();
			}
		};
		window.addEventListener('mousemove', handleKioskActivity);
		window.addEventListener('click', handleKioskActivity);
		window.addEventListener('keydown', handleKioskKey);

		return () => {
			clearInterval(clockTimer);
			evtSource.close();
			cancelAnimationFrame(animId);
			window.removeEventListener('mousemove', handleKioskActivity);
			window.removeEventListener('click', handleKioskActivity);
			window.removeEventListener('keydown', handleKioskKey);
			if (kioskIdleTimer) clearTimeout(kioskIdleTimer);
		};
	});
</script>

<div
	class="cockpit-shell"
	class:kiosk-mode={isKioskMode}
	class:kiosk-hidden={isKioskMode && !kioskControlsVisible}
>
	{#if isKioskMode}
		<button
			type="button"
			class="btn-exit-kiosk"
			class:visible={kioskControlsVisible}
			onclick={() => {
				isKioskMode = false;
				kioskControlsVisible = true;
			}}
			title="Quitter le mode Kiosk (ou appuyer sur Échap)"
		>
			✕ QUITTER LE MODE KIOSK (ÉCHAP)
		</button>
	{/if}

	<!-- 1. BARRE LATÉRALE GAUCHE : Cockpit Navigation (Refonte 58px -> 200px) -->
	<aside class="cockpit-sidebar" class:expanded={leftSidebarExpanded} aria-label="Navigation Cockpit">
		<div class="sidebar-header-dock">
			<div class="cockpit-logo" title="Agence Bulles">
				<span class="logo-dot"></span>
				<span class="logo-text">AB</span>
			</div>
			<button
				type="button"
				class="btn-toggle-expand"
				onclick={() => (leftSidebarExpanded = !leftSidebarExpanded)}
				title={leftSidebarExpanded ? 'Réduire le menu' : 'Étendre le menu'}
			>
				{leftSidebarExpanded ? '◀' : '▶'}
			</button>
		</div>

		<nav class="cockpit-nav-buttons">
			<!-- SECTION 1 : ESPACE -->
			{#if leftSidebarExpanded}
				<div class="nav-section-title">ESPACE</div>
			{/if}
			<button
				type="button"
				class="nav-icon-btn active"
				title="Vue principale du bureau"
			>
				<span class="nav-btn-icon">HQ</span>
				{#if leftSidebarExpanded}
					<div class="nav-btn-text">
						<span class="nav-btn-label">BUREAU</span>
						<span class="nav-btn-sub">Espace 2D</span>
					</div>
				{/if}
			</button>

			<button
				type="button"
				class="nav-icon-btn"
				class:active={showControlDrawer}
				onclick={() => (showControlDrawer = !showControlDrawer)}
				title="Ouvrir la console de simulation / actions"
			>
				<span class="nav-btn-icon">&gt;_</span>
				{#if leftSidebarExpanded}
					<div class="nav-btn-text">
						<span class="nav-btn-label">CONSOLE</span>
						<span class="nav-btn-sub">Actions & prompts</span>
					</div>
				{/if}
			</button>

			<div class="nav-divider"></div>

			<!-- SECTION 2 : AUDIO & AMBIANCE -->
			{#if leftSidebarExpanded}
				<div class="nav-section-title">AUDIO</div>
			{/if}
			<button
				type="button"
				class="nav-icon-btn"
				class:muted={!audioOn}
				class:active={audioOn}
				onclick={toggleAudio}
				title="Activer ou couper les bruitages du bureau"
			>
				<span class="nav-btn-icon">{audioOn ? 'FX' : 'OFF'}</span>
				{#if leftSidebarExpanded}
					<div class="nav-btn-text">
						<span class="nav-btn-label">{audioOn ? 'BRUITAGES ON' : 'BRUITAGES OFF'}</span>
						<span class="nav-btn-sub">Foley 8-bit bureau</span>
					</div>
				{/if}
			</button>

			<button
				type="button"
				class="nav-icon-btn"
				class:active={isLofiBgmOn}
				onclick={toggleLofiMusic}
				title="Bande-son Chiptune Lo-Fi WebAudio (72 BPM relaxant)"
			>
				<span class="nav-btn-icon" class:pulse-icon={isLofiBgmOn}>{isLofiBgmOn ? '♫♪' : 'BGM'}</span>
				{#if leftSidebarExpanded}
					<div class="nav-btn-text">
						<span class="nav-btn-label">{isLofiBgmOn ? 'LO-FI ACTIF' : 'LO-FI OFF'}</span>
						<span class="nav-btn-sub">Musique 72 BPM</span>
					</div>
				{/if}
			</button>

			{#if isLofiBgmOn && leftSidebarExpanded}
				<div class="lofi-volume-slider-box">
					<span class="lofi-vol-label">VOL</span>
					<input
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={bgmVol}
						oninput={handleBgmVolumeChange}
						class="lofi-slider"
						title="Volume de la bande-son Lo-Fi"
					/>
				</div>
			{/if}

			<div class="nav-divider"></div>

			<!-- SECTION 3 : GITCAT -->
			{#if leftSidebarExpanded}
				<div class="nav-section-title">GITCAT</div>
			{/if}
			<button
				type="button"
				class="nav-icon-btn"
				onclick={() => triggerEvent({ type: 'PET_INTERACT' })}
				title="Caresser la mascotte GitCat"
			>
				<span class="nav-btn-icon">CAT</span>
				{#if leftSidebarExpanded}
					<div class="nav-btn-text">
						<span class="nav-btn-label">GITCAT</span>
						<span class="nav-btn-sub">Caresser mascotte</span>
					</div>
				{/if}
			</button>

			<button
				type="button"
				class="nav-icon-btn"
				onclick={() => throwYarnBall()}
				title="Lancer la pelote de laine à GitCat dans le salon"
			>
				<span class="nav-btn-icon">YRN</span>
				{#if leftSidebarExpanded}
					<div class="nav-btn-text">
						<span class="nav-btn-label">PELOTE</span>
						<span class="nav-btn-sub">Jouer avec GitCat</span>
					</div>
				{/if}
			</button>

			<div class="nav-divider"></div>

			<!-- SECTION 4 : AFFICHAGE -->
			{#if leftSidebarExpanded}
				<div class="nav-section-title">VUE</div>
			{/if}
			<button
				type="button"
				class="nav-icon-btn"
				class:active={isKioskMode}
				onclick={toggleKioskMode}
				title="Basculer en Mode Kiosk immersif (auto-hide)"
			>
				<span class="nav-btn-icon">[ ]</span>
				{#if leftSidebarExpanded}
					<div class="nav-btn-text">
						<span class="nav-btn-label">{isKioskMode ? 'QUITTER KIOSK' : 'MODE KIOSK'}</span>
						<span class="nav-btn-sub">Auto-hide immersif</span>
					</div>
				{/if}
			</button>

			<button
				type="button"
				class="nav-icon-btn"
				onclick={toggleFullscreen}
				title="Basculer en plein écran sur écran secondaire"
			>
				<span class="nav-btn-icon">EXP</span>
				{#if leftSidebarExpanded}
					<div class="nav-btn-text">
						<span class="nav-btn-label">{isFullscreen ? 'FENÊTRE' : 'PLEIN ÉCRAN'}</span>
						<span class="nav-btn-sub">Mode projection</span>
					</div>
				{/if}
			</button>
		</nav>

		<div class="sidebar-bottom-badge">
			<span>v0.4</span>
		</div>
	</aside>

	<!-- 2. ZONE CENTRALE : BANDEAU KPIS + PLATEAU LIBÉRÉ + JOURNAL -->
	<div class="cockpit-center">
		<!-- En-tête KPI de Gestion d'Équipe -->
		<header class="kpi-banner">
			<div class="kpi-main-title">
				<div class="title-row">
					<span class="pixel-indicator-green"></span>
					<h1>BUREAU AGENCE BULLES</h1>
				</div>
				<p class="subtitle">Supervision autonome des agents et des sous-agents en temps réel</p>
			</div>

			<div class="kpi-metrics-row">
				<div class="kpi-card">
					<span class="kpi-label">EN ACTIVITÉ</span>
					<strong class="kpi-val highlight">{activeAgentsCount} / {animatedAgents.length}</strong>
				</div>

				<div class="kpi-card">
					<span class="kpi-label">VALIDATION HUMAINE</span>
					<strong class="kpi-val" class:alert={waitingHumanCount > 0}>{waitingHumanCount} STOP</strong>
				</div>

				<div class="kpi-card kpi-projects-card" title="Projets actuellement sollicités sous /Users/silveremeya/Projets">
					<span class="kpi-label">
						PROJETS EN COURS ({snapshot?.stats.activeProjects?.length ?? 1})
					</span>
					<div class="active-projects-list">
						{#if snapshot?.stats.activeProjects && snapshot.stats.activeProjects.length > 0}
							{#each snapshot.stats.activeProjects as proj}
								<span
									class="project-pill"
									class:is-primary={proj === snapshot.stats.activeProject}
									title="Projet: {proj}"
								>
									{#if proj === snapshot.stats.activeProject}
										<span class="live-dot-mini"></span>
									{/if}
									{proj}
								</span>
							{/each}
						{:else}
							<strong class="kpi-val project-text">{snapshot?.stats.activeProject ?? 'agents-skills'}</strong>
						{/if}
					</div>
				</div>

				<div class="kpi-card">
					<span class="kpi-label">TOKENS CUMULÉS</span>
					<strong class="kpi-val">{totalTokensK}k</strong>
				</div>

				<div class="kpi-watchers">
					<div class="mini-watcher" class:active={snapshot?.watcherStatus.antigravityActive} title="Antigravity Watcher">
						<span class="watcher-dot"></span>
						<span>AG</span>
					</div>
					<div class="mini-watcher" class:active={snapshot?.watcherStatus.opencodeActive} title="OpenCode Watcher">
						<span class="watcher-dot"></span>
						<span>OC</span>
					</div>
					<div class="mini-watcher" class:active={snapshot?.watcherStatus.claudeActive} title="Claude Watcher">
						<span class="watcher-dot"></span>
						<span>CL</span>
					</div>
				</div>

				<!-- SELECTEUR D'AMBIANCE JOUR / NUIT CYBERPUNK (Phase 3) -->
				<div class="ambient-theme-picker" title="Ambiance lumineuse du bureau">
					<span class="ambient-label">AMBIANCE</span>
					<div class="ambient-btn-group">
						<button
							type="button"
							class="ambient-pill"
							class:active={ambientMode === 'auto'}
							onclick={() => (ambientMode = 'auto')}
							title="Heure réelle locale"
						>
							AUTO
						</button>
						<button
							type="button"
							class="ambient-pill"
							class:active={ambientMode === 'day'}
							onclick={() => (ambientMode = 'day')}
							title="Plein jour clair"
						>
							JOUR
						</button>
						<button
							type="button"
							class="ambient-pill"
							class:active={ambientMode === 'sunset'}
							onclick={() => (ambientMode = 'sunset')}
							title="Crépuscule orangé"
						>
							SOIR
						</button>
						<button
							type="button"
							class="ambient-pill"
							class:active={ambientMode === 'night'}
							onclick={() => (ambientMode = 'night')}
							title="Nuit Cyberpunk avec néons"
						>
							NUIT
						</button>
					</div>
				</div>

				<div class="kpi-clock">{currentTime}</div>
			</div>
		</header>

		<!-- Scène du Bureau Pixel Art (100% DÉGAGÉE, ZÉRO BOÎTE PAR-DESSUS LE SALON !) -->
		<main class="stage-viewport">
			<div class="canvas-frame">
				<canvas
					bind:this={canvasEl}
					width={NATIVE_WIDTH}
					height={NATIVE_HEIGHT}
					onclick={handleCanvasClick}
				></canvas>

				<!-- Couche de bulles HUD synchronisée au-dessus de la tête des agents uniquement -->
				<div class="bubbles-layer">
					{#each animatedAgents as agent (agent.id)}
						{@const leftPct = ((agent.renderX * TILE_SIZE + 8) / NATIVE_WIDTH) * 100}
						{@const topPct = ((agent.renderY * TILE_SIZE - 14) / NATIVE_HEIGHT) * 100}
						<div
							class="agent-hud-anchor"
							class:is-selected={selectedAgentId === agent.id}
							style="left: {leftPct}%; top: {topPct}%; --agent-color: {agent.palette.shirt};"
						>
							{#if agent.state === 'WAITING_HUMAN'}
								<div class="permission-alert-badge">⛔ STOP JALON</div>
							{:else if agent.state === 'DONE'}
								<div class="done-check-badge">✔ TERMINÉ</div>
							{/if}

							<div
								class="speech-bubble mini-pill"
								class:is-calling={agent.state === 'CALLING' || agent.state === 'PHONE_CALL'}
								class:is-waiting={agent.state === 'WAITING_HUMAN'}
								class:is-selected={selectedAgentId === agent.id}
								onclick={(e) => {
									e.stopPropagation();
									toggleAgentSelection(agent.id);
								}}
								role="button"
								tabindex="0"
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') toggleAgentSelection(agent.id);
								}}
								aria-label="Agent {agent.name}: {agent.activityLabel || agent.callMessage || formatStateLabel(agent.state)}"
							>
								<span class="pill-dot state-{agent.state.toLowerCase()}"></span>
								<strong class="pill-name">{agent.name}</strong>
								{#if agent.activityLabel || agent.callMessage}
									<span class="pill-sep">·</span>
									<span class="pill-action" title={agent.activityLabel || agent.callMessage}>
										{agent.activityLabel || agent.callMessage}
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<!-- BANNIÈRE D'ACTION JALON HUMAIN (STOP) -->
				{#if waitingAgents.length > 0}
					{@const firstWaiting = waitingAgents[0]}
					{@const charIdx = getAgentCharIndex(firstWaiting)}
					<div class="human-gate-banner" role="alert">
						<div class="gate-banner-left">
							<div
								class="gate-banner-avatar"
								style="background-image: url('/assets/characters/char_{charIdx}.png');"
							></div>
							<div class="gate-banner-text">
								<div class="gate-banner-title">
									<span class="gate-stop-sign">⛔ STOP JALON HUMAIN</span>
									<span class="gate-agent-tag">[{firstWaiting.name}]</span>
								</div>
								<div class="gate-banner-msg">
									{firstWaiting.activityLabel || 'Validation humaine requise avant de poursuivre'}
								</div>
							</div>
						</div>
						<div class="gate-banner-actions">
							<button
								type="button"
								class="pixel-btn gate-approve-btn"
								onclick={() => resolveHumanGate(firstWaiting.id, 'approve')}
							>
								✔ VALIDER LE JALON
							</button>
							<button
								type="button"
								class="pixel-btn gate-reject-btn"
								onclick={() => resolveHumanGate(firstWaiting.id, 'reject')}
							>
								↺ RÉVISION
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- BOÎTE DE DIALOGUE RPG RÉTRO (Typewriter Dialogue Box) : DÉPLACÉE SOUS LE CANVAS -->
			{#if rpgDialogueVisible && activeDialogueAgent && activeDialogueAgent.lastDialogue}
				{@const charIdx = getAgentCharIndex(activeDialogueAgent)}
				{@const dialogue = activeDialogueAgent.lastDialogue}
				<div
					class="rpg-dialogue-box"
					class:is-gate={activeDialogueAgent.state === 'WAITING_HUMAN' || dialogue.type === 'gate'}
					onclick={completeTypewriterImmediately}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') completeTypewriterImmediately();
					}}
					role="button"
					tabindex="0"
					aria-label="Boîte de dialogue RPG. Cliquer pour afficher le texte complet"
				>
					<div class="rpg-box-border-top"></div>
					<div class="rpg-box-inner">
						<div
							class="rpg-portrait-frame"
							style="--portrait-border: {activeDialogueAgent.palette.shirt};"
						>
							<div
								class="rpg-portrait"
								style="background-image: url('/assets/characters/char_{charIdx}.png');"
							></div>
						</div>

						<div class="rpg-dialogue-body">
							<div class="rpg-dialogue-header">
								<div class="rpg-speaker-row">
									<strong class="rpg-speaker-name" style="color: {activeDialogueAgent.palette.shirt};">
										{activeDialogueAgent.name.toUpperCase()}
									</strong>
									<span class="rpg-type-badge type-{dialogue.type}">
										{#if dialogue.type === 'gate'}
											⛔ JALON STOP
										{:else if dialogue.type === 'thought'}
											💭 RÉFLEXION
										{:else if dialogue.type === 'done'}
											✔ SUCCÈS
										{:else}
											⚙ ACTION
										{/if}
									</span>
									{#if activeDialogueAgent.activeProjects && activeDialogueAgent.activeProjects.length > 0}
										<div class="rpg-projects-group">
											{#each activeDialogueAgent.activeProjects as prj}
												<span class="rpg-project-badge" class:is-primary={prj === activeDialogueAgent.currentProject}>
													{prj}
												</span>
											{/each}
										</div>
									{:else if activeDialogueAgent.currentProject}
										<span class="rpg-project-badge">
											{activeDialogueAgent.currentProject}
										</span>
									{/if}
								</div>
								<button
									type="button"
									class="rpg-close-btn"
									onclick={(e) => {
										e.stopPropagation();
										rpgDialogueVisible = false;
									}}
									title="Masquer la boîte de dialogue"
								>
									✕
								</button>
							</div>

							<!-- VUE DES SKILLS UTILISÉS DANS LA NOTE EN DESSOUS DU BUREAU -->
							<div class="rpg-skills-bar" title="Skills d'agent actives chargées dans la mémoire">
								<div class="rpg-skills-lead">
									<span class="skills-pulse-dot"></span>
									<span class="rpg-skills-title">SKILLS EN JEU ({activeSkillsList.length}) :</span>
								</div>
								<div class="rpg-skills-chips">
									{#each activeSkillsList as skill, idx}
										<span
											class="rpg-skill-chip"
											class:is-active-skill={idx === 0}
											title="{skill} : {SKILL_LABELS[skill] ?? 'Skill certifiée Agence Bulles'}"
										>
											<span class="skill-dot-neon"></span>
											<span class="skill-chip-name">{skill}</span>
											{#if idx === 0}
												<span class="skill-active-tag">ACTIF</span>
											{/if}
										</span>
									{/each}
								</div>
							</div>

							<div class="rpg-text-container">
								<p class="rpg-typewriter-text">
									{typewriterText}
									{#if typewriterText.length < typewriterTargetText.length}
										<span class="typewriter-cursor">▌</span>
									{/if}
								</p>
							</div>

							{#if activeDialogueAgent.state === 'WAITING_HUMAN' || dialogue.type === 'gate'}
								<div class="rpg-dialogue-actions">
									<button
										type="button"
										class="pixel-btn rpg-btn-approve"
										onclick={(e) => {
											e.stopPropagation();
											resolveHumanGate(activeDialogueAgent.id, 'approve');
										}}
									>
										✔ APPROUVER LE JALON
									</button>
									<button
										type="button"
										class="pixel-btn rpg-btn-reject"
										onclick={(e) => {
											e.stopPropagation();
											resolveHumanGate(activeDialogueAgent.id, 'reject');
										}}
									>
										↺ RÉVISION
									</button>
								</div>
							{/if}
						</div>
					</div>

					<div class="rpg-next-arrow" title="Cliquer pour afficher tout le texte">▼</div>
				</div>
			{:else if !rpgDialogueVisible && activeDialogueAgent}
				<button
					type="button"
					class="btn-restore-dialogue"
					onclick={() => (rpgDialogueVisible = true)}
					title="Afficher la boîte de dialogue RPG"
				>
					💬 DIALOGUE RPG : {activeDialogueAgent.name}
				</button>
			{/if}

			{#if showControlDrawer}
				<aside class="control-drawer-dock" aria-label="Console de commande">
					<div class="drawer-header-dock">
						<h2>CONSOLE D'ACTIONS</h2>
						<button type="button" class="btn-close-dock" onclick={() => (showControlDrawer = false)}>✕</button>
					</div>
					<div class="drawer-body-dock">
						<div class="control-group">
							<label for="select-agent">Agent actif</label>
							<select id="select-agent" bind:value={simAgentId}>
								<option value="lead-dev">lead-dev (Orchestrateur)</option>
								<option value="ops-quality">ops-quality (QA & Sécurité)</option>
								<option value="integrations">integrations (Data & API)</option>
							</select>
						</div>

						<div class="control-group">
							<label for="input-project">Projet en cours</label>
							<input id="input-project" type="text" bind:value={simProject} placeholder="ex: lodgi" />
						</div>

						<div class="control-group">
							<label for="input-activity">Activité (Activity Label)</label>
							<input
								id="input-activity"
								type="text"
								bind:value={simActivityLabel}
								placeholder="ex: Running vitest..."
							/>
						</div>

						<div class="btn-grid">
							<button
								type="button"
								class="pixel-btn"
								onclick={() =>
									triggerEvent({
										type: 'WORK_START',
										agentId: simAgentId,
										project: simProject,
										activityLabel: simActivityLabel,
										skills: [simSkill]
									})}
							>
								TRAVAILLER
							</button>
							<button
								type="button"
								class="pixel-btn warn-btn"
								onclick={() =>
									triggerEvent({
										type: 'WAITING_HUMAN',
										agentId: simAgentId,
										project: simProject,
										message: 'Validation schéma requise'
									})}
							>
								STOP JALON
							</button>
							<button
								type="button"
								class="pixel-btn ok-btn"
								onclick={() => resolveHumanGate(simAgentId, 'approve')}
							>
								APPROUVER JALON
							</button>
							<button
								type="button"
								class="pixel-btn ok-btn"
								onclick={() =>
									triggerEvent({
										type: 'TURN_DONE',
										agentId: simAgentId,
										project: simProject
									})}
							>
								TERMINER
							</button>
							<button
								type="button"
								class="pixel-btn secondary"
								onclick={() =>
									triggerEvent({
										type: 'RETURN_DESK',
										agentId: simAgentId
									})}
							>
								RETOUR POSTE
							</button>
						</div>

						<hr />

						<h3>INTERACTION ENTRE COLLÈGUES</h3>
						<div class="control-group">
							<label for="select-target">Destinataire</label>
							<select id="select-target" bind:value={simTargetAgentId}>
								<option value="ops-quality">ops-quality</option>
								<option value="integrations">integrations</option>
								<option value="lead-dev">lead-dev</option>
							</select>
						</div>

						<div class="btn-grid">
							<button
								type="button"
								class="pixel-btn"
								onclick={() =>
									triggerEvent({
										type: 'CALL_AGENT',
										agentId: simAgentId,
										targetAgentId: simTargetAgentId,
										project: simProject,
										message: `Appel vers ${simTargetAgentId}`
									})}
							>
								TÉLÉPHONER
							</button>
							<button
								type="button"
								class="pixel-btn secondary"
								onclick={() =>
									triggerEvent({
										type: 'VISIT_AGENT',
										agentId: simAgentId,
										targetAgentId: simTargetAgentId,
										project: simProject,
										message: `Point au bureau ${simTargetAgentId}`
									})}
							>
								VISITER BUREAU
							</button>
						</div>

						<hr />

						<h3>SCÉNARIOS DE BUREAU & MEETINGS</h3>
						<div class="btn-grid">
							<button
								type="button"
								class="pixel-btn highlight-btn"
								onclick={triggerTeamMeeting}
								title="Convoquer toute l'équipe pour un Standup général au Salon"
							>
								📢 CONVOQUER STANDUP
							</button>
							<button
								type="button"
								class="pixel-btn warn-btn"
								onclick={triggerServerAlert}
								title="Déclencher une alerte sur le Rack Serveur Coolify"
							>
								🚨 ALERTE COOLIFY
							</button>
							<button
								type="button"
								class="pixel-btn ok-btn"
								onclick={() => triggerPhoneCall(simAgentId, simTargetAgentId)}
								title="Déclencher un appel intercom direct entre deux collègues"
							>
								📞 APPEL INTERCOM
							</button>
							<button
								type="button"
								class="pixel-btn secondary"
								onclick={() => triggerDeskVisit(simAgentId, simTargetAgentId)}
								title="Envoyer un agent au bureau d'un autre en binôme"
							>
								🚶 VISITE BINÔME
							</button>
							<button
								type="button"
								class="pixel-btn secondary"
								onclick={triggerCoffeeChat}
								title="Déclencher une pause café collective au comptoir"
							>
								☕ PAUSE CAFÉ ÉQUIPE
							</button>
						</div>

						<hr />

						<h3>RENFORTS (SOUS-AGENTS)</h3>
						<div class="control-row">
							<input
								type="text"
								aria-label="Nom du renfort"
								bind:value={simSubagentName}
								placeholder="Nom (ex: bot-qa)"
							/>
							<input
								type="text"
								aria-label="Rôle du renfort"
								bind:value={simSubagentRole}
								placeholder="Rôle (ex: Audit)"
							/>
						</div>
						<div class="btn-grid">
							<button
								type="button"
								class="pixel-btn ok-btn"
								onclick={() =>
									triggerEvent({
										type: 'SPAWN_SUBAGENT',
										subagentName: simSubagentName,
										subagentRole: simSubagentRole,
										project: simProject,
										skills: [simSkill]
									})}
							>
								SPAWN RENFORT
							</button>
							<button
								type="button"
								class="pixel-btn warn-btn"
								onclick={() =>
									triggerEvent({
										type: 'DISMISS_SUBAGENT',
										agentId: simSubagentName
									})}
							>
								LIBÉRER RENFORT
							</button>
						</div>

						<hr />

						<h3>PAUSES & DÉTENTE</h3>
						<div class="btn-grid three-cols">
							<button
								type="button"
								class="pixel-btn secondary"
								onclick={() => triggerEvent({ type: 'GO_COFFEE', agentId: simAgentId })}
							>
								CAFÉ
							</button>
							<button
								type="button"
								class="pixel-btn secondary"
								onclick={() => triggerEvent({ type: 'GO_GYM', agentId: simAgentId })}
							>
								GYM
							</button>
							<button
								type="button"
								class="pixel-btn secondary"
								onclick={() => triggerEvent({ type: 'GO_LOUNGE', agentId: simAgentId })}
							>
								SALON
							</button>
						</div>
					</div>
				</aside>
			{/if}
		</main>

		<!-- Pied de page : Ticker de Journal de bord façon JRPG -->
		<footer class="cockpit-footer">
			<span class="footer-badge">JOURNAL</span>
			<div class="footer-ticker">
				{#if snapshot && snapshot.logs.length > 0}
					{#each snapshot.logs.slice(0, 5) as entry (entry.id)}
						<div class="log-item">
							<span class="log-time">
								{new Date(entry.timestamp).toLocaleTimeString('fr-FR', {
									hour: '2-digit',
									minute: '2-digit',
									second: '2-digit'
								})}
							</span>
							<span class="log-source">[{entry.source.toUpperCase()}]</span>
							<span class="log-summary">{entry.summary}</span>
						</div>
					{/each}
				{:else}
					<div class="log-item">En attente d'événements du bureau...</div>
				{/if}
			</div>
		</footer>
	</div>

	<!-- 3. VOLET LATÉRAL DROIT : RÉGIE D'ÉQUIPE HIÉRARCHIQUE & INSPECTEUR INTÉGRÉ (310px repliable) -->
	{#if rightSidebarCollapsed}
		<button
			type="button"
			class="docked-roster-tab"
			onclick={() => (rightSidebarCollapsed = false)}
			title="Déplier la régie des agents"
		>
			<span class="docked-arrow">◀</span>
			<span class="docked-text">RÉGIE ({animatedAgents.length})</span>
		</button>
	{/if}

	<aside class="team-sidebar" class:collapsed={rightSidebarCollapsed} aria-label="Régie de l'équipe des agents">
		<div class="sidebar-section-title">
			<span class="section-title-dot"></span>
			<h2>RÉGIE DES AGENTS</h2>
			<span class="live-status-pill">LIVE</span>
			<button
				type="button"
				class="btn-toggle-collapse"
				onclick={() => (rightSidebarCollapsed = true)}
				title="Replier la régie des agents"
			>
				▶
			</button>
		</div>

		<!-- Arbre Hiérarchique Scrollable -->
		<div class="team-roster-scroll">
			<!-- GROUPE 1 : DIRECTION & ARCHITECTURE -->
			<div class="hierarchy-cluster">
				<div class="cluster-label">
					<span>DIRECTION & ARCHITECTURE</span>
					<span class="count-pill">1</span>
				</div>
				{#if leadAgent}
					{@const charIdx = getAgentCharIndex(leadAgent)}
					<button
						type="button"
						class="agent-roster-card"
						class:selected={selectedAgentId === leadAgent.id}
						class:attention={leadAgent.state === 'WAITING_HUMAN'}
						style="--agent-theme: {leadAgent.palette.shirt};"
						onclick={() => toggleAgentSelection(leadAgent.id)}
					>
						<div
							class="roster-mugshot"
							style="background-image: url('/assets/characters/char_{charIdx}.png');"
						></div>
						<div class="roster-meta">
							<div class="roster-header">
								<strong class="roster-name">{leadAgent.name}</strong>
								<span
									class="status-dot"
									class:working={leadAgent.state === 'WORKING' || leadAgent.state === 'CALLING'}
									class:waiting={leadAgent.state === 'WAITING_HUMAN'}
									class:done={leadAgent.state === 'DONE'}
								></span>
							</div>
							<span class="roster-title">{leadAgent.title}</span>
							<div class="roster-projects-row">
								{#if leadAgent.activeProjects && leadAgent.activeProjects.length > 0}
									{#each leadAgent.activeProjects as prj}
										<span class="roster-prj-badge" class:is-primary={prj === leadAgent.currentProject}>{prj}</span>
									{/each}
								{:else if leadAgent.currentProject}
									<span class="roster-prj-badge is-primary">{leadAgent.currentProject}</span>
								{/if}
							</div>
							<div class="roster-status-row">
								<span class="roster-state-chip state-{leadAgent.state.toLowerCase()}">
									{formatStateLabel(leadAgent.state)}
								</span>
								<span class="mana-pct">{Math.round(leadAgent.contextRatio * 100)}% CTX</span>
							</div>
							<div class="roster-mana-bar">
								<div
									class="roster-mana-fill"
									style="width: {Math.round(leadAgent.contextRatio * 100)}%; background: {getContextGaugeColor(leadAgent.contextRatio)};"
								></div>
							</div>
						</div>
					</button>
				{/if}
			</div>

			<!-- GROUPE 2 : SPÉCIALISTES PERMANENTS -->
			<div class="hierarchy-cluster">
				<div class="cluster-label">
					<span>SPÉCIALISTES PERMANENTS</span>
					<span class="count-pill">{specialistAgents.length}</span>
				</div>
				{#each specialistAgents as ag (ag.id)}
					{@const charIdx = getAgentCharIndex(ag)}
					<button
						type="button"
						class="agent-roster-card"
						class:selected={selectedAgentId === ag.id}
						class:attention={ag.state === 'WAITING_HUMAN'}
						style="--agent-theme: {ag.palette.shirt};"
						onclick={() => toggleAgentSelection(ag.id)}
					>
						<div
							class="roster-mugshot"
							style="background-image: url('/assets/characters/char_{charIdx}.png');"
						></div>
						<div class="roster-meta">
							<div class="roster-header">
								<strong class="roster-name">{ag.name}</strong>
								<span
									class="status-dot"
									class:working={ag.state === 'WORKING' || ag.state === 'CALLING'}
									class:waiting={ag.state === 'WAITING_HUMAN'}
									class:done={ag.state === 'DONE'}
								></span>
							</div>
							<span class="roster-title">{ag.title}</span>
							<div class="roster-projects-row">
								{#if ag.activeProjects && ag.activeProjects.length > 0}
									{#each ag.activeProjects as prj}
										<span class="roster-prj-badge" class:is-primary={prj === ag.currentProject}>{prj}</span>
									{/each}
								{:else if ag.currentProject}
									<span class="roster-prj-badge is-primary">{ag.currentProject}</span>
								{/if}
							</div>
							<div class="roster-status-row">
								<span class="roster-state-chip state-{ag.state.toLowerCase()}">
									{formatStateLabel(ag.state)}
								</span>
								<span class="mana-pct">{Math.round(ag.contextRatio * 100)}% CTX</span>
							</div>
							<div class="roster-mana-bar">
								<div
									class="roster-mana-fill"
									style="width: {Math.round(ag.contextRatio * 100)}%; background: {getContextGaugeColor(ag.contextRatio)};"
								></div>
							</div>
						</div>
					</button>
				{/each}
			</div>

			<!-- GROUPE 3 : RENFORTS / SOUS-AGENTS -->
			<div class="hierarchy-cluster">
				<div class="cluster-label">
					<span>RENFORTS TEMPORAIRES</span>
					<span class="count-pill">{subAgents.length}</span>
				</div>
				{#if subAgents.length > 0}
					{#each subAgents as ag (ag.id)}
						{@const charIdx = getAgentCharIndex(ag)}
						<button
							type="button"
							class="agent-roster-card subagent-card"
							class:selected={selectedAgentId === ag.id}
							style="--agent-theme: {ag.palette.shirt};"
							onclick={() => toggleAgentSelection(ag.id)}
						>
							<div
								class="roster-mugshot"
								style="background-image: url('/assets/characters/char_{charIdx}.png');"
							></div>
							<div class="roster-meta">
								<div class="roster-header">
									<strong class="roster-name">{ag.name}</strong>
									<span class="status-dot working"></span>
								</div>
								<span class="roster-title">{ag.title}</span>
								<span class="roster-state-chip state-working">{formatStateLabel(ag.state)}</span>
							</div>
						</button>
					{/each}
				{:else}
					<div class="empty-subagents-card">Aucun renfort temporaire actif</div>
				{/if}
			</div>
		</div>

		<!-- FICHE INSPECTEUR INTÉGRÉE PERMANENTE (Pliable et désélectionnable) -->
		{#if selectedAgent}
			<div class="integrated-inspector" class:folded={inspectorCollapsed} style="--agent-accent: {selectedAgent.palette.shirt};">
				<div class="inspector-top-banner">
					<div
						class="inspector-avatar"
						style="background-image: url('/assets/characters/char_{getAgentCharIndex(selectedAgent)}.png');"
					></div>
					<div class="inspector-agent-id">
						<span class="role-badge">{getHierarchyRoleLabel(selectedAgent)}</span>
						<h3>{selectedAgent.name.toUpperCase()}</h3>
						<span class="inspector-role-title">{selectedAgent.title}</span>
					</div>
					<div class="inspector-banner-actions">
						<button
							type="button"
							class="btn-inspector-action"
							onclick={() => (inspectorCollapsed = !inspectorCollapsed)}
							title={inspectorCollapsed ? "Déplier l'inspecteur" : "Replier l'inspecteur"}
						>
							{inspectorCollapsed ? '▲' : '▼'}
						</button>
						<button
							type="button"
							class="btn-inspector-action btn-deselect"
							onclick={() => (selectedAgentId = null)}
							title="Désélectionner cet agent"
						>
							✕
						</button>
					</div>
				</div>

				{#if !inspectorCollapsed}
					<div class="inspector-meta-grid">
						<div class="meta-field">
							<span class="meta-caption">STATUT EN DIRECT</span>
							<strong class="meta-value state-label">{formatStateLabel(selectedAgent.state)}</strong>
						</div>
						<div class="meta-field">
							<span class="meta-caption">PROJETS ACTIFS</span>
							{#if selectedAgent.activeProjects && selectedAgent.activeProjects.length > 0}
								<div class="inspector-projects-chips">
									{#each selectedAgent.activeProjects as prj}
										<span class="inspector-prj-pill" class:is-primary={prj === selectedAgent.currentProject}>
											{#if prj === selectedAgent.currentProject}●{/if} {prj}
										</span>
									{/each}
								</div>
							{:else}
								<strong class="meta-value">{selectedAgent.currentProject ?? '—'}</strong>
							{/if}
						</div>
					</div>

					{#if !selectedAgent.isTemporary}
						<div class="inspector-gauge-section">
							<div class="gauge-title-row">
								<span>JAUGE DE CONTEXTE</span>
								<strong>{Math.round(selectedAgent.contextRatio * 100)}% ({Math.round(selectedAgent.contextTokens / 1000)}k)</strong>
							</div>
							<div class="gauge-bar-track">
								<div
									class="gauge-bar-fill"
									style="width: {Math.round(selectedAgent.contextRatio * 100)}%; background: {getContextGaugeColor(selectedAgent.contextRatio)};"
								></div>
							</div>
						</div>
					{/if}

					{#if selectedAgent.state === 'WAITING_HUMAN'}
						<div class="inspector-gate-box">
							<span class="gate-alert-tag">⛔ JALON EN ATTENTE DE VALIDATION</span>
							<p class="gate-alert-desc">Cet agent est arrêté sur un jalon critique. Ton aval est requis pour poursuivre.</p>
							<div class="inspector-gate-buttons">
								<button
									type="button"
									class="pixel-btn gate-approve-btn"
									onclick={() => resolveHumanGate(selectedAgent.id, 'approve')}
								>
									✔ APPROUVER LE JALON
								</button>
								<button
									type="button"
									class="pixel-btn gate-reject-btn"
									onclick={() => resolveHumanGate(selectedAgent.id, 'reject')}
								>
									↺ RÉVISION
								</button>
							</div>
						</div>
					{/if}

					<div class="inspector-activity-box">
						<span class="meta-caption">ACTION EN COURS</span>
						<p class="activity-desc">{selectedAgent.activityLabel ?? 'En veille'}</p>
					</div>

					{#if selectedAgent.customMission}
						<div class="inspector-activity-box">
							<span class="meta-caption">MISSION PRINCIPALE</span>
							<p class="activity-desc mission-text">{selectedAgent.customMission}</p>
						</div>
					{/if}

					{#if selectedAgent.activeSkills.length > 0}
						<div class="inspector-skills-wrap">
							<span class="meta-caption">SKILLS CHARGÉES</span>
							<div class="skills-pill-box">
								{#each selectedAgent.activeSkills as sk}
									<span class="skill-tag-pill">{sk}</span>
								{/each}
							</div>
						</div>
					{/if}

					<button
						type="button"
						class="pixel-btn highlight-btn customize-trigger-btn"
						onclick={() => openCustomizer(selectedAgent)}
					>
						CUSTOMISER CET AGENT
					</button>
				{/if}
			</div>
		{:else}
			<div class="integrated-inspector empty-state">
				<span class="empty-inspector-title">FICHE D'INSPECTEUR</span>
				<p class="empty-inspector-hint">Clique sur un agent dans la liste ou sur la scène pour afficher ses détails ou le customiser.</p>
			</div>
		{/if}
	</aside>


	<!-- Modal de Customisation des Agents (Style & Rôle/Objectifs) -->
	{#if showCustomizerModal && selectedAgent}
		<div
			class="modal-backdrop"
			onclick={() => (showCustomizerModal = false)}
			role="presentation"
		>
			<div
				class="customizer-dialog"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.key === 'Escape' && (showCustomizerModal = false)}
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<div class="dialog-header">
					<div class="dialog-title-block">
						<span class="dialog-dot" style="background: {editShirtColor};"></span>
						<h2>CUSTOMISER : {selectedAgent.name.toUpperCase()}</h2>
						<span class="hierarchy-pill">{getHierarchyRoleLabel(selectedAgent)}</span>
					</div>
					<button
						type="button"
						class="btn-close-dialog"
						onclick={() => (showCustomizerModal = false)}
					>
						✕
					</button>
				</div>

				<div class="customizer-tabs">
					<button
						type="button"
						class="tab-btn"
						class:active={customizerTab === 'style'}
						onclick={() => (customizerTab = 'style')}
					>
						1. STYLE & PHYSIQUE
					</button>
					<button
						type="button"
						class="tab-btn"
						class:active={customizerTab === 'desk'}
						onclick={() => (customizerTab = 'desk')}
					>
						2. BUREAU & HUMEUR
					</button>
					<button
						type="button"
						class="tab-btn"
						class:active={customizerTab === 'role'}
						onclick={() => (customizerTab = 'role')}
					>
						3. RÔLE & OBJECTIFS
					</button>
				</div>

				<div class="dialog-content">
					{#if customizerTab === 'style'}
						<!-- Choix du Sprite MetroCity (0..5) -->
						<div class="custom-section">
							<span class="section-label">MODÈLE DE SPRITE (METROCITY)</span>
							<div class="sprite-grid">
								{#each [0, 1, 2, 3, 4, 5] as idx}
									<button
										type="button"
										class="sprite-choice-card"
										class:selected={editSpriteIndex === idx}
										onclick={() => (editSpriteIndex = idx)}
									>
										<div
											class="sprite-preview"
											style="background-image: url('/assets/characters/char_{idx}.png');"
										></div>
										<span class="sprite-label">CHAR #{idx}</span>
									</button>
								{/each}
							</div>
						</div>

						<!-- Couleur de Vêtement / Chemise -->
						<div class="custom-section">
							<span class="section-label">COULEUR DU VÊTEMENT / TENUE</span>
							<div class="color-palette-grid">
								{#each PRESET_COLORS as color}
									<button
										type="button"
										class="color-circle"
										class:selected={editShirtColor === color}
										style="background-color: {color};"
										onclick={() => (editShirtColor = color)}
										title={color}
									></button>
								{/each}
							</div>
						</div>

						<!-- Couleur de Cheveux -->
						<div class="custom-section">
							<span class="section-label">COULEUR DES CHEVEUX & COIFFURE</span>
							<div class="color-palette-grid">
								{#each HAIR_COLORS as color}
									<button
										type="button"
										class="color-circle"
										class:selected={editHairColor === color}
										style="background-color: {color}; border-radius: 2px;"
										onclick={() => (editHairColor = color)}
										title="Cheveux: {color}"
									></button>
								{/each}
							</div>
						</div>

						<!-- Teinte de Peau -->
						<div class="custom-section">
							<span class="section-label">TEINTE DE PEAU & CARNATION</span>
							<div class="color-palette-grid">
								{#each SKIN_TONES as tone}
									<button
										type="button"
										class="color-circle"
										class:selected={editSkinTone === tone}
										style="background-color: {tone}; border-radius: 4px;"
										onclick={() => (editSkinTone = tone)}
										title="Carnation: {tone}"
									></button>
								{/each}
							</div>
						</div>

						<!-- Accessoires Pixel Art -->
						<div class="custom-section">
							<span class="section-label">ACCESSOIRE PORTÉ</span>
							<div class="accessory-chips">
								<button
									type="button"
									class="chip-btn"
									class:active={editAccessory === 'none'}
									onclick={() => (editAccessory = 'none')}
								>
									Aucun
								</button>
								<button
									type="button"
									class="chip-btn"
									class:active={editAccessory === 'badge'}
									onclick={() => (editAccessory = 'badge')}
								>
									Badge Leader (Doré)
								</button>
								<button
									type="button"
									class="chip-btn"
									class:active={editAccessory === 'glasses'}
									onclick={() => (editAccessory = 'glasses')}
								>
									Lunettes Cyber
								</button>
								<button
									type="button"
									class="chip-btn"
									class:active={editAccessory === 'headset'}
									onclick={() => (editAccessory = 'headset')}
								>
									Casque Audio
								</button>
								<button
									type="button"
									class="chip-btn"
									class:active={editAccessory === 'coffee'}
									onclick={() => (editAccessory = 'coffee')}
								>
									Tasse Expresso
								</button>
							</div>
						</div>
					{:else if customizerTab === 'desk'}
						<!-- Décoration posée sur le bureau -->
						<div class="custom-section">
							<span class="section-label">DÉCORATION POSÉE SUR LE BUREAU</span>
							<div class="accessory-chips">
								<button
									type="button"
									class="chip-btn"
									class:active={editDeskDecor === 'none'}
									onclick={() => (editDeskDecor = 'none')}
								>
									Standard (Aucun)
								</button>
								<button
									type="button"
									class="chip-btn"
									class:active={editDeskDecor === 'dual_monitor'}
									onclick={() => (editDeskDecor = 'dual_monitor')}
								>
									Double Écran Rétro
								</button>
								<button
									type="button"
									class="chip-btn"
									class:active={editDeskDecor === 'bonsai'}
									onclick={() => (editDeskDecor = 'bonsai')}
								>
									Bonsaï Zen
								</button>
								<button
									type="button"
									class="chip-btn"
									class:active={editDeskDecor === 'mug'}
									onclick={() => (editDeskDecor = 'mug')}
								>
									Mug Céramique
								</button>
								<button
									type="button"
									class="chip-btn"
									class:active={editDeskDecor === 'robot'}
									onclick={() => (editDeskDecor = 'robot')}
								>
									Figurine Robot
								</button>
								<button
									type="button"
									class="chip-btn"
									class:active={editDeskDecor === 'neon'}
									onclick={() => (editDeskDecor = 'neon')}
								>
									Lampe Néon Cyber
								</button>
							</div>
						</div>

						<!-- Humeur et statut personnel -->
						<div class="custom-section">
							<label for="edit-mood" class="section-label">HUMEUR & BULLE PERSONNELLE AU REPOS</label>
							<input
								id="edit-mood"
								class="pixel-input"
								type="text"
								bind:value={editMoodStatus}
								placeholder="ex: Architecte en deep work..."
							/>
							<div class="mood-presets-chips">
								{#each MOOD_PRESETS as preset}
									<button
										type="button"
										class="mood-chip-btn"
										class:active={editMoodStatus === preset}
										onclick={() => (editMoodStatus = preset)}
									>
										{preset}
									</button>
								{/each}
							</div>
						</div>
					{:else}
						<!-- Rôle, Titre et Objectifs -->
						<div class="custom-section">
							<label for="edit-title" class="section-label">INTITULÉ DE POSTE / TITRE</label>
							<input
								id="edit-title"
								class="pixel-input"
								type="text"
								bind:value={editTitle}
								placeholder="ex: Architecte Full-Stack"
							/>
						</div>

						<div class="custom-section">
							<label for="edit-role" class="section-label">RÔLE HIÉRARCHIQUE</label>
							<select id="edit-role" class="pixel-select" bind:value={editRole}>
								<option value="lead-dev">lead-dev (Orchestrateur & Direction)</option>
								<option value="ops-quality">ops-quality (Spécialiste QA & Sécurité)</option>
								<option value="integrations">integrations (Spécialiste Data & API)</option>
								<option value="subagent">subagent (Renfort Temporaire)</option>
							</select>
						</div>

						<div class="custom-section">
							<label for="edit-mission" class="section-label">OBJECTIF & MISSION PRINCIPALE</label>
							<textarea
								id="edit-mission"
								class="pixel-textarea"
								rows="3"
								bind:value={editMission}
								placeholder="Objectifs de l'agent, directives et responsabilités..."
							></textarea>
						</div>

						<div class="custom-section">
							<span class="section-label">SKILLS ATTRIBUÉES (ECO-TOKENS)</span>
							<div class="skills-selector">
								{#each BULLES_SKILLS as skill}
									<button
										type="button"
										class="skill-toggle-chip"
										class:checked={editSkills.includes(skill)}
										onclick={() => toggleEditSkill(skill)}
									>
										{skill}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<div class="dialog-actions">
					<button
						type="button"
						class="pixel-btn secondary"
						onclick={() => (showCustomizerModal = false)}
					>
						ANNULER
					</button>
					<button type="button" class="pixel-btn ok-btn" onclick={saveCustomizerConfig}>
						ENREGISTRER LA CONFIGURATION
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- MODALE PHASE 2 : TABLEAU KANBAN DES SPECS & QA (ops-quality) -->
	{#if showKanbanModal}
		<div
			class="modal-backdrop"
			onclick={() => (showKanbanModal = false)}
			role="presentation"
		>
			<div
				class="kanban-dialog"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.key === 'Escape' && (showKanbanModal = false)}
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<div class="dialog-header">
					<div class="dialog-title-block">
						<span class="dialog-dot" style="background: #38bdf8;"></span>
						<h2>TABLEAU KANBAN DES SPECS & QA (ops-quality)</h2>
						<span class="hierarchy-pill">MUR DE TESTS</span>
					</div>
					<button
						type="button"
						class="btn-close-dialog"
						onclick={() => (showKanbanModal = false)}
					>
						✕
					</button>
				</div>

				<div class="kanban-board-body">
					<!-- COLONNE 1 : À FAIRE -->
					<div class="kanban-col col-todo">
						<div class="kanban-col-header">
							<span class="col-pill pill-todo">À FAIRE</span>
							<span class="col-count">3</span>
						</div>
						<div class="kanban-cards-stack">
							<div class="kanban-card">
								<span class="card-id">SPEC-003</span>
								<strong class="card-title">Validation CI & Lighthouse</strong>
								<p class="card-desc">Score 100/100, audits accessibilité a11y et pré-commit checklist.</p>
								<div class="card-tags">
									<span class="tag-pill tag-qa">ops-quality</span>
									<span class="tag-pill">PWA</span>
								</div>
							</div>
							<div class="kanban-card">
								<span class="card-id">SPEC-004</span>
								<strong class="card-title">Living Documentation (.md)</strong>
								<p class="card-desc">Synchronisation temps réel DESIGN_SYSTEM.md & BLUEPRINT.md.</p>
								<div class="card-tags">
									<span class="tag-pill tag-doc">LivingDoc</span>
								</div>
							</div>
							<div class="kanban-card">
								<span class="card-id">SPEC-005</span>
								<strong class="card-title">Sauvegardes Cloudflare R2</strong>
								<p class="card-desc">Sauvegarde automatisée de la base et des secrets chiffrés.</p>
								<div class="card-tags">
									<span class="tag-pill tag-infra">R2 S3</span>
								</div>
							</div>
						</div>
					</div>

					<!-- COLONNE 2 : EN COURS -->
					<div class="kanban-col col-wip">
						<div class="kanban-col-header">
							<span class="col-pill pill-wip">EN COURS (SPRINT)</span>
							<span class="col-count">1</span>
						</div>
						<div class="kanban-cards-stack">
							<div class="kanban-card active-card">
								<div class="card-live-dot"></div>
								<span class="card-id">PHASE-002</span>
								<strong class="card-title">Tableau Kanban 8-bit & Rack Serveur</strong>
								<p class="card-desc">Visualisation murale QA et diodes animées de déploiement Coolify.</p>
								<div class="card-progress-bar">
									<div class="progress-fill" style="width: 85%;"></div>
								</div>
								<div class="card-tags">
									<span class="tag-pill tag-lead">lead-dev</span>
									<span class="tag-pill tag-qa">ops-quality</span>
									<span class="tag-pill tag-wip">85% WIP</span>
								</div>
							</div>
						</div>
					</div>

					<!-- COLONNE 3 : TERMINÉ -->
					<div class="kanban-col col-done">
						<div class="kanban-col-header">
							<span class="col-pill pill-done">TERMINÉ & VALIDÉ</span>
							<span class="col-count">3</span>
						</div>
						<div class="kanban-cards-stack">
							<div class="kanban-card done-card">
								<span class="card-id">PHASE-001</span>
								<strong class="card-title">Jalons STOP 1-clic & Boîte RPG</strong>
								<p class="card-desc">Validation immédiate des jalons humains et typewriter 16-bit.</p>
								<div class="card-tags">
									<span class="tag-pill tag-done">✔ VALIDÉ QA</span>
								</div>
							</div>
							<div class="kanban-card done-card">
								<span class="card-id">SPEC-001</span>
								<strong class="card-title">Scaffolding SvelteKit 5 Runes</strong>
								<p class="card-desc">Architecture mobile-first, canvas 320x208 et adapter-node.</p>
								<div class="card-tags">
									<span class="tag-pill tag-done">✔ PASS</span>
								</div>
							</div>
							<div class="kanban-card done-card">
								<span class="card-id">SPEC-002</span>
								<strong class="card-title">Bus d'événements & SSE Watcher</strong>
								<p class="card-desc">Flux continu Antigravity, OpenCode et synchronisation transcripts.</p>
								<div class="card-tags">
									<span class="tag-pill tag-done">✔ PASS</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="dialog-actions">
					<button
						type="button"
						class="pixel-btn ok-btn"
						onclick={() => (showKanbanModal = false)}
					>
						FERMER LE KANBAN
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- MODALE PHASE 2 : RACK SERVEUR COOLIFY & INFRASTRUCTURE CLOUD -->
	{#if showServerModal}
		<div
			class="modal-backdrop"
			onclick={() => (showServerModal = false)}
			role="presentation"
		>
			<div
				class="server-dialog"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.key === 'Escape' && (showServerModal = false)}
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<div class="dialog-header">
					<div class="dialog-title-block">
						<span class="dialog-dot" style="background: #22c55e;"></span>
						<h2>INFRASTRUCTURE SERVEURS COOLIFY & CLOUDFLARE</h2>
						<span class="hierarchy-pill">RACK 19 POUCES</span>
					</div>
					<button
						type="button"
						class="btn-close-dialog"
						onclick={() => (showServerModal = false)}
					>
						✕
					</button>
				</div>

				<div class="server-dialog-body">
					<div class="servers-grid">
						<!-- SERVEUR 1 : COOLIFY -->
						<div class="server-status-card" class:deploying={isSimulatingDeploy}>
							<div class="server-card-header">
								<div class="server-card-title">
									<span class="status-indicator-led led-green"></span>
									<strong>COOLIFY APPLICATION</strong>
								</div>
								<span class="server-port-tag">PORT 3000 / 5173</span>
							</div>
							<div class="server-card-metrics">
								<div class="metric-row">
									<span>Statut</span>
									<strong class="text-green">{isSimulatingDeploy ? 'DÉPLOIEMENT ACTIF 🚀' : 'EN LIGNE (HEALTHY) ✔'}</strong>
								</div>
								<div class="metric-row">
									<span>Runtime</span>
									<span>Node.js 22 LTS (@sveltejs/adapter-node)</span>
								</div>
								<div class="metric-row">
									<span>Charge Mémoire</span>
									<span>142 MB / 2048 MB (7%)</span>
								</div>
								<div class="metric-row">
									<span>Uptime</span>
									<span>99.98% (Dernier redémarrage propre)</span>
								</div>
							</div>
						</div>

						<!-- SERVEUR 2 : TURSO LIBSQL -->
						<div class="server-status-card">
							<div class="server-card-header">
								<div class="server-card-title">
									<span class="status-indicator-led led-green"></span>
									<strong>TURSO LIBSQL MANAGEE</strong>
								</div>
								<span class="server-port-tag">REGION cdg (Paris)</span>
							</div>
							<div class="server-card-metrics">
								<div class="metric-row">
									<span>Statut</span>
									<strong class="text-green">SYNCHRONISÉE ✔</strong>
								</div>
								<div class="metric-row">
									<span>Mode Local Dev</span>
									<span>file:pixel-office.local.db</span>
								</div>
								<div class="metric-row">
									<span>Latence ping</span>
									<span>8 ms</span>
								</div>
								<div class="metric-row">
									<span>Migrations</span>
									<span>0 en attente (Up to date)</span>
								</div>
							</div>
						</div>

						<!-- SERVEUR 3 : CLOUDFLARE TUNNELS -->
						<div class="server-status-card">
							<div class="server-card-header">
								<div class="server-card-title">
									<span class="status-indicator-led led-green"></span>
									<strong>CLOUDFLARE ZERO TRUST</strong>
								</div>
								<span class="server-port-tag">PROXY ORANGE</span>
							</div>
							<div class="server-card-metrics">
								<div class="metric-row">
									<span>Statut Tunnels</span>
									<strong class="text-green">ACTIF & CHIFFRÉ ✔</strong>
								</div>
								<div class="metric-row">
									<span>SSL / TLS</span>
									<span>Full (Strict) TLS 1.3</span>
								</div>
								<div class="metric-row">
									<span>Protection DDoS</span>
									<span>Armée (Turnstile & Rate-limit)</span>
								</div>
							</div>
						</div>

						<!-- SERVEUR 4 : CLOUDFLARE R2 -->
						<div class="server-status-card">
							<div class="server-card-header">
								<div class="server-card-title">
									<span class="status-indicator-led led-green"></span>
									<strong>CLOUDFLARE R2 BACKUPS</strong>
								</div>
								<span class="server-port-tag">S3 BUCKET</span>
							</div>
							<div class="server-card-metrics">
								<div class="metric-row">
									<span>Sauvegardes Auto</span>
									<strong class="text-green">QUOTIDIENNE (24H) ✔</strong>
								</div>
								<div class="metric-row">
									<span>Dernier Snapshot</span>
									<span>Il y a 32 minutes (14.2 MB)</span>
								</div>
								<div class="metric-row">
									<span>Restauration test</span>
									<span>Validée sur environnement de test</span>
								</div>
							</div>
						</div>
					</div>

					<!-- ACTION DÉPLOIEMENT DIRECT -->
					<div class="deploy-action-bar">
						<div class="deploy-info">
							<strong class="deploy-title">DÉPLOIEMENT AUTOMATISÉ</strong>
							<span class="deploy-subtitle">Simuler un cycle complet Git PR → Coolify Webhook → Build Docker</span>
						</div>
						<button
							type="button"
							class="pixel-btn ok-btn deploy-trigger-btn"
							disabled={isSimulatingDeploy}
							onclick={triggerDeploySimulation}
						>
							{#if isSimulatingDeploy}
								COMPILATION & DÉPLOIEMENT EN COURS...
							{:else}
								🚀 DÉCLENCHER DÉPLOIEMENT TEST
							{/if}
						</button>
					</div>
				</div>

				<div class="dialog-actions">
					<button
						type="button"
						class="pixel-btn secondary"
						onclick={() => (showServerModal = false)}
					>
						FERMER L'INFRASTRUCTURE
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(*) {
		-webkit-font-smoothing: none;
		-moz-osx-font-smoothing: grayscale;
		font-smooth: never;
		text-rendering: pixelated;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #080d16;
		color: #f8fafc;
		font-family: 'Press Start 2P', 'Silkscreen', monospace;
		overflow: hidden;
		user-select: none;
	}

	:global(button),
	:global(input),
	:global(select),
	:global(textarea) {
		font-family: 'Press Start 2P', 'Silkscreen', monospace;
		-webkit-font-smoothing: none;
		-moz-osx-font-smoothing: grayscale;
		font-smooth: never;
	}

	/* 1. COCKPIT SHELL (Layout 3 colonnes plein écran) */
	.cockpit-shell {
		display: flex;
		width: 100vw;
		height: 100dvh;
		background: #080d16;
		overflow: hidden;
	}

	/* 2. BARRE LATÉRALE GAUCHE (Refonte : 60px compact -> 210px étendu) */
	.cockpit-sidebar {
		width: 60px;
		flex-shrink: 0;
		height: 100dvh;
		background: #080d18;
		border-right: 2px solid #1e293b;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10px 0 8px 0;
		box-sizing: border-box;
		z-index: 30;
		transition: width 150ms cubic-bezier(0.4, 0, 0.2, 1);
		overflow-x: hidden;
		overflow-y: auto;
	}

	.cockpit-sidebar.expanded {
		width: 210px;
		align-items: stretch;
		padding: 10px 10px 8px 10px;
	}

	.sidebar-header-dock {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		margin-bottom: 12px;
		gap: 6px;
	}

	.cockpit-sidebar.expanded .sidebar-header-dock {
		flex-direction: row;
		justify-content: space-between;
		padding: 0 2px;
	}

	.cockpit-logo {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		background: #111827;
		border: 2px solid #d81b60;
		box-shadow: 2px 2px 0px #000000;
		position: relative;
		flex-shrink: 0;
		border-radius: 2px;
	}

	.logo-dot {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 5px;
		height: 5px;
		background: #d81b60;
		box-shadow: 0 0 6px #d81b60;
	}

	.logo-text {
		font-family: 'Press Start 2P', monospace;
		font-size: 10px;
		color: #ffffff;
		font-weight: bold;
	}

	.btn-toggle-expand {
		background: #111827;
		border: 1px solid #334155;
		color: #94a3b8;
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		width: 38px;
		height: 20px;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.cockpit-sidebar.expanded .btn-toggle-expand {
		width: auto;
		height: 24px;
		padding: 0 8px;
	}

	.btn-toggle-expand:hover {
		background: #1e293b;
		color: #38bdf8;
		border-color: #38bdf8;
	}

	.cockpit-nav-buttons {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
		width: 100%;
		padding: 0;
		box-sizing: border-box;
	}

	.cockpit-sidebar.expanded .cockpit-nav-buttons {
		align-items: stretch;
	}

	.nav-section-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #475569;
		letter-spacing: 0.5px;
		padding: 6px 4px 2px 4px;
		text-align: left;
		white-space: nowrap;
	}

	.nav-divider {
		width: 26px;
		height: 1px;
		background: #1e293b;
		margin: 3px 0;
	}

	.cockpit-sidebar.expanded .nav-divider {
		width: 100%;
		margin: 4px 0;
	}

	.nav-icon-btn {
		width: 42px;
		height: 42px;
		background: #0f172a;
		border: 2px solid #1e293b;
		box-shadow: 2px 2px 0px #000000;
		color: #94a3b8;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		box-sizing: border-box;
		transition: all 120ms ease;
		flex-shrink: 0;
		border-radius: 2px;
	}

	.cockpit-sidebar.expanded .nav-icon-btn {
		width: 100%;
		height: 42px;
		padding: 4px 10px;
		justify-content: flex-start;
		gap: 10px;
	}

	.nav-icon-btn:hover {
		background: #1e293b;
		border-color: #38bdf8;
		color: #ffffff;
		box-shadow: 0 0 8px rgba(56, 189, 248, 0.4), 2px 2px 0px #000000;
	}

	.nav-icon-btn.active {
		background: #1e1b4b;
		border-color: #d81b60;
		color: #ffffff;
		box-shadow: 0 0 8px rgba(216, 27, 96, 0.5), 2px 2px 0px #000000;
	}

	.nav-icon-btn.muted {
		opacity: 0.4;
		border-color: #334155;
		color: #64748b;
	}

	.nav-btn-icon {
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		font-weight: bold;
		color: currentColor;
		flex-shrink: 0;
		text-align: center;
		line-height: 1;
	}

	.cockpit-sidebar.expanded .nav-btn-icon {
		width: 22px;
		text-align: center;
	}

	.pulse-icon {
		color: #38bdf8;
		animation: pulseChiptune 0.8s infinite alternate;
	}

	@keyframes pulseChiptune {
		0% {
			transform: scale(1);
			color: #38bdf8;
		}
		100% {
			transform: scale(1.15);
			color: #f43f5e;
		}
	}

	.nav-btn-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		overflow: hidden;
		min-width: 0;
	}

	.nav-btn-label {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		line-height: 1.2;
		color: #cbd5e1;
		white-space: nowrap;
	}

	.nav-btn-sub {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		color: #64748b;
		line-height: 1.1;
		white-space: nowrap;
	}

	.sidebar-bottom-badge {
		margin-top: auto;
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		color: #475569;
		padding: 4px 6px;
		border: 1px solid #1e293b;
		background: #090e17;
		text-align: center;
	}

	/* 3. ZONE CENTRALE (Bandeau KPI + Scène Top-Down + Journal) */
	.cockpit-center {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		height: 100dvh;
		background: #080d16;
		position: relative;
		overflow: hidden;
	}

	.kpi-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 16px;
		background: #0f1626;
		border-bottom: 2px solid #1e293b;
		gap: 14px;
		box-sizing: border-box;
		flex-wrap: wrap;
		z-index: 10;
	}

	.kpi-main-title {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.pixel-indicator-green {
		width: 8px;
		height: 8px;
		background: #22c55e;
		box-shadow: 0 0 8px #22c55e;
	}

	.kpi-main-title h1 {
		font-family: 'Press Start 2P', monospace;
		font-size: 11px;
		margin: 0;
		color: #ffffff;
		letter-spacing: 0.5px;
	}

	.kpi-main-title .subtitle {
		margin: 0;
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #94a3b8;
		line-height: 1;
	}

	.kpi-metrics-row {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.kpi-card {
		display: flex;
		flex-direction: column;
		padding: 4px 8px;
		background: #111827;
		border: 2px solid #1e293b;
		box-shadow: 1px 1px 0px #000000;
		gap: 2px;
	}

	.kpi-label {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #64748b;
		letter-spacing: 0.5px;
	}

	.kpi-val {
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		color: #ffffff;
	}

	.kpi-val.highlight {
		color: #38bdf8;
	}

	.kpi-val.alert {
		color: #f59e0b;
		animation: pulseCard 0.8s infinite alternate;
	}

	.kpi-val.project-text {
		color: #f472b6;
	}

	.kpi-watchers {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 6px;
		background: #111827;
		border: 2px solid #1e293b;
	}

	.mini-watcher {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 4px;
		background: #1e293b;
		border: 1px solid #334155;
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #64748b;
	}

	.mini-watcher .watcher-dot {
		width: 5px;
		height: 5px;
		background: #475569;
	}

	.mini-watcher.active {
		border-color: #22c55e;
		color: #4ade80;
	}

	.mini-watcher.active .watcher-dot {
		background: #22c55e;
		box-shadow: 0 0 6px #22c55e;
	}

	.kpi-clock {
		font-family: 'Press Start 2P', monospace;
		font-size: 9px;
		color: #cbd5e1;
		padding: 4px 8px;
		background: #111827;
		border: 2px solid #334155;
	}

	/* SCÈNE DU BUREAU TOP-DOWN (100% VISIBLE ET LIBÉRÉE) */
	.stage-viewport {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		position: relative;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 6px 12px 6px 12px;
		gap: 6px;
		box-sizing: border-box;
	}

	.canvas-frame {
		position: relative;
		aspect-ratio: 20 / 13;
		flex: 1 1 0;
		min-height: 0;
		width: auto;
		max-width: 100%;
		border: 4px solid #000000;
		box-shadow:
			0 0 0 2px #1e293b,
			0 16px 40px rgba(0, 0, 0, 0.85);
		background: #18202c;
		cursor: crosshair;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
		image-rendering: pixelated;
		image-rendering: crisp-edges;
	}

	.bubbles-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 5;
	}

	.agent-hud-anchor {
		position: absolute;
		transform: translate(-50%, -100%);
		transition:
			left 55ms linear,
			top 55ms linear;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.agent-hud-anchor.is-selected {
		z-index: 12;
	}

	.permission-alert-badge {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		background: #f59e0b;
		color: #000000;
		padding: 3px 6px;
		border: 2px solid #ffffff;
		margin-bottom: 3px;
		animation: pulseBorder 0.5s infinite alternate;
	}

	.done-check-badge {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		background: #22c55e;
		color: #052e16;
		padding: 2px 5px;
		border: 1px solid #ffffff;
		margin-bottom: 3px;
	}

	.speech-bubble.mini-pill {
		min-width: 0;
		max-width: 145px;
		height: 18px;
		background: rgba(8, 13, 24, 0.78);
		backdrop-filter: blur(2px);
		border: 1.5px solid var(--agent-color, #d81b60);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.8), 1px 1px 0px #000000;
		padding: 0 6px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		white-space: nowrap;
		position: relative;
		margin-bottom: 3px;
		pointer-events: auto;
		cursor: pointer;
		border-radius: 2px;
		transition: all 0.15s ease;
		user-select: none;
	}

	.speech-bubble.mini-pill:hover {
		background: rgba(15, 23, 42, 0.95);
		border-color: #38bdf8;
		max-width: 220px;
		z-index: 20;
		transform: translateY(-1px);
	}

	.speech-bubble.mini-pill.is-calling {
		border-color: #38bdf8;
		background: rgba(12, 74, 110, 0.88);
		animation: pulsePill 0.6s infinite alternate;
	}

	.speech-bubble.mini-pill.is-waiting {
		border-color: #f59e0b;
		background: rgba(120, 53, 15, 0.88);
		animation: pulsePill 0.5s infinite alternate;
	}

	.speech-bubble.mini-pill.is-selected {
		border-color: #38bdf8;
		box-shadow: 0 0 8px rgba(56, 189, 248, 0.7), 1px 1px 0px #000000;
	}

	@keyframes pulsePill {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(-2px);
		}
	}

	.speech-bubble.mini-pill::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 3px solid transparent;
		border-right: 3px solid transparent;
		border-top: 4px solid var(--agent-color, #d81b60);
	}

	.speech-bubble.mini-pill .pill-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: #64748b;
		flex-shrink: 0;
	}

	.speech-bubble.mini-pill .pill-dot.state-working {
		background: #22c55e;
		box-shadow: 0 0 5px #22c55e;
	}

	.speech-bubble.mini-pill .pill-dot.state-waiting_human {
		background: #f59e0b;
		box-shadow: 0 0 6px #f59e0b;
		animation: livePulse 0.8s infinite;
	}

	.speech-bubble.mini-pill .pill-dot.state-done {
		background: #4ade80;
	}

	.speech-bubble.mini-pill .pill-dot.state-calling,
	.speech-bubble.mini-pill .pill-dot.state-visiting {
		background: #38bdf8;
		box-shadow: 0 0 6px #38bdf8;
	}

	.speech-bubble.mini-pill .pill-name {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #ffffff;
		flex-shrink: 0;
		letter-spacing: 0.2px;
	}

	.speech-bubble.mini-pill .pill-sep {
		font-size: 8px;
		color: #64748b;
		flex-shrink: 0;
	}

	.speech-bubble.mini-pill .pill-action {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		color: #7dd3fc;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1;
	}

	/* TIROIR DE COMMANDE DOCKABLE */
	.control-drawer-dock {
		position: absolute;
		right: 12px;
		top: 12px;
		bottom: 12px;
		width: 320px;
		background: rgba(13, 19, 31, 0.98);
		border: 3px solid #d81b60;
		box-shadow: -4px 0 24px rgba(0, 0, 0, 0.85);
		padding: 14px;
		overflow-y: auto;
		z-index: 25;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.drawer-header-dock {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 2px solid #334155;
		padding-bottom: 6px;
	}

	.drawer-header-dock h2 {
		font-family: 'Press Start 2P', monospace;
		font-size: 9px;
		margin: 0;
		color: #f472b6;
	}

	.btn-close-dock {
		background: transparent;
		border: 1px solid #64748b;
		color: #ffffff;
		font-family: 'Press Start 2P', monospace;
		font-size: 9px;
		cursor: pointer;
		padding: 2px 6px;
	}

	.btn-close-dock:hover {
		background: #ef4444;
		border-color: #ef4444;
	}

	.drawer-body-dock h3 {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		margin: 8px 0 4px 0;
		color: #38bdf8;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 3px;
		margin-bottom: 6px;
	}

	.control-group label {
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #cbd5e1;
	}

	.control-group select,
	.control-group input,
	.control-row input {
		font-family: 'Silkscreen', monospace;
		font-size: 9px;
		padding: 5px 6px;
		background: #1e293b;
		color: #ffffff;
		border: 2px solid #475569;
	}

	.control-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		margin-bottom: 6px;
	}

	.btn-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		margin-bottom: 6px;
	}

	.btn-grid.three-cols {
		grid-template-columns: 1fr 1fr 1fr;
	}

	.pixel-btn {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		padding: 6px 8px;
		background: #d81b60;
		color: #ffffff;
		border: 2px solid #ffffff;
		box-shadow: 2px 2px 0px #000000;
		cursor: pointer;
		transition: transform 80ms ease;
		white-space: nowrap;
	}

	.pixel-btn:active {
		transform: translate(2px, 2px);
		box-shadow: 0px 0px 0px #000000;
	}

	.pixel-btn.secondary {
		background: #134242;
		border-color: #c2e8e8;
		color: #c2e8e8;
	}

	.pixel-btn.highlight-btn {
		background: #f59e0b;
		border-color: #fef08a;
		color: #1a1a1a;
	}

	.pixel-btn.warn-btn {
		background: #b45309;
		border-color: #fde68a;
		color: #fef3c7;
	}

	.pixel-btn.ok-btn {
		background: #15803d;
		border-color: #bbf7d0;
		color: #f0fdf4;
	}

	hr {
		border: none;
		border-top: 2px dashed #1e293b;
		margin: 8px 0;
	}

	/* PIED DE PAGE : JOURNAL DU COCKPIT */
	.cockpit-footer {
		height: 32px;
		background: #090e17;
		border-top: 2px solid #1e293b;
		display: flex;
		align-items: center;
		padding: 0 14px;
		gap: 12px;
		box-sizing: border-box;
		flex-shrink: 0;
		z-index: 10;
	}

	.footer-badge {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		color: #d81b60;
		background: #24111f;
		border: 1px solid #d81b60;
		padding: 2px 6px;
		white-space: nowrap;
	}

	.footer-ticker {
		display: flex;
		align-items: center;
		gap: 18px;
		overflow-x: auto;
		white-space: nowrap;
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
	}

	.log-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.log-time {
		color: #64748b;
	}

	.log-source {
		color: #2dd4bf;
		font-weight: bold;
	}

	.log-summary {
		color: #e2e8f0;
	}

	/* 4. VOLET LATÉRAL DROIT : RÉGIE D'ÉQUIPE (310px repliable) */
	.docked-roster-tab {
		position: fixed;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		background: #111827;
		border: 2px solid #38bdf8;
		border-right: none;
		padding: 10px 6px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		z-index: 35;
		cursor: pointer;
		box-shadow: -2px 0 12px rgba(0, 0, 0, 0.7);
		transition: all 100ms ease;
	}

	.docked-roster-tab:hover {
		background: #1e293b;
		border-color: #ffffff;
	}

	.docked-arrow {
		color: #38bdf8;
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
	}

	.docked-text {
		writing-mode: vertical-lr;
		text-orientation: mixed;
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		color: #f8fafc;
		letter-spacing: 1px;
	}

	.team-sidebar {
		width: 310px;
		flex-shrink: 0;
		height: 100dvh;
		background: #0c121e;
		border-left: 2px solid #1e293b;
		display: flex;
		flex-direction: column;
		z-index: 20;
		overflow: hidden;
		box-sizing: border-box;
		transition: width 180ms ease, opacity 140ms ease;
	}

	.team-sidebar.collapsed {
		width: 0px !important;
		min-width: 0 !important;
		border-left: none !important;
		opacity: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.sidebar-section-title {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		background: #0f1728;
		border-bottom: 2px solid #1e293b;
		flex-shrink: 0;
	}

	.section-title-dot {
		width: 7px;
		height: 7px;
		background: #38bdf8;
		box-shadow: 0 0 6px #38bdf8;
	}

	.sidebar-section-title h2 {
		font-family: 'Press Start 2P', monospace;
		font-size: 9px;
		margin: 0;
		color: #ffffff;
		letter-spacing: 0.5px;
	}

	.live-status-pill {
		margin-left: auto;
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		background: #14532d;
		color: #4ade80;
		padding: 2px 4px;
		border: 1px solid #22c55e;
	}

	.btn-toggle-collapse {
		background: #111827;
		border: 1px solid #334155;
		color: #94a3b8;
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		padding: 3px 5px;
		cursor: pointer;
		margin-left: 6px;
	}

	.btn-toggle-collapse:hover {
		background: #1e293b;
		color: #ffffff;
		border-color: #38bdf8;
	}

	.team-roster-scroll {
		flex: 1;
		overflow-y: auto;
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		scrollbar-width: thin;
	}

	.hierarchy-cluster {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.cluster-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #38bdf8;
		padding-bottom: 3px;
		border-bottom: 1px solid #1e293b;
		letter-spacing: 0.5px;
	}

	.count-pill {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		background: #1e293b;
		color: #cbd5e1;
		padding: 1px 4px;
	}

	.agent-roster-card {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		background: #111827;
		border: 2px solid #1e293b;
		box-shadow: 2px 2px 0px #000000;
		color: #f8fafc;
		cursor: pointer;
		text-align: left;
		width: 100%;
		box-sizing: border-box;
		transition: all 80ms ease;
	}

	.agent-roster-card:hover {
		background: #182236;
		border-color: #475569;
	}

	.agent-roster-card.selected {
		border-color: #38bdf8;
		background: #142236;
		box-shadow: 2px 2px 0px var(--agent-theme, #38bdf8);
	}

	.agent-roster-card.attention {
		border-color: #f59e0b;
		animation: pulseCard 0.8s infinite alternate;
	}

	.subagent-card {
		border-style: dashed;
	}

	.roster-mugshot {
		width: 28px;
		height: 32px;
		background-color: #18202c;
		border: 1px solid #475569;
		background-size: 196px 168px;
		background-position: -28px -4px;
		background-repeat: no-repeat;
		image-rendering: pixelated;
		flex-shrink: 0;
	}

	.roster-meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.roster-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 4px;
	}

	.roster-name {
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		color: #ffffff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		background: #64748b;
		flex-shrink: 0;
	}

	.status-dot.working {
		background: #22c55e;
		box-shadow: 0 0 6px #22c55e;
	}

	.status-dot.waiting {
		background: #f59e0b;
		box-shadow: 0 0 6px #f59e0b;
	}

	.status-dot.done {
		background: #10b981;
	}

	.roster-title {
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #94a3b8;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.roster-status-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 4px;
		margin-top: 1px;
	}

	.roster-state-chip {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		line-height: 1;
		padding: 2px 4px;
		background: #1e293b;
		color: #cbd5e1;
		letter-spacing: 0.5px;
	}

	.roster-state-chip.state-working {
		background: #14532d;
		color: #4ade80;
	}

	.roster-state-chip.state-waiting_human {
		background: #b45309;
		color: #fef3c7;
	}

	.roster-state-chip.state-done {
		background: #15803d;
		color: #bbf7d0;
	}

	.mana-pct {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #64748b;
	}

	.roster-mana-bar {
		width: 100%;
		height: 3px;
		background: #090e17;
		border: 1px solid #1e293b;
		margin-top: 1px;
		overflow: hidden;
	}

	.roster-mana-fill {
		height: 100%;
		transition: width 200ms ease;
	}

	.empty-subagents-card {
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #64748b;
		font-style: italic;
		padding: 6px 8px;
		background: #090e17;
		border: 1px dashed #1e293b;
		text-align: center;
	}

	/* FICHE INSPECTEUR INTÉGRÉE (Dans la barre latérale droite, 100% hors scène) */
	.integrated-inspector {
		background: #111827;
		border-top: 3px solid var(--agent-accent, #d81b60);
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex-shrink: 0;
		max-height: 52%;
		overflow-y: auto;
		box-sizing: border-box;
		scrollbar-width: thin;
		transition: max-height 150ms ease;
	}

	.integrated-inspector.folded {
		max-height: 52px;
		overflow: hidden;
		padding-bottom: 6px;
	}

	.integrated-inspector.empty-state {
		background: #0d131f;
		border-top: 2px dashed #334155;
		padding: 14px 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 6px;
	}

	.empty-inspector-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		color: #64748b;
	}

	.empty-inspector-hint {
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #94a3b8;
		margin: 0;
		line-height: 1.4;
	}

	.inspector-top-banner {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.inspector-avatar {
		width: 32px;
		height: 36px;
		background-color: #18202c;
		border: 1px solid #475569;
		background-size: 224px 192px;
		background-position: -32px -4px;
		background-repeat: no-repeat;
		image-rendering: pixelated;
		flex-shrink: 0;
	}

	.inspector-agent-id {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.role-badge {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #38bdf8;
		letter-spacing: 0.5px;
	}

	.inspector-agent-id h3 {
		font-family: 'Press Start 2P', monospace;
		font-size: 9px;
		margin: 0;
		color: #ffffff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.inspector-role-title {
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #94a3b8;
		line-height: 1.2;
	}

	.inspector-banner-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-left: auto;
	}

	.btn-inspector-action {
		background: #1e293b;
		border: 1px solid #475569;
		color: #cbd5e1;
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		padding: 3px 5px;
		cursor: pointer;
	}

	.btn-inspector-action:hover {
		background: #334155;
		color: #ffffff;
		border-color: #ffffff;
	}

	.btn-inspector-action.btn-deselect {
		color: #f472b6;
	}

	.btn-inspector-action.btn-deselect:hover {
		background: #ef4444;
		border-color: #ef4444;
		color: #ffffff;
	}

	.inspector-meta-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		padding: 6px;
		background: #0d131f;
		border: 1px solid #1e293b;
	}

	.meta-field {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.meta-caption {
		font-family: 'Press Start 2P', monospace;
		font-size: 5px;
		color: #64748b;
		letter-spacing: 0.5px;
	}

	.meta-value {
		font-family: 'Silkscreen', monospace;
		font-size: 9px;
		color: #cbd5e1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meta-value.state-label {
		color: #38bdf8;
	}

	.inspector-gauge-section {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.gauge-title-row {
		display: flex;
		justify-content: space-between;
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #94a3b8;
	}

	.gauge-bar-track {
		width: 100%;
		height: 4px;
		background: #090e17;
		border: 1px solid #334155;
		overflow: hidden;
	}

	.gauge-bar-fill {
		height: 100%;
		transition: width 200ms ease;
	}

	.inspector-activity-box {
		padding: 5px 7px;
		background: #0d131f;
		border: 1px solid #1e293b;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.activity-desc {
		margin: 0;
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #38bdf8;
		line-height: 1.2;
	}

	.activity-desc.mission-text {
		color: #cbd5e1;
		font-size: 8px;
	}

	.inspector-skills-wrap {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.skills-pill-box {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
	}

	.skill-tag-pill {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		padding: 2px 4px;
		background: #134242;
		color: #c2e8e8;
		border: 1px solid #2dd4bf;
	}

	.customize-trigger-btn {
		width: 100%;
		margin-top: 4px;
		text-align: center;
	}

	/* 5. MODAL DE CUSTOMISATION DES AGENTS */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(4, 7, 13, 0.88);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 16px;
		box-sizing: border-box;
	}

	.customizer-dialog {
		background: #111827;
		border: 3px solid #d81b60;
		box-shadow: 6px 6px 0px #000000;
		width: 100%;
		max-width: 520px;
		display: flex;
		flex-direction: column;
		max-height: 90dvh;
		overflow: hidden;
	}

	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 14px;
		background: #1e293b;
		border-bottom: 2px solid #334155;
	}

	.dialog-title-block {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.dialog-dot {
		width: 10px;
		height: 10px;
		box-shadow: 0 0 8px currentColor;
	}

	.dialog-header h2 {
		font-family: 'Press Start 2P', monospace;
		font-size: 9px;
		margin: 0;
		color: #ffffff;
	}

	.hierarchy-pill {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		background: #0ea5e9;
		color: #041019;
		padding: 2px 5px;
	}

	.btn-close-dialog {
		background: transparent;
		border: 1px solid #64748b;
		color: #ffffff;
		font-family: 'Press Start 2P', monospace;
		font-size: 9px;
		cursor: pointer;
		padding: 3px 6px;
	}

	.btn-close-dialog:hover {
		background: #ef4444;
		border-color: #ef4444;
	}

	.customizer-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		background: #0b0f19;
		border-bottom: 2px solid #1e293b;
	}

	.mood-presets-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 6px;
	}

	.mood-chip-btn {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		background: #0f172a;
		border: 1px solid #334155;
		color: #94a3b8;
		padding: 3px 6px;
		cursor: pointer;
		border-radius: 2px;
		transition: all 0.1s ease;
	}

	.mood-chip-btn:hover {
		border-color: #38bdf8;
		color: #ffffff;
	}

	.mood-chip-btn.active {
		background: #022c22;
		border-color: #10b981;
		color: #a7f3d0;
	}

	.tab-btn {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		padding: 9px;
		background: transparent;
		color: #94a3b8;
		border: none;
		border-bottom: 3px solid transparent;
		cursor: pointer;
	}

	.tab-btn.active {
		color: #ffffff;
		border-bottom-color: #d81b60;
		background: #131c2d;
	}

	.dialog-content {
		padding: 14px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 14px;
		scrollbar-width: thin;
	}

	.custom-section {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.section-label {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		color: #38bdf8;
		letter-spacing: 0.5px;
	}

	.sprite-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 6px;
	}

	.sprite-choice-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 6px 2px;
		background: #1e293b;
		border: 2px solid #334155;
		cursor: pointer;
		gap: 4px;
	}

	.sprite-choice-card:hover {
		border-color: #94a3b8;
	}

	.sprite-choice-card.selected {
		border-color: #d81b60;
		background: #2a1628;
		box-shadow: 0 0 6px #d81b60;
	}

	.sprite-preview {
		width: 28px;
		height: 32px;
		background-size: 196px 168px;
		background-position: -28px -4px;
		background-repeat: no-repeat;
		image-rendering: pixelated;
	}

	.sprite-label {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #cbd5e1;
	}

	.color-palette-grid {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.color-circle {
		width: 24px;
		height: 24px;
		border: 2px solid #334155;
		cursor: pointer;
		border-radius: 2px;
	}

	.color-circle.selected {
		border-color: #ffffff;
		transform: scale(1.15);
		box-shadow: 0 0 6px #ffffff;
	}

	.accessory-chips {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.chip-btn {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		padding: 6px 8px;
		background: #1e293b;
		border: 2px solid #334155;
		color: #cbd5e1;
		cursor: pointer;
	}

	.chip-btn.active {
		border-color: #38bdf8;
		color: #38bdf8;
		background: #0c2738;
	}

	.pixel-input,
	.pixel-select,
	.pixel-textarea {
		font-family: 'Silkscreen', monospace;
		font-size: 10px;
		padding: 6px 8px;
		background: #1e293b;
		color: #ffffff;
		border: 2px solid #475569;
		box-sizing: border-box;
		width: 100%;
	}

	.pixel-textarea {
		resize: vertical;
	}

	.skills-selector {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.skill-toggle-chip {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		padding: 4px 6px;
		background: #1e293b;
		border: 1px solid #475569;
		color: #94a3b8;
		cursor: pointer;
	}

	.skill-toggle-chip.checked {
		border-color: #22c55e;
		color: #4ade80;
		background: #0f2e1e;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 10px 14px;
		background: #1e293b;
		border-top: 2px solid #334155;
	}

	/* ========================================================
	   PHASE 1 : JALON HUMAIN (STOP) & BOÎTE DE DIALOGUE RPG
	   ======================================================== */
	@keyframes gatePulse {
		0% {
			box-shadow: 0 0 0 2px #f59e0b, 0 4px 16px rgba(245, 158, 11, 0.4);
		}
		100% {
			box-shadow: 0 0 0 4px #ef4444, 0 6px 24px rgba(239, 68, 68, 0.7);
		}
	}

	@keyframes blinkCursor {
		0%, 49% {
			opacity: 1;
		}
		50%, 100% {
			opacity: 0;
		}
	}

	@keyframes floatArrow {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(3px);
		}
	}

	/* BANNIÈRE D'ALERTE JALON HUMAIN DANS LE CANVAS */
	.human-gate-banner {
		position: absolute;
		top: 8px;
		left: 8px;
		right: 8px;
		z-index: 28;
		background: #090e17;
		border: 3px solid #f59e0b;
		padding: 8px 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		animation: gatePulse 1.2s infinite alternate;
	}

	.gate-banner-left {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.gate-banner-avatar {
		width: 36px;
		height: 36px;
		background-size: 144px 144px;
		background-position: -6px -4px;
		background-repeat: no-repeat;
		image-rendering: pixelated;
		border: 2px solid #f59e0b;
		background-color: #020617;
		flex-shrink: 0;
	}

	.gate-banner-text {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.gate-banner-title {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.gate-stop-sign {
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		color: #ef4444;
		letter-spacing: 0.5px;
	}

	.gate-agent-tag {
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #f59e0b;
	}

	.gate-banner-msg {
		font-family: 'Silkscreen', monospace;
		font-size: 9px;
		color: #e2e8f0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.gate-banner-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.gate-approve-btn {
		background: #15803d !important;
		border-color: #4ade80 !important;
		color: #ffffff !important;
		font-size: 7px !important;
		padding: 6px 10px !important;
	}

	.gate-approve-btn:hover {
		background: #16a34a !important;
		transform: translateY(-1px);
	}

	.gate-reject-btn {
		background: #c2410c !important;
		border-color: #fb923c !important;
		color: #ffffff !important;
		font-size: 7px !important;
		padding: 6px 10px !important;
	}

	.gate-reject-btn:hover {
		background: #ea580c !important;
		transform: translateY(-1px);
	}

	/* BOÎTE DE DIALOGUE RPG RÉTRO (Typewriter Dialogue Box) : POSITIONNÉE SOUS LE CANVAS */
	.rpg-dialogue-box {
		position: relative;
		width: 100%;
		max-width: 820px;
		z-index: 10;
		background: linear-gradient(180deg, #091122 0%, #030712 100%);
		border: 3px solid #fbbf24;
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.95),
			inset 0 0 0 1px #78350f;
		padding: 6px 12px;
		display: flex;
		flex-direction: column;
		cursor: pointer;
		user-select: none;
		box-sizing: border-box;
		flex-shrink: 0;
		margin-top: auto;
	}

	.rpg-dialogue-box.is-gate {
		border-color: #f59e0b;
		box-shadow:
			0 0 0 2px #ef4444,
			0 4px 16px rgba(0, 0, 0, 0.95);
	}

	.rpg-box-inner {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.rpg-portrait-frame {
		width: 44px;
		height: 44px;
		flex-shrink: 0;
		background: #020617;
		border: 2px solid var(--portrait-border, #38bdf8);
		box-shadow: 0 0 0 1px #000000;
		overflow: hidden;
		position: relative;
	}

	.rpg-portrait {
		width: 100%;
		height: 100%;
		/* Spritesheet 112x96 (7 frames de 16x32). La tête de face est en (0,0) avec 16x16px.
		   Zoom x2.75 -> 308px x 264px pour remplir parfaitement le cadre 44x44 sans clone */
		background-size: 308px 264px;
		background-position: 0px 0px;
		background-repeat: no-repeat;
		image-rendering: pixelated;
	}

	.rpg-dialogue-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.rpg-dialogue-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.rpg-speaker-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.rpg-speaker-name {
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		letter-spacing: 0.5px;
	}

	.rpg-type-badge {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		padding: 2px 6px;
		border-radius: 2px;
		border: 1px solid currentColor;
	}

	.rpg-type-badge.type-gate {
		color: #ef4444;
		border-color: #ef4444;
		background: rgba(239, 68, 68, 0.15);
	}

	.rpg-type-badge.type-thought {
		color: #38bdf8;
		border-color: #38bdf8;
		background: rgba(56, 189, 248, 0.15);
	}

	.rpg-type-badge.type-done {
		color: #4ade80;
		border-color: #4ade80;
		background: rgba(74, 222, 128, 0.15);
	}

	.rpg-type-badge.type-action {
		color: #fbbf24;
		border-color: #fbbf24;
		background: rgba(251, 191, 36, 0.15);
	}

	.rpg-close-btn {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		background: transparent;
		border: 1px solid #475569;
		color: #94a3b8;
		padding: 2px 5px;
		cursor: pointer;
	}

	.rpg-close-btn:hover {
		border-color: #ef4444;
		color: #ef4444;
	}

	.rpg-project-badge {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #38bdf8;
		background: #0c1c38;
		border: 1px solid #1e3a8a;
		padding: 2px 6px;
		letter-spacing: 0.5px;
	}

	/* VUE DES SKILLS UTILISÉS DANS LA NOTE EN DESSOUS DU BUREAU */
	.rpg-skills-bar {
		display: flex;
		flex-direction: column;
		gap: 5px;
		background: #030814;
		border: 1px solid #0284c7;
		box-shadow: inset 0 0 8px rgba(2, 132, 199, 0.2);
		padding: 6px 10px;
		margin: 2px 0 6px 0;
		border-radius: 2px;
	}

	.rpg-skills-lead {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.skills-pulse-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #22c55e;
		box-shadow: 0 0 6px #22c55e;
		animation: livePulse 1.2s infinite;
		flex-shrink: 0;
	}

	.rpg-skills-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #38bdf8;
		letter-spacing: 0.5px;
		flex-shrink: 0;
	}

	.rpg-skills-chips {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		align-items: center;
	}

	.rpg-skill-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		background: #061e2a;
		border: 1px solid #0891b2;
		color: #67e8f9;
		padding: 2px 6px;
		border-radius: 2px;
		line-height: 1.2;
		letter-spacing: 0.3px;
		transition: all 0.15s ease;
	}

	.rpg-skill-chip.is-active-skill {
		background: #022c22;
		border-color: #10b981;
		color: #a7f3d0;
		box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
	}

	.skill-dot-neon {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: #34d399;
		box-shadow: 0 0 4px #34d399;
	}

	.skill-chip-name {
		font-weight: 500;
	}

	.skill-active-tag {
		font-family: 'Press Start 2P', monospace;
		font-size: 5px;
		background: #10b981;
		color: #022c22;
		padding: 1px 3px;
		border-radius: 1px;
		font-weight: bold;
		letter-spacing: 0.2px;
	}

	.rpg-projects-group {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		align-items: center;
	}

	.rpg-project-badge.is-primary {
		border-color: #38bdf8;
		color: #ffffff;
		background: #0369a1;
		box-shadow: 0 0 6px rgba(56, 189, 248, 0.5);
	}

	/* STYLES MULTI-PROJETS : KPI, BUBBLES, ROSTER & INSPECTOR */
	.kpi-projects-card {
		min-width: 140px;
	}

	.active-projects-list {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		align-items: center;
		margin-top: 2px;
	}

	.project-pill {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		background: #0f172a;
		border: 1px solid #334155;
		color: #94a3b8;
		padding: 1px 5px;
		border-radius: 2px;
	}

	.project-pill.is-primary {
		background: #022c22;
		border-color: #059669;
		color: #34d399;
		font-weight: bold;
	}

	.live-dot-mini {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 4px #10b981;
		animation: livePulse 1s infinite;
	}

	.agent-multi-projects-chips {
		display: flex;
		gap: 3px;
		flex-wrap: wrap;
		align-items: center;
	}

	.agent-prj-badge {
		font-family: 'Silkscreen', monospace;
		font-size: 6px;
		background: #0f172a;
		border: 1px solid #1e293b;
		color: #64748b;
		padding: 1px 4px;
		border-radius: 2px;
	}

	.agent-prj-badge.is-current {
		background: #042f2e;
		border-color: #0d9488;
		color: #2dd4bf;
		font-weight: bold;
	}

	.roster-projects-row {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-top: 2px;
		flex-wrap: wrap;
	}

	.roster-prj-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 5px;
		color: #475569;
		letter-spacing: 0.3px;
	}

	.roster-prj-badge {
		font-family: 'Silkscreen', monospace;
		font-size: 6px;
		background: #0f172a;
		border: 1px solid #1e293b;
		color: #64748b;
		padding: 1px 4px;
		border-radius: 2px;
	}

	.roster-prj-badge.is-current {
		background: #022c22;
		border-color: #059669;
		color: #34d399;
		font-weight: bold;
	}

	.inspector-projects-chips {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		align-items: center;
	}

	.inspector-prj-pill {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		background: #0f172a;
		border: 1px solid #334155;
		color: #94a3b8;
		padding: 1px 6px;
		border-radius: 2px;
	}

	.inspector-prj-pill.is-current {
		background: #0369a1;
		border-color: #38bdf8;
		color: #ffffff;
		box-shadow: 0 0 6px rgba(56, 189, 248, 0.4);
		font-weight: bold;
	}

	.rpg-text-container {
		min-height: 24px;
	}

	.rpg-typewriter-text {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		line-height: 1.6;
		color: #f8fafc;
		margin: 0;
		word-break: break-word;
	}

	.typewriter-cursor {
		color: #fbbf24;
		animation: blinkCursor 0.5s infinite;
		font-size: 8px;
	}

	.rpg-dialogue-actions {
		display: flex;
		gap: 8px;
		margin-top: 4px;
	}

	.rpg-btn-approve {
		background: #166534 !important;
		border-color: #22c55e !important;
		color: #ffffff !important;
		font-size: 7px !important;
		padding: 4px 8px !important;
	}

	.rpg-btn-reject {
		background: #9a3412 !important;
		border-color: #f97316 !important;
		color: #ffffff !important;
		font-size: 7px !important;
		padding: 4px 8px !important;
	}

	.rpg-next-arrow {
		position: absolute;
		right: 10px;
		bottom: 6px;
		font-size: 8px;
		color: #fbbf24;
		animation: floatArrow 0.6s infinite alternate;
	}

	.btn-restore-dialogue {
		position: relative;
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		background: #091122;
		border: 2px solid #fbbf24;
		color: #fbbf24;
		padding: 6px 12px;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
		margin-top: auto;
		margin-bottom: 2px;
	}

	.btn-restore-dialogue:hover {
		background: #172554;
	}

	/* INSPECTEUR : ACTIONS JALON STOP */
	.inspector-gate-box {
		background: rgba(239, 68, 68, 0.12);
		border: 2px solid #ef4444;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		animation: gatePulse 1.2s infinite alternate;
	}

	.gate-alert-tag {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		color: #ef4444;
	}

	.gate-alert-desc {
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #cbd5e1;
		margin: 0;
		line-height: 1.4;
	}

	.inspector-gate-buttons {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	/* ========================================================
	   PHASE 2 : TABLEAU KANBAN 8-BIT & RACK SERVEUR INFRA
	   ======================================================== */
	/* MODALE KANBAN DES SPECS & QA */
	.kanban-dialog {
		width: min(780px, 94vw);
		max-height: 88vh;
		background: #091122;
		border: 4px solid #38bdf8;
		box-shadow:
			0 0 0 2px #0f172a,
			0 20px 60px rgba(0, 0, 0, 0.95);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.kanban-board-body {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		padding: 16px;
		overflow-y: auto;
		background: #040813;
	}

	@media (max-width: 680px) {
		.kanban-board-body {
			grid-template-columns: 1fr;
		}
	}

	.kanban-col {
		background: #0c1527;
		border: 2px solid #1e293b;
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-height: 280px;
	}

	.kanban-col-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 8px;
		border-bottom: 2px solid #1e293b;
	}

	.col-pill {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		padding: 3px 6px;
		letter-spacing: 0.5px;
	}

	.pill-todo {
		background: rgba(244, 63, 94, 0.2);
		color: #fb7185;
		border: 1px solid #f43f5e;
	}

	.pill-wip {
		background: rgba(245, 158, 11, 0.2);
		color: #fbbf24;
		border: 1px solid #f59e0b;
	}

	.pill-done {
		background: rgba(16, 185, 129, 0.2);
		color: #34d399;
		border: 1px solid #10b981;
	}

	.col-count {
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		color: #64748b;
	}

	.kanban-cards-stack {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.kanban-card {
		background: #111e38;
		border: 2px solid #1e293b;
		padding: 8px 10px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		position: relative;
		transition: transform 0.15s ease, border-color 0.15s ease;
	}

	.kanban-card:hover {
		transform: translateY(-2px);
		border-color: #38bdf8;
	}

	.kanban-card.active-card {
		border-color: #fbbf24;
		background: #1a2333;
		box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
	}

	.card-live-dot {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #22c55e;
		box-shadow: 0 0 6px #22c55e;
		animation: blinkCursor 0.8s infinite alternate;
	}

	.kanban-card.done-card {
		border-color: #065f46;
		background: #081d19;
		opacity: 0.88;
	}

	.card-id {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		color: #38bdf8;
	}

	.card-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		line-height: 1.4;
		color: #f8fafc;
	}

	.card-desc {
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #94a3b8;
		margin: 0;
		line-height: 1.4;
	}

	.card-progress-bar {
		height: 4px;
		background: #0f172a;
		border: 1px solid #334155;
		overflow: hidden;
		margin: 2px 0;
	}

	.progress-fill {
		height: 100%;
		background: #fbbf24;
	}

	.card-tags {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		margin-top: 2px;
	}

	.tag-pill {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		padding: 2px 5px;
		background: #0f172a;
		color: #94a3b8;
		border: 1px solid #334155;
	}

	.tag-qa {
		color: #38bdf8;
		border-color: #0284c7;
	}

	.tag-lead {
		color: #f472b6;
		border-color: #db2777;
	}

	.tag-wip {
		color: #fbbf24;
		border-color: #d97706;
	}

	.tag-done {
		color: #4ade80;
		border-color: #16a34a;
	}

	/* MODALE RACK SERVEUR COOLIFY & INFRA */
	.server-dialog {
		width: min(740px, 94vw);
		max-height: 88vh;
		background: #080d1a;
		border: 4px solid #22c55e;
		box-shadow:
			0 0 0 2px #0f172a,
			0 20px 60px rgba(0, 0, 0, 0.95);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.server-dialog-body {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		overflow-y: auto;
		background: #030712;
	}

	.servers-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	@media (max-width: 640px) {
		.servers-grid {
			grid-template-columns: 1fr;
		}
	}

	.server-status-card {
		background: #0c1424;
		border: 2px solid #1e293b;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		transition: border-color 0.2s ease;
	}

	.server-status-card.deploying {
		border-color: #38bdf8;
		animation: gatePulse 1s infinite alternate;
	}

	.server-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 8px;
		border-bottom: 2px solid #1e293b;
	}

	.server-card-title {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.server-card-title strong {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		color: #f8fafc;
	}

	.status-indicator-led {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}

	.led-green {
		background: #22c55e;
		box-shadow: 0 0 8px #22c55e;
	}

	.server-port-tag {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		background: #0f172a;
		border: 1px solid #334155;
		color: #94a3b8;
		padding: 2px 6px;
	}

	.server-card-metrics {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.metric-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-family: 'Silkscreen', monospace;
		font-size: 9px;
		color: #94a3b8;
	}

	.metric-row span:last-child,
	.metric-row strong {
		color: #e2e8f0;
	}

	.text-green {
		color: #4ade80 !important;
	}

	/* ACTION DÉPLOIEMENT DIRECT */
	.deploy-action-bar {
		background: #0d172a;
		border: 2px solid #334155;
		padding: 12px 14px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 14px;
	}

	@media (max-width: 600px) {
		.deploy-action-bar {
			flex-direction: column;
			align-items: stretch;
		}
	}

	.deploy-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.deploy-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		color: #38bdf8;
	}

	.deploy-subtitle {
		font-family: 'Silkscreen', monospace;
		font-size: 9px;
		color: #94a3b8;
	}

	.deploy-trigger-btn {
		font-size: 8px !important;
		padding: 8px 14px !important;
		white-space: nowrap;
	}

	/* ========================================================
	   PHASE 3 : CYCLE JOUR/NUIT & MODE KIOSK AUTO-HIDE
	   ======================================================== */
	/* SÉLECTEUR D'AMBIANCE LUMINEUSE DANS LE HEADER */
	.ambient-theme-picker {
		display: flex;
		align-items: center;
		gap: 6px;
		background: #0f172a;
		border: 1px solid #334155;
		padding: 2px 6px;
	}

	.ambient-label {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #64748b;
		letter-spacing: 0.5px;
	}

	.ambient-btn-group {
		display: flex;
		gap: 3px;
	}

	.ambient-pill {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		background: transparent;
		border: 1px solid transparent;
		color: #94a3b8;
		padding: 3px 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.ambient-pill:hover {
		color: #f8fafc;
	}

	.ambient-pill.active {
		background: #1e293b;
		border-color: #38bdf8;
		color: #38bdf8;
		font-weight: bold;
	}

	/* MODE KIOSK AMBIANT IMMERSIF (AUTO-HIDE) */
	.btn-exit-kiosk {
		position: fixed;
		top: 14px;
		right: 14px;
		z-index: 100;
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		background: rgba(9, 17, 34, 0.92);
		border: 2px solid #fbbf24;
		color: #fbbf24;
		padding: 8px 12px;
		cursor: pointer;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8);
		transition: opacity 0.3s ease, transform 0.3s ease;
		opacity: 0;
		pointer-events: none;
		transform: translateY(-8px);
	}

	.btn-exit-kiosk.visible {
		opacity: 1;
		pointer-events: auto;
		transform: translateY(0);
	}

	.cockpit-shell.kiosk-mode .cockpit-sidebar,
	.cockpit-shell.kiosk-mode .team-sidebar,
	.cockpit-shell.kiosk-mode .dock-tab-handle,
	.cockpit-shell.kiosk-mode .kpi-banner,
	.cockpit-shell.kiosk-mode .cockpit-footer {
		transition: opacity 0.4s ease, transform 0.4s ease;
	}

	.cockpit-shell.kiosk-mode.kiosk-hidden .cockpit-sidebar {
		opacity: 0;
		pointer-events: none;
		transform: translateX(-40px);
	}

	.cockpit-shell.kiosk-mode.kiosk-hidden .team-sidebar {
		opacity: 0;
		pointer-events: none;
		transform: translateX(40px);
	}

	.cockpit-shell.kiosk-mode.kiosk-hidden .dock-tab-handle {
		opacity: 0;
		pointer-events: none;
	}

	.cockpit-shell.kiosk-mode.kiosk-hidden .kpi-banner {
		opacity: 0;
		pointer-events: none;
		transform: translateY(-40px);
	}

	.cockpit-shell.kiosk-mode.kiosk-hidden .cockpit-footer {
		opacity: 0;
		pointer-events: none;
		transform: translateY(40px);
	}

	.cockpit-shell.kiosk-mode .canvas-frame {
		max-height: calc(100dvh - 120px);
		width: min(96vw, calc((100dvh - 120px) * (20 / 13)));
		transition: all 0.4s ease;
	}

	.cockpit-shell.kiosk-mode.kiosk-hidden .canvas-frame {
		max-height: 94vh;
		width: min(96vw, calc(94vh * (20 / 13)));
	}

	/* ========================================================
	   PHASE 4 : BANDE-SON LO-FI CHIPTUNE & PELOTE GITCAT
	   ======================================================== */
	.lofi-volume-slider-box {
		display: flex;
		align-items: center;
		gap: 6px;
		background: #091122;
		border: 1px solid #1e293b;
		padding: 4px 8px;
		margin: 2px 4px 6px 4px;
	}

	.lofi-vol-label {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		color: #38bdf8;
	}

	.lofi-slider {
		flex: 1;
		height: 4px;
		background: #1e293b;
		accent-color: #38bdf8;
		cursor: pointer;
	}
</style>
