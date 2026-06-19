import { defineConfig } from 'vite';

// Relative base so the build works at both iamkanuri.github.io/thirdocular
// and the thirdocular.com custom domain.
//
// The @font-face blocks reference woff2 files from public/fonts with relative
// URLs so they resolve correctly under both deployments. Vite can't resolve
// public assets at build time and warns about it — that's expected (they're
// served verbatim from the site root), so we filter just that message to keep
// the build log clean.
export default defineConfig({
  base: './',
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
