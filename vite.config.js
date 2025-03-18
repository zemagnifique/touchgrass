import { defineConfig } from 'vite'

export default defineConfig({
    base: '/touchgrass/',  // Replace with your repository name
    build: {
        outDir: 'docs',
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: './index.html'
            },
            output: {
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.');
                    const ext = info.pop();
                    const name = info.join('.');
                    if (ext === 'css') return `assets/${name}.css`;
                    return `assets/[name]-[hash][extname]`;
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
            }
        }
    }
}) 