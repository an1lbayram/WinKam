import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

// Page titles are rendered as plain text, not semantic <h1>-<h6> elements,
// and the same label text also appears in the sidebar nav links. Scoping to
// <main> (native landmark role) avoids ambiguous matches against the nav.
function mainRegion() {
  return within(screen.getByRole('main'))
}

describe('App routing (integration)', () => {
  beforeEach(() => {
    delete window.winkam
  })

  it('renders the Overview page at the root route', () => {
    renderAt('/')
    expect(mainRegion().getByText('Genel Bakış')).toBeInTheDocument()
  })

  it('renders the Clean page at /temizlik', () => {
    renderAt('/temizlik')
    expect(mainRegion().getByText('Temizlik')).toBeInTheDocument()
  })

  it('renders the Repair page at /onarim', () => {
    renderAt('/onarim')
    expect(mainRegion().getByText('Onarım')).toBeInTheDocument()
  })

  it('renders the Network page at /ag', () => {
    renderAt('/ag')
    expect(mainRegion().getByText('Ağ')).toBeInTheDocument()
  })

  it('renders the Backup page at /yedek', () => {
    renderAt('/yedek')
    expect(mainRegion().getByText('Yedek')).toBeInTheDocument()
  })

  it('renders the Settings page at /ayarlar', () => {
    renderAt('/ayarlar')
    expect(mainRegion().getByText('Ayarlar')).toBeInTheDocument()
  })

  it('navigates between pages via the sidebar nav links', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const nav = screen.getAllByRole('navigation')[0]
    await user.click(within(nav).getByText('Onarım'))
    expect(mainRegion().getByText('Onarım')).toBeInTheDocument()
  })
})

describe('Clean page - permission gating (functional/security)', () => {
  beforeEach(() => {
    delete window.winkam
  })

  it('dry-run is enabled without an Electron bridge (no admin required)', () => {
    renderAt('/temizlik')
    expect(screen.getByRole('button', { name: 'Dry-run' })).toBeEnabled()
  })

  it('safe and advanced clean are disabled without an Electron bridge', () => {
    renderAt('/temizlik')
    expect(screen.getByRole('button', { name: 'Safe' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Advanced' })).toBeDisabled()
  })

  it('safe and advanced clean become enabled once the Electron bridge is present', () => {
    window.winkam = { invoke: async () => ({ ok: true }), on: () => () => {} }
    renderAt('/temizlik')
    expect(screen.getByRole('button', { name: 'Safe' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Advanced' })).toBeEnabled()
  })
})

describe('Clean page - dry-run flow (mock runner)', () => {
  beforeEach(() => {
    delete window.winkam
  })

  it(
    'shows mock output after triggering a dry-run',
    async () => {
      const user = userEvent.setup()
      renderAt('/temizlik')
      await user.click(screen.getByRole('button', { name: 'Dry-run' }))

      await waitFor(
        () => {
          expect(screen.getByText(/exit code: 0/)).toBeInTheDocument()
        },
        { timeout: 8000 },
      )
    },
    10000,
  )
})

describe('Backup page - target input validation (security)', () => {
  beforeEach(() => {
    delete window.winkam
  })

  it('restricts input to a single uppercase letter and blocks non-letters', async () => {
    const user = userEvent.setup()
    renderAt('/yedek')
    const input = screen.getByPlaceholderText('D')
    await user.clear(input)
    await user.type(input, 'e5xtra')
    expect(input).toHaveValue('E')
  })

  it('disables the backup action when target is C (system drive)', async () => {
    const user = userEvent.setup()
    renderAt('/yedek')
    const input = screen.getByPlaceholderText('D')
    await user.clear(input)
    await user.type(input, 'c')
    expect(screen.getByRole('button', { name: 'Yedek Başlat' })).toBeDisabled()
  })

  it('enables the backup action for a valid non-C target when electron bridge present', async () => {
    window.winkam = { invoke: async () => 'id', on: () => () => {} }
    const user = userEvent.setup()
    renderAt('/yedek')
    const input = screen.getByPlaceholderText('D')
    await user.clear(input)
    await user.type(input, 'd')
    expect(screen.getByRole('button', { name: 'Yedek Başlat' })).toBeEnabled()
  })
})

describe('Logs page - electron dependency', () => {
  beforeEach(() => {
    delete window.winkam
  })

  it('shows an "Electron required" message when no bridge is available', () => {
    renderAt('/loglar')
    expect(screen.getByText('Electron gerekli')).toBeInTheDocument()
  })
})
