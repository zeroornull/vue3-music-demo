import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      clearMocks: true,
      restoreMocks: true,
      include: ['src/**/*.test.ts'],
    },
  }),
)
