import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.join(__dirname, '..', '..')
const uiRoot = path.join(repoRoot, 'ui')

const srcSvg = path.join(uiRoot, 'public', 'favicon.svg')
const outDir = path.join(uiRoot, 'build')
const outPng = path.join(outDir, 'icon.png')
const outIco = path.join(outDir, 'icon.ico')

await fs.mkdir(outDir, { recursive: true })

const svg = await fs.readFile(srcSvg)
await sharp(svg, { density: 512 })
  .resize(512, 512, { fit: 'contain', background: { r: 11, g: 13, b: 18, alpha: 1 } })
  .png()
  .toFile(outPng)

const icoBuf = await pngToIco(outPng)
await fs.writeFile(outIco, icoBuf)

console.log(`Wrote ${outPng}`)
console.log(`Wrote ${outIco}`)

