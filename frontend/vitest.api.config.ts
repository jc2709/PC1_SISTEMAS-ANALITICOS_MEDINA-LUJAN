import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: '..',
  test: {
    environment: 'node',
    include: ['tests/api/**/*.test.ts'],
  },
})
