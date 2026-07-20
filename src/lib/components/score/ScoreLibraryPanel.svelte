<script lang="ts">
	import type { SavedScore } from '$lib/services/persistence';

	let {
		libraryName,
		selectedSavedId,
		savedScores,
		selectedSavedScore,
		tutorialStep,
		libraryStatus,
		libraryStatusKind,
		onSaveCurrentScore,
		onLoadSavedScore,
		onDeleteSavedScore,
		onExportCurrentScore,
		onImportScoreFile,
		onUpdateLibraryName,
		onUpdateSelectedSavedId
	}: {
		libraryName: string;
		selectedSavedId: string;
		savedScores: SavedScore[];
		selectedSavedScore: SavedScore | null;
		tutorialStep: string;
		libraryStatus: string;
		libraryStatusKind: 'info' | 'success' | 'warning' | 'error';
		onSaveCurrentScore: () => void;
		onLoadSavedScore: () => void;
		onDeleteSavedScore: () => void;
		onExportCurrentScore: () => void;
		onImportScoreFile: (file: File) => void;
		onUpdateLibraryName: (name: string) => void;
		onUpdateSelectedSavedId: (id: string) => void;
	} = $props();

	let importInput: HTMLInputElement | null = null;
</script>

<div class="field library-field" class:tutorial-focus={tutorialStep === 'library'}>
	<span class="field-label">Arquivo</span>
	<div class="library-row">
		<input
			class="library-name"
			type="text"
			placeholder="Nome da levada"
			value={libraryName}
			oninput={(e) => onUpdateLibraryName((e.target as HTMLInputElement).value)}
		/>
		<select
			class="library-select"
			aria-label="Arquivos salvos"
			value={selectedSavedId}
			onchange={(e) => {
				const val = (e.target as HTMLSelectElement).value;
				onUpdateSelectedSavedId(val);
			}}
		>
			<option value="">Arquivos salvos</option>
			{#each savedScores as saved (saved.id)}
				<option value={saved.id}>{saved.name}</option>
			{/each}
		</select>
		<button
			class="library-btn primary"
			type="button"
			onclick={onSaveCurrentScore}
			title="Salvar no navegador"
		>
			Salvar
		</button>
		<button
			class="library-btn"
			type="button"
			onclick={onLoadSavedScore}
			disabled={!selectedSavedScore}
			title="Carregar arquivo salvo"
		>
			Carregar
		</button>
		<button
			class="library-btn danger"
			type="button"
			onclick={onDeleteSavedScore}
			disabled={!selectedSavedScore}
			title="Excluir arquivo salvo"
		>
			Excluir
		</button>
		<button
			class="library-btn"
			type="button"
			onclick={onExportCurrentScore}
			title="Exportar arquivo JSON"
		>
			Exportar
		</button>
		<button
			class="library-btn"
			type="button"
			onclick={() => importInput?.click()}
			title="Importar arquivo JSON"
		>
			Importar
		</button>
		<input
			bind:this={importInput}
			class="file-input"
			type="file"
			accept="application/json,.json,.pdb.json"
			onchange={(e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (file) onImportScoreFile(file);
				(e.target as HTMLInputElement).value = '';
			}}
		/>
	</div>
	{#if savedScores.length === 0}
		<p class="library-empty-note">
			Você ainda não tem arquivos salvos neste navegador. Clique em <strong>Salvar</strong> para criar
			seu primeiro arquivo.
		</p>
	{/if}
	{#if libraryStatus}
		<span
			class="library-status"
			class:success={libraryStatusKind === 'success'}
			class:warning={libraryStatusKind === 'warning'}
			class:error={libraryStatusKind === 'error'}
		>
			{libraryStatus}
		</span>
	{/if}
</div>

<style>
	.library-field {
		min-width: 0;
	}
	.field-label {
		font-size: 0.65rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.45);
		text-transform: uppercase;
	}
	.library-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.35rem;
	}
	.library-name {
		min-width: 0;
		grid-column: 1 / -1;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.13);
		color: #fff;
		padding: 0.42rem 0.65rem;
		border-radius: 7px;
		font-size: 0.82rem;
		outline: none;
	}
	.library-name::placeholder {
		color: rgba(255, 255, 255, 0.35);
	}
	.library-name:focus {
		border-color: rgba(255, 77, 109, 0.5);
		box-shadow: 0 0 0 2px rgba(255, 77, 109, 0.12);
	}
	.library-select {
		appearance: none;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.13);
		color: #fff;
		border-radius: 7px;
		outline: none;
		min-width: 0;
		max-width: none;
		grid-column: 1 / -1;
		padding: 0.4rem 1.8rem 0.4rem 0.65rem;
		padding-right: 0.65rem;
		font-size: 0.82rem;
	}
	.library-btn {
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 7px;
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.82);
		cursor: pointer;
		font-size: 0.72rem;
		font-weight: 800;
		padding: 0.46rem 0.58rem;
		white-space: nowrap;
		min-width: 0;
	}
	.library-btn:hover:not(:disabled),
	.library-btn:focus-visible:not(:disabled) {
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
		outline: none;
	}
	.library-btn.primary {
		background: rgba(255, 77, 109, 0.18);
		border-color: rgba(255, 77, 109, 0.42);
		color: #fff;
	}
	.library-btn.danger:hover:not(:disabled),
	.library-btn.danger:focus-visible:not(:disabled) {
		background: rgba(255, 77, 109, 0.22);
		border-color: rgba(255, 77, 109, 0.48);
	}
	.library-btn:disabled {
		opacity: 0.38;
		cursor: not-allowed;
	}
	.library-status {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.68rem;
		font-weight: 700;
		margin-top: 0.15rem;
		padding: 0.34rem 0.45rem;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	.library-status.success {
		color: #9ef5b5;
		border-color: rgba(78, 199, 110, 0.45);
		background: rgba(30, 120, 52, 0.24);
	}
	.library-status.warning {
		color: #ffd78c;
		border-color: rgba(255, 189, 74, 0.42);
		background: rgba(133, 85, 12, 0.27);
	}
	.library-status.error {
		color: #ffb9c6;
		border-color: rgba(255, 77, 109, 0.45);
		background: rgba(122, 30, 48, 0.28);
	}
	.library-empty-note {
		margin: 0.1rem 0 0;
		color: rgba(255, 255, 255, 0.72);
		font-size: 0.68rem;
		line-height: 1.45;
	}
	.file-input {
		display: none;
	}

	@media (max-width: 980px) {
		.library-field {
			grid-column: 1 / -1;
		}
	}

	@media (max-width: 640px) {
		.library-name {
			font-size: 0.78rem;
		}
		.library-row {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 420px) {
		.library-btn {
			padding-inline: 0.45rem;
		}
	}
</style>
