import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    pool: 'forks',
    include: ['src/lib/**/*.{test,spec}.ts'],
    passWithNoTests: true,
  },
})
