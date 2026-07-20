<script lang="ts">
	import { LIBRARY_SCORES } from '$lib/library';
	import { DEFAULT_BPM, MAX_BPM, MAX_MEASURES, MIN_BPM } from '$lib/presets';
	import { scoreState } from '$lib/state/score.svelte';
	import { playbackState } from '$lib/state/playback.svelte';
	import { editorState } from '$lib/state/editor.svelte';
	import { STROKES } from '$lib/types';

	import ScoreLibraryPanel from './ScoreLibraryPanel.svelte';
	import ScoreSoundTools from './ScoreSoundTools.svelte';
	import ScoreNotationTools from './ScoreNotationTools.svelte';

	import {
		loadLibraryScore,
		saveCurrentScore,
		loadSavedScore,
		deleteSavedScore,
		exportCurrentScore,
		importScoreFile,
		setTimeSignature,
		prepareAudio
	} from '$lib/score-edit/library-actions';
	import {
		writeSelected,
		toggleAccent,
		replaceSelectedWithRest,
		togglePlayback
	} from '$lib/score-edit/note-actions';
	import { STROKE_ORDER, DURATION_OPTIONS } from '$lib/score-edit/keyboard';

	let { tutorialStep = '' }: { tutorialStep?: string } = $props();

	const beatOptions = Array.from({ length: 16 }, (_, i) => i + 1);
	const subdivisionOptions = [2, 4, 8, 16];

	let genres = $derived.by(() => {
		const gSet = new Set<string>();
		for (const item of LIBRARY_SCORES) {
			if (item.score.genre) gSet.add(item.score.genre);
		}
		return [
			'Todos',
			...Array.from(gSet).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
		];
	});

	let filteredLibraryScores = $derived.by(() => {
		if (editorState.selectedGenreFilter === 'Todos') return LIBRARY_SCORES;
		return LIBRARY_SCORES.filter((item) => item.score.genre === editorState.selectedGenreFilter);
	});

	$effect(() => {
		const isDotted = playbackState.notationDotted;
		playbackState.notationDuration =
			isDotted && editorState.selectedDuration >= 2
				? editorState.selectedDuration * 1.5
				: editorState.selectedDuration;
	});
</script>

<aside
	class="side-tools"
	class:tutorial-focus={tutorialStep === 'tools'}
	aria-label="Ferramentas da partitura"
