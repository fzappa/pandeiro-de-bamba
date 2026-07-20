<script lang="ts">
	import NotationIcon from '../NotationIcon.svelte';
	import ScoreMeta from './ScoreMeta.svelte';
	import ScoreSystem from './ScoreSystem.svelte';
	import ScoreVisualNote from './ScoreVisualNote.svelte';

	import { scoreState } from '$lib/state/score.svelte';
	import { playbackState } from '$lib/state/playback.svelte';
	import { notationService } from '$lib/services/notation.svelte';
	import { stepsPerBeatForSignature } from '$lib/notation';
	import {
		systemForStep,
		yOffsetForSystem,
		yOffsetForSlot,
		slotX
	} from '$lib/score-visual-helpers';

	import { writeOnEmptyOrSelect } from '$lib/score-edit/note-actions';
	import {
		LINE_Y,
		TOP_PAD,
		FIRST_SYSTEM_LEFT_PAD,
		SYSTEM_LEFT_PAD,
		BARLINE_NOTE_GAP,
		END_REPEAT_NOTE_GAP,
		HEIGHT,
		SYSTEM_GAP,
		TOP_MARGIN,
		computeMeasuresPerSystem,
		computeSlotW,
		computeSvgHeight,
		computeSvgWidth,
		computeFirstSystemSvgWidth
	} from '$lib/score-edit/layout';

	let { tutorialStep = '', compact = false }: { tutorialStep?: string; compact?: boolean } =
		$props();

	let scoreScrollEl = $state<HTMLDivElement | null>(null);
	let scoreViewportWidth = $state(0);
	let lastAutoScrollSystem = -1;

	let stepsPerBeat = $derived(
		scoreState.value ? stepsPerBeatForSignature(scoreState.value.timeSignature) : 16
	);
	let totalSlots = $derived(
		scoreState.value ? scoreState.value.measures * scoreState.value.timeSignature.beats : 0
	);
	let measuresPerSystem = $derived(
		scoreState.value
			? computeMeasuresPerSystem(
					scoreViewportWidth,
					scoreState.value.timeSignature.beats,
					stepsPerBeat
				)
			: 1
	);
	let slotsPerSystem = $derived(
		scoreState.value ? scoreState.value.timeSignature.beats * measuresPerSystem : 8
	);
	let totalSystems = $derived(
		slotsPerSystem > 0 ? Math.max(1, Math.ceil(totalSlots / slotsPerSystem)) : 1
	);
	let slotW = $derived(computeSlotW(scoreViewportWidth, slotsPerSystem));
	let stepWidth = $derived(slotW / stepsPerBeat);
	let svgWidth = $derived(computeSvgWidth(slotsPerSystem, slotW));
	let firstSystemSvgWidth = $derived(computeFirstSystemSvgWidth(slotsPerSystem, slotW));
	let svgHeight = $derived(computeSvgHeight(totalSystems));
	let hasVisualNotes = $derived(notationService.visualNotes.length > 0);

	function scrollPlaybackIntoView(step: number) {
		const scrollEl = scoreScrollEl;
		if (!scrollEl || !scoreState.value || svgHeight <= 0) return;

		// Prefer a DOM-based strategy first. It is more reliable on mobile containers
		// where viewport dimensions can change with virtual keyboard/browser UI.
		const playingRect = scrollEl.querySelector('.slot-hit.playing') as SVGGraphicsElement | null;
		if (playingRect) {
			const hostRect = scrollEl.getBoundingClientRect();
			const noteRect = playingRect.getBoundingClientRect();
			const margin = Math.min(64, scrollEl.clientHeight * 0.22);
			const viewportTop = hostRect.top + margin;
			const viewportBottom = hostRect.bottom - margin;
			const isVisible = noteRect.top >= viewportTop && noteRect.bottom <= viewportBottom;
			if (!isVisible) {
				const centerOffset = noteRect.top - hostRect.top - scrollEl.clientHeight * 0.35;
				scrollEl.scrollTo({
					top: Math.max(0, scrollEl.scrollTop + centerOffset),
					behavior: 'smooth'
				});
			}
			return;
		}

		const system = systemForStep(step, slotsPerSystem, stepsPerBeat);
		const scaleY = scrollEl.scrollHeight / svgHeight;
		const systemTop = yOffsetForSystem(system, HEIGHT, SYSTEM_GAP, TOP_MARGIN) * scaleY;
		const systemBottom = systemTop + HEIGHT * scaleY;
		const viewportTop = scrollEl.scrollTop;
		const viewportBottom = viewportTop + scrollEl.clientHeight;
		const margin = Math.min(64, scrollEl.clientHeight * 0.18);
		const isVisible = systemTop >= viewportTop + margin && systemBottom <= viewportBottom - margin;

		if (system === lastAutoScrollSystem && isVisible) return;

		lastAutoScrollSystem = system;
		scrollEl.scrollTo({
			top: Math.max(0, systemTop - margin),
			behavior: 'smooth'
		});
	}

	$effect(() => {
		if (!playbackState.isPlaying || playbackState.currentStep < 0) {
			lastAutoScrollSystem = -1;
			return;
		}
		requestAnimationFrame(() => {
			scrollPlaybackIntoView(playbackState.currentStep);
		});
	});

	$effect(() => {
		if (!scoreScrollEl) return;
		const updateWidth = () => {
			scoreViewportWidth = scoreScrollEl?.clientWidth ?? 0;
		};
		updateWidth();
		const observer = new ResizeObserver(updateWidth);
		observer.observe(scoreScrollEl);
		return () => observer.disconnect();
	});
