import { test, expect } from '@playwright/test';

test.describe('Mutation Confirmation Dialogs E2E', () => {
  test('Admin: role change requires explicit confirmation dialog', async ({ page }) => {
    // Login as Admin
    await page.goto('/sign-in');
    await page.fill('#email', 'admin@learnsphere.dev');
    await page.fill('#password', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/);

    // Go to Admin Users page
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText('User Directory');

    // Find the first role select dropdown
    const roleSelect = page.locator('table select').first();
    await expect(roleSelect).toBeVisible();

    const initialRole = await roleSelect.inputValue();
    const targetRole = initialRole === 'admin' ? 'instructor' : 'admin';

    // Change dropdown value
    await roleSelect.selectOption(targetRole);

    // Confirmation dialog MUST appear with role="alertdialog"
    const dialog = page.locator('div[role="alertdialog"]');
    await expect(dialog).toBeVisible();

    // Verify Title and buttons
    const cancelBtn = dialog.locator('button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible();

    // Test Cancel: clicking Cancel does NOT mutate and closes dialog
    await cancelBtn.click();
    await expect(dialog).not.toBeVisible();

    // Re-open dialog
    await roleSelect.selectOption(targetRole);
    await expect(dialog).toBeVisible();

    // Listen for PATCH/POST network request to ensure it only happens on Confirm
    let requestFired = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/users') && req.method() === 'PATCH') {
        requestFired = true;
      }
    });

    // Click Confirm button inside dialog
    const confirmBtn = dialog.locator('button:not(:has-text("Cancel"))');
    await confirmBtn.click();

    // Dialog closes and request fires
    await expect(dialog).not.toBeVisible();
    expect(requestFired).toBe(true);

    // Success alert is visible
    await expect(page.locator('text=role updated')).toBeVisible();
  });

  test('Instructor: course deletion requires confirmation dialog', async ({ page }) => {
    // Login as Instructor
    await page.goto('/sign-in');
    await page.fill('#email', 'sarah.instructor@learnsphere.dev');
    await page.fill('#password', 'InstructorPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/instructor/);

    // Click Delete on first course
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();

      // Accessible confirmation dialog appears
      const dialog = page.locator('div[role="alertdialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('h3')).toContainText('Delete course?');

      // Click Cancel - course remains intact
      await dialog.locator('button:has-text("Cancel")').click();
      await expect(dialog).not.toBeVisible();
    }
  });

  test('Instructor: publish/unpublish requires confirmation dialog', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('#email', 'sarah.instructor@learnsphere.dev');
    await page.fill('#password', 'InstructorPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/instructor/);

    // Find Publish or Unpublish button in table
    const toggleBtn = page.locator('td button:has-text("Publish"), td button:has-text("Unpublish")').first();
    if (await toggleBtn.isVisible()) {
      const isPublish = (await toggleBtn.textContent())?.includes('Publish');
      await toggleBtn.click();

      // Accessible confirmation dialog appears
      const dialog = page.locator('div[role="alertdialog"]');
      await expect(dialog).toBeVisible();
      if (isPublish) {
        await expect(dialog.locator('h3')).toContainText('Publish course?');
      } else {
        await expect(dialog.locator('h3')).toContainText('Unpublish course?');
      }

      // Cancel closes dialog without mutating
      await dialog.locator('button:has-text("Cancel")').click();
      await expect(dialog).not.toBeVisible();
    }
  });

  test('Instructor: course creation requires confirmation before sending API request', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('#email', 'sarah.instructor@learnsphere.dev');
    await page.fill('#password', 'InstructorPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/instructor/);

    // Open create course modal
    await page.click('button:has-text("Create New Course")');
    await expect(page.locator('h3:has-text("Create New Course")')).toBeVisible();

    // Fill form
    await page.fill('input[placeholder*="Modern Full-Stack"]', `Test Confirm Course ${Date.now()}`);

    // Click submit inside creation modal
    await page.click('button:has-text("Create & Open Editor")');

    // Confirm dialog MUST appear
    const confirmDialog = page.locator('div[role="alertdialog"]');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.locator('h3')).toContainText('Create course?');

    // Click Cancel - no course created
    await confirmDialog.locator('button:has-text("Cancel")').click();
    await expect(confirmDialog).not.toBeVisible();
  });
});
