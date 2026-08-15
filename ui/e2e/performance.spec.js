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
    const errors = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/#/')
    await page.getByRole('navigation').getByText('Temizlik').click()
    await page.getByRole('navigation').getByText('Loglar').click()

    expect(errors).toEqual([])
  })
})
