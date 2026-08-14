import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Relative base so the build works at both iamkanuri.github.io/thirdocular
// and the thirdocular.com custom domain.
//
// The @font-face blocks reference woff2 files from public/fonts with relative
// URLs so they resolve correctly under both deployments. Vite can't resolve
// public assets at build time and warns about it — that's expected (they're
// served verbatim from the site root), so we filter just that message to keep
// the build log clean.
// Three HTML entry points. index.html was implicit before /labs existed; naming
// it here is required, because declaring rollupOptions.input REPLACES Vite's
// default entry rather than adding to it — omitting it would silently stop
// building the home page.
//
// The /labs pages are real Vite entries rather than files dropped in public/,
// so they share the hashed CSS bundle with the home page and cannot drift from
// the design tokens. Everything already under public/ (the ARS bundles, the
// findings pages) is untouched and still copied verbatim.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        labs: resolve(import.meta.dirname, 'labs/index.html'),
        lifeos: resolve(import.meta.dirname, 'labs/lifeos/index.html'),
      },
    },
  },
  customLogger: (() => {
    const base = console;
    const mute = (msg) => typeof msg === 'string' && msg.includes("didn't resolve at build time");
    return {
      info: (m) => base.info(m),
      warn: (m) => {
        if (!mute(m)) base.warn(m);
      },
      warnOnce: (m) => {
        if (!mute(m)) base.warn(m);
      },
      error: (m) => base.error(m),
      clearScreen: () => {},
      hasErrorLogged: () => false,
      hasWarned: false,
    };
  })(),
});
