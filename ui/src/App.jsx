import { NavLink, Route, Routes } from 'react-router-dom'
import {
  Activity,
  Check,
  Copy,
  DatabaseBackup,
  FileText,
  Shield,
  Settings as SettingsIcon,
  Sparkles,
  Stethoscope,
  Wifi,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRunner, electronPing, isElectronAvailable, listLogs, readLog } from './api/winkam'
import { Button } from './components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/Card'
import { cn } from './lib/cn'

function Shell({ children }) {
  const electronOk = isElectronAvailable()
  const [diag, setDiag] = useState({ uaElectron: false, bridge: false, ping: null })
  const nav = useMemo(
    () => [
      { to: '/', label: 'Genel Bakış', icon: Activity },
      { to: '/temizlik', label: 'Temizlik', icon: Sparkles },
      { to: '/onarim', label: 'Onarım', icon: Stethoscope },
      { to: '/ag', label: 'Ağ', icon: Wifi },
      { to: '/yedek', label: 'Yedek', icon: DatabaseBackup },
      { to: '/loglar', label: 'Loglar', icon: FileText },
      { to: '/ayarlar', label: 'Ayarlar', icon: SettingsIcon },
    ],
    [],
  )

  useEffect(() => {
    const uaElectron =
      typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent || '')
    const bridge = isElectronAvailable()
    setDiag((d) => ({ ...d, uaElectron, bridge }))
    electronPing()
      .then((res) => setDiag((d) => ({ ...d, ping: res })))
      .catch(() => setDiag((d) => ({ ...d, ping: { ok: false, elevated: false } })))
  }, [])

  return (
    <div className="min-h-full bg-[#0b0d12] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-violet-700/20 blur-[110px]" />
        <div className="absolute bottom-[-160px] right-[-120px] h-[420px] w-[620px] rounded-full bg-cyan-500/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto flex min-h-full max-w-[1240px] gap-6 px-6 py-6">
        <aside className="w-[280px] shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600/20 ring-1 ring-violet-500/30">
                <Sparkles className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">WinKam</div>
                <div className="text-xs text-white/50">Profesyonel Temizlik Paneli</div>
              </div>
            </div>

            <nav className="mt-5 space-y-1">
              {nav.map((n) => {
                const Icon = n.icon
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white',
                        isActive && 'bg-white/7 text-white ring-1 ring-white/10',
                      )
                    }
                    end={n.to === '/'}
                  >
                    <Icon className="h-4 w-4" />
                    {n.label}
                  </NavLink>
                )
              })}
            </nav>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">Durum</div>
              <div className="mt-1 text-sm font-medium">Hazır</div>
              <div className="mt-2 text-xs text-white/50">
                {electronOk
                  ? 'Electron: bağlı • Dry-run: adminsiz • Safe/Advanced: yönetici'
                  : 'Web mod: simülasyon • Gerçek çalıştırma için Electron'}
              </div>
              <div className="mt-2 text-[11px] text-white/40">
                UA: {diag.uaElectron ? 'Electron' : 'Web'} • Bridge:{' '}
                {diag.bridge ? 'OK' : 'YOK'} • Ping:{' '}
                {diag.ping?.ok ? 'OK' : '—'}
              </div>
              {diag.ping?.ok ? (
                <div className="mt-1 text-[11px] text-white/40">
                  Yetki: {diag.ping?.elevated ? 'Yönetici' : 'Standart'}
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-6">{children}</main>
      </div>
    </div>
  )
}

function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xl font-semibold leading-tight">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-white/60">{subtitle}</div> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  )
}

function OutputPanel({ output }) {
  const preRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const el = preRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [output])

  const handleCopy = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle>Çıktı / Log</CardTitle>
          <CardDescription>Komut çıktıları burada görünür (dev modunda mock).</CardDescription>
        </div>
        <Button variant="secondary" onClick={handleCopy} disabled={!output} className="h-8 gap-2 px-3 text-xs">
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </Button>
      </CardHeader>
      <CardContent>
        <pre
          ref={preRef}
          className="max-h-[280px] overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-white/80"
        >
          {output || '—'}
        </pre>
      </CardContent>
    </Card>
  )
}

