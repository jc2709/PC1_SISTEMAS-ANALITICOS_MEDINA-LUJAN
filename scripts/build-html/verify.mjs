import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const outputPath = path.resolve(process.cwd(), 'frontend', 'dist', 'index.html')
const html = await readFile(outputPath, 'utf8')
const outputStats = await stat(outputPath)

const invalidPatterns = [
  { label: 'script externo', pattern: /<script[^>]+src=/i },
  { label: 'hoja de estilos externa', pattern: /<link[^>]+rel=["']stylesheet["']/i },
  { label: 'ruta absoluta de assets', pattern: /["']\/assets\//i },
]

const failures = invalidPatterns.filter(({ pattern }) => pattern.test(html))
if (failures.length > 0) {
  throw new Error(`El HTML no es autocontenido: ${failures.map(({ label }) => label).join(', ')}`)
}

if (!/connect-src[^;]*https:\/\/pc1-medina-lujan\.vercel\.app/i.test(html)) {
  throw new Error('La política de seguridad del HTML no autoriza el backend público de IA.')
}

console.log(`HTML local verificado: ${outputPath} (${Math.ceil(outputStats.size / 1024)} KiB)`)
