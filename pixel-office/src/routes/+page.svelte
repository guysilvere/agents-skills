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
		isSoundEnabled,
		playDoneChime,
		playPermissionChime,
		playSubagentSpawnChime,
		setSoundEnabled
	} from '$lib/services/sound-effects';
	import { loadPixelAssets, type PixelAssetsBundle } from '$lib/services/sprite-loader';
	import type {
		GridPoint,
		IncomingOfficeEvent,
		OfficeAgent,
		OfficeSnapshot
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

		const clickedAgent = animatedAgents.find((a) => {
			const dx = a.renderX + 0.5 - clickedTileX;
			const dy = a.renderY + 0.5 - clickedTileY;
			return Math.sqrt(dx * dx + dy * dy) <= 1.2;
		});

		if (clickedAgent) {
			toggleAgentSelection(clickedAgent.id);
		} else {
			selectedAgentId = null;
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
	let customizerTab: 'style' | 'role' = $state('style');
	let editSpriteIndex = $state(0);
	let editShirtColor = $state('#D81B60');
	let editAccessory: 'glasses' | 'headset' | 'coffee' | 'badge' | 'none' = $state('none');
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
		editAccessory = agent.customAccessory ?? (agent.id === 'lead-dev' ? 'badge' : 'none');
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
				accessory: editAccessory,
				mission: editMission,
				skills: editSkills
			}
		});
		showCustomizerModal = false;
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
				return 'APPEL';
			case 'VISITING':
				return 'RÉUNION';
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

		if (snapshot.pet) {
			const petSpeed = 0.1;
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

			if (canvasEl) {
				const ctx = canvasEl.getContext('2d');
				if (ctx) {
					renderPixelOfficeScene(
						ctx,
						animatedAgents,
						animatedPet,
						selectedAgentId,
						frameCount,
						assetsBundle
					);
				}
			}
		};

		animId = requestAnimationFrame(renderLoop);

		return () => {
			clearInterval(clockTimer);
			evtSource.close();
			cancelAnimationFrame(animId);
		};
	});
</script>

