<script lang="ts">
	import { browser } from '$app/environment';
	import ScoreEditor from '$lib/components/ScoreEditor.svelte';
	import ScoreSurface from '$lib/components/score/ScoreSurface.svelte';
	import PandeiroView from '$lib/components/PandeiroView.svelte';
	import AppHeader from '$lib/components/ui/AppHeader.svelte';
	import AboutPanel from '$lib/components/ui/AboutPanel.svelte';
	import TutorialCard from '$lib/components/ui/TutorialCard.svelte';
	import { tutorialSteps } from '$lib/data/tutorial';
	import { scoreState } from '$lib/state/score.svelte';
	import { playbackState } from '$lib/state/playback.svelte';
	import { togglePlayback } from '$lib/score-edit/note-actions';
	import { prepareAudio } from '$lib/score-edit/library-actions';
	import type { StrokeType } from '$lib/types';
	import packageInfo from '../../package.json';

	let hoverStroke = $state<StrokeType | null>(null);
	let showAbout = $state(false);
	let showTutorial = $state(false);
	let tutorialIndex = $state(0);
	let leftWidth = $state(63);
	let isDraggingDivider = $state(false);
	let viewportWidth = $state(1200);
	let mobilePane = $state<'editor' | 'pandeiro'>('editor');
	let isMobileLayout = $derived(viewportWidth <= 860);

	const aboutInfo = {
		name: packageInfo.name,
		version: packageInfo.version,
		developer: packageInfo.author.name,
		contact: packageInfo.author.email,
		license: packageInfo.license
	};

	let currentTutorial = $derived(tutorialSteps[tutorialIndex]);

	// Duração de meio ciclo do balanço = um tempo do compasso
	// bpm → beats/min → ms/beat; dividimos por 2 pois a animação é 'alternate'
	let swingDuration = $derived(
		scoreState.value ? Math.round(60_000 / scoreState.value.bpm / 2) : 400
	);

	function handleStrokeClick(stroke: StrokeType) {
		if (playbackState.notationRestMode) {
			scoreState.insertNote(scoreState.cursor, null, playbackState.notationDuration);
			scoreState.cursor += playbackState.notationDuration;
			return;
		}

		const actualStroke =
			playbackState.notationMuted && stroke === 'P'
				? 'P_mut'
				: playbackState.notationMuted && stroke === 'D'
					? 'D_mut'
					: stroke;
		scoreState.insertStrokeAtCursor(
			actualStroke,
			playbackState.notationDuration,
			playbackState.notationAccented
		);
	}

	function handleDividerDown(e: PointerEvent) {
		isDraggingDivider = true;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDraggingDivider) return;
		const nextWidth = (e.clientX / window.innerWidth) * 100;
		leftWidth = Math.max(42, Math.min(78, nextWidth));
	}

	function handlePointerUp() {
		isDraggingDivider = false;
	}

	function handleResize() {
		if (!browser) return;
		viewportWidth = window.innerWidth;
	}

	if (browser) {
		viewportWidth = window.innerWidth;
	}

	function openTutorial() {
		tutorialIndex = 0;
		showTutorial = true;
	}

	function nextTutorial() {
		if (tutorialIndex < tutorialSteps.length - 1) tutorialIndex += 1;
		else showTutorial = false;
	}

	function previousTutorial() {
		tutorialIndex = Math.max(0, tutorialIndex - 1);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			showAbout = false;
			showTutorial = false;
		}
	}
</script>

<svelte:window
	on:pointermove={handlePointerMove}
	on:pointerup={handlePointerUp}
	on:keydown={handleKeydown}
	on:resize={handleResize}
/>

<svelte:head>
	<title>Pandeiro de Bamba</title>
	<meta name="description" content="Crie, escreva e toque levadas de pandeiro como quiser." />
</svelte:head>

