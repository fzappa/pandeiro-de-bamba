<script lang="ts">
	import type { StrokeType } from '$lib/types';
	import { STROKES as strokeCatalog } from '$lib/types';

	let {
		STROKE_ORDER,
		STROKES,
		selectedStroke,
		isAbafado,
		tutorialStep,
		onPrepareAudio,
		onSelectStroke,
		onToggleAbafado
	}: {
		STROKE_ORDER: StrokeType[];
		STROKES: typeof strokeCatalog;
		selectedStroke: StrokeType;
		isAbafado: boolean;
		tutorialStep: string;
		onPrepareAudio: () => void;
		onSelectStroke: (stroke: StrokeType) => void;
		onToggleAbafado: () => void;
	} = $props();
</script>

<div class="tool-group" class:tutorial-focus={tutorialStep === 'sound-tools'}>
	<span class="group-label">Som:</span>
	{#each STROKE_ORDER as stroke (stroke)}
		{@const info = STROKES[stroke]}
		<button
			class="tool-btn stroke-btn"
			class:active={selectedStroke === stroke}
			style="--c: {info.color}"
			onpointerdown={onPrepareAudio}
			onclick={() => onSelectStroke(stroke)}
			title={info.description}
			aria-label="{stroke} — {info.description}"
			aria-pressed={selectedStroke === stroke}
		>
			{stroke}
		</button>
	{/each}
	<div class="divider"></div>
	<button
		class="tool-btn"
		disabled={!['P', 'D'].includes(selectedStroke)}
		class:active={isAbafado}
		onclick={onToggleAbafado}
		title="Abafar nota (Polegar/Ponta Mudo)"
		aria-label="Abafar nota (Polegar/Ponta Mudo)"
		aria-pressed={isAbafado}
	>
		( )
	</button>
</div>

<style>
	.tool-group {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.group-label {
		font-size: 0.65rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.45);
		text-transform: uppercase;
		width: 100%;
	}
	.tool-btn {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #ddd;
		padding: 0.42rem 0.62rem;
		border-radius: 6px;
		font-size: 0.75rem;
		cursor: pointer;
		white-space: nowrap;
		min-height: 34px;
	}
	.tool-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}
	.tool-btn.active {
		background: #ff4d6d;
		color: #fff;
		border-color: transparent;
	}
	.stroke-btn {
		font-weight: 800;
		border-bottom: 3px solid var(--c, transparent);
	}
	.divider {
		width: 1px;
		height: 24px;
		background: rgba(255, 255, 255, 0.1);
	}

	@media (max-width: 640px) {
		.group-label {
			font-size: 0.6rem;
		}
		.tool-group {
			gap: 0.32rem;
		}
		.tool-btn {
			min-height: 36px;
			padding: 0.42rem 0.5rem;
			font-size: 0.72rem;
		}
		.divider {
			display: none;
		}
	}
</style>
