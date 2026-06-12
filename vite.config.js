import { defineConfig } from 'vite';

// Relative base so the build works at both iamkanuri.github.io/thirdocular
// and the thirdocular.com custom domain.
export default defineConfig({
  base: './',
});