<div class="cockpit-shell">
	<!-- 1. BARRE LATÉRALE GAUCHE : Cockpit Navigation (Extensible 64px -> 210px) -->
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
			<button
				type="button"
				class="nav-icon-btn active"
				title="Vue principale du bureau"
			>
				<span class="nav-btn-icon">HQ</span>
				<div class="nav-btn-text">
					<span class="nav-btn-label">BUREAU</span>
					{#if leftSidebarExpanded}
						<span class="nav-btn-sub">Espace 2D</span>
					{/if}
				</div>
			</button>

			<button
				type="button"
				class="nav-icon-btn"
				class:active={showControlDrawer}
				onclick={() => (showControlDrawer = !showControlDrawer)}
				title="Ouvrir la console de simulation / actions"
			>
				<span class="nav-btn-icon">CMD</span>
				<div class="nav-btn-text">
					<span class="nav-btn-label">CONSOLE</span>
					{#if leftSidebarExpanded}
						<span class="nav-btn-sub">Actions & prompts</span>
					{/if}
				</div>
			</button>

			<button
				type="button"
				class="nav-icon-btn"
				onclick={() => triggerEvent({ type: 'PET_INTERACT' })}
				title="Caresser la mascotte GitCat"
			>
				<span class="nav-btn-icon">CAT</span>
				<div class="nav-btn-text">
					<span class="nav-btn-label">GITCAT</span>
					{#if leftSidebarExpanded}
						<span class="nav-btn-sub">Mascotte bureau</span>
					{/if}
				</div>
			</button>

			<button
				type="button"
				class="nav-icon-btn"
				class:muted={!audioOn}
				onclick={toggleAudio}
				title="Activer ou couper le son WebAudio"
			>
				<span class="nav-btn-icon">{audioOn ? 'VOL' : 'MUT'}</span>
				<div class="nav-btn-text">
					<span class="nav-btn-label">{audioOn ? 'SON: ON' : 'SON: OFF'}</span>
					{#if leftSidebarExpanded}
						<span class="nav-btn-sub">Synthèse WebAudio</span>
					{/if}
				</div>
			</button>

			<button
				type="button"
				class="nav-icon-btn"
				onclick={toggleFullscreen}
				title="Basculer en plein écran sur écran secondaire"
			>
				<span class="nav-btn-icon">EXP</span>
				<div class="nav-btn-text">
					<span class="nav-btn-label">{isFullscreen ? 'FENÊTRE' : 'PLEIN ÉCRAN'}</span>
					{#if leftSidebarExpanded}
						<span class="nav-btn-sub">Mode projection</span>
					{/if}
				</div>
			</button>
		</nav>

		<div class="sidebar-bottom-badge">
			<span>v0.3</span>
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

				<div class="kpi-card">
					<span class="kpi-label">PROJET ACTIF</span>
					<strong class="kpi-val project-text">{snapshot?.stats.activeProject ?? 'agents-skills'}</strong>
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
								<div class="permission-alert-badge">STOP — VALIDATION HUMAINE</div>
							{:else if agent.state === 'DONE'}
								<div class="done-check-badge">TERMINÉ [OK]</div>
							{/if}

							<div
								class="speech-bubble"
								class:is-calling={agent.state === 'CALLING'}
								class:is-waiting={agent.state === 'WAITING_HUMAN'}
							>
								<div class="bubble-header">
									<span class="agent-name">{agent.name}</span>
									<span class="state-chip state-{agent.state.toLowerCase()}">
										{formatStateLabel(agent.state)}
									</span>
								</div>

								{#if agent.activityLabel}
									<div class="activity-line">{agent.activityLabel}</div>
								{/if}

								{#if (agent.state === 'WORKING' || agent.state === 'WAITING_HUMAN') && agent.currentProject}
									<div class="project-row">
										<span class="project-label">PROJET:</span>
										<strong class="project-value">{agent.currentProject}</strong>
									</div>
									{#if agent.activeSkills.length > 0}
										<div class="skills-list">
											{#each agent.activeSkills as skill}
												<span class="skill-badge">{skill}</span>
											{/each}
										</div>
									{/if}
								{:else if (agent.state === 'CALLING' || agent.state === 'VISITING') && agent.callMessage}
									<div class="call-row">
										<span>{agent.callMessage}</span>
									</div>
								{/if}

								{#if !agent.isTemporary && agent.contextTokens > 0}
									<div
										class="context-gauge-track"
										title="{Math.round(agent.contextRatio * 100)}% contexte utilisé ({Math.round(agent.contextTokens / 1000)}k / {Math.round(agent.maxContextTokens / 1000)}k tokens)"
									>
										<div
											class="context-gauge-fill"
											style="width: {Math.min(100, Math.round(agent.contextRatio * 100))}%; background: {getContextGaugeColor(agent.contextRatio)};"
										></div>
									</div>
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

				<!-- BOÎTE DE DIALOGUE RPG RÉTRO (Typewriter Dialogue Box) -->
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
			</div>

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
							<span class="meta-caption">PROJET</span>
							<strong class="meta-value">{selectedAgent.currentProject ?? '—'}</strong>
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
						1. STYLE & APPARENCE
					</button>
					<button
						type="button"
						class="tab-btn"
						class:active={customizerTab === 'role'}
						onclick={() => (customizerTab = 'role')}
					>
						2. RÔLE & OBJECTIFS
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

						<!-- Accessoires Pixel Art -->
						<div class="custom-section">
							<span class="section-label">ACCESSOIRE SUPERPOSÉ</span>
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

	/* 2. BARRE LATÉRALE GAUCHE (Extensible 64px -> 210px) */
	.cockpit-sidebar {
		width: 64px;
		flex-shrink: 0;
		height: 100dvh;
		background: #0c121e;
		border-right: 2px solid #1e293b;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12px 0 8px 0;
		box-sizing: border-box;
		z-index: 30;
		transition: width 160ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.cockpit-sidebar.expanded {
		width: 210px;
		align-items: stretch;
		padding: 12px 10px 8px 10px;
	}

	.sidebar-header-dock {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		position: relative;
		margin-bottom: 14px;
		gap: 6px;
	}

	.cockpit-sidebar.expanded .sidebar-header-dock {
		justify-content: space-between;
	}

	.cockpit-logo {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: #111827;
		border: 2px solid #d81b60;
		box-shadow: 2px 2px 0px #000000;
		position: relative;
		flex-shrink: 0;
	}

	.logo-dot {
		position: absolute;
		top: 3px;
		right: 3px;
		width: 6px;
		height: 6px;
		background: #d81b60;
		box-shadow: 0 0 6px #d81b60;
	}

	.logo-text {
		font-family: 'Press Start 2P', monospace;
		font-size: 11px;
		color: #ffffff;
		font-weight: bold;
	}

	.btn-toggle-expand {
		background: #111827;
		border: 1px solid #334155;
		color: #94a3b8;
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		padding: 4px 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
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
		gap: 10px;
		width: 100%;
		padding: 0 8px;
		box-sizing: border-box;
	}

	.cockpit-sidebar.expanded .cockpit-nav-buttons {
		padding: 0;
	}

	.nav-icon-btn {
		width: 48px;
		height: 48px;
		background: #111827;
		border: 2px solid #334155;
		box-shadow: 2px 2px 0px #000000;
		color: #94a3b8;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 2px;
		box-sizing: border-box;
		gap: 3px;
		transition: all 80ms ease;
	}

	.cockpit-sidebar.expanded .nav-icon-btn {
		width: 100%;
		height: auto;
		padding: 8px 10px;
		flex-direction: row;
		justify-content: flex-start;
		gap: 10px;
	}

	.nav-icon-btn:hover {
		background: #1e293b;
		border-color: #38bdf8;
		color: #ffffff;
	}

	.nav-icon-btn.active {
		background: #1a2333;
		border-color: #d81b60;
		color: #ffffff;
		box-shadow: 2px 2px 0px #d81b60;
	}

	.nav-icon-btn.muted {
		opacity: 0.6;
		border-color: #64748b;
	}

	.nav-btn-icon {
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		color: currentColor;
		flex-shrink: 0;
	}

	.cockpit-sidebar.expanded .nav-btn-icon {
		width: 24px;
		text-align: center;
	}

	.nav-btn-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		overflow: hidden;
	}

	.nav-btn-label {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		line-height: 1;
		color: #cbd5e1;
		white-space: nowrap;
	}

	.nav-btn-sub {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		color: #64748b;
		line-height: 1;
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
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		padding: 10px;
		box-sizing: border-box;
	}

	.canvas-frame {
		position: relative;
		aspect-ratio: 20 / 13;
		width: min(100%, calc((100dvh - 120px) * (20 / 13)));
		max-height: calc(100dvh - 120px);
		border: 4px solid #000000;
		box-shadow:
			0 0 0 2px #1e293b,
			0 20px 50px rgba(0, 0, 0, 0.85);
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

	.speech-bubble {
		min-width: 135px;
		max-width: 215px;
		background: rgba(15, 23, 42, 0.94);
		border: 2px solid var(--agent-color, #d81b60);
		box-shadow: 3px 3px 0px #000000;
		padding: 4px 6px;
		color: #ffffff;
		position: relative;
		margin-bottom: 4px;
	}

	.speech-bubble.is-calling {
		border-color: #38bdf8;
		animation: pulseBorder 0.7s infinite alternate;
	}

	.speech-bubble.is-waiting {
		border-color: #f59e0b;
		background: rgba(69, 26, 3, 0.95);
	}

	@keyframes pulseBorder {
		from {
			transform: translateY(0px);
		}
		to {
			transform: translateY(-3px);
		}
	}

	@keyframes pulseCard {
		from {
			border-color: #f59e0b;
			box-shadow: 0 0 4px #f59e0b;
		}
		to {
			border-color: #ef4444;
			box-shadow: 0 0 10px #ef4444;
		}
	}

	.speech-bubble::after {
		content: '';
		position: absolute;
		bottom: -6px;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 6px solid var(--agent-color, #d81b60);
	}

	.bubble-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
		border-bottom: 1px solid #334155;
		padding-bottom: 2px;
		margin-bottom: 2px;
	}

	.agent-name {
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		color: #ffffff;
	}

	.state-chip {
		font-family: 'Press Start 2P', monospace;
		font-size: 6px;
		padding: 1px 4px;
		background: #334155;
		color: #e2e8f0;
	}

	.state-chip.state-working {
		background: #14532d;
		color: #4ade80;
	}

	.state-chip.state-waiting_human {
		background: #b45309;
		color: #fef3c7;
	}

	.state-chip.state-done {
		background: #15803d;
		color: #bbf7d0;
	}

	.state-chip.state-calling,
	.state-chip.state-visiting {
		background: #0c4a6e;
		color: #38bdf8;
	}

	.activity-line {
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #38bdf8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-bottom: 2px;
	}

	.project-row {
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		line-height: 1.1;
		margin-bottom: 2px;
	}

	.project-label {
		color: #94a3b8;
	}

	.project-value {
		color: #f472b6;
	}

	.skills-list {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		margin-bottom: 3px;
	}

	.skill-badge {
		font-family: 'Silkscreen', monospace;
		font-size: 7px;
		background: #134242;
		color: #c2e8e8;
		border: 1px solid #2dd4bf;
		padding: 1px 4px;
	}

	.call-row {
		font-family: 'Silkscreen', monospace;
		font-size: 8px;
		color: #7dd3fc;
	}

	.context-gauge-track {
		width: 100%;
		height: 3px;
		background: #1e293b;
		margin-top: 2px;
		overflow: hidden;
	}

	.context-gauge-fill {
		height: 100%;
		transition: width 200ms ease;
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
		grid-template-columns: 1fr 1fr;
		background: #0b0f19;
		border-bottom: 2px solid #1e293b;
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

	/* BOÎTE DE DIALOGUE RPG RÉTRO (Typewriter Dialogue Box) */
	.rpg-dialogue-box {
		position: absolute;
		bottom: 8px;
		left: 8px;
		right: 8px;
		z-index: 30;
		background: linear-gradient(180deg, #091122 0%, #030712 100%);
		border: 3px solid #fbbf24;
		box-shadow:
			0 6px 18px rgba(0, 0, 0, 0.95),
			inset 0 0 0 1px #78350f;
		padding: 8px 12px;
		display: flex;
		flex-direction: column;
		cursor: pointer;
		user-select: none;
	}

	.rpg-dialogue-box.is-gate {
		border-color: #f59e0b;
		box-shadow:
			0 0 0 2px #ef4444,
			0 6px 20px rgba(0, 0, 0, 0.95);
	}

	.rpg-box-inner {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.rpg-portrait-frame {
		width: 48px;
		height: 48px;
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
		background-size: 192px 192px;
		background-position: -8px -6px;
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
		position: absolute;
		bottom: 10px;
		right: 10px;
		z-index: 20;
		font-family: 'Press Start 2P', monospace;
		font-size: 7px;
		background: #091122;
		border: 2px solid #fbbf24;
		color: #fbbf24;
		padding: 6px 10px;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
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
</style>
