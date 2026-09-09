import { defineConfig, devices } from '@playwright/test'

/**
 * E2E runs against the Vite dev server in "web mode" (mock runner, no
 * Electron bridge, no admin elevation, no real filesystem/system calls).
 * This exercises navigation, layout, and UI state logic safely and
 * cross-browser without touching a real Windows system.
 */
export default defineConfig({
  testDir: './e2e',
  // Vite's dev server transforms modules on first request; under several
  // parallel workers hitting a cold server at once, that first navigation
  // can comfortably exceed the 30s default, so give it more headroom.
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 45_000,
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Gorsel regresyon yalnizca chromium'da: referans goruntuler motor
    // basina degisiyor ve depoda yalnizca chromium icin var. Diger
    // motorlarda duzen dogrulugunu responsive/navigation testleri kapsiyor.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: '**/visual.spec.js' },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: '**/visual.spec.js' },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, testIgnore: '**/visual.spec.js' },
  ],
})
