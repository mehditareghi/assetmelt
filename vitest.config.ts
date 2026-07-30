import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        exclude: ['node_modules','scripts/**', '/src/generated/**'],
        coverage: {
            provider: 'v8',
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        }
    }
})