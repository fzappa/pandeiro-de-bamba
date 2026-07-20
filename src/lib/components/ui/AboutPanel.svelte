<script lang="ts">
	type AboutInfo = {
		name: string;
		version: string;
		developer: string;
		contact: string;
		license: string;
	};

	let { showAbout = $bindable(), aboutInfo }: { showAbout: boolean; aboutInfo: AboutInfo } =
		$props();
</script>

{#if showAbout}
	<div class="about-layer">
		<button
			class="about-backdrop"
			type="button"
			aria-label="Fechar tela Sobre"
			onclick={() => (showAbout = false)}
		></button>
		<div class="about-panel" role="dialog" aria-modal="true" aria-labelledby="about-title">
			<header class="about-header">
				<div class="about-title-row">
					<div>
						<p class="about-kicker">Sobre o projeto</p>
						<h2 id="about-title">Pandeiro de Bamba</h2>
					</div>
					<img class="about-icon" src="/pandeiro.png" alt="" aria-hidden="true" />
				</div>
				<button
					class="close-button"
					type="button"
					aria-label="Fechar tela Sobre"
					onclick={() => (showAbout = false)}
				>
					×
				</button>
			</header>

			<p class="about-copy">
				Aplicativo para criar, escrever e tocar levadas de pandeiro com notação própria para samba,
				choro e outros ritmos.
			</p>

			<dl class="about-grid">
				<div>
					<dt>Versão</dt>
					<dd>{aboutInfo.version}</dd>
				</div>
				<div>
					<dt>Desenvolvedor</dt>
					<dd>{aboutInfo.developer}</dd>
				</div>
				<div>
					<dt>Contato</dt>
					<dd>{aboutInfo.contact}</dd>
				</div>
				<div>
					<dt>Licença</dt>
					<dd>{aboutInfo.license}</dd>
				</div>
				<div>
					<dt>GitHub</dt>
					<dd>
						<a href="https://github.com/fzappa/pandeiro-de-bamba" target="_blank" rel="noopener noreferrer"
							>fzappa/pandeiro-de-bamba</a
						>
					</dd>
				</div>
			</dl>

			<div class="about-tech">
				<span>SvelteKit</span>
				<span>Svelte 5</span>
				<span>TypeScript</span>
				<span>SVG</span>
				<span>Web Audio API</span>
				<span>pnpm</span>
			</div>

			<p class="about-note">
				Observação: o conteúdo da biblioteca é baseado na interpretação do autor do software.
			</p>
		</div>
	</div>
{/if}

<style>
	.about-layer {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		justify-content: flex-end;
		padding: 0;
	}

	.about-backdrop {
		position: absolute;
		inset: 0;
		border: 0;
		background: rgba(5, 5, 8, 0.38);
		backdrop-filter: blur(6px);
		cursor: default;
	}

	.about-panel {
		position: relative;
		z-index: 1;
		width: min(560px, 92vw);
		height: 100vh;
		max-height: 100vh;
		overflow: auto;
		border-left: 1px solid rgba(255, 255, 255, 0.12);
		background:
			linear-gradient(160deg, rgba(28, 28, 34, 0.98), rgba(13, 13, 18, 0.96)),
			radial-gradient(circle at top right, rgba(255, 77, 109, 0.18), transparent 42%);
		box-shadow: 0 18px 60px rgba(0, 0, 0, 0.48);
		color: #f8f1dc;
		padding: 1.2rem;
		animation: aboutPanelIn 0.18s ease-out;
	}

	.about-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		padding-bottom: 0.85rem;
	}

	.about-title-row {
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}

	.about-icon {
		width: 56px;
		height: 56px;
		flex: 0 0 auto;
		object-fit: contain;
		filter: drop-shadow(0 0 14px rgba(255, 77, 109, 0.28));
	}

	.about-kicker {
		margin: 0 0 0.2rem;
		color: #ff4d6d;
		font-size: 0.68rem;
		font-weight: 900;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.about-header h2 {
		margin: 0;
		color: #fff;
		font-size: 1.35rem;
		letter-spacing: 0.02em;
	}

	.close-button {
		width: 34px;
		height: 34px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.06);
		color: #fff;
		cursor: pointer;
		font-size: 1.4rem;
		line-height: 1;
	}

	.close-button:hover,
	.close-button:focus-visible {
		background: rgba(255, 255, 255, 0.12);
		outline: none;
	}

	.about-copy {
		margin: 1rem 0;
		color: rgba(248, 241, 220, 0.82);
		font-size: 0.95rem;
		line-height: 1.55;
	}

	.about-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		margin: 0;
	}

	.about-grid div {
		min-width: 0;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.045);
		padding: 0.75rem;
	}

	.about-grid dt {
		color: rgba(248, 241, 220, 0.48);
		font-size: 0.64rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		margin-bottom: 0.28rem;
		text-transform: uppercase;
	}

	.about-grid dd {
		margin: 0;
		color: #fff;
		font-size: 0.92rem;
		font-weight: 700;
		overflow-wrap: anywhere;
		white-space: nowrap;
	}

	.about-grid dd a {
		color: inherit;
		text-decoration-color: rgba(255, 255, 255, 0.4);
	}

	.about-grid dd a:hover,
	.about-grid dd a:focus-visible {
		text-decoration-color: currentColor;
	}

	.about-tech {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-top: 1rem;
	}

	.about-tech span {
		border: 1px solid rgba(255, 77, 109, 0.28);
		border-radius: 999px;
		color: rgba(255, 255, 255, 0.78);
		font-size: 0.7rem;
		font-weight: 800;
		padding: 0.32rem 0.52rem;
	}

	.about-note {
		border-left: 3px solid rgba(255, 77, 109, 0.55);
		color: rgba(248, 241, 220, 0.68);
		font-size: 0.78rem;
		line-height: 1.5;
		margin: 1rem 0 0;
		padding-left: 0.78rem;
	}

	@keyframes aboutPanelIn {
		from {
			transform: translateX(24px);
			opacity: 0.85;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@media (max-width: 560px) {
		.about-layer {
			align-items: flex-end;
		}

		.about-panel {
			width: 100%;
			height: min(82vh, 620px);
			max-height: 82vh;
			border-left: 0;
			border-top: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: 8px 8px 0 0;
			animation: aboutPanelUp 0.18s ease-out;
		}

		.about-grid {
			grid-template-columns: 1fr;
		}
	}

	@keyframes aboutPanelUp {
		from {
			transform: translateY(24px);
			opacity: 0.85;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
