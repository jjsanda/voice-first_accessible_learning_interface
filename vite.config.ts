/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Deployed to GitHub Pages under the repository name, so production builds
// (and vite preview, which serves them) need the repo path as base.
// Dev and tests run from the domain root.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'serve' && !isPreview ? '/' : '/voice-first_accessible_learning_interface/',
  plugins: [react()],
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    setupFiles: 'src/test/setup.ts',
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/test/**', 'src/**/__tests__/**', 'src/main.tsx'],
    },
  },
}));
