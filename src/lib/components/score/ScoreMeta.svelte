<script lang="ts">
	import { scoreState } from '$lib/state/score.svelte';

	let {
		firstSystemSvgWidth
	}: {
		firstSystemSvgWidth: number;
	} = $props();
</script>

<foreignObject x={25} y="2" width={firstSystemSvgWidth - 50} height="85">
	<div
		class="score-meta-container"
		style="display: flex; justify-content: space-between; align-items: flex-start; height: 100%; width: 100%; font-family: sans-serif;"
	>
		<!-- Esquerda: Gênero -->
		<div
			style="flex: 1; display: flex; flex-direction: column; justify-content: flex-start; min-width: 80px;"
		>
			<input
				class="score-genre-input"
				type="text"
				aria-label="Gênero da partitura"
				placeholder="Gênero"
				value={scoreState.value.genre || ''}
				maxlength="30"
				style="font-size: 16px; font-weight: bold; border: none; background: transparent; padding: 0; margin: 0; outline: none; width: 100%; color: #111; text-align: left;"
				oninput={(e) => scoreState.setGenre((e.target as HTMLInputElement).value)}
			/>
		</div>

		<!-- Centro: Título e Subtítulo -->
		<div
			style="flex: 2; display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 150px; margin: 0 10px;"
		>
			<input
				class="score-title-input"
				type="text"
				aria-label="Título da partitura"
				placeholder="Título"
				value={scoreState.value.title || ''}
				maxlength="80"
				style="font-size: 26px; font-weight: bold; border: none; background: transparent; padding: 0; margin: 0; outline: none; width: 100%; color: #111; text-align: center;"
				oninput={(e) => scoreState.setTitle((e.target as HTMLInputElement).value)}
			/>
			<input
				class="score-subtitle-input"
				type="text"
				aria-label="Subtítulo da partitura"
				placeholder="Subtítulo"
				value={scoreState.value.subtitle || ''}
				maxlength="80"
				style="font-size: 14px; border: none; background: transparent; padding: 0; margin: 0; outline: none; width: 100%; color: #d11; text-align: center; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold;"
				oninput={(e) => scoreState.setSubtitle((e.target as HTMLInputElement).value)}
			/>
		</div>

		<!-- Direita: Autoria/Referência -->
		<div
			style="flex: 1; display: flex; flex-direction: column; align-items: flex-end; text-align: right; min-width: 150px;"
		>
			<textarea
				class="score-author-input"
				aria-label="Referência ou autoria"
				placeholder="Referência / Autoria"
				value={scoreState.value.author || ''}
				maxlength="120"
				style="font-size: 14px; font-weight: bold; border: none; background: transparent; padding: 0; margin: 0; outline: none; width: 100%; color: #111; text-align: right; resize: none; height: 50px; line-height: 1.2; font-family: inherit;"
				oninput={(e) => scoreState.setAuthor((e.target as HTMLTextAreaElement).value)}
			></textarea>
		</div>
	</div>
</foreignObject>

<style>
	.score-title-input::placeholder {
		color: rgba(0, 0, 0, 0.32);
		font-weight: 500;
	}
	.score-title-input:focus {
		background: rgba(255, 255, 255, 0.34) !important;
		box-shadow: inset 0 -1px rgba(0, 0, 0, 0.22);
	}
	.score-subtitle-input::placeholder {
		color: rgba(0, 0, 0, 0.28);
		-webkit-text-fill-color: rgba(0, 0, 0, 0.28);
	}
	.score-author-input::placeholder {
		color: rgba(0, 0, 0, 0.32);
	}
	.score-subtitle-input:focus,
	.score-author-input:focus {
		background: rgba(255, 255, 255, 0.34) !important;
		box-shadow: inset 0 -1px rgba(0, 0, 0, 0.22);
	}
</style>
