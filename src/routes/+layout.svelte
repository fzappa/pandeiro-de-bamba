<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { env as publicEnv } from '$env/dynamic/public';
	import '../app.css';

	// Opcional: sem PUBLIC_GA_MEASUREMENT_ID definida, o rastreamento fica
	// desativado (nenhum script do Google Analytics é carregado).
	const GA_MEASUREMENT_ID = publicEnv.PUBLIC_GA_MEASUREMENT_ID;

	let { children } = $props();
	let showLogout = $derived(page.data.authEnabled && page.url.pathname !== '/login');

	let analyticsInitialized = false;

	// gtag.js só processa comandos recebidos como objeto `arguments`;
	// um array comum é ignorado silenciosamente.
	function gtag() {
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push(arguments);
	}

	function trackPageView(path: string) {
		if (!browser || dev || !GA_MEASUREMENT_ID) return;

		window.gtag = window.gtag || gtag;
		if (!analyticsInitialized) {
			window.gtag('js', new Date());
			analyticsInitialized = true;
		}

		window.gtag('config', GA_MEASUREMENT_ID, {
			page_path: path
		});
	}

	afterNavigate(({ to }) => {
		if (!to?.url) return;
		trackPageView(`${to.url.pathname}${to.url.search}`);
	});
</script>

<svelte:head>
	{#if !dev && GA_MEASUREMENT_ID}
		<!-- Script inline aqui seria bloqueado pela CSP (sem nonce fora do
		     app.html); o stub de window.gtag fica em trackPageView. -->
		<script async src="https://www.googletagmanager.com/gtag/js?id={GA_MEASUREMENT_ID}"></script>
	{/if}
</svelte:head>

{#if showLogout}
	<a class="logout-link" href={resolve('/logout')} data-sveltekit-preload-data="off">Sair</a>
{/if}

{@render children()}

<style>
	.logout-link {
		position: fixed;
		top: 0.6rem;
		right: 0.6rem;
		z-index: 999;
		border: 1px solid rgba(255, 255, 255, 0.13);
		border-radius: 999px;
		background: rgba(20, 20, 23, 0.9);
		backdrop-filter: blur(4px);
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-decoration: none;
		padding: 0.4rem 0.7rem;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}
	.logout-link:hover,
	.logout-link:focus-visible {
		background: rgba(255, 77, 109, 0.16);
		border-color: rgba(255, 77, 109, 0.5);
		color: #fff;
		outline: none;
	}
</style>
