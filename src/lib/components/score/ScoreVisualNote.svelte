<script lang="ts">
	import type { VisualNote, StrokeType } from '$lib/types';
	import { STROKES } from '$lib/types';
	import NotationIcon from '../NotationIcon.svelte';
	import {
		xForStep,
		yOffsetForStep,
		systemForStep,
		noteYAt,
		generateWavyLine,
		beamStartInsideStem,
		beamEndInsideStem,
		beamRectX,
		beamRectWidth,
		forwardBeamHookEndX,
		backwardBeamHookEndX
	} from '$lib/score-visual-helpers';

	let {
		note,
		visualNotes,
		scoreCursor,
		currentStep,
		stepWidth,
		topPad,
		height,
		lineY,
		slotsPerSystem,
		stepsPerBeat,
		systemGap,
		topMargin,
		firstSystemLeftPad,
		systemLeftPad,
		slotW,
		barlineNoteGap,
		totalSlots,
		endRepeatNoteGap,
		writeOnEmptyOrSelect
	}: {
		note: VisualNote;
		visualNotes: VisualNote[];
		scoreCursor: number;
		currentStep: number;
		stepWidth: number;
		topPad: number;
		height: number;
		lineY: number;
		slotsPerSystem: number;
		stepsPerBeat: number;
		systemGap: number;
		topMargin: number;
		firstSystemLeftPad: number;
		systemLeftPad: number;
		slotW: number;
		barlineNoteGap: number;
		totalSlots: number;
		endRepeatNoteGap: number;
		writeOnEmptyOrSelect: (note: VisualNote) => void;
	} = $props();

	let x = $derived(
		xForStep(
			note.step,
			stepsPerBeat,
			slotsPerSystem,
			slotW,
			barlineNoteGap,
			totalSlots,
			endRepeatNoteGap,
			firstSystemLeftPad,
			systemLeftPad
		)
	);

	let selected = $derived(scoreCursor >= note.step && scoreCursor < note.step + note.duration);
	let playing = $derived(currentStep >= note.step && currentStep < note.step + note.duration);
	let hitWidth = $derived(Math.max(stepWidth * note.duration, 16));
	let yOffset = $derived(
		yOffsetForStep(note.step, slotsPerSystem, stepsPerBeat, height, systemGap, topMargin)
	);
	let system = $derived(systemForStep(note.step, slotsPerSystem, stepsPerBeat));
</script>

<rect
	x={x - hitWidth / 2}
	y={yOffset + topPad}
	width={hitWidth}
	height={height - topPad * 2}
	class:selected
	class:playing
	class="slot-hit"
	role="button"
	tabindex="0"
	aria-label="Selecionar step {note.step}"
	onclick={() => writeOnEmptyOrSelect(note)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			writeOnEmptyOrSelect(note);
		}
	}}
	oncontextmenu={(e) => {
		e.preventDefault();
	}}
/>

