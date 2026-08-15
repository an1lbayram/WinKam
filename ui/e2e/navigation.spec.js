import { expect, test } from '@playwright/test'

const pages = [
  { path: '/#/', heading: 'Genel Bakış' },
  { path: '/#/temizlik', heading: 'Temizlik' },
  { path: '/#/onarim', heading: 'Onarım' },
  { path: '/#/ag', heading: 'Ağ' },
  { path: '/#/yedek', heading: 'Yedek' },
  { path: '/#/loglar', heading: 'Loglar' },
  { path: '/#/ayarlar', heading: 'Ayarlar' },
]

test.describe('Functional QA: page navigation', () => {
  // Page titles render as plain text (not semantic <h1>-<h6>), and the same
  // label also appears in the sidebar nav, so queries are scoped to <main>.
  for (const { path, heading } of pages) {
    test(`loads ${path} and shows the "${heading}" title`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('main').getByText(heading, { exact: true }).first()).toBeVisible()
    })
  }

  test('sidebar nav links move between pages', async ({ page }) => {
    await page.goto('/#/')
    await page.getByRole('navigation').getByText('Onarım').click()
    await expect(page).toHaveURL(/#\/onarim/)
    await expect(page.locator('main').getByText('Onarım', { exact: true })).toBeVisible()
  })

  test('page title is set correctly', async ({ page }) => {
    await page.goto('/#/')
    await expect(page).toHaveTitle(/WinKam/)
  })
})

test.describe('E2E: dry-run clean flow (mock/web mode)', () => {
  test('dry-run button is enabled and produces mock output', async ({ page }) => {
    await page.goto('/#/temizlik')
    const dryRun = page.getByRole('button', { name: 'Dry-run' })
    await expect(dryRun).toBeEnabled()
    await dryRun.click()
    await expect(page.getByText(/exit code: 0/)).toBeVisible({ timeout: 5000 })
  })

  test('safe/advanced clean are disabled in plain web mode (no Electron bridge)', async ({ page }) => {
    await page.goto('/#/temizlik')
    await expect(page.getByRole('button', { name: 'Safe' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Advanced' })).toBeDisabled()
  })
})

test.describe('E2E: backup target validation', () => {
  test('typing "c" disables the backup action (system drive protection)', async ({ page }) => {
    await page.goto('/#/yedek')
    const input = page.getByPlaceholder('D')
    await input.fill('')
    await input.type('c')
    await expect(page.getByRole('button', { name: 'Yedek Başlat' })).toBeDisabled()
  })
})
