import { test, expect } from '@playwright/test';

test.describe('Event Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
  });

  test('should open New Event modal and create a new calendar event', async ({ page }) => {
    // Click New Event button in header
    const newEventBtn = page.locator('#tour-new-event');
    await newEventBtn.click();

    // Verify modal is visible
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'New Event' })).toBeVisible();

    // Fill in event details
    const testTitle = `Team Standup ${Date.now()}`;
    await page.locator('input[placeholder="Event Title..."]').fill(testTitle);
    await page.locator('input[placeholder="e.g. Science Hall 102 or Zoom link"]').fill('Room 404');
    await page.locator('textarea[placeholder="Add details, agenda items, or notes..."]').fill('Weekly sync notes');

    // Submit form
    await page.getByRole('button', { name: 'Create Event' }).click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // The event should be rendered on the calendar
    await expect(page.locator(`button[title*="${testTitle}"]`)).toBeVisible();
  });

  test('should allow opening and editing an existing event', async ({ page }) => {
    // Open New Event modal
    await page.locator('#tour-new-event').click();
    const eventTitle = `Design Review ${Date.now()}`;
    await page.locator('input[placeholder="Event Title..."]').fill(eventTitle);
    await page.getByRole('button', { name: 'Create Event' }).click();

    // Find and click the created event card on the calendar
    const eventCard = page.locator(`button[title*="${eventTitle}"]`).first();
    await expect(eventCard).toBeVisible();
    await eventCard.click();

    // Modal should open in edit mode
    const modal = page.locator('div[role="dialog"]');
    await expect(modal.getByRole('heading', { name: 'Edit Event' })).toBeVisible();

    // Update the title
    const updatedTitle = `${eventTitle} - Updated`;
    const titleInput = page.locator('input[placeholder="Event Title..."]');
    await titleInput.fill(updatedTitle);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Modal should close and updated title should be visible
    await expect(modal).not.toBeVisible();
    await expect(page.locator(`button[title*="${updatedTitle}"]`)).toBeVisible();
  });

  test('should allow deleting an event via edit modal', async ({ page }) => {
    // Create an event to delete
    await page.locator('#tour-new-event').click();
    const eventTitle = `Temporary Meeting ${Date.now()}`;
    await page.locator('input[placeholder="Event Title..."]').fill(eventTitle);
    await page.getByRole('button', { name: 'Create Event' }).click();

    const eventCard = page.locator(`button[title*="${eventTitle}"]`).first();
    await expect(eventCard).toBeVisible();
    await eventCard.click();

    // Click delete icon in modal
    const deleteBtn = page.locator('button[title="Delete event"]');
    await deleteBtn.click();

    // Confirm deletion in banner
    await expect(page.getByText('Delete this event permanently?')).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    // Event should disappear from view
    await expect(page.locator(`button[title*="${eventTitle}"]`)).not.toBeVisible();
  });
});
