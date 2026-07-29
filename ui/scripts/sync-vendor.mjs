// Keeps ui/vendor/python/winkam in sync with py-src/winkam so the packaged
// Electron app (which bundles vendor/python as its embedded Python runtime)
// never drifts from the CLI source of truth. Run automatically before
// `dist:win` (see package.json "predist:win"), but safe to run any time.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.join(__dirname, '..', '..')
const uiRoot = path.join(__dirname, '..')

const srcDir = path.join(repoRoot, 'py-src', 'winkam')
const destDir = path.join(uiRoot, 'vendor', 'python', 'winkam')

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

// Remove stale files in dest that no longer exist in src (e.g. renamed
// modules, __pycache__), then copy every file from src -> dest.
async function syncDir(from, to) {
  await fs.mkdir(to, { recursive: true })

  const srcEntries = await fs.readdir(from, { withFileTypes: true })
  const srcNames = new Set(srcEntries.map((e) => e.name))

  if (await exists(to)) {
    const destEntries = await fs.readdir(to, { withFileTypes: true })
    for (const entry of destEntries) {
      if (entry.name === '__pycache__') {
        await fs.rm(path.join(to, entry.name), { recursive: true, force: true })
        continue
      }
      if (!srcNames.has(entry.name)) {
        await fs.rm(path.join(to, entry.name), { recursive: true, force: true })
      }
    }
  }

  await Promise.all(
    srcEntries.map(async (entry) => {
      if (entry.name === '__pycache__') return
      const srcPath = path.join(from, entry.name)
      const destPath = path.join(to, entry.name)
      if (entry.isDirectory()) {
        await syncDir(srcPath, destPath)
      } else if (entry.isFile()) {
        await fs.copyFile(srcPath, destPath)
      }
    }),
  )
}

if (!(await exists(srcDir))) {
  throw new Error(`sync-vendor: source directory not found: ${srcDir}`)
}

await syncDir(srcDir, destDir)

console.log(`[sync-vendor] Synced ${srcDir} -> ${destDir}`)
