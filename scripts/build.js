import { build } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

async function updateFileContent(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8')
    content = content.replace(/\/touchgrass\//g, '/')
    fs.writeFileSync(filePath, content)
}

async function buildApp() {
    const cnamePath = path.join(projectRoot, 'public', 'CNAME')
    const isCustomDomain = fs.existsSync(cnamePath)
    const domain = isCustomDomain ? fs.readFileSync(cnamePath, 'utf-8').trim() : null

    await build({
        configFile: path.join(projectRoot, 'vite.config.js'),
        base: '/',
        build: {
            outDir: 'docs',
            assetsDir: 'assets'
        }
    })

    if (domain) {
        const docsDir = path.join(projectRoot, 'docs')
        
        // Process all files recursively
        const processDirectory = (dir) => {
            const files = fs.readdirSync(dir)
            for (const file of files) {
                const filePath = path.join(dir, file)
                const stat = fs.statSync(filePath)
                
                if (stat.isDirectory()) {
                    processDirectory(filePath)
                } else if (/\.(html|js|css)$/.test(file)) {
                    updateFileContent(filePath)
                }
            }
        }

        processDirectory(docsDir)
        fs.copyFileSync(cnamePath, path.join(docsDir, 'CNAME'))
    }
}

buildApp().catch(console.error) 