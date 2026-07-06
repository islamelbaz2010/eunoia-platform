import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@/': path.resolve(__dirname, './') + '/',
      '@core/': path.resolve(__dirname, './core/') + '/',
      '@services/': path.resolve(__dirname, './services/') + '/',
    },
  },
})
