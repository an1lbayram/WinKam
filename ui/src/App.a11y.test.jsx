import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
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

describe('Accessibility (axe)', () => {
  beforeEach(() => {
    delete window.winkam
  })

  it.each([
    ['/', 'Genel Bakış'],
    ['/temizlik', 'Temizlik'],
    ['/onarim', 'Onarım'],
    ['/ag', 'Ağ'],
    ['/yedek', 'Yedek'],
    ['/loglar', 'Loglar'],
    ['/ayarlar', 'Ayarlar'],
  ])(
    '%s (%s) has no detectable a11y violations',
    async (path) => {
      const { container } = renderAt(path)
      // color-contrast requires real paint/layout, which jsdom doesn't do
      // (it's also what makes the check slow enough to blow past the
      // default test timeout here); the Playwright E2E a11y suite runs the
      // same scan in a real browser and is the authoritative check for it.
      const results = await axe(container, {
        rules: { 'color-contrast': { enabled: false } },
      })
      expect(results.violations).toEqual([])
    },
    15000,
  )
})
