import { test, expect } from '@playwright/test';

test.describe('Admin Governance & Telemetry E2E', () => {
  test('logs in as admin, audits platform telemetry, manages users, and moderates courses', async ({ page }) => {
    // 1. Sign in as admin
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'admin@learnsphere.dev');
    await page.fill('input[type="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('h1')).toContainText('Admin Control Center');

    // 2. Verify telemetry KPI cards
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Courses in Portfolio')).toBeVisible();
    await expect(page.locator('text=Total Enrollments')).toBeVisible();
    await expect(page.locator('text=Learning Velocity')).toBeVisible();

    // 3. Verify sections
    await expect(page.locator('text=Top Courses by Enrollment')).toBeVisible();
    await expect(page.locator('text=Recent Account Registrations')).toBeVisible();
    await expect(page.locator('text=Platform Security & Audit Trail')).toBeVisible();

    // 4. Navigate to User Directory
    await page.click('a:has-text("Manage Users")');
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.locator('h1')).toContainText('User Directory');

    // Search for user
    await page.fill('input[placeholder*="Search by email or name"]', 'sarah');
    await expect(page.locator('text=sarah.instructor@learnsphere.dev')).toBeVisible();

    // 5. Navigate to Course Moderation
    await page.click('header a:has-text("Course Management")');
    await expect(page).toHaveURL(/\/admin\/courses/);
    await expect(page.locator('h1')).toContainText('Course Administration');
    await expect(page.locator('table')).toBeVisible();
  });
});
