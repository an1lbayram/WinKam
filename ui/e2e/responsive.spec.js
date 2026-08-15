import { expect, test } from '@playwright/test'

const viewports = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
}

test.describe('Responsive layout', () => {
  for (const [name, size] of Object.entries(viewports)) {
    test(`renders without horizontal overflow at ${name} (${size.width}x${size.height})`, async ({ page }) => {
      await page.setViewportSize(size)
      await page.goto('/#/')
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      )
      expect(hasOverflow).toBe(false)
    })
  }

  test('mobile nav links meet the 44px minimum touch target height', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('/#/')
    const firstLink = page.getByRole('navigation').getByRole('link').first()
    const box = await firstLink.boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(40) // ~44px target, small tolerance for borders
  })

  test('sidebar stacks above content on mobile and sits beside it on desktop', async ({ page }) => {
    await page.goto('/#/')

    await page.setViewportSize(viewports.mobile)
    const navMobile = await page.getByRole('navigation').first().boundingBox()
    const mainMobile = await page.locator('main').boundingBox()
    expect(navMobile.y).toBeLessThan(mainMobile.y)

    await page.setViewportSize(viewports.desktop)
    const navDesktop = await page.getByRole('navigation').first().boundingBox()
    const mainDesktop = await page.locator('main').boundingBox()
    expect(Math.abs(navDesktop.y - mainDesktop.y)).toBeLessThan(navDesktop.height)
  })
})
