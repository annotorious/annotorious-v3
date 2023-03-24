import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default defineConfig({
  test: {
    watch: false
  },
  plugins: [svelte({ preprocess: sveltePreprocess() })]
});