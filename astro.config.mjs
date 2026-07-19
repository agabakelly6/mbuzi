// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://ypambuzichoma.com',

  // Hover/viewport-based prefetch for same-site links — speeds up
  // subsequent navigations with no effect on this page's own load.
  prefetch: true,

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});