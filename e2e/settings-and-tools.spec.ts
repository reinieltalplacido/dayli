import { test, expect } from '@playwright/test';

test.describe('Settings, Search, and Smart Tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
  });

  test('should open Preferences & Settings modal and navigate tabs', async ({ page }) => {
    // Open settings from sidebar
    const settingsBtn = page.locator('#tour-settings');
    await settingsBtn.click();

    // Verify modal is open and shows version v1.0.0
    const modalHeading = page.getByRole('heading', { name: 'Settings' });
    await expect(modalHeading).toBeVisible();
    await expect(page.getByText('Preferences & Config')).toBeVisible();
    await expect(page.getByText('v1.0.0').first()).toBeVisible();

    // Switch to Regional tab
    const regionalTab = page.getByRole('button', { name: /Regional|Locale/i }).first();
    if (await regionalTab.isVisible()) {
      await regionalTab.click();
      await expect(page.getByText(/Time Zone|Language|Format/i).first()).toBeVisible();
    }

    // Switch to Shortcuts tab
    const shortcutsTab = page.getByRole('button', { name: /Shortcuts/i }).first();
    if (await shortcutsTab.isVisible()) {
      await shortcutsTab.click();
      await expect(page.getByText(/Keyboard Shortcuts/i).first()).toBeVisible();
    }

    // Close settings modal
    const closeBtn = page.locator('button[title="Close (Esc)"]');
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('should open and close the Smart Schedule quick-add modal', async ({ page }) => {
    const smartScheduleBtn = page.locator('#tour-smart-schedule');
    await smartScheduleBtn.click();

    // Verify modal elements
    const modalHeading = page.getByRole('heading', { name: 'Smart Schedule' });
    await expect(modalHeading).toBeVisible();
    const promptInput = page.locator('input[placeholder*="Dinner with Alex"]');
    await expect(promptInput).toBeVisible();

    // Close modal via Escape or close button
    await page.keyboard.press('Escape');
    await expect(modalHeading).not.toBeVisible();
  });

  test('should open search modal using search button or shortcut', async ({ page }) => {
    // Click Search button in header
    const searchBtn = page.locator('header button', { hasText: 'Search' });
    await searchBtn.click();

    // Verify search dialog opens
    const searchInput = page.locator('input[placeholder*="Search events, locations, or notes..."], input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Type a query
    await searchInput.fill('Project');
    await page.keyboard.press('Escape');
    await expect(searchInput).not.toBeVisible();
  });
});
