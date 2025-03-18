import { defineConfig } from 'vite'

export default defineConfig({
    base: '/touchgrass/',  // Replace with your repository name
    build: {
        outDir: 'docs'  // GitHub Pages will serve from /docs or /root
    }
}) 