{#if note.isRest && note.isExplicitRest}
	<g class="rest" transform="translate({x - 12} {yOffset + lineY - 16})">
		<NotationIcon duration={note.baseDuration} rest size={32} />
	</g>
	{#if note.isDotted}
		<circle cx={x + 22} cy={yOffset + lineY} r="2.5" fill="#111" />
	{/if}
{:else if !note.isRest}
	{@const stroke = note.stroke as StrokeType}
	{@const y = noteYAt(
		stroke,
		note.step,
		slotsPerSystem,
		stepsPerBeat,
		height,
		systemGap,
		topMargin,
		lineY
	)}
	{@const shape = STROKES[stroke].notehead}

	{#if note.baseDuration < 64 && shape !== 'none'}
		<line
			x1={x + 8}
			y1={y}
			x2={x + 8}
			y2={note.beamType !== 'none' ? yOffset + note.beamY - 2 : y - 42}
			class="stem"
		/>
		{#if shape === 'headless' && note.beamType === 'none'}
			<line x1={x + 2} y1={y - 42} x2={x + 14} y2={y - 42} class="stem" />
		{/if}
	{/if}

	{#if note.beamType === 'none'}
		{#if note.baseDuration === 8}
			<path
				d="M {x + 8} {y - 42} Q {x + 15} {y - 30} {x + 18} {y - 15} Q {x + 12} {y - 25} {x + 8} {y -
					25}"
				fill="#111"
			/>
		{:else if note.baseDuration === 4}
			<path
				d="M {x + 8} {y - 42} Q {x + 15} {y - 30} {x + 18} {y - 15} Q {x + 12} {y - 25} {x + 8} {y -
					25}"
				fill="#111"
			/>
			<path
				d="M {x + 8} {y - 32} Q {x + 15} {y - 20} {x + 18} {y - 5} Q {x + 12} {y - 15} {x + 8} {y -
					15}"
				fill="#111"
			/>
		{:else if note.baseDuration === 2}
			<path
				d="M {x + 8} {y - 42} Q {x + 15} {y - 30} {x + 18} {y - 15} Q {x + 12} {y - 25} {x + 8} {y -
					25}"
				fill="#111"
			/>
			<path
				d="M {x + 8} {y - 32} Q {x + 15} {y - 20} {x + 18} {y - 5} Q {x + 12} {y - 15} {x + 8} {y -
					15}"
				fill="#111"
			/>
			<path
				d="M {x + 8} {y - 22} Q {x + 15} {y - 10} {x + 18} {y + 5} Q {x + 12} {y - 5} {x + 8} {y -
					5}"
				fill="#111"
			/>
		{:else if note.baseDuration === 1}
			<path
				d="M {x + 8} {y - 42} Q {x + 15} {y - 30} {x + 18} {y - 15} Q {x + 12} {y - 25} {x + 8} {y -
					25}"
				fill="#111"
			/>
			<path
				d="M {x + 8} {y - 32} Q {x + 15} {y - 20} {x + 18} {y - 5} Q {x + 12} {y - 15} {x + 8} {y -
					15}"
				fill="#111"
			/>
			<path
				d="M {x + 8} {y - 22} Q {x + 15} {y - 10} {x + 18} {y + 5} Q {x + 12} {y - 5} {x + 8} {y -
					5}"
				fill="#111"
			/>
			<path
				d="M {x + 8} {y - 12} Q {x + 15} {y} {x + 18} {y + 15} Q {x + 12} {y + 5} {x + 8} {y + 5}"
				fill="#111"
			/>
		{/if}
	{/if}

	{#if note.beamType !== 'none'}
		{@const nextNote = visualNotes.find((vn) => vn.step === note.nextBeamStep)}
		{@const nextX = nextNote
			? xForStep(
					nextNote.step,
					stepsPerBeat,
					slotsPerSystem,
					slotW,
					barlineNoteGap,
					totalSlots,
					endRepeatNoteGap,
					firstSystemLeftPad,
					systemLeftPad
				)
			: 0}
		{@const stemX = x + 8}
		{@const nextStemX = nextX + 8}
		{@const beamStartX = beamStartInsideStem(stemX)}
		{@const beamEndX = beamEndInsideStem(nextStemX)}
		{@const nextSameSystem =
			nextNote != null && systemForStep(nextNote.step, slotsPerSystem, stepsPerBeat) === system}
		{@const prevNoteIndex = visualNotes.findIndex((vn) => vn === note) - 1}
		{@const prevNote = prevNoteIndex >= 0 ? visualNotes[prevNoteIndex] : null}
		{@const prevInSameGroup = prevNote != null && prevNote.beamType !== 'none'}

		{#if nextNote != null && nextSameSystem}
			<rect
				x={beamRectX(beamStartX, beamEndX)}
				y={yOffset + note.beamY - 2}
				width={beamRectWidth(beamStartX, beamEndX)}
				height="4"
				fill="#111"
			/>

			{#if note.baseDuration <= 4}
				{#if nextNote.baseDuration <= 4}
					<rect
						x={beamRectX(beamStartX, beamEndX)}
						y={yOffset + note.beamY + 6}
						width={beamRectWidth(beamStartX, beamEndX)}
						height="4"
						fill="#111"
					/>
				{:else if !prevInSameGroup || prevNote.baseDuration > 4}
					{@const hookEndX = forwardBeamHookEndX(stemX, nextStemX)}
					<rect
						x={beamRectX(beamStartX, hookEndX)}
						y={yOffset + note.beamY + 6}
						width={beamRectWidth(beamStartX, hookEndX)}
						height="4"
						fill="#111"
					/>
				{/if}
			{/if}

			{#if note.baseDuration <= 2}
				{#if nextNote.baseDuration <= 2}
					<rect
						x={beamRectX(beamStartX, beamEndX)}
						y={yOffset + note.beamY + 14}
						width={beamRectWidth(beamStartX, beamEndX)}
						height="4"
						fill="#111"
					/>
				{:else if !prevInSameGroup || prevNote.baseDuration > 2}
					{@const hookEndX = forwardBeamHookEndX(stemX, nextStemX)}
					<rect
						x={beamRectX(beamStartX, hookEndX)}
						y={yOffset + note.beamY + 14}
						width={beamRectWidth(beamStartX, hookEndX)}
						height="4"
						fill="#111"
					/>
				{/if}
			{/if}

			{#if note.baseDuration === 1}
				{#if nextNote.baseDuration === 1}
					<rect
						x={beamRectX(beamStartX, beamEndX)}
						y={yOffset + note.beamY + 22}
						width={beamRectWidth(beamStartX, beamEndX)}
						height="4"
						fill="#111"
					/>
				{:else if !prevInSameGroup || prevNote.baseDuration > 1}
					{@const hookEndX = forwardBeamHookEndX(stemX, nextStemX)}
					<rect
						x={beamRectX(beamStartX, hookEndX)}
						y={yOffset + note.beamY + 22}
						width={beamRectWidth(beamStartX, hookEndX)}
						height="4"
						fill="#111"
					/>
				{/if}
			{/if}
		{/if}

		{#if note.beamType === 'end'}
			{@const prevNoteIndex = visualNotes.findIndex((vn) => vn === note) - 1}
			{@const prevNote = prevNoteIndex >= 0 ? visualNotes[prevNoteIndex] : null}
			{@const prevInSameGroup = prevNote != null && prevNote.beamType !== 'none'}
			{@const prevX = prevNote
				? xForStep(
						prevNote.step,
						stepsPerBeat,
						slotsPerSystem,
						slotW,
						barlineNoteGap,
						totalSlots,
						endRepeatNoteGap,
						firstSystemLeftPad,
						systemLeftPad
					)
				: x}
			{@const prevStemX = prevX + 8}
			{@const backwardBeamEndX = beamEndInsideStem(stemX)}
			{#if note.baseDuration <= 4 && (!prevInSameGroup || prevNote.baseDuration > 4)}
				{@const hookEndX = backwardBeamHookEndX(stemX, prevStemX)}
				<rect
					x={beamRectX(backwardBeamEndX, hookEndX)}
					y={yOffset + note.beamY + 6}
					width={beamRectWidth(backwardBeamEndX, hookEndX)}
					height="4"
					fill="#111"
				/>
			{/if}
			{#if note.baseDuration <= 2 && (!prevInSameGroup || prevNote.baseDuration > 2)}
				{@const hookEndX = backwardBeamHookEndX(stemX, prevStemX)}
				<rect
					x={beamRectX(backwardBeamEndX, hookEndX)}
					y={yOffset + note.beamY + 14}
					width={beamRectWidth(backwardBeamEndX, hookEndX)}
					height="4"
					fill="#111"
				/>
			{/if}
			{#if note.baseDuration === 1 && (!prevInSameGroup || prevNote.baseDuration > 1)}
				{@const hookEndX = backwardBeamHookEndX(stemX, prevStemX)}
				<rect
					x={beamRectX(backwardBeamEndX, hookEndX)}
					y={yOffset + note.beamY + 22}
					width={beamRectWidth(backwardBeamEndX, hookEndX)}
					height="4"
					fill="#111"
				/>
			{/if}
		{/if}
	{/if}

	{#if note.isDotted}
		<circle cx={x + 24} cy={y} r="2.5" fill="#111" />
	{/if}

	{#if note.isAccented}
		{@const accentY =
			note.beamType !== 'none'
				? yOffset + note.beamY - 14
				: note.baseDuration < 64
					? y - 54
					: y - 20}
		<text x={x + 8} y={accentY} class="accent-mark">&gt;</text>
	{/if}

	{#if shape === 'none'}
		{@const w = note.baseDuration * stepWidth}
		{@const waveY = yOffset + topPad + 10}
		<path d={generateWavyLine(x, waveY, w - 4)} fill="none" stroke="#111" stroke-width="1.5" />
	{:else if shape === 'x'}
		<line x1={x - 7} y1={y - 7} x2={x + 7} y2={y + 7} class="note-x" />
		<line x1={x - 7} y1={y + 7} x2={x + 7} y2={y - 7} class="note-x" />
	{:else if shape !== 'headless'}
		{#if shape === 'ghost'}
			<path d="M {x - 10} {y - 9} Q {x - 17} {y} {x - 10} {y + 9}" class="paren-arc" />
			<path d="M {x + 10} {y - 9} Q {x + 17} {y} {x + 10} {y + 9}" class="paren-arc" />
		{/if}
		<ellipse
			cx={x}
			cy={y}
			rx="8"
			ry="6"
			transform="rotate(-20 {x} {y})"
			class="note-head"
			fill={note.baseDuration >= 32 ? 'none' : '#111'}
			stroke={note.baseDuration >= 32 ? '#111' : 'none'}
			stroke-width="1.5"
		/>
	{/if}

	{#if note.tieToNext}
		{@const nextTieNote = visualNotes.find((vn) => vn.step === note.nextTieStep)}
		{@const nextSameSystem =
			nextTieNote != null &&
			systemForStep(nextTieNote.step, slotsPerSystem, stepsPerBeat) === system}
		{#if nextTieNote != null && nextSameSystem}
			{@const nextX = xForStep(
				nextTieNote.step,
				stepsPerBeat,
				slotsPerSystem,
				slotW,
				barlineNoteGap,
				totalSlots,
				endRepeatNoteGap,
				firstSystemLeftPad,
				systemLeftPad
			)}
			{@const tieY = y + 16}
			{@const tieControlY = y + 28}
			<path
				d="M {x + 12} {tieY} Q {(x + nextX) / 2} {tieControlY} {nextX - 12} {tieY}"
				class="tie"
			/>
		{/if}
	{/if}

	{#if !note.tieFromPrevious}
		<text {x} y={yOffset + lineY + 45} class="stroke-label">
			{stroke.replace('_mut', '')}
		</text>
	{/if}
{/if}

<style>
	.accent-mark {
		fill: #111;
		font:
			400 24px Arial,
			sans-serif;
		text-anchor: middle;
		dominant-baseline: middle;
	}
	.slot-hit {
		fill: transparent;
		cursor: pointer;
		outline: none;
	}
	.slot-hit:hover {
		fill: rgba(90, 130, 180, 0.1);
	}
	.slot-hit.selected {
		fill: rgba(255, 77, 109, 0.14);
		stroke: rgba(255, 77, 109, 0.55);
		stroke-width: 1.5;
	}
	.slot-hit.playing {
		fill: rgba(255, 149, 0, 0.18);
	}
	.stem,
	.note-x {
		stroke: #111;
		stroke-width: 2;
	}
	.stem {
		stroke-linecap: butt;
	}
	.note-x {
		stroke-linecap: round;
	}
	.tie {
		fill: none;
		stroke: #111;
		stroke-width: 1.8;
		stroke-linecap: round;
	}
	.note-head {
		fill: #111;
	}
	.paren-arc {
		fill: none;
		stroke: #111;
		stroke-width: 1.5;
		stroke-linecap: round;
	}
	.stroke-label {
		fill: rgba(0, 0, 0, 0.62);
		font:
			700 11px Arial,
			sans-serif;
		text-anchor: middle;
	}
	.rest {
		color: #111;
	}
</style>
