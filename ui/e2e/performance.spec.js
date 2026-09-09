import { expect, test } from '@playwright/test'

test.describe('Performance', () => {
  test('overview page loads and becomes interactive within budget', async ({ page }) => {
    const start = Date.now()
    await page.goto('/#/', { waitUntil: 'networkidle' })
    const loadMs = Date.now() - start
    expect(loadMs).toBeLessThan(5000)
  })

  test('navigation performance timing reports reasonable DOMContentLoaded time', async ({ page }) => {
    await page.goto('/#/')
    const timing = await page.evaluate(() => {
      const [nav] = performance.getEntriesByType('navigation')
      return { domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime }
    })
    expect(timing.domContentLoaded).toBeLessThan(3000)
  })

  test('no console errors during initial load and navigation', async ({ page }) => {
    // Vite'in dev sunucusu WebKit'in bazi on-yukleme isteklerine 403
    // donuyor; bu uygulamanin degil test sunucusunun gurultusu ve yalnizca
    // tek motorda goruluyor. Diger tum kaynak hatalari (404 dahil) ve
    // gercek JS hatalari yakalanmaya devam ediyor.
    const IGNORED = [/Failed to load resource.*status of 403/i]
    const errors = []
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return
      const text = msg.text()
      if (IGNORED.some((re) => re.test(text))) return
      errors.push(text)
    })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/#/')
    await page.getByRole('navigation').getByText('Temizlik').click()
    await page.getByRole('navigation').getByText('Loglar').click()

    expect(errors).toEqual([])
  })
})
