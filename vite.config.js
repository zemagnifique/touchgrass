import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

// Determine if we're using a custom domain from the CNAME file
const hasCustomDomain = () => {
    try {
        return fs.existsSync(path.join(process.cwd(), 'public', 'CNAME'))
    } catch {
        return false
    }
}

export default defineConfig({
    base: hasCustomDomain() ? '/' : '/touchgrass/',
    build: {
        outDir: 'docs',
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: './index.html'
            },
            output: {
                // Use predictable names for main bundles
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'style.css') {
                        return 'assets/style.css';
                    }
                    if (assetInfo.name === 'index.css') {
                        return 'assets/main.css';
                    }
                    return 'assets/[name].[hash][extname]';
                }
            }
        }
    },
    css: {
        // Ensure CSS files are generated with predictable names
        modules: {
            generateScopedName: '[name]__[local]__[hash:base64:5]'
        }
    }
}) 