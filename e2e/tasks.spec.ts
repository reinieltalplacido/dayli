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

    // Click "New" button in drawer header
    await tasksPanel.getByRole('button', { name: 'New' }).click();
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Add a new task
    const taskTitle = `Complete Playwright setup ${Date.now()}`;
    await modal.locator('input[placeholder="What needs to be done?..."]').fill(taskTitle);
    await modal.getByRole('button', { name: 'Create Task' }).click();
    await expect(modal).not.toBeVisible();

    // Verify task is added to list
    await expect(tasksPanel.getByText(taskTitle)).toBeVisible();
  });

  test('should toggle task completion state and switch filter tabs', async ({ page }) => {
    await page.locator('#tour-tasks-header').click();
    const tasksPanel = page.locator('aside[aria-label="Tasks and Reminders"]');

    const taskTitle = `Review PR ${Date.now()}`;
    await tasksPanel.getByRole('button', { name: 'New' }).click();
    const modal = page.locator('div[role="dialog"]');
    await modal.locator('input[placeholder="What needs to be done?..."]').fill(taskTitle);
    await modal.getByRole('button', { name: 'Create Task' }).click();
    await expect(modal).not.toBeVisible();

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
    await tasksPanel.getByRole('button', { name: 'New' }).click();
    const modal = page.locator('div[role="dialog"]');
    await modal.locator('input[placeholder="What needs to be done?..."]').fill(taskTitle);
    await modal.getByRole('button', { name: 'Create Task' }).click();
    await expect(modal).not.toBeVisible();
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

  test('should open TaskModal via New button, set due date, and create task', async ({ page }) => {
    await page.locator('#tour-tasks-header').click();
    const tasksPanel = page.locator('aside[aria-label="Tasks and Reminders"]');

    // Click "New" button in drawer header
    await tasksPanel.getByRole('button', { name: 'New' }).click();

    // Verify Task Modal opened
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'New Task' })).toBeVisible();

    const taskTitle = `Modal Task with Due Date ${Date.now()}`;
    await modal.locator('input[placeholder="What needs to be done?..."]').fill(taskTitle);

    // Click "Tomorrow" quick date preset
    await modal.getByRole('button', { name: 'Tomorrow' }).click();

    // Submit form
    await modal.getByRole('button', { name: 'Create Task' }).click();
    await expect(modal).not.toBeVisible();

    // Verify task is displayed with due date badge
    const createdTask = tasksPanel.locator('div.group', { hasText: taskTitle }).first();
    await expect(createdTask).toBeVisible();
    await expect(createdTask.getByText(/Today|Tomorrow|Nov|Dec/i).first()).toBeVisible();
  });

  test('should open TaskModal by clicking an existing task and allow editing', async ({ page }) => {
    await page.locator('#tour-tasks-header').click();
    const tasksPanel = page.locator('aside[aria-label="Tasks and Reminders"]');

    // Create a task
    const taskTitle = `Editable Task ${Date.now()}`;
    await tasksPanel.getByRole('button', { name: 'New' }).click();
    const createModal = page.locator('div[role="dialog"]');
    await createModal.locator('input[placeholder="What needs to be done?..."]').fill(taskTitle);
    await createModal.getByRole('button', { name: 'Create Task' }).click();
    await expect(createModal).not.toBeVisible();
    await expect(tasksPanel.getByText(taskTitle)).toBeVisible();

    // Click the task text to open edit modal
    const taskRow = tasksPanel.locator('div.group', { hasText: taskTitle }).first();
    await taskRow.locator('p').click();

    // Modal should be open in Edit mode
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Edit Task' })).toBeVisible();

    // Change title
    const updatedTitle = `${taskTitle} (Updated)`;
    await modal.locator('input[placeholder="What needs to be done?..."]').fill(updatedTitle);
    await modal.getByRole('button', { name: 'Today' }).click();
    await modal.getByRole('button', { name: 'Save Changes' }).click();

    await expect(modal).not.toBeVisible();
    await expect(tasksPanel.getByText(updatedTitle)).toBeVisible();
  });
});
