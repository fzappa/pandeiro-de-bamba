<script lang="ts">
	let { openTutorial, openAbout }: { openTutorial: () => void; openAbout: () => void } = $props();
</script>

<header class="app-header">
	<div class="branding">
		<img class="logo" src="/pandeiro.png" alt="Pandeiro de Bamba" />
		<div class="title">Pandeiro <span>DE BAMBA</span></div>
	</div>
	<div class="header-actions">
		<button class="header-button" type="button" onclick={openTutorial}> Tutorial </button>
		<button class="header-button" type="button" onclick={openAbout}> Sobre </button>
	</div>
</header>

<style>
	.app-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 1rem;
		background: #121217;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		flex-shrink: 0;
	}

	.branding {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
	}
	.logo {
		width: 30px;
		height: 30px;
		object-fit: contain;
		filter: drop-shadow(0 0 8px rgba(255, 77, 109, 0.5));
	}
	.title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 800;
		color: #fff;
		letter-spacing: 0.5px;
		white-space: nowrap;
	}
	.title span {
		color: #ff4d6d;
		font-weight: 900;
		font-size: 0.6rem;
		letter-spacing: 2px;
		display: block;
		margin-top: -2px;
	}
	.header-actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.55rem;
	}

	.header-button {
		border: 1px solid rgba(255, 255, 255, 0.13);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.07);
		color: rgba(255, 255, 255, 0.86);
		cursor: pointer;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		padding: 0.48rem 0.85rem;
		text-transform: uppercase;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}
	.header-button:hover,
	.header-button:focus-visible {
		background: rgba(255, 77, 109, 0.14);
		border-color: rgba(255, 77, 109, 0.48);
		color: #fff;
		outline: none;
	}

	@media (max-width: 560px) {
		.app-header {
			align-items: flex-start;
			padding: 0.65rem 0.75rem;
		}

		.logo {
			width: 28px;
			height: 28px;
		}

		.title {
			font-size: 0.98rem;
		}

		.title span {
			font-size: 0.54rem;
			letter-spacing: 1.4px;
		}

		.header-actions {
			gap: 0.35rem;
		}

		.header-button {
			font-size: 0.68rem;
			letter-spacing: 0.04em;
			padding: 0.42rem 0.58rem;
		}
	}
</style>
