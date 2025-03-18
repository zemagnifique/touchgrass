import { defineConfig } from 'vite'

// Determine if we're using a custom domain from the CNAME file
import fs from 'fs'
import path from 'path'

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
            output: {
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.')
                    const ext = info.pop()
                    const name = info.join('.')
                    return name === 'style' || name === 'main'
                        ? `assets/${name}.${ext}`
                        : `assets/[name]-[hash][extname]`
                }
            }
        }
    }
}) 