</script>

<section
	class="paper-area"
	class:compact
	class:tutorial-focus={tutorialStep === 'score'}
	aria-label="Folha de partitura"
>
	<div class="score-scroll" bind:this={scoreScrollEl}>
		{#if scoreState.value}
			{#if !hasVisualNotes}
				<div class="score-empty-state" role="status">
					<strong>Partitura vazia.</strong> Escolha um toque e uma figura para escrever a primeira nota.
				</div>
			{/if}
			<svg
				class="score-svg"
				width={firstSystemSvgWidth}
				height={svgHeight}
				viewBox="0 0 {firstSystemSvgWidth} {svgHeight}"
				role="img"
				aria-label="Partitura de pandeiro"
			>
				<rect width={firstSystemSvgWidth} height={svgHeight} fill="#f4f1e8" />

				<ScoreMeta {firstSystemSvgWidth} />

				<g
					class="tempo-mark"
					transform="translate(25 125)"
					aria-label="Andamento: {scoreState.value.bpm} BPM"
				>
					<NotationIcon duration={16} size={22} title="Semínima" />
					<text x="23" y="17" class="tempo-equals">=</text>
					<text x="38" y="17" class="tempo-value">{scoreState.value.bpm}</text>
				</g>

				{#each Array(totalSystems) as _, system (system)}
					<ScoreSystem
						{system}
						lineY={LINE_Y}
						firstSystemLeftPad={FIRST_SYSTEM_LEFT_PAD}
						systemLeftPad={SYSTEM_LEFT_PAD}
						{slotsPerSystem}
						{totalSlots}
						{slotW}
						height={HEIGHT}
						systemGap={SYSTEM_GAP}
						topMargin={TOP_MARGIN}
						{firstSystemSvgWidth}
						{svgWidth}
					/>
				{/each}

				{#each Array(totalSlots) as _, slot (slot)}
					<text
						x={slotX(
							slot,
							slotsPerSystem,
							slotW,
							BARLINE_NOTE_GAP,
							FIRST_SYSTEM_LEFT_PAD,
							SYSTEM_LEFT_PAD
						)}
						y={yOffsetForSlot(slot, slotsPerSystem, HEIGHT, SYSTEM_GAP, TOP_MARGIN) + LINE_Y + 68}
						class="beat-label"
					>
						{(slot % scoreState.value.timeSignature.beats) + 1}
					</text>
				{/each}

				{#each notationService.visualNotes as note (`${note.step}-${note.stroke ?? 'rest'}`)}
					<ScoreVisualNote
						{note}
						visualNotes={notationService.visualNotes}
						scoreCursor={scoreState.cursor}
						currentStep={playbackState.currentStep}
						{stepWidth}
						topPad={TOP_PAD}
						height={HEIGHT}
						lineY={LINE_Y}
						{slotsPerSystem}
						{stepsPerBeat}
						systemGap={SYSTEM_GAP}
						topMargin={TOP_MARGIN}
						firstSystemLeftPad={FIRST_SYSTEM_LEFT_PAD}
						systemLeftPad={SYSTEM_LEFT_PAD}
						{slotW}
						barlineNoteGap={BARLINE_NOTE_GAP}
						{totalSlots}
						endRepeatNoteGap={END_REPEAT_NOTE_GAP}
						{writeOnEmptyOrSelect}
					/>
				{/each}
			</svg>
		{/if}
	</div>
</section>

<style>
	.paper-area {
		position: relative;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		padding: clamp(1rem, 2.5vw, 2rem);
		background:
			linear-gradient(90deg, rgba(180, 70, 82, 0.16) 0 1px, transparent 1px 100%) 54px 0 / 1px 100%
				no-repeat,
			repeating-linear-gradient(0deg, transparent 0 34px, rgba(80, 98, 140, 0.12) 34px 35px),
			#eee9dc;
	}
	.paper-area.compact {
		height: 100%;
		padding: 0.45rem;
	}

	.score-scroll {
		position: relative;
		height: 100%;
		min-height: 0;
		box-sizing: border-box;
		overflow: auto;
		background: #f4f1e8;
		border: 1px solid rgba(70, 55, 35, 0.16);
		box-shadow: 0 18px 42px rgba(70, 55, 35, 0.18);
		-webkit-overflow-scrolling: touch;
	}
	.paper-area.compact .score-scroll {
		border-radius: 6px;
	}
	.score-empty-state {
		position: sticky;
		top: 0;
		z-index: 2;
		margin: 0.45rem;
		padding: 0.5rem 0.65rem;
		border-radius: 7px;
		border: 1px dashed rgba(70, 55, 35, 0.28);
		background: rgba(255, 255, 255, 0.85);
		color: rgba(30, 23, 15, 0.78);
		font-size: 0.76rem;
	}
	.score-svg {
		display: block;
		max-width: 100%;
	}

	.tempo-mark {
		color: #111;
		fill: #111;
	}
	.tempo-equals,
	.tempo-value {
		fill: #111;
		font:
			400 20px Georgia,
			serif;
		dominant-baseline: middle;
	}
	.tempo-value {
		font-size: 22px;
	}
	.beat-label {
		fill: rgba(0, 0, 0, 0.62);
		font:
			700 11px Arial,
			sans-serif;
		text-anchor: middle;
	}

	@media (max-width: 980px) {
		.paper-area {
			padding: 0.85rem;
		}
	}

	@media (max-width: 640px) {
		.paper-area {
			padding: 0.55rem;
			background:
				linear-gradient(90deg, rgba(180, 70, 82, 0.16) 0 1px, transparent 1px 100%) 36px 0 / 1px
					100% no-repeat,
				repeating-linear-gradient(0deg, transparent 0 30px, rgba(80, 98, 140, 0.12) 30px 31px),
				#eee9dc;
		}

		.score-scroll {
			border-radius: 6px;
		}

		.score-svg {
			max-width: 100%;
		}
	}

	@media (max-width: 420px) {
		.score-svg {
			max-width: 100%;
		}
	}
</style>