<main class="app" class:resizing={isDraggingDivider} style="--left-w: {leftWidth}%;">
	{#if isMobileLayout}
		<div class="mobile-pane-switch" role="tablist" aria-label="Alternar visualização">
			<button
				type="button"
				role="tab"
				class:active={mobilePane === 'editor'}
				aria-selected={mobilePane === 'editor'}
				onclick={() => (mobilePane = 'editor')}
			>
				Editor
			</button>
			<button
				type="button"
				role="tab"
				class:active={mobilePane === 'pandeiro'}
				aria-selected={mobilePane === 'pandeiro'}
				onclick={() => (mobilePane = 'pandeiro')}
			>
				Pandeiro
			</button>
		</div>
	{/if}
	<div class="left-pane" class:hidden-mobile-pane={isMobileLayout && mobilePane !== 'editor'}>
		{#if !isMobileLayout || mobilePane === 'editor'}
			<AppHeader {openTutorial} openAbout={() => (showAbout = true)} />

			<div class="editor-area">
				<ScoreEditor tutorialStep={showTutorial ? currentTutorial.target : ''} />
			</div>
		{/if}
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="pane-divider"
		class:dragging={isDraggingDivider}
		class:tutorial-focus={showTutorial && currentTutorial.target === 'layout'}
		onpointerdown={handleDividerDown}
		title="Arraste para ajustar as áreas"
	>
		<div class="divider-grip"></div>
	</div>

	<div class="right-pane" class:full-mobile-pane={isMobileLayout && mobilePane === 'pandeiro'}>
		{#if scoreState.value && (!isMobileLayout || mobilePane === 'pandeiro')}
			<div class="mobile-pandeiro-stack">
				<PandeiroView
					activeStrokes={playbackState.activeStrokes}
					genre={scoreState.value.genre || scoreState.value.title}
					bpm={scoreState.value.bpm}
					{hoverStroke}
					compact={isMobileLayout}
					mutedPreview={playbackState.notationMuted}
					tutorialStep={showTutorial ? currentTutorial.target : ''}
					swaying={playbackState.isPlaying}
					isAccented={playbackState.isAccented}
					{swingDuration}
					onStrokeClick={handleStrokeClick}
					onStrokeHover={(stroke) => (hoverStroke = stroke)}
					onRegionLeave={() => (hoverStroke = null)}
				/>

				{#if isMobileLayout}
					<div class="mobile-playback">
						<button
							class="btn-metro"
							class:muted={playbackState.isMetronomeMuted}
							onclick={() => (playbackState.isMetronomeMuted = !playbackState.isMetronomeMuted)}
							title={playbackState.isMetronomeMuted ? 'Ativar metrônomo' : 'Mutar metrônomo'}
							aria-label={playbackState.isMetronomeMuted ? 'Ativar metrônomo' : 'Mutar metrônomo'}
						>
							{#if playbackState.isMetronomeMuted}🔇{:else}🔊{/if}
						</button>
						<button
							class="btn-play"
							class:paused={playbackState.isPlaying}
							onclick={togglePlayback}
							onpointerdown={prepareAudio}
							title={playbackState.isPlaying ? 'Pausar' : 'Tocar'}
						>
							{#if playbackState.isPlaying}
								<svg viewBox="0 0 24 24"
									><rect x="6" y="4" width="4" height="16" /><rect
										x="14"
										y="4"
										width="4"
										height="16"
									/></svg
								>
							{:else}
								<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
							{/if}
						</button>
						<button class="btn-stop" onclick={() => playbackState.stop()} title="Parar">
							<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="1" /></svg>
						</button>
					</div>

					<div class="mobile-score-preview">
						<ScoreSurface tutorialStep={showTutorial ? currentTutorial.target : ''} compact />
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<TutorialCard
		bind:showTutorial
		bind:tutorialIndex
		{tutorialSteps}
		{currentTutorial}
		{nextTutorial}
		{previousTutorial}
	/>

	<AboutPanel bind:showAbout {aboutInfo} />
</main>

<style>
	.app {
		display: grid;
		grid-template-columns: minmax(420px, var(--left-w)) 12px minmax(320px, 1fr);
		height: 100dvh;
		overflow: hidden;
		background: #101014;
	}
	.mobile-pane-switch {
		display: none;
	}

	.app.resizing {
		user-select: none;
		cursor: col-resize;
	}

	.left-pane {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		background: #d7d2c6;
	}

	.pane-divider {
		z-index: 5;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(
			90deg,
			rgba(0, 0, 0, 0.24),
			rgba(255, 255, 255, 0.04),
			rgba(0, 0, 0, 0.24)
		);
		cursor: col-resize;
		touch-action: none;
	}

	.pane-divider:hover,
	.pane-divider.dragging {
		background: rgba(255, 77, 109, 0.18);
	}

	.divider-grip {
		width: 3px;
		height: 42px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.28);
	}

	.tutorial-focus {
		position: relative;
		z-index: 80;
		outline: 2px solid rgba(255, 77, 109, 0.95);
		outline-offset: 4px;
		box-shadow:
			0 0 0 8px rgba(255, 77, 109, 0.18),
			0 0 22px rgba(255, 77, 109, 0.72),
			0 0 48px rgba(255, 77, 109, 0.42);
		animation: tutorialGlow 1.25s ease-in-out infinite alternate;
	}

	@keyframes tutorialGlow {
		from {
			box-shadow:
				0 0 0 6px rgba(255, 77, 109, 0.13),
				0 0 18px rgba(255, 77, 109, 0.52),
				0 0 34px rgba(255, 77, 109, 0.3);
		}
		to {
			box-shadow:
				0 0 0 10px rgba(255, 77, 109, 0.22),
				0 0 30px rgba(255, 77, 109, 0.86),
				0 0 62px rgba(255, 77, 109, 0.48);
		}
	}

	.right-pane {
		min-width: 0;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(1rem, 3vw, 2.5rem);
		background: radial-gradient(circle at center, #1f1f26 0%, #0d0d12 72%);
	}
	.mobile-pandeiro-stack {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		width: 100%;
		height: 100%;
	}
	.mobile-playback {
		display: none;
	}
	.mobile-score-preview {
		display: none;
	}

	.editor-area {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	@media (max-width: 860px) {
		.app {
			grid-template-columns: 1fr;
			grid-template-rows: auto minmax(0, 1fr);
			height: 100dvh;
			overflow: hidden;
		}
		.mobile-pane-switch {
			position: sticky;
			top: 0;
			z-index: 20;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 0.4rem;
			padding: 0.6rem;
			background: rgba(8, 8, 12, 0.96);
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		}
		.mobile-pane-switch button {
			border: 1px solid rgba(255, 255, 255, 0.18);
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.06);
			color: rgba(255, 255, 255, 0.85);
			font-size: 0.76rem;
			font-weight: 800;
			letter-spacing: 0.06em;
			padding: 0.42rem 0.75rem;
			text-transform: uppercase;
		}
		.mobile-pane-switch button.active {
			background: rgba(255, 77, 109, 0.2);
			border-color: rgba(255, 77, 109, 0.5);
			color: #fff;
		}

		.pane-divider {
			cursor: default;
			pointer-events: none;
			display: none;
		}

		.left-pane,
		.right-pane {
			min-height: 0;
			height: 100%;
		}

		.left-pane {
			border-right: 0;
			border-bottom: 0;
		}
		.left-pane.hidden-mobile-pane {
			display: none;
		}
		.right-pane.full-mobile-pane {
			grid-row: 2;
			padding-top: 0.55rem;
		}

		.right-pane {
			padding: 1rem;
			align-items: stretch;
			justify-content: flex-start;
		}
		.mobile-pandeiro-stack {
			gap: 0.65rem;
			justify-content: flex-start;
			align-content: start;
		}
		.mobile-playback {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			justify-content: center;
		}
		.mobile-score-preview {
			display: block;
			min-height: 0;
			height: min(38dvh, 360px);
			border: 1px solid rgba(255, 255, 255, 0.14);
			border-radius: 8px;
			overflow: hidden;
			background: #1a1a22;
		}
	}

	@media (max-width: 560px) {
		.right-pane {
			padding: 0.75rem;
		}
		.mobile-score-preview {
			height: min(34dvh, 320px);
		}
	}

	.btn-metro {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(255, 255, 255, 0.07);
		color: #fff;
		cursor: pointer;
		font-size: 1rem;
	}
	.btn-metro.muted {
		background: rgba(255, 77, 109, 0.2);
		border-color: rgba(255, 77, 109, 0.5);
	}
	.btn-play,
	.btn-stop {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.btn-play {
		background: #ff4d6d;
		color: #fff;
		box-shadow: 0 3px 12px rgba(255, 77, 109, 0.4);
	}
	.btn-play.paused {
		background: #ff9500;
		box-shadow: 0 3px 12px rgba(255, 149, 0, 0.4);
	}
	.btn-stop {
		background: rgba(255, 255, 255, 0.07);
		color: rgba(255, 255, 255, 0.7);
	}
	.btn-play svg,
	.btn-stop svg {
		width: 16px;
		height: 16px;
		fill: currentColor;
	}
</style>
