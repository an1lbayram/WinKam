const path = require('node:path')
const fs = require('node:fs/promises')
const https = require('node:https')
const extract = require('extract-zip')

async function download(url, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true })
  return new Promise((resolve, reject) => {
    const file = require('node:fs').createWriteStream(dest)
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`))
          return
        }
        res.pipe(file)
        file.on('finish', () => file.close(resolve))
      })
      .on('error', reject)
  })
}

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true })
  const entries = await fs.readdir(from, { withFileTypes: true })
  await Promise.all(
    entries.map(async (e) => {
      const src = path.join(from, e.name)
      const dst = path.join(to, e.name)
      if (e.isDirectory()) return copyDir(src, dst)
      if (e.isFile()) return fs.copyFile(src, dst)
    }),
  )
}

async function patchPth(pythonDir) {
  const files = await fs.readdir(pythonDir)
  const pth = files.find((f) => f.endsWith('._pth'))
  if (!pth) return
  const pthPath = path.join(pythonDir, pth)
  // Minimal sys.path: python*.zip + current dir.
  // Keep isolated mode (do NOT enable 'import site').
  const majorMinor = pth.match(/python(\d)(\d\d)\._pth/i)
  const zipName = majorMinor ? `python${majorMinor[1]}${majorMinor[2]}.zip` : 'python.zip'
  const content = `${zipName}\n.\n`
  await fs.writeFile(pthPath, content, 'utf-8')
}

exports.default = async function beforePack(context) {
  // Runs inside ui/ project.
  const projectDir = context.appDir || (context.packager && context.packager.projectDir)
  if (!projectDir) {
    throw new Error('beforePack: unable to resolve projectDir')
  }
  const repoRoot = path.resolve(projectDir, '..')
  const vendorDir = path.join(projectDir, 'vendor')
  const pythonDir = path.join(vendorDir, 'python')
  const cacheZip = path.join(vendorDir, 'cache', 'python-embed.zip')

  // If already prepared, do nothing.
  if (!(await exists(path.join(pythonDir, 'python.exe')))) {
    const ver = process.env.WINKAM_EMBED_PYTHON_VERSION || '3.13.13'
    const url = `https://www.python.org/ftp/python/${ver}/python-${ver}-embed-amd64.zip`
    // eslint-disable-next-line no-console
    console.log(`[beforePack] Downloading embeddable Python ${ver}...`)
    await download(url, cacheZip)

    // Clean and extract
    await fs.rm(pythonDir, { recursive: true, force: true })
    await fs.mkdir(pythonDir, { recursive: true })
    await extract(cacheZip, { dir: pythonDir })

    // Copy winkam package inside python directory (so '.' in _pth works)
    const winkamSrc = path.join(repoRoot, 'py-src', 'winkam')
    const winkamDst = path.join(pythonDir, 'winkam')
    await copyDir(winkamSrc, winkamDst)

    await patchPth(pythonDir)
  }

  // eslint-disable-next-line no-console
  console.log('[beforePack] Bundled Python OK.')
}

