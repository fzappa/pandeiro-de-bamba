import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
    runes: ({ filename }) =>
      filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
  },
  kit: {
    adapter: adapter(),
    csp: {
      // SvelteKit injeta nonces/hashes nos scripts inline que gera,
      // dispensando 'unsafe-inline' em script-src.
      directives: {
        "default-src": ["self"],
        // googletagmanager.com só é contactado quando PUBLIC_GA_MEASUREMENT_ID
        // está definida (ver src/routes/+layout.svelte); inofensivo mantê-lo
        // aqui mesmo sem GA configurado, pois o script nunca é injetado.
        "script-src": ["self", "https://www.googletagmanager.com"],
        // 'unsafe-inline' em style-src é necessário: transições e
        // animações do Svelte aplicam atributos style inline.
        "style-src": ["self", "unsafe-inline", "https://fonts.googleapis.com"],
        "img-src": ["self", "data:", "blob:"],
        "media-src": ["self", "data:", "blob:"],
        "font-src": ["self", "data:", "https://fonts.gstatic.com"],
        "connect-src": [
          "self",
          "https://www.googletagmanager.com",
          "https://*.google-analytics.com",
        ],
        "object-src": ["none"],
        "base-uri": ["self"],
        "frame-ancestors": ["none"],
        "form-action": ["self"],
      },
    },
  },
};

export default config;
