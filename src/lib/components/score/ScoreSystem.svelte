<script lang="ts">
	import { scoreState } from '$lib/state/score.svelte';
	import {
		yOffsetForSystem,
		systemLeftPadForSystem,
		systemWidthForSystem
	} from '$lib/score-visual-helpers';

	let {
		system,
		lineY,
		firstSystemLeftPad,
		systemLeftPad,
		slotsPerSystem,
		totalSlots,
		slotW,
		height,
		systemGap,
		topMargin,
		firstSystemSvgWidth,
		svgWidth
	}: {
		system: number;
		lineY: number;
		firstSystemLeftPad: number;
		systemLeftPad: number;
		slotsPerSystem: number;
		totalSlots: number;
		slotW: number;
		height: number;
		systemGap: number;
		topMargin: number;
		firstSystemSvgWidth: number;
		svgWidth: number;
	} = $props();

	let yOffset = $derived(yOffsetForSystem(system, height, systemGap, topMargin));
	let systemStart = $derived(system * slotsPerSystem);
	let systemEnd = $derived(Math.min(totalSlots, systemStart + slotsPerSystem));
	let leftPad = $derived(systemLeftPadForSystem(system, firstSystemLeftPad, systemLeftPad));
	let systemWidth = $derived(systemWidthForSystem(system, firstSystemSvgWidth, svgWidth));
	let startMeasure = $derived(Math.floor(systemStart / scoreState.value.timeSignature.beats) + 1);
</script>

<line x1="14" y1={yOffset + lineY} x2={systemWidth - 20} y2={yOffset + lineY} class="staff-line" />

<text x={leftPad - 24} y={yOffset + lineY + 68} class="measure-start-label">
	{startMeasure}
</text>

{#if system === 0}
	<rect x="34" y={yOffset + lineY - 15} width="4" height="30" class="ink" />
	<rect x="43" y={yOffset + lineY - 15} width="4" height="30" class="ink" />
	<text x="72" y={yOffset + lineY - 14} class="time-sig">
		{scoreState.value.timeSignature.beats}
	</text>
	<text x="72" y={yOffset + lineY + 16} class="time-sig">
		{scoreState.value.timeSignature.subdivision}
	</text>
{/if}

{#each Array(systemEnd - systemStart + 1) as _, i (systemStart + i)}
	{@const slot = systemStart + i}
	{@const x = leftPad + i * slotW}
	{@const endX = slot === systemEnd ? systemWidth - 22 : x}
	{#if slot % scoreState.value.timeSignature.beats === 0 || slot === systemEnd}
		{#if slot === 0}
			<g class="repeat-mark start-repeat">
				<rect x={x - 10} y={yOffset + lineY - 46} width="4" height="92" />
				<line x1={x - 2} y1={yOffset + lineY - 46} x2={x - 2} y2={yOffset + lineY + 46} />
				<circle cx={x + 6} cy={yOffset + lineY - 10} r="2.7" />
				<circle cx={x + 6} cy={yOffset + lineY + 10} r="2.7" />
			</g>
		{:else if slot === totalSlots}
			<g class="repeat-mark end-repeat">
				<circle cx={endX - 14} cy={yOffset + lineY - 10} r="2.7" />
				<circle cx={endX - 14} cy={yOffset + lineY + 10} r="2.7" />
				<line x1={endX - 4} y1={yOffset + lineY - 46} x2={endX - 4} y2={yOffset + lineY + 46} />
				<rect x={endX + 3} y={yOffset + lineY - 46} width="4" height="92" />
			</g>
		{:else}
			<line
				x1={endX}
				y1={yOffset + lineY - 46}
				x2={endX}
				y2={yOffset + lineY + 46}
				class="barline"
			/>
		{/if}
	{/if}
{/each}

<style>
	.staff-line {
		stroke: #111;
		stroke-width: 1.7;
	}
	.barline {
		stroke: #222;
		stroke-width: 1.3;
	}
	.repeat-mark {
		fill: #111;
		stroke: #111;
	}
	.repeat-mark line {
		stroke-width: 1.5;
	}
	.ink {
		fill: #111;
	}
	.time-sig {
		fill: #111;
		font:
			800 28px Arial,
			sans-serif;
		text-anchor: middle;
		dominant-baseline: middle;
	}
	.measure-start-label {
		fill: rgba(0, 0, 0, 0.62);
		font:
			700 13px Arial,
			sans-serif;
		text-anchor: middle;
		dominant-baseline: middle;
	}
</style>
