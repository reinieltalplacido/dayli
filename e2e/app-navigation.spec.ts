import { test, expect } from '@playwright/test';

test.describe('Dayli Calendar Navigation & Views', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
  });

  test('should load the calendar app and render header title', async ({ page }) => {
    await expect(page.locator('header h2')).toBeVisible();
    await expect(page.getByText('Dayli').first()).toBeVisible();
  });

  test('should switch views between Month, Week, and Day using header buttons', async ({ page }) => {
    // Switch to Week view
    const weekBtn = page.locator('#tour-views button', { hasText: 'Week' });
    await weekBtn.click();
    await expect(page.locator('#tour-views button', { hasText: 'Week' })).toHaveClass(/bg-white|dark:bg-\[#2C2C2E\]/);

    // Switch to Day view
    const dayBtn = page.locator('#tour-views button', { hasText: 'Day' });
    await dayBtn.click();
    await expect(page.locator('#tour-views button', { hasText: 'Day' })).toHaveClass(/bg-white|dark:bg-\[#2C2C2E\]/);

    // Switch back to Month view
    const monthBtn = page.locator('#tour-views button', { hasText: 'Month' });
    await monthBtn.click();
    await expect(page.locator('#tour-views button', { hasText: 'Month' })).toHaveClass(/bg-white|dark:bg-\[#2C2C2E\]/);
  });

  test('should navigate to next and previous periods and return with Today button', async ({ page }) => {
    const titleLocator = page.locator('header h2');
    const initialTitle = await titleLocator.innerText();

    // Click next
    const nextBtn = page.locator('header button[aria-label="Next"]');
    await nextBtn.click();
    await expect(titleLocator).not.toHaveText(initialTitle);

    // Click Today
    const todayBtn = page.locator('header button', { hasText: 'Today' });
    await todayBtn.click();
    await expect(titleLocator).toHaveText(initialTitle);
  });

  test('should support keyboard navigation shortcuts (M, W, D)', async ({ page }) => {
    // Wait for hydration and click non-interactive header title to focus page
    await page.locator('header h2').click();

    // Press 'W' for week view
    await page.keyboard.press('w');
    await expect(page.locator('#tour-views button', { hasText: 'Week' })).toHaveClass(/bg-white|dark:bg-\[#2C2C2E\]/);

    // Press 'D' for day view
    await page.keyboard.press('d');
    await expect(page.locator('#tour-views button', { hasText: 'Day' })).toHaveClass(/bg-white|dark:bg-\[#2C2C2E\]/);

    // Press 'M' for month view
    await page.keyboard.press('m');
    await expect(page.locator('#tour-views button', { hasText: 'Month' })).toHaveClass(/bg-white|dark:bg-\[#2C2C2E\]/);
  });
});
