import { build } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

async function buildApp() {
    // Check if CNAME exists and read its contents
    const cnamePath = path.join(projectRoot, 'public', 'CNAME')
    const isCustomDomain = fs.existsSync(cnamePath)
    const domain = isCustomDomain ? fs.readFileSync(cnamePath, 'utf-8').trim() : null

    // Build with appropriate base
    await build({
        configFile: path.join(projectRoot, 'vite.config.js'),
        base: domain ? '/' : '/touchgrass/',
        build: {
            outDir: 'docs',
            assetsDir: 'assets'
        }
    })

    // If using custom domain, update all built files
    if (domain) {
        const docsDir = path.join(projectRoot, 'docs')
        
        // Update HTML files
        const htmlFiles = fs.readdirSync(docsDir)
            .filter(file => file.endsWith('.html'))
        
        for (const file of htmlFiles) {
            const filePath = path.join(docsDir, file)
            let content = fs.readFileSync(filePath, 'utf-8')
            content = content.replace(/\/touchgrass\//g, '/')
            fs.writeFileSync(filePath, content)
        }

        // Update JS files
        const assetsDir = path.join(docsDir, 'assets')
        const jsFiles = fs.readdirSync(assetsDir)
            .filter(file => file.endsWith('.js'))
        
        for (const file of jsFiles) {
            const filePath = path.join(assetsDir, file)
            let content = fs.readFileSync(filePath, 'utf-8')
            content = content.replace(/\/touchgrass\//g, '/')
            fs.writeFileSync(filePath, content)
        }

        // Copy CNAME to docs
        fs.copyFileSync(cnamePath, path.join(docsDir, 'CNAME'))
    }
}

buildApp().catch(console.error) 