function useWinkam() {
  const [busy, setBusy] = useState(false)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState({ state: 'idle', label: '' })
  const runnerRef = useRef(null)
  const waitersRef = useRef(new Map()) // id -> resolve(code)

  useEffect(() => {
    const runner = createRunner({
      onChunk: ({ chunk }) => setOutput((p) => p + chunk),
      onExit: ({ id, code }) => {
        setOutput((p) => p + `\n[exit code: ${code}]\n`)
        const resolve = waitersRef.current.get(id)
        if (resolve) {
          waitersRef.current.delete(id)
          resolve(code)
        }
      },
    })
    runnerRef.current = runner
    return () => runner.dispose?.()
  }, [])

  async function run(cmd, args) {
    setBusy(true)
    setStatus({ state: 'running', label: `${cmd} ${args ? JSON.stringify(args) : ''}` })
    try {
      const runner = runnerRef.current
      if (!runner) throw new Error('Runner not initialized')
      setOutput((p) => p + `\n> ${cmd} ${args ? JSON.stringify(args) : ''}\n`)
      const id = await runner.run(cmd, args)
      setOutput((p) => p + `[running id: ${id}]\n`)
      await new Promise((resolve) => {
        waitersRef.current.set(id, resolve)
      })
    } catch (err) {
      setOutput((p) => p + `\n[Hata: İşlem başlatılamadı - ${err.message}]\n`)
    } finally {
      setBusy(false)
      setStatus({ state: 'idle', label: '' })
    }
  }

  function clear() {
    setOutput('')
  }

  return { busy, output, status, run, clear }
}

