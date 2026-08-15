import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const pages = [
  ['/#/', 'overview'],
  ['/#/temizlik', 'clean'],
  ['/#/onarim', 'repair'],
  ['/#/ag', 'network'],
  ['/#/yedek', 'backup'],
  ['/#/loglar', 'logs'],
  ['/#/ayarlar', 'settings'],
]

test.describe('Accessibility (axe-core, WCAG2A/AA)', () => {
  for (const [path, name] of pages) {
    test(`${name} page has no serious/critical a11y violations`, async ({ page }) => {
      await page.goto(path)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
      expect(serious, JSON.stringify(serious, null, 2)).toEqual([])
    })
  }
})
