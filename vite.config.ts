import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
  },
  test: {
    css: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
})
