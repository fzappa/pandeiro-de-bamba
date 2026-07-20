import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
  plugins: [sveltekit()],
});
