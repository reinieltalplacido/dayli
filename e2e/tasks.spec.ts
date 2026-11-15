import { test, expect } from '@playwright/test';

test.describe('Tasks & Reminders Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
  });

  test('should toggle the tasks drawer and create a new task', async ({ page }) => {
    // Open tasks drawer via header button
    const tasksToggle = page.locator('#tour-tasks-header');
    await tasksToggle.click();

    const tasksPanel = page.locator('aside[aria-label="Tasks and Reminders"]');
    await expect(tasksPanel).toBeVisible();

    // Add a new task
    const taskTitle = `Complete Playwright setup ${Date.now()}`;
    const taskInput = tasksPanel.locator('input[placeholder="Add new task..."]');
    await taskInput.fill(taskTitle);
    await taskInput.press('Enter');

    // Verify task is added to list
    await expect(tasksPanel.getByText(taskTitle)).toBeVisible();
  });

  test('should toggle task completion state and switch filter tabs', async ({ page }) => {
    await page.locator('#tour-tasks-header').click();
    const tasksPanel = page.locator('aside[aria-label="Tasks and Reminders"]');

    const taskTitle = `Review PR ${Date.now()}`;
    const taskInput = tasksPanel.locator('input[placeholder="Add new task..."]');
    await taskInput.fill(taskTitle);
    await taskInput.press('Enter');

    const taskRow = tasksPanel.locator('div.group', { hasText: taskTitle }).first();
    // Toggle completion by clicking the circle/check icon button
    const toggleBtn = taskRow.locator('button[aria-label="Toggle task completion"]');
    await toggleBtn.click();

    // Switch to Completed filter
    await tasksPanel.getByRole('button', { name: 'completed' }).click();
    await expect(tasksPanel.getByText(taskTitle)).toBeVisible();

    // Switch to Pending filter - task should not appear
    await tasksPanel.getByRole('button', { name: 'pending' }).click();
    await expect(tasksPanel.getByText(taskTitle)).not.toBeVisible();

    // Switch back to All filter
    await tasksPanel.getByRole('button', { name: 'all' }).click();
    await expect(tasksPanel.getByText(taskTitle)).toBeVisible();
  });

  test('should delete a task and close the drawer', async ({ page }) => {
    await page.locator('#tour-tasks-header').click();
    const tasksPanel = page.locator('aside[aria-label="Tasks and Reminders"]');

    const taskTitle = `Delete me ${Date.now()}`;
    const taskInput = tasksPanel.locator('input[placeholder="Add new task..."]');
    await taskInput.fill(taskTitle);
    await taskInput.press('Enter');
    await expect(tasksPanel.getByText(taskTitle)).toBeVisible();

    // Hover or find delete button
    const deleteBtn = tasksPanel.locator('button[title="Delete task"]').first();
    await deleteBtn.click();

    // Task should be gone
    await expect(tasksPanel.getByText(taskTitle)).not.toBeVisible();

    // Close panel
    await tasksPanel.locator('button[title="Close tasks"]').click();
    await expect(tasksPanel).not.toBeVisible();
  });
});