>
	<div class="toolbar">
		<div class="field">
			<label for="sc-genre-filter">Gênero</label>
			<div class="select-wrap">
				<select
					id="sc-genre-filter"
					value={editorState.selectedGenreFilter}
					onchange={(e) => {
						editorState.selectedGenreFilter = (e.target as HTMLSelectElement).value;
						editorState.selectedLibraryId = '';
					}}
				>
					{#each genres as genre (genre)}
						<option value={genre}>{genre}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="field">
			<label for="sc-library">Biblioteca</label>
			<div class="select-wrap">
				<select
					id="sc-library"
					value={editorState.selectedLibraryId}
					onchange={(e) => {
						editorState.selectedLibraryId = (e.target as HTMLSelectElement).value;
						loadLibraryScore(editorState.selectedLibraryId);
					}}
				>
					<option value="" disabled>Selecionar levada</option>
					{#each filteredLibraryScores as item (item.id)}
						<option value={item.id}>{item.name}</option>
					{:else}
						<option value="" disabled>Nenhuma levada encontrada</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="field bpm-field">
			<label for="sc-bpm">BPM</label>
			<div class="bpm-row">
				<input
					id="sc-bpm"
					type="range"
					min={MIN_BPM}
					max={MAX_BPM}
					value={scoreState.value?.bpm ?? DEFAULT_BPM}
					oninput={(e) => scoreState.setBpm(parseInt((e.target as HTMLInputElement).value))}
				/>
				<span class="bpm-val">{scoreState.value?.bpm ?? DEFAULT_BPM}</span>
			</div>
		</div>

		<div class="field meas-field">
			<span class="field-label">Compassos</span>
			<div class="meas-row">
				<button
					class="meas-btn"
					onclick={() => scoreState.setMeasures(scoreState.value!.measures - 1)}
					disabled={scoreState.value?.measures === 1}>-</button
				>
				<span class="meas-val">{scoreState.value?.measures ?? 2}</span>
				<button
					class="meas-btn"
					onclick={() => scoreState.setMeasures(scoreState.value!.measures + 1)}
					disabled={scoreState.value?.measures === MAX_MEASURES}>+</button
				>
			</div>
		</div>

		<div class="field sig-field">
			<span class="field-label">Compasso</span>
			<div class="sig-row">
				<select
					aria-label="Numerador do compasso"
					value={scoreState.value?.timeSignature.beats ?? 4}
					onchange={(e) =>
						setTimeSignature(
							parseInt((e.target as HTMLSelectElement).value),
							scoreState.value!.timeSignature.subdivision
						)}
				>
					{#each beatOptions as beat (beat)}
						<option value={beat}>{beat}</option>
					{/each}
				</select>
				<span class="sig-slash">/</span>
				<select
					aria-label="Denominador do compasso"
					value={scoreState.value?.timeSignature.subdivision ?? 4}
					onchange={(e) =>
						setTimeSignature(
							scoreState.value!.timeSignature.beats,
							parseInt((e.target as HTMLSelectElement).value)
						)}
				>
					{#each subdivisionOptions as subdivision (subdivision)}
						<option value={subdivision}>{subdivision}</option>
					{/each}
				</select>
			</div>
		</div>

		<ScoreLibraryPanel
			libraryName={editorState.libraryName}
			selectedSavedId={editorState.selectedSavedId}
			savedScores={editorState.savedScores}
			selectedSavedScore={editorState.selectedSavedScore}
			{tutorialStep}
			libraryStatus={editorState.libraryStatus}
			libraryStatusKind={editorState.libraryStatusKind}
			onSaveCurrentScore={saveCurrentScore}
			onLoadSavedScore={loadSavedScore}
			onDeleteSavedScore={deleteSavedScore}
			onExportCurrentScore={exportCurrentScore}
			onImportScoreFile={importScoreFile}
			onUpdateLibraryName={(name) => (editorState.libraryName = name)}
			onUpdateSelectedSavedId={(id) => {
				editorState.selectedSavedId = id;
				editorState.libraryName = editorState.selectedSavedScore?.name ?? editorState.libraryName;
			}}
		/>

		{#if filteredLibraryScores.length === 0}
			<p class="library-empty-hint" role="status">
				Nenhuma levada encontrada para o genero selecionado. Escolha "Todos" para ver a biblioteca
				completa.
			</p>
		{/if}
	</div>

	<div class="notation-toolbar">
		<ScoreSoundTools
			{STROKE_ORDER}
			{STROKES}
			selectedStroke={editorState.selectedStroke}
			isAbafado={playbackState.notationMuted}
			{tutorialStep}
			onPrepareAudio={prepareAudio}
			onSelectStroke={(stroke) => {
				editorState.selectedStroke = stroke;
				if (!['P', 'D'].includes(stroke)) playbackState.notationMuted = false;
				playbackState.notationRestMode = false;
				writeSelected();
			}}
			onToggleAbafado={() => {
				playbackState.notationMuted = !playbackState.notationMuted;
				playbackState.notationRestMode = false;
				writeSelected();
			}}
		/>

		<ScoreNotationTools
			isRestMode={playbackState.notationRestMode}
			{DURATION_OPTIONS}
			selectedDuration={editorState.selectedDuration}
			isDotted={playbackState.notationDotted}
			isAccented={playbackState.notationAccented}
			canUndo={scoreState.canUndo}
			canRedo={scoreState.canRedo}
			{tutorialStep}
			onSelectDurationOption={(val) => {
				const nextDuration = playbackState.notationDotted && val >= 2 ? val * 1.5 : val;
				editorState.selectedDuration = val;
				if (playbackState.notationRestMode) replaceSelectedWithRest(nextDuration);
			}}
			onToggleRestMode={(v) => {
				playbackState.notationRestMode = v;
				if (playbackState.notationRestMode) replaceSelectedWithRest();
			}}
			onToggleDotted={() => (playbackState.notationDotted = !playbackState.notationDotted)}
			onToggleAccent={toggleAccent}
			onClearAll={() => scoreState.clearAll()}
			onUndo={() => scoreState.undo()}
			onRedo={() => scoreState.redo()}
		/>
	</div>

	<div class="playback" class:tutorial-focus={tutorialStep === 'tools'}>
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
</aside>

<style>
	.side-tools {
		position: relative;
		min-height: 0;
		min-width: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding: 0.85rem;
		border-right: 1px solid rgba(0, 0, 0, 0.35);
		box-shadow: 12px 0 24px rgba(0, 0, 0, 0.12);

		/* Sombra de rolagem: só aparece nas bordas quando há conteúdo
		   escondido acima/abaixo (técnica CSS de "scroll shadow"). */
		background:
			linear-gradient(#17171d 30%, rgba(23, 23, 29, 0)) local,
			linear-gradient(rgba(23, 23, 29, 0), #17171d 70%) local,
			radial-gradient(farthest-side at 50% 0, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0)) scroll,
			radial-gradient(farthest-side at 50% 100%, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0)) scroll;
		background-repeat: no-repeat;
		background-color: #17171d;
		background-position:
			top,
			bottom,
			top,
			bottom;
		background-size:
			100% 40px,
			100% 40px,
			100% 14px,
			100% 14px;
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding: 0;
		flex-shrink: 0;
		min-width: 0;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.field label,
	.field-label {
		font-size: 0.65rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.45);
		text-transform: uppercase;
	}
	.select-wrap {
		position: relative;
	}
	select {
		appearance: none;
		width: 100%;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.13);
		color: #fff;
		padding: 0.4rem 1.8rem 0.4rem 0.65rem;
		border-radius: 7px;
		font-size: 0.88rem;
		outline: none;
	}
	.select-wrap::after {
		content: '▾';
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		color: rgba(255, 255, 255, 0.4);
		pointer-events: none;
	}
	.bpm-field {
		min-width: 0;
	}
	.bpm-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	input[type='range'] {
		flex: 1;
		appearance: none;
		-webkit-appearance: none;
		height: 3px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.14);
	}
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #ff4d6d;
	}
	.bpm-val {
		font-size: 1rem;
		font-weight: 700;
		color: #ff4d6d;
		min-width: 2.2rem;
		text-align: right;
	}
	.meas-row,
	.sig-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.4rem;
		background: rgba(255, 255, 255, 0.07);
		padding: 0.15rem;
		border-radius: 7px;
		border: 1px solid rgba(255, 255, 255, 0.13);
	}
	.meas-btn {
		background: transparent;
		color: #fff;
		border: none;
		width: 24px;
		height: 24px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
	}
	.meas-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
	}
	.meas-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.meas-val {
		font-size: 0.9rem;
		font-weight: 700;
		min-width: 1.2rem;
		text-align: center;
	}
	.sig-field select {
		min-width: 3.2rem;
		padding-right: 0.65rem;
		text-align: center;
	}
	.sig-slash {
		color: rgba(255, 255, 255, 0.5);
		font-weight: 800;
	}
	.playback {
		position: sticky;
		bottom: -0.85rem;
		display: flex;
		gap: 0.45rem;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin: 0 -0.85rem -0.85rem;
		padding: 0.55rem 0.85rem 0.85rem;
		background: linear-gradient(rgba(23, 23, 29, 0), #17171d 22%);
		z-index: 15;
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
		color: rgba(255, 255, 255, 0.6);
	}
	.btn-play svg,
	.btn-stop svg {
		width: 16px;
		height: 16px;
		fill: currentColor;
	}

	.notation-toolbar {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-top: 0.7rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		flex-shrink: 0;
		min-width: 0;
	}

	.library-empty-hint {
		margin: -0.15rem 0 0;
		padding: 0.5rem 0.6rem;
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 7px;
		background: rgba(255, 255, 255, 0.04);
		color: rgba(255, 255, 255, 0.78);
		font-size: 0.72rem;
		line-height: 1.4;
	}

	:global(.tutorial-focus) {
		position: relative;
		z-index: 80;
		outline: 2px solid rgba(255, 77, 109, 0.95);
		outline-offset: 5px;
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

	.side-tools :global(button[title]) {
		position: relative;
	}

	.side-tools :global(button[title]:hover::after),
	.side-tools :global(button[title]:focus-visible::after) {
		content: attr(title);
		position: absolute;
		left: 50%;
		bottom: calc(100% + 8px);
		z-index: 20;
		width: max-content;
		max-width: 220px;
		transform: translateX(-50%);
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 6px;
		background: rgba(10, 10, 14, 0.96);
		color: #fff;
		font-size: 0.68rem;
		font-weight: 700;
		line-height: 1.35;
		padding: 0.42rem 0.5rem;
		pointer-events: none;
		white-space: normal;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.38);
	}

	@media (max-width: 980px) {
		.side-tools {
			max-height: 34dvh;
			border-right: 0;
			border-bottom: 1px solid rgba(0, 0, 0, 0.35);
			box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
		}

		.toolbar,
		.notation-toolbar {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			align-items: start;
		}

		.playback {
			grid-column: 1 / -1;
		}
	}

	@media (max-width: 640px) {
		.side-tools {
			max-height: 38dvh;
			gap: 0.55rem;
			padding: 0.65rem;
		}

		.toolbar,
		.notation-toolbar {
			grid-template-columns: repeat(2, minmax(8.5rem, 1fr));
			gap: 0.55rem;
		}

		.field label,
		.field-label {
			font-size: 0.6rem;
		}

		select {
			font-size: 0.78rem;
		}

		.btn-metro,
		.btn-play,
		.btn-stop {
			width: 38px;
			height: 38px;
		}

		.notation-toolbar {
			padding-top: 0.55rem;
		}

		.side-tools :global(button[title]:hover::after),
		.side-tools :global(button[title]:focus-visible::after) {
			display: none;
		}
	}

	@media (max-width: 420px) {
		.toolbar,
		.notation-toolbar {
			grid-template-columns: 1fr;
		}

		.side-tools {
			max-height: 40dvh;
		}
	}
</style>
