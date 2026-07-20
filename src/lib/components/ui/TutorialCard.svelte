<script lang="ts">
	import type { TutorialStep } from '$lib/data/tutorial';

	let {
		showTutorial = $bindable(),
		tutorialIndex = $bindable(),
		tutorialSteps,
		currentTutorial,
		nextTutorial,
		previousTutorial
	}: {
		showTutorial: boolean;
		tutorialIndex: number;
		tutorialSteps: TutorialStep[];
		currentTutorial: TutorialStep;
		nextTutorial: () => void;
		previousTutorial: () => void;
	} = $props();
</script>

{#if showTutorial}
	<div class="tutorial-scrim" aria-hidden="true"></div>
	<div class="tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
		<div class="tutorial-count">{tutorialIndex + 1} / {tutorialSteps.length}</div>
		<h2 id="tutorial-title">{currentTutorial.title}</h2>
		<p>{currentTutorial.body}</p>
		<div class="tutorial-actions">
			<button type="button" class="tutorial-button ghost" onclick={() => (showTutorial = false)}>
				Fechar
			</button>
			<button
				type="button"
				class="tutorial-button"
				onclick={previousTutorial}
				disabled={tutorialIndex === 0}
			>
				Voltar
			</button>
			<button type="button" class="tutorial-button primary" onclick={nextTutorial}>
				{tutorialIndex === tutorialSteps.length - 1 ? 'Concluir' : 'Próximo'}
			</button>
		</div>
	</div>
{/if}

<style>
	.tutorial-scrim {
		position: fixed;
		inset: 0;
		z-index: 70;
		pointer-events: none;
		background: rgba(5, 5, 8, 0.56);
	}

	.tutorial-card {
		pointer-events: auto;
		position: fixed;
		z-index: 100;
		right: clamp(1rem, 3vw, 2rem);
		bottom: clamp(1rem, 3vw, 2rem);
		width: min(420px, calc(100vw - 2rem));
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 8px;
		background: rgba(22, 22, 28, 0.97);
		box-shadow: 0 22px 70px rgba(0, 0, 0, 0.55);
		color: #f8f1dc;
		padding: 1rem;
	}

	.tutorial-count {
		color: #ff4d6d;
		font-size: 0.72rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		margin-bottom: 0.35rem;
		text-transform: uppercase;
	}

	.tutorial-card h2 {
		margin: 0 0 0.5rem;
		color: #fff;
		font-size: 1.15rem;
	}

	.tutorial-card p {
		margin: 0;
		color: rgba(248, 241, 220, 0.78);
		line-height: 1.5;
	}

	.tutorial-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.tutorial-button {
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 7px;
		background: rgba(255, 255, 255, 0.07);
		color: #fff;
		cursor: pointer;
		font-size: 0.78rem;
		font-weight: 800;
		padding: 0.5rem 0.7rem;
	}

	.tutorial-button.primary {
		background: #ff4d6d;
		border-color: transparent;
	}

	.tutorial-button.ghost {
		margin-right: auto;
	}

	.tutorial-button:disabled {
		cursor: not-allowed;
		opacity: 0.38;
	}

	@media (max-width: 560px) {
		.tutorial-card {
			right: 0.75rem;
			bottom: 0.75rem;
			width: calc(100vw - 1.5rem);
			padding: 0.85rem;
		}

		.tutorial-actions {
			flex-wrap: wrap;
		}

		.tutorial-button.ghost {
			margin-right: 0;
		}
	}
</style>
