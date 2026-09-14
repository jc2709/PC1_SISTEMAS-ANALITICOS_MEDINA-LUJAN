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

console.log(`HTML local verificado: ${outputPath} (${Math.ceil(outputStats.size / 1024)} KiB)`)
