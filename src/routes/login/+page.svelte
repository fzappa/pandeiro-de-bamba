<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}
</script>

<svelte:head>
	<title>Entrar · Pandeiro de Bamba</title>
</svelte:head>

<div class="login-screen">
	<form class="login-card" method="POST" use:enhance>
		<img class="login-logo" src="/pandeiro.png" alt="" />
		<h1 class="login-title">Pandeiro <span>DE BAMBA</span></h1>
		<p class="login-subtitle">Acesso restrito durante o desenvolvimento.</p>

		{#if form?.error}
			<p class="login-error" role="alert">{form.error}</p>
		{/if}

		<label class="login-field">
			<span>Usuário</span>
			<input
				type="text"
				name="username"
				autocomplete="username"
				value={form?.username ?? ''}
				use:focusOnMount
				required
			/>
		</label>

		<label class="login-field">
			<span>Senha</span>
			<input type="password" name="password" autocomplete="current-password" required />
		</label>

		<button type="submit" class="login-submit">Entrar</button>
	</form>
</div>

<style>
	.login-screen {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background:
			radial-gradient(circle at 50% 0%, rgba(255, 77, 109, 0.12), transparent 60%), var(--color-bg);
	}

	.login-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		width: 100%;
		max-width: 340px;
		padding: 2.2rem 1.9rem 1.9rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
	}

	.login-logo {
		width: 52px;
		height: 52px;
		object-fit: contain;
		filter: drop-shadow(0 0 14px rgba(255, 77, 109, 0.5));
	}

	.login-title {
		margin: 0;
		font-size: 1.3rem;
		font-weight: 800;
		color: #fff;
		text-align: center;
		letter-spacing: 0.5px;
	}
	.login-title span {
		display: block;
		margin-top: 2px;
		color: var(--color-accent);
		font-weight: 900;
		font-size: 0.62rem;
		letter-spacing: 2.2px;
	}

	.login-subtitle {
		margin: -0.4rem 0 0.3rem;
		color: var(--color-text-muted);
		font-size: 0.8rem;
		text-align: center;
	}

	.login-error {
		width: 100%;
		margin: -0.2rem 0 0;
		padding: 0.55rem 0.7rem;
		border: 1px solid rgba(255, 77, 109, 0.4);
		border-radius: var(--radius-sm);
		background: rgba(255, 77, 109, 0.12);
		color: #ffb3c0;
		font-size: 0.78rem;
		text-align: center;
	}

	.login-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		width: 100%;
	}
	.login-field span {
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.login-field input {
		width: 100%;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: #fff;
		padding: 0.6rem 0.7rem;
		font-size: 0.92rem;
		font-family: inherit;
		outline: none;
		transition:
			border-color var(--transition-fast),
			background var(--transition-fast);
	}
	.login-field input:focus-visible {
		border-color: var(--color-accent);
		background: rgba(255, 255, 255, 0.09);
		outline: none;
	}

	.login-submit {
		width: 100%;
		margin-top: 0.4rem;
		padding: 0.68rem;
		border: none;
		border-radius: var(--radius-sm);
		background: var(--color-accent);
		color: #fff;
		font-family: inherit;
		font-size: 0.88rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		cursor: pointer;
		box-shadow: 0 8px 20px rgba(255, 77, 109, 0.35);
		transition: filter var(--transition-fast);
	}
	.login-submit:hover,
	.login-submit:focus-visible {
		filter: brightness(1.08);
	}
</style>
