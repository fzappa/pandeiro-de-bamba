<script lang="ts">
	import type { DurationOption } from '$lib/score-edit/keyboard';
	import NotationIcon from '../NotationIcon.svelte';

	let {
		isRestMode,
		DURATION_OPTIONS,
		selectedDuration,
		isDotted,
		isAccented,
		canUndo,
		canRedo,
		tutorialStep,
		onSelectDurationOption,
		onToggleRestMode,
		onToggleDotted,
		onToggleAccent,
		onClearAll,
		onUndo,
		onRedo
	}: {
		isRestMode: boolean;
		DURATION_OPTIONS: DurationOption[];
		selectedDuration: number;
		isDotted: boolean;
		isAccented: boolean;
		canUndo: boolean;
		canRedo: boolean;
		tutorialStep: string;
		onSelectDurationOption: (val: number) => void;
		onToggleRestMode: (v: boolean) => void;
		onToggleDotted: () => void;
		onToggleAccent: () => void;
		onClearAll: () => void;
		onUndo: () => void;
		onRedo: () => void;
	} = $props();
</script>

<div class="tool-group" class:tutorial-focus={tutorialStep === 'duration-tools'}>
	<span class="group-label">{isRestMode ? 'Pausas:' : 'Figuras:'}</span>
	{#each DURATION_OPTIONS as durationOption (durationOption.value)}
		<button
			class="tool-btn icon-btn"
			class:active={selectedDuration === durationOption.value}
			onclick={() => onSelectDurationOption(durationOption.value)}
			title={isRestMode ? durationOption.restTitle : durationOption.noteTitle}
			aria-label={isRestMode ? durationOption.restTitle : durationOption.noteTitle}
		>
			<NotationIcon duration={durationOption.value} rest={isRestMode} size={24} />
		</button>
	{/each}
</div>

<div class="divider"></div>

<div class="tool-group" class:tutorial-focus={tutorialStep === 'duration-tools'}>
	<span class="group-label">Modo:</span>
	<button
		class="tool-btn"
		class:active={!isRestMode}
		onclick={() => onToggleRestMode(false)}
		title="Inserir Notas"><NotationIcon duration={16} size={20} /> Nota</button
	>
	<button
		class="tool-btn rest-btn"
		class:active={isRestMode}
		onclick={() => onToggleRestMode(true)}
		title="Inserir Pausas"><NotationIcon duration={16} rest size={20} /> Pausa</button
	>
	<button
		class="tool-btn"
		class:active={isDotted}
		onclick={onToggleDotted}
		title="Ponto de Aumento (aumenta 50% da duração)">.</button
	>
	<button
		class="tool-btn accent-btn"
		class:active={isAccented}
		onclick={onToggleAccent}
		title="Acento da nota">&gt;</button
	>
	<div class="divider"></div>
	<button
		class="tool-btn"
		onclick={onUndo}
		disabled={!canUndo}
		title="Desfazer (Ctrl+Z)">↩</button
	>
	<button
		class="tool-btn"
		onclick={onRedo}
		disabled={!canRedo}
		title="Refazer (Ctrl+Y)">↪</button
	>
	<div class="divider"></div>
	<button class="tool-btn rest-btn" onclick={onClearAll} title="Limpar toda a pauta"
		>🗑 Limpar</button
	>
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
	.icon-btn {
		width: 38px;
		height: 38px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}
	.tool-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}
	.tool-btn:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}
	.tool-btn.active {
		background: #ff4d6d;
		color: #fff;
		border-color: transparent;
	}
	.rest-btn {
		border-bottom: 3px solid #777;
	}
	.accent-btn {
		font-size: 1.15rem;
		font-weight: 900;
		line-height: 1;
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
		.icon-btn {
			width: 40px;
			height: 40px;
			padding: 0;
		}
		.divider {
			display: none;
		}
	}
</style>
