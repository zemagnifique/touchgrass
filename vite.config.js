import { defineConfig } from 'vite'

export default defineConfig({
    base: '/touchgrass/',  // Replace with your repository name
    build: {
        outDir: 'docs',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name]-[hash][extname]',
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
            }
        }
    }
}) 