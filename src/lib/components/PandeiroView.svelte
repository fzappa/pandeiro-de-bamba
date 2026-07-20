<script lang="ts">
	import type { StrokeType } from '$lib/types';
	import { STROKES } from '$lib/types';
	import {
		MUTED_SKIN_COLOR,
		MUTED_THUMB_SKIN_TRANSFORM,
		MUTED_UPPER_SKIN_TRANSFORM,
		OPEN_SKIN_COLOR,
		THUMB_SKIN_PATH,
		UPPER_SKIN_PATH
	} from '$lib/pandeiroGeometry';

	let {
		activeStrokes = new Set<StrokeType>(),
		genre = '',
		bpm = 0,
		hoverStroke = null,
		compact = false,
		mutedPreview = false,
		tutorialStep = '',
		swaying = false,
		isAccented = false,
		swingDuration = 800,
		onStrokeClick,
		onStrokeHover,
		onRegionLeave
	}: {
		activeStrokes?: Set<StrokeType>;
		genre?: string;
		bpm?: number;
		hoverStroke?: StrokeType | null;
		compact?: boolean;
		mutedPreview?: boolean;
		tutorialStep?: string;
		swaying?: boolean;
		isAccented?: boolean;
		swingDuration?: number;
		onStrokeClick?: (stroke: StrokeType) => void;
		onStrokeHover?: (stroke: StrokeType) => void;
		onRegionLeave?: () => void;
	} = $props();

	let previewActive = $derived(activeStrokes.size === 0);
	let showMutedThumbSkin = $derived(
		activeStrokes.has('P_mut') ||
			(previewActive && (hoverStroke === 'P_mut' || (hoverStroke === 'P' && mutedPreview)))
	);
	let showOpenThumbSkin = $derived(
		activeStrokes.has('P') || (previewActive && hoverStroke === 'P' && !mutedPreview)
	);
	let showMutedUpperSkin = $derived(
		activeStrokes.has('D_mut') ||
			(previewActive && (hoverStroke === 'D_mut' || (hoverStroke === 'D' && mutedPreview)))
	);
	let showOpenUpperSkin = $derived(
		activeStrokes.has('D') || (previewActive && hoverStroke === 'D' && !mutedPreview)
	);
	let showThumbSkin = $derived(showOpenThumbSkin || showMutedThumbSkin);
	let showUpperSkin = $derived(showOpenUpperSkin || showMutedUpperSkin);
	let showCenterPm = $derived(activeStrokes.has('Pm') || (previewActive && hoverStroke === 'Pm'));
	let showCenterDm = $derived(activeStrokes.has('Dm') || (previewActive && hoverStroke === 'Dm'));
	let showFullSkin = $derived(activeStrokes.has('T') || (previewActive && hoverStroke === 'T'));
	let showBottomRim = $derived(activeStrokes.has('H') || (previewActive && hoverStroke === 'H'));
	let showTopRim = $derived(activeStrokes.has('F') || (previewActive && hoverStroke === 'F'));
	let showRulo = $derived(activeStrokes.has('R') || (previewActive && hoverStroke === 'R'));
	let previewing = $derived(previewActive && hoverStroke !== null);
	let anyHit = $derived(activeStrokes.size > 0);

	// Cores por região
	let bottomColor = $derived(
		[...activeStrokes].find((s) => STROKES[s]?.pandeiroRegion === 'bottom-rim')
			? STROKES[[...activeStrokes].find((s) => STROKES[s]?.pandeiroRegion === 'bottom-rim')!]?.color
			: STROKES.H.color
	);
	let _thumbColor = $derived(
		[...activeStrokes].find((s) => STROKES[s]?.pandeiroRegion === 'thumb-skin')
			? STROKES[[...activeStrokes].find((s) => STROKES[s]?.pandeiroRegion === 'thumb-skin')!]?.color
			: STROKES.P.color
	);
	let topColor = $derived(
		[...activeStrokes].find((s) => STROKES[s]?.pandeiroRegion === 'top-rim')
			? STROKES[[...activeStrokes].find((s) => STROKES[s]?.pandeiroRegion === 'top-rim')!]?.color
			: STROKES.F.color
	);

	// Quais sonoridades estão ativas (para mostrar labels)
	let activeLabels = $derived(
		[...activeStrokes]
			.map((s) => (s === 'P_mut' ? '(P)' : s === 'D_mut' ? '(D)' : STROKES[s]?.label))
			.join(' + ')
	);
	let hasActiveLabels = $derived(activeLabels.length > 0);

	// ─── Modelo cinemático do balanço ───────────────────────────────────────────
	// θ_p(t) = Ap · sin(ωt)          — pitch: inclina frente/trás
	// θ_r(t) = Ar · sin(ωt + φ)      — roll:  inclina lateral; φ ≠ 0 → elipse
	// A(t) modulada lentamente para simular variações expressivas do groove
	// Transiente h_i(t) = K·e^{-λΔt}·sin(ωd·Δt) acoplado a cada golpe

	const MAX_TILT = 15; // graus máximo de inclinação
	const TENSION = 14; // velocidade da resposta (interpolação)
	const IDLE_SWAY_AMP = 1.5; // balanço muito sutil quando parado
	const IDLE_SWAY_FREQ = 0.5; // Hz

	type HitTransient = { t0: number; K: number };
	let hitTransients: HitTransient[] = [];
	let swingTransform = $state('');
	let currentPitch = $state(0);
	let currentRoll = $state(0);
	let lastTs = 0;
	let prevAnyHit = false;

	// Determina a inclinação alvo baseada nos toques ativos
	let targetPitch = $derived.by(() => {
		if (!swaying && activeStrokes.size === 0) return 0;

		const tiltMod = isAccented ? 2.0 : 1.0;

		// Prioridade para toques de borda (gangorra)
		const hasTop = activeStrokes.has('D') || activeStrokes.has('D_mut') || activeStrokes.has('F');
		const hasBottom =
			activeStrokes.has('P') || activeStrokes.has('P_mut') || activeStrokes.has('H');
		const hasMiddle =
			activeStrokes.has('T') ||
			activeStrokes.has('Pm') ||
			activeStrokes.has('Dm') ||
			activeStrokes.has('R');

		if (hasTop) return -MAX_TILT * tiltMod; // Inclina para cima (D/F)
		if (hasBottom) return MAX_TILT * tiltMod; // Inclina para baixo (P/H)
		if (hasMiddle) return 0; // Toques no meio anulam a inclinação

		return 0;
	});

	// Detecta borda de subida de anyHit para injetar transiente
	$effect(() => {
		const curr = anyHit;
		if (curr && !prevAnyHit && swaying) {
			const K = isAccented ? 6.5 : 4.2;
			hitTransients.push({ t0: performance.now() / 1000, K });
		}
		prevAnyHit = curr;
	});

	// Loop principal: inicia/para com swaying; recalcula f quando swingDuration muda
	$effect(() => {
		void swingDuration;

		if (!swaying) {
			swingTransform = '';
			hitTransients = [];
			return;
		}

		let rafId: number;

		const tick = (ts: number) => {
			const dt = lastTs ? (ts - lastTs) / 1000 : 0.016;
			lastTs = ts;
			const t = ts / 1000;

			// Balanço ocioso (apenas se swaying estiver ativo e sem toques)
			const idleSway =
				swaying && activeStrokes.size === 0
					? IDLE_SWAY_AMP * Math.sin(2 * Math.PI * IDLE_SWAY_FREQ * t)
					: 0;

			// Interpolação suave para o pitch (gangorra)
			currentPitch += (targetPitch + idleSway - currentPitch) * (1 - Math.exp(-TENSION * dt));

			// Transientes de golpe (tremor rápido)
			hitTransients = hitTransients.filter((h) => t - h.t0 < 0.6);
			let tp = 0,
				tr = 0;
			for (const h of hitTransients) {
				const ddt = t - h.t0;
				const env = h.K * Math.exp(-15 * ddt);
				tp += env * Math.sin(30 * ddt);
				tr += env * 0.4 * Math.sin(22 * ddt);
			}

			// Interpolação para o roll (mínimo, apenas para transientes)
			currentRoll += (tr - currentRoll) * (1 - Math.exp(-20 * dt));

			const finalPitch = currentPitch + tp;
			swingTransform = `rotateX(${finalPitch.toFixed(2)}deg) rotateZ(${currentRoll.toFixed(2)}deg)`;

			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	});
</script>

<div class="pandeiro-wrapper" class:tutorial-focus={tutorialStep === 'pandeiro'} class:compact>
	<!-- Gênero -->
	<div class="genre-label">
		<span class="genre-name">{genre.toUpperCase()}</span>
		<span
			class="active-label"
			class:empty={!hasActiveLabels && bpm <= 0}
			class:idle={!hasActiveLabels && bpm > 0}
			>{activeLabels || (bpm > 0 ? `${bpm} BPM` : '')}</span
		>
	</div>

	<!-- SVG do Pandeiro -->
	<div class="pandeiro-container" style:transform={swingTransform}>
		<svg
			viewBox="0 0 400 400"
			xmlns="http://www.w3.org/2000/svg"
			class="pandeiro-svg"
			class:any-hit={anyHit}
		>
			<defs>
				<filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
					<feGaussianBlur stdDeviation="10" result="b" />
					<feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
				</filter>

				<filter id="glow-sm" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="5" result="b" />
					<feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
				</filter>

				<!-- Gradiente da pele -->
				<radialGradient id="skin" cx="45%" cy="40%" r="60%">
					<stop offset="0%" stop-color="#e8d5a3" />
					<stop offset="65%" stop-color="#d4b87a" />
					<stop offset="100%" stop-color="#b8955a" />
				</radialGradient>

				<!-- Gradiente do aro -->
				<radialGradient id="rim" cx="50%" cy="50%" r="50%">
					<stop offset="72%" stop-color="#5c3d1e" />
					<stop offset="100%" stop-color="#3d2610" />
				</radialGradient>

				<!-- Glow centro -->
				<radialGradient id="cg" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color={STROKES.T.color} stop-opacity="0.65" />
					<stop offset="100%" stop-color={STROKES.T.color} stop-opacity="0.04" />
				</radialGradient>

				<clipPath id="skin-clip">
					<circle cx="200" cy="200" r="150" />
				</clipPath>
			</defs>

			<!-- Sombra -->
			<circle cx="200" cy="206" r="176" fill="rgba(0,0,0,0.45)" />

			<!-- Aro exterior -->
			<circle cx="200" cy="200" r="178" fill="url(#rim)" />

			<!-- Glow borda INFERIOR (Baixo: P, H) -->
			{#if showBottomRim}
				<path
					d="M 60 290 A 160 160 0 0 0 340 290"
					fill="none"
					stroke={bottomColor}
					stroke-width="20"
					stroke-linecap="round"
					opacity="0.9"
					filter="url(#glow)"
					class:preview-hit={previewing}
				/>
			{/if}

			<!-- Glow borda SUPERIOR (Cima: D, F) -->
			{#if showTopRim}
				<path
					d="M 60 110 A 160 160 0 0 1 340 110"
					fill="none"
					stroke={topColor}
					stroke-width="20"
					stroke-linecap="round"
					opacity="0.9"
					filter="url(#glow)"
					class:preview-hit={previewing}
				/>
			{/if}

			<!-- Platinelas decorativas (sempre visíveis) -->
			{#each Array(6) as _, i (i)}
				{@const angle = i * 60 - 30}
				{@const a = (angle * Math.PI) / 180}
				{@const px = 200 + 163 * Math.cos(a)}
				{@const py = 200 + 163 * Math.sin(a)}
				<ellipse
					cx={px}
					cy={py}
					rx="12"
					ry="6"
					transform="rotate({angle} {px} {py})"
					fill="#b8902a"
					opacity="0.65"
				/>
			{/each}

			<!-- Pele -->
			<circle cx="200" cy="200" r="150" fill="url(#skin)" />
			<circle cx="200" cy="200" r="150" fill="none" stroke="#a8853a" stroke-width="2" />

			<!-- TAPA (T): couro inteiro -->
			{#if showFullSkin}
				<g clip-path="url(#skin-clip)" filter="url(#glow)" class:preview-hit={previewing}>
					<circle cx="200" cy="200" r="150" fill="url(#cg)" />
					<circle
						cx="200"
						cy="200"
						r="138"
						fill="none"
						stroke={STROKES.T.color}
						stroke-width="5"
						opacity="0.45"
					/>
				</g>
			{/if}

			<!-- Região do POLEGAR (P): couro inferior, solto mais amplo e abafado mais contido -->
			{#if showOpenThumbSkin}
				<g clip-path="url(#skin-clip)" filter="url(#glow-sm)" class:preview-hit={previewing}>
					<path d={THUMB_SKIN_PATH} fill={OPEN_SKIN_COLOR} opacity="0.92" />
				</g>
			{/if}

			{#if showMutedThumbSkin}
				<g clip-path="url(#skin-clip)" filter="url(#glow-sm)" class:preview-hit={previewing}>
					<path
						d={THUMB_SKIN_PATH}
						transform={MUTED_THUMB_SKIN_TRANSFORM}
						fill={MUTED_SKIN_COLOR}
						opacity="0.92"
						stroke="rgba(120,20,36,0.38)"
						stroke-width="2"
					/>
				</g>
			{/if}

			<!-- Grave com a ponta dos dedos (D): couro superior, solto mais amplo e abafado mais contido -->
			{#if showOpenUpperSkin}
				<g clip-path="url(#skin-clip)" filter="url(#glow-sm)" class:preview-hit={previewing}>
					<path d={UPPER_SKIN_PATH} fill={OPEN_SKIN_COLOR} opacity="0.92" />
				</g>
			{/if}

			{#if showMutedUpperSkin}
				<g clip-path="url(#skin-clip)" filter="url(#glow-sm)" class:preview-hit={previewing}>
					<path
						d={UPPER_SKIN_PATH}
						transform={MUTED_UPPER_SKIN_TRANSFORM}
						fill={MUTED_SKIN_COLOR}
						opacity="0.92"
						stroke="rgba(120,20,36,0.38)"
						stroke-width="2"
					/>
				</g>
			{/if}

			<!-- Centro decorativo -->
			<circle cx="200" cy="200" r="7" fill="#7a5c14" opacity="0.55" />
			<circle cx="200" cy="200" r="3" fill="#5a4010" opacity="0.7" />

			<!-- Polegar no meio (Pm) e Dedos no meio (Dm): círculos menores no centro -->
			{#if showCenterPm}
				<circle
					cx="200"
					cy="200"
					r="32"
					fill={STROKES.Pm.color}
					opacity="0.9"
					filter="url(#glow-sm)"
					class:preview-hit={previewing}
				/>
			{/if}

			{#if showCenterDm}
				<circle
					cx="200"
					cy="200"
					r="46"
					fill={STROKES.Dm.color}
					opacity="0.9"
					filter="url(#glow-sm)"
					class:preview-hit={previewing}
				/>
			{/if}

			{#if showRulo}
				<g filter="url(#glow-sm)" class:preview-hit={previewing}>
					<circle cx="200" cy="200" r="85" fill={STROKES.R.color} opacity="0.16" />
					<text x="200" y="203" class="rulo-symbol" fill={STROKES.R.color}>∞</text>
				</g>
			{/if}

			{#if onStrokeClick}
				<g class="hit-zones">
					<circle
						class="hit-zone t-zone"
						cx="200"
						cy="200"
						r="146"
						role="button"
						tabindex="0"
						aria-label="Inserir Tapa"
						onmouseenter={() => onStrokeHover?.('T')}
						onmouseleave={() => onRegionLeave?.()}
						onfocus={() => onStrokeHover?.('T')}
						onblur={() => onRegionLeave?.()}
						onclick={() => onStrokeClick?.('T')}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onStrokeClick?.('T')}
					/>
					<path
						class="hit-zone d-zone"
						d={UPPER_SKIN_PATH}
						role="button"
						tabindex="0"
						aria-label="Inserir Grave com a ponta dos dedos"
						onmouseenter={() => onStrokeHover?.('D')}
						onmouseleave={() => onRegionLeave?.()}
						onfocus={() => onStrokeHover?.('D')}
						onblur={() => onRegionLeave?.()}
						onclick={() => onStrokeClick?.('D')}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onStrokeClick?.('D')}
					/>
					<circle
						class="hit-zone r-zone"
						cx="200"
						cy="200"
						r="78"
						role="button"
						tabindex="0"
						aria-label="Inserir Rulo"
						onmouseenter={() => onStrokeHover?.('R')}
						onmouseleave={() => onRegionLeave?.()}
						onfocus={() => onStrokeHover?.('R')}
						onblur={() => onRegionLeave?.()}
						onclick={() => onStrokeClick?.('R')}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onStrokeClick?.('R')}
					/>
					<path
						class="hit-zone p-zone"
						d={THUMB_SKIN_PATH}
						role="button"
						tabindex="0"
						aria-label="Inserir Polegar"
						onmouseenter={() => onStrokeHover?.('P')}
						onmouseleave={() => onRegionLeave?.()}
						onfocus={() => onStrokeHover?.('P')}
						onblur={() => onRegionLeave?.()}
						onclick={() => onStrokeClick?.('P')}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onStrokeClick?.('P')}
					/>
					<path
						class="hit-zone f-zone"
						d="M 34 200
               A 166 166 0 0 1 366 200
               L 344 200
               A 144 144 0 0 0 56 200
               Z"
						role="button"
						tabindex="0"
						aria-label="Inserir Finger"
						onmouseleave={() => onRegionLeave?.()}
						onmouseenter={() => onStrokeHover?.('F')}
						onfocus={() => onStrokeHover?.('F')}
						onblur={() => onRegionLeave?.()}
						onclick={() => onStrokeClick?.('F')}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onStrokeClick?.('F')}
					/>
					<path
						class="hit-zone h-zone"
						d="M 34 200
               A 166 166 0 0 0 366 200
               L 344 200
               A 144 144 0 0 1 56 200
               Z"
						role="button"
						tabindex="0"
						aria-label="Inserir Heel"
						onmouseenter={() => onStrokeHover?.('H')}
						onmouseleave={() => onRegionLeave?.()}
						onfocus={() => onStrokeHover?.('H')}
						onblur={() => onRegionLeave?.()}
						onclick={() => onStrokeClick?.('H')}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onStrokeClick?.('H')}
					/>
					<path
						class="hit-zone d-mut-zone"
						d={UPPER_SKIN_PATH}
						transform={MUTED_UPPER_SKIN_TRANSFORM}
						role="button"
						tabindex="0"
						aria-label="Inserir Grave Abafado"
						onmouseenter={() => onStrokeHover?.('D_mut')}
						onmouseleave={() => onRegionLeave?.()}
						onfocus={() => onStrokeHover?.('D_mut')}
						onblur={() => onRegionLeave?.()}
						onclick={() => onStrokeClick?.('D_mut')}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onStrokeClick?.('D_mut')}
					/>
					<path
						class="hit-zone p-mut-zone"
						d={THUMB_SKIN_PATH}
						transform={MUTED_THUMB_SKIN_TRANSFORM}
						role="button"
						tabindex="0"
						aria-label="Inserir Polegar Abafado"
						onmouseenter={() => onStrokeHover?.('P_mut')}
						onmouseleave={() => onRegionLeave?.()}
						onfocus={() => onStrokeHover?.('P_mut')}
						onblur={() => onRegionLeave?.()}
						onclick={() => onStrokeClick?.('P_mut')}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onStrokeClick?.('P_mut')}
					/>
					<circle
						class="hit-zone dm-zone"
						cx="200"
						cy="200"
						r="46"
						role="button"
						tabindex="0"
						aria-label="Inserir Dedos no meio"
						onmouseenter={() => onStrokeHover?.('Dm')}
						onmouseleave={() => onRegionLeave?.()}
						onfocus={() => onStrokeHover?.('Dm')}
						onblur={() => onRegionLeave?.()}
						onclick={() => onStrokeClick?.('Dm')}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onStrokeClick?.('Dm')}
					/>
					<circle
						class="hit-zone pm-zone"
						cx="200"
						cy="200"
						r="28"
						role="button"
						tabindex="0"
						aria-label="Inserir Polegar no meio"
						onmouseenter={() => onStrokeHover?.('Pm')}
						onmouseleave={() => onRegionLeave?.()}
						onfocus={() => onStrokeHover?.('Pm')}
						onblur={() => onRegionLeave?.()}
						onclick={() => onStrokeClick?.('Pm')}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onStrokeClick?.('Pm')}
					/>
				</g>
			{/if}
		</svg>
	</div>

	<!-- Indicador da região ativa -->
	<div class="region-indicators">
		<div
			class="region-dot"
			class:active={showTopRim || showUpperSkin}
			style="--rc: {showTopRim ? STROKES.F.color : STROKES.D.color}"
		>
			Cima
		</div>
		<div
			class="region-dot"
			class:active={showCenterPm || showCenterDm || showFullSkin || showRulo}
			style="--rc: {showRulo
				? STROKES.R.color
				: showFullSkin
					? STROKES.T.color
					: showCenterDm
						? STROKES.Dm.color
						: STROKES.Pm.color}"
		>
			Meio
		</div>
		<div
			class="region-dot"
			class:active={showBottomRim || showThumbSkin}
			style="--rc: {showBottomRim ? STROKES.H.color : STROKES.P.color}"
		>
			Baixo
		</div>
	</div>
</div>

<style>
	.pandeiro-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.2rem;
		width: 100%;
		height: 100%;
		justify-content: center;
		min-width: 0;
		min-height: 0;
		/* perspectiva 3-D para rotateX (pitch) ter profundidade visual */
		perspective: 900px;
		perspective-origin: 50% 40%;
	}
	.pandeiro-wrapper.compact {
		justify-content: flex-start;
		gap: 0.55rem;
		height: auto;
	}

	.genre-label {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-height: 4rem;
		justify-content: center;
		max-width: 100%;
	}
	.pandeiro-wrapper.compact .genre-label {
		min-height: auto;
	}

	.genre-name {
		font-size: 1.8rem;
		font-weight: 800;
		letter-spacing: 0.3em;
		color: #f0e6c8;
		text-shadow: 0 0 20px rgba(255, 200, 100, 0.35);
		overflow-wrap: anywhere;
	}

	.active-label {
		font-size: 1rem;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: 0.15em;
		text-shadow: 0 0 12px rgba(255, 255, 255, 0.5);
		min-height: 1.2em;
		line-height: 1.2em;
		transition: opacity 0.1s;
	}

	.active-label.empty {
		visibility: hidden;
	}

	.active-label.idle {
		color: rgba(255, 255, 255, 0.45);
		font-weight: 600;
		text-shadow: none;
	}

	.pandeiro-container {
		width: min(340px, 85vw, 46dvh);
		aspect-ratio: 1;
		flex: 0 1 auto;
		/* pivô centralizado conforme croqui: eixo horizontal */
		transform-origin: 50% 50%;
		will-change: transform;
	}
	.pandeiro-wrapper.compact .pandeiro-container {
		width: min(300px, 72vw);
	}

	.pandeiro-svg {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 8px 30px rgba(0, 0, 0, 0.6));
		transition: filter 0.1s;
	}

	.pandeiro-svg.any-hit {
		filter: drop-shadow(0 8px 40px rgba(255, 180, 80, 0.25));
	}

	.rulo-symbol {
		font:
			900 64px Georgia,
			'Times New Roman',
			serif;
		text-anchor: middle;
		dominant-baseline: middle;
		paint-order: stroke;
		stroke: rgba(60, 20, 35, 0.22);
		stroke-width: 2;
	}

	.hit-zone {
		fill: transparent;
		cursor: pointer;
		pointer-events: all;
		outline: none;
	}

	.hit-zone:hover,
	.hit-zone:focus-visible {
		filter: url(#glow-sm);
	}

	.preview-hit {
		opacity: 0.72;
	}

	/* Indicadores de região */
	.region-indicators {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
	}
	.pandeiro-wrapper.compact .region-indicators {
		gap: 0.45rem;
	}

	.region-dot {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.68rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.55);
		transition: all 0.1s;
	}

	.region-dot::before {
		content: '';
		display: block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--rc, #fff);
		opacity: 0.3;
		transition: all 0.1s;
	}

	.region-dot.active {
		color: var(--rc);
		text-shadow: 0 0 8px var(--rc);
	}

	.region-dot.active::before {
		opacity: 1;
		box-shadow: 0 0 8px var(--rc);
		transform: scale(1.3);
	}

	.tutorial-focus {
		position: relative;
		z-index: 80;
		outline: 2px solid rgba(255, 77, 109, 0.95);
		outline-offset: 8px;
		box-shadow:
			0 0 0 9px rgba(255, 77, 109, 0.18),
			0 0 24px rgba(255, 77, 109, 0.72),
			0 0 54px rgba(255, 77, 109, 0.42);
		animation: tutorialGlow 1.25s ease-in-out infinite alternate;
	}

	@keyframes tutorialGlow {
		from {
			box-shadow:
				0 0 0 7px rgba(255, 77, 109, 0.13),
				0 0 18px rgba(255, 77, 109, 0.52),
				0 0 38px rgba(255, 77, 109, 0.3);
		}
		to {
			box-shadow:
				0 0 0 11px rgba(255, 77, 109, 0.22),
				0 0 32px rgba(255, 77, 109, 0.86),
				0 0 68px rgba(255, 77, 109, 0.48);
		}
	}

	@media (max-width: 860px) {
		.pandeiro-wrapper {
			gap: 0.85rem;
			justify-content: flex-start;
			padding-block: 0.2rem;
		}

		.genre-label {
			min-height: 3.25rem;
		}

		.genre-name {
			font-size: 1.25rem;
			letter-spacing: 0.2em;
		}

		.active-label {
			font-size: 0.82rem;
			letter-spacing: 0.08em;
		}

		.pandeiro-container {
			width: min(310px, 78vw, 28dvh);
		}
		.pandeiro-wrapper.compact .pandeiro-container {
			width: min(280px, 70vw);
		}
	}

	@media (max-width: 480px) {
		.pandeiro-wrapper {
			gap: 0.65rem;
		}

		.genre-label {
			min-height: 3rem;
		}

		.genre-name {
			font-size: 1rem;
			letter-spacing: 0.14em;
		}

		.pandeiro-container {
			width: min(270px, 74vw, 25dvh);
		}

		.region-indicators {
			gap: 0.55rem;
		}
	}
</style>
