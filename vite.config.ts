import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Library build: one ESM chunk per public entry (see package.json "exports").
 * Framework packages stay external; the Shell/mini app provides them.
 */
export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        contracts: resolve(__dirname, 'src/contracts/index.ts'),
        mfe: resolve(__dirname, 'src/mfe/index.ts'),
        app: resolve(__dirname, 'src/app/index.ts'),
        vite: resolve(__dirname, 'src/vite/index.ts'),
        'bridge-vue': resolve(__dirname, 'src/bridge/vue.ts'),
        'bridge-pinia': resolve(__dirname, 'src/bridge/pinia.ts'),
        'bridge-vue-router': resolve(__dirname, 'src/bridge/vue-router.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'vue-router', 'pinia', '@vueuse/core', 'axios', 'vite', 'module', 'path', 'node:module', 'node:path', 'fs', 'node:fs'],
      output: { chunkFileNames: 'chunks/[name]-[hash].js' },
    },
  },
});
