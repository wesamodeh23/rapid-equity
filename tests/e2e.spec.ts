import { test, expect } from '@playwright/test'

test('basic navigation and sample replay', async ({ page }) => {
  await page.goto('/')
  // should redirect to /overview
  await expect(page).toHaveURL(/overview/)
  // navigate to Research via nav
  await page.click('text=Research')
  await expect(page.locator('h1')).toHaveText('Research')
  // start sample replay and expect Stop button to appear
  await page.click('text=Start Sample Replay')
  await expect(page.locator('text=Stop Replay')).toBeVisible()
})
