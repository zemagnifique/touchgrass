import { build } from 'vite'
import fs from 'fs'
import path from 'path'

async function buildApp() {
    // Check if CNAME exists and read its contents
    const cnamePath = path.join(process.cwd(), 'public', 'CNAME')
    const isCustomDomain = fs.existsSync(cnamePath)
    const domain = isCustomDomain ? fs.readFileSync(cnamePath, 'utf-8').trim() : null

    // Build with appropriate base
    await build({
        configFile: path.join(process.cwd(), 'vite.config.js'),
        base: domain ? '/' : '/touchgrass/',
        build: {
            outDir: 'docs',
            assetsDir: 'assets'
        }
    })

    // If using custom domain, update the paths in the built files
    if (domain) {
        const docsDir = path.join(process.cwd(), 'docs')
        const htmlFile = path.join(docsDir, 'index.html')
        let html = fs.readFileSync(htmlFile, 'utf-8')
        html = html.replace(/\/touchgrass\//g, '/')
        fs.writeFileSync(htmlFile, html)
    }
}

buildApp().catch(console.error) 