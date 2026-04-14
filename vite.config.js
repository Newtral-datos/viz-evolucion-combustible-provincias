import { resolve } from 'path'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: '/viz-mes-combustible/',
  build: {
    rollupOptions: {
      input: {
        main:  resolve(__dirname, 'index.html'),
        tabla: resolve(__dirname, 'tabla/index.html'),
      }
    }
  }
})
