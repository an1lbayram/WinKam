import { expect, test } from '@playwright/test'

test.describe('Visual regression', () => {
  test('overview page matches baseline screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/#/')
    await expect(page.locator('main').getByText('Genel Bakış', { exact: true })).toBeVisible()
    await expect(page).toHaveScreenshot('overview-desktop.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })

  test('clean page matches baseline screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/#/temizlik')
    await expect(page.locator('main').getByText('Temizlik', { exact: true })).toBeVisible()
    await expect(page).toHaveScreenshot('clean-desktop.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })

  test('overview page matches baseline screenshot on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/#/')
    await expect(page.locator('main').getByText('Genel Bakış', { exact: true })).toBeVisible()
    await expect(page).toHaveScreenshot('overview-mobile.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })
})
