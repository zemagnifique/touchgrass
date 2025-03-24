import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

// Simplified configuration - always use root path
export default defineConfig({
    base: '/',
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