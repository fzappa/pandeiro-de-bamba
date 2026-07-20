<script lang="ts">
	import { onMount } from 'svelte';
	import { scoreState } from '$lib/state/score.svelte';
	import { editorState } from '$lib/state/editor.svelte';
	import * as persistence from '$lib/services/persistence';
	import { handleScoreKeydown } from '$lib/score-edit/keyboard';
	import ScoreToolbar from './score/ScoreToolbar.svelte';
	import ScoreSurface from './score/ScoreSurface.svelte';

	let { tutorialStep = '' }: { tutorialStep?: string } = $props();

	onMount(() => {
		editorState.savedScores = persistence.readSavedScores();
		editorState.libraryName = scoreState.value?.title ?? '';
	});
</script>

<svelte:window on:keydown={handleScoreKeydown} />

<div class="editor">
	<ScoreToolbar {tutorialStep} />
	<ScoreSurface {tutorialStep} />
</div>

<style>
	.editor {
		display: grid;
		grid-template-columns: 260px minmax(0, 1fr);
		gap: 0;
		height: 100%;
		min-height: 0;
		min-width: 0;
		background: #d7d2c6;
	}

	@media (max-width: 980px) {
		.editor {
			grid-template-columns: 1fr;
			grid-template-rows: auto minmax(0, 1fr);
		}
	}

	@media (max-width: 640px) {
		.editor {
			grid-template-rows: auto minmax(260px, 1fr);
		}
	}
</style>