function Overview() {
  return (
    <>
      <PageHeader
        title="Genel Bakış"
        subtitle="Sistemi güvenle temizle, onar, ağını sıfırla ve yedek al."
      />
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Önerilen akış</CardTitle>
            <CardDescription>Dry-run → Safe → Advanced</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-white/70">
              İlk önce neyin hedefleneceğini gör, sonra silmeye geç.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Güvenlik</CardTitle>
            <CardDescription>Whitelist + kök dizin koruması</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-white/70">
              Hedefler <code className="rounded bg-white/10 px-1">config.ini</code> üzerinden yönetilir.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loglama</CardTitle>
            <CardDescription>Run-id ile tek dosya</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-white/70">
              İstersen logları UI’dan da görüntüleyebiliriz.
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function Clean() {
  const electronOk = isElectronAvailable()
  const { busy, output, status, run, clear } = useWinkam()

  return (
    <>
      <PageHeader
        title="Temizlik"
        subtitle="Safe ile başla. Advanced daha agresiftir."
        actions={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => run('clean', { mode: 'dry-run' })}>
              Dry-run
            </Button>
            <Button disabled={busy || !electronOk} onClick={() => run('clean', { mode: 'safe' })}>
              Safe
            </Button>
            <Button variant="danger" disabled={busy || !electronOk} onClick={() => run('clean', { mode: 'advanced' })}>
              Advanced
            </Button>
            <Button variant="ghost" disabled={busy} onClick={clear}>
              Temizle
            </Button>
          </>
        }
      />
      {busy ? (
        <div className="text-xs text-white/60">
          Çalışıyor: <span className="text-white/80">{status.label}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Temizlik seçenekleri</CardTitle>
            <CardDescription>Her mod farklı hedefleri temizler.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium">Safe</div>
                <div className="mt-1 text-white/60">
                  Kullanıcı temp + tarayıcı cache + geri dönüşüm kutusu.
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium">Advanced</div>
                <div className="mt-1 text-white/60">
                  Safe + Windows Temp + Update cache + spooler + MEMORY.DMP.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>İpucu</CardTitle>
            <CardDescription>Önce “Dry-run”</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-white/70">
              Dry-run adminsiz çalışır; gerçek silme işlemleri yönetici ister.
            </div>
          </CardContent>
        </Card>
      </div>

      <OutputPanel output={output} />
    </>
  )
}

function Repair() {
  const { busy, output, status, run, clear } = useWinkam()
  return (
    <>
      <PageHeader
        title="Onarım"
        subtitle="SFC + DISM ile sistem dosyalarını onar."
        actions={
          <>
            <Button disabled={busy} onClick={() => run('repair', {})}>
              Onarımı Başlat
            </Button>
            <Button variant="ghost" disabled={busy} onClick={clear}>
              Temizle
            </Button>
          </>
        }
      />
      {busy ? (
        <div className="text-xs text-white/60">
          Çalışıyor: <span className="text-white/80">{status.label}</span>
        </div>
      ) : null}
      <OutputPanel output={output} />
    </>
  )
}

function Network() {
  const { busy, output, status, run, clear } = useWinkam()
  return (
    <>
      <PageHeader
        title="Ağ"
        subtitle="Winsock / IP / DNS sıfırlama."
        actions={
          <>
            <Button disabled={busy} onClick={() => run('network', {})}>
              Ağ Sıfırla
            </Button>
            <Button variant="ghost" disabled={busy} onClick={clear}>
              Temizle
            </Button>
          </>
        }
      />
      {busy ? (
        <div className="text-xs text-white/60">
          Çalışıyor: <span className="text-white/80">{status.label}</span>
        </div>
      ) : null}
      <OutputPanel output={output} />
    </>
  )
}

function Backup() {
  const { busy, output, status, run, clear } = useWinkam()
  const [target, setTarget] = useState('D')
  return (
    <>
      <PageHeader
        title="Yedek"
        subtitle="wbadmin ile sistem imaj yedeği."
        actions={
          <>
            <Button
              variant="secondary"
              disabled={busy || !target || target === 'C'}
              onClick={() => run('backup', { target })}
            >
              Yedek Başlat
            </Button>
            <Button variant="ghost" disabled={busy} onClick={clear}>
              Temizle
            </Button>
          </>
        }
      />
      {busy ? (
        <div className="text-xs text-white/60">
          Çalışıyor: <span className="text-white/80">{status.label}</span>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Hedef sürücü</CardTitle>
          <CardDescription>Örn: D (C olamaz). UI stdin veremediği için hedef gerekli.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <input
              value={target}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
                if (val.length <= 1) setTarget(val)
              }}
              maxLength={1}
              className="h-10 w-32 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              placeholder="D"
            />
            <div className="text-xs text-white/50">
              Yönetici olarak çalıştırmanız gerekebilir.
            </div>
          </div>
        </CardContent>
      </Card>

      <OutputPanel output={output} />
    </>
  )
}

function Logs() {
  const electronOk = isElectronAvailable()
  const [files, setFiles] = useState([])
  const [selected, setSelected] = useState(null)
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function refresh() {
    setBusy(true)
    try {
      const res = await listLogs()
      setFiles(res.files || [])
    } catch (error) {
      console.error("Log dosyaları listelenirken hata oluştu:", error)
      setFiles([])
    } finally {
      setBusy(false)
    }
  }

  async function open(name) {
    setSelected(name)
    setContent('Yükleniyor...')
    try {
      const res = await readLog(name)
      setContent(res.ok ? res.content : 'Log okunurken bir sorun oluştu veya dosya boş.')
    } catch (error) {
      console.error("Log okunurken hata:", error)
      setContent('Log dosyası okunamadı. Bağlantı hatası.')
    }
  }

  const handleCopy = () => {
    if (!content || content === 'Yükleniyor...') return
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <>
      <PageHeader
        title="Loglar"
        subtitle="logs/ klasöründeki çalışma loglarını görüntüleyin."
        actions={
          <>
            <Button variant="secondary" disabled={busy || !electronOk} onClick={refresh}>
              Yenile
            </Button>
          </>
        }
      />

      {!electronOk ? (
        <Card>
          <CardHeader>
            <CardTitle>Electron gerekli</CardTitle>
            <CardDescription>Logları okumak için Electron köprüsü gerekir.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-white/70">
              `npm run electron:dev` veya `npm run electron:only` ile açın.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Dosyalar</CardTitle>
              <CardDescription>{files.length} adet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {files.map((f) => (
                  <button
                    key={f.name}
                    className={cn(
                      'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10',
                      selected === f.name && 'ring-2 ring-violet-500/40',
                    )}
                    onClick={() => open(f.name)}
                  >
                    <div className="font-medium">{f.name}</div>
                    <div className="mt-1 text-[11px] text-white/50">
                      {Math.round((f.size || 0) / 1024)} KB
                    </div>
                  </button>
                ))}
                {files.length === 0 ? (
                  <div className="text-xs text-white/50">Log bulunamadı.</div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle>İçerik</CardTitle>
            <CardDescription>{selected || '—'}</CardDescription>
          </div>
          {selected && (
            <Button variant="secondary" onClick={handleCopy} className="h-8 gap-2 px-3 text-xs">
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </Button>
          )}
            </CardHeader>
            <CardContent>
              <pre className="max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-white/80">
                {content || '—'}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

function Settings() {
  return (
    <>
      <PageHeader title="Ayarlar" subtitle="config.ini ve log klasörü ayarları." />
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Gelişmiş</CardTitle>
            <CardDescription>Sistem yapılandırma tercihleri.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <div className="text-sm font-medium">Güvenli Kip (Safe Mode) Koruması</div>
                <div className="text-xs text-white/50">Kritik sistem dosyalarını her zaman atla</div>
              </div>
              <div className="h-4 w-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hakkında</CardTitle>
            <CardDescription>WinKam v1.0.0</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-white/70">
              <p><strong>WinKam</strong>, açık kaynaklı bir Windows temizlik ve optimizasyon aracıdır.</p>
              <p>Güvenli ve şeffaf yapısıyla gereksiz sistem yüklerini ortadan kaldırır.</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                <Shield className="h-4 w-4" /> Güvenli Kök Koruması Aktif (MIT Lisansı)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/temizlik" element={<Clean />} />
        <Route path="/onarim" element={<Repair />} />
        <Route path="/ag" element={<Network />} />
        <Route path="/yedek" element={<Backup />} />
        <Route path="/loglar" element={<Logs />} />
        <Route path="/ayarlar" element={<Settings />} />
      </Routes>
    </Shell>
  )
}
