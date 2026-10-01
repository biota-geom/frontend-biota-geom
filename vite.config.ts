import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    open: true,
  },
  test: {
    css: true,
    environment: 'jsdom',
    // A worker per logical CPU exhausts memory when several jsdom suites run
    // together, making otherwise fast tests hit Vitest's 5 s timeout.
    maxWorkers: 2,
    setupFiles: './src/tests/setup.ts',
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/tests/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        // Vendored by the shadcn CLI — not ours to test.
        'src/components/ui/shadcn/**',
      ],
    },
  },
});
