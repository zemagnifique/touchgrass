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
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.');
                    const ext = info.pop();
                    const name = info.join('.');
                    
                    if (name === 'main' || name === 'style') {
                        return `assets/${name}.${ext}`;
                    }
                    
                    return `assets/[name]-[hash][extname]`;
                }
            }
        }
    }
}) 