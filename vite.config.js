import { resolve } from 'path'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: 'src',
  base: './',
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, 'src/lib/')
    }
  },
  server: {
    port: 3001,
    host: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        editor: resolve(__dirname, 'src/editor/index.html'),
      },
    },
    sourcemap: true,
    outDir: '../docs',
    emptyOutDir: true,
  },
})