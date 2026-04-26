import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Treat every foundry-* tag as a custom element so Vue's compiler
          // doesn't try to resolve them as Vue components or bind props as
          // Vue props. AGENTS.md §9 forbids framework-specific wrappers —
          // this is compile-time config, not a wrapper.
          isCustomElement: (tag) => tag.startsWith('foundry-'),
        },
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
  },
});
