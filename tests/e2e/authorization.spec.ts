import { test, expect } from '@playwright/test';

test.describe('Privacy & Authorization Guards E2E', () => {
  test('redirects unauthenticated users to sign-in when accessing protected routes', async ({ page }) => {
    await page.goto('/learner');
    await expect(page).toHaveURL(/\/sign-in/);

    await page.goto('/instructor');
    await expect(page).toHaveURL(/\/sign-in/);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('prevents learner from accessing instructor and admin portals', async ({ page }) => {
    // Sign in as learner
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'alex.learner@learnsphere.dev');
    await page.fill('input[type="password"]', 'LearnerPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/learner/);

    // Attempt to access instructor studio
    await page.goto('/instructor');
    // Should be prevented from viewing instructor studio
    await expect(page.locator('h1:has-text("Instructor Studio")')).not.toBeVisible();

    // Attempt to access admin console
    await page.goto('/admin');
    // Should be prevented from viewing admin console
    await expect(page.locator('h1:has-text("Admin Control Center")')).not.toBeVisible();
  });

  test('prevents instructor from accessing admin governance routes', async ({ page }) => {
    // Sign in as instructor
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'sarah.instructor@learnsphere.dev');
    await page.fill('input[type="password"]', 'InstructorPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/instructor/);

    // Attempt to access admin console
    await page.goto('/admin/users');
    await expect(page.locator('h1:has-text("User Directory & Role Governance")')).not.toBeVisible();
  });
});
