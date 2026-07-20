<script lang="ts">
	let {
		duration,
		rest = false,
		x = 0,
		y = 0,
		size = 32,
		title = ''
	}: {
		duration: number;
		rest?: boolean;
		x?: number;
		y?: number;
		size?: number;
		title?: string;
	} = $props();

	let flagCount = $derived(
		duration <= 1 ? 4 : duration <= 2 ? 3 : duration <= 4 ? 2 : duration <= 8 ? 1 : 0
	);
</script>

<svg
	class="notation-icon"
	class:rest
	{x}
	{y}
	width={size}
	height={size}
	viewBox="0 0 32 32"
	role={title ? 'img' : 'presentation'}
	aria-label={title || undefined}
	aria-hidden={title ? undefined : 'true'}
>
	{#if title}
		<title>{title}</title>
	{/if}

	{#if rest}
		{#if duration >= 64}
			<rect x="10" y="14" width="12" height="4" rx="0.8" />
			<line x1="8" y1="14" x2="24" y2="14" />
		{:else if duration >= 32}
			<rect x="10" y="10" width="12" height="4" rx="0.8" />
			<line x1="8" y1="14" x2="24" y2="14" />
		{:else if duration >= 16}
			<path
				d="M 18 5 C 13 9 13 12 18 16 C 12 17 12 21 17 27"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{:else}
			<line x1="19" y1="6" x2="13" y2="28" />
			{#if flagCount >= 1}
				<circle cx="17.5" cy="8" r="2.6" />
				<path d="M 19 9 C 24 11 23 16 16.5 17" fill="none" stroke-linecap="round" />
			{/if}
			{#if flagCount >= 2}
				<circle cx="16.3" cy="13.2" r="2.6" />
				<path d="M 17.8 14 C 22.8 16 21.8 21 15.3 22" fill="none" stroke-linecap="round" />
			{/if}
			{#if flagCount >= 3}
				<circle cx="15.1" cy="18.4" r="2.6" />
				<path d="M 16.6 19.2 C 21 21 20 25.4 14.4 26.2" fill="none" stroke-linecap="round" />
			{/if}
			{#if flagCount >= 4}
				<circle cx="13.9" cy="23.6" r="2.6" />
				<path d="M 15.4 24 C 19 25.4 18 28.6 13.4 29.2" fill="none" stroke-linecap="round" />
			{/if}
		{/if}
	{:else}
		<ellipse
			cx="12"
			cy="22"
			rx="6.2"
			ry="4.4"
			transform="rotate(-22 12 22)"
			fill={duration >= 32 ? 'none' : 'currentColor'}
		/>
		{#if duration < 64}
			<line x1="17.5" y1="20.5" x2="17.5" y2="5" />
		{/if}
		{#if flagCount >= 1}
			<path d="M 17.5 5 C 25 8 25 14 17.5 15.5" fill="none" stroke-linecap="round" />
		{/if}
		{#if flagCount >= 2}
			<path d="M 17.5 10 C 25 13 25 19 17.5 20.5" fill="none" stroke-linecap="round" />
		{/if}
		{#if flagCount >= 3}
			<path d="M 17.5 15 C 24 17.5 24 23 17.5 24" fill="none" stroke-linecap="round" />
		{/if}
		{#if flagCount >= 4}
			<path d="M 17.5 20 C 23 22 23 27 17.5 28" fill="none" stroke-linecap="round" />
		{/if}
	{/if}
</svg>

<style>
	.notation-icon {
		display: inline-block;
		flex: 0 0 auto;
		color: currentColor;
		overflow: visible;
		vertical-align: middle;
	}

	.notation-icon :global(line),
	.notation-icon :global(path),
	.notation-icon :global(ellipse) {
		stroke: currentColor;
		stroke-width: 2;
	}

	.notation-icon.rest :global(circle) {
		fill: currentColor;
		stroke: none;
	}

	.notation-icon.rest :global(path),
	.notation-icon.rest :global(line) {
		stroke-width: 2.2;
	}
</style>
