import { test, expect } from '@playwright/test';

test.describe('Authentication & Session E2E', () => {
  test('logs in successfully with valid learner credentials and signs out', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('h1')).toContainText('Sign in');

    await page.fill('#email', 'alex.learner@learnsphere.dev');
    await page.fill('#password', 'LearnerPass123!');
    await page.click('button[type="submit"]');

    // Should navigate to learner portal
    await expect(page).toHaveURL(/\/learner/);
    await expect(page.locator('h1')).toContainText('Welcome back');

    // Sign out
    await page.click('header button:has-text("Sign out")');
    await expect(page).toHaveURL('/');
  });

  test('displays error message on invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('#email', 'alex.learner@learnsphere.dev');
    await page.fill('#password', 'WrongPassword999!');
    await page.click('button[type="submit"]');

    await expect(page.locator('role=alert')).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('registers a new learner account and enters dashboard', async ({ page }) => {
    const randomEmail = `e2e_learner_${Date.now()}@learnsphere.dev`;

    await page.goto('/sign-up');
    await expect(page.locator('h1')).toContainText('Create your account');

    await page.fill('#displayName', 'Test Auto Learner');
    await page.fill('#reg-email', randomEmail);
    await page.fill('#reg-password', 'TestPass123!Secure');
    await page.fill('#confirmPassword', 'TestPass123!Secure');
    await page.click('button[type="submit"]');

    // Should redirect to /learner portal
    await expect(page).toHaveURL(/\/learner/);
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  test('Learner: session persists across normal page reload', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('#email', 'alex.learner@learnsphere.dev');
    await page.fill('#password', 'LearnerPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/learner/);
    await expect(page.locator('h1')).toContainText('Welcome back');

    // Perform hard browser reload
    await page.reload();

    // Verify user remains logged in and role is preserved
    await expect(page).toHaveURL(/\/learner/);
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  test('Instructor: session persists across normal page reload', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('#email', 'sarah.instructor@learnsphere.dev');
    await page.fill('#password', 'InstructorPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/instructor/);
    await expect(page.locator('h1')).toContainText('Instructor Studio');

    // Perform hard browser reload
    await page.reload();

    // Verify instructor remains authenticated
    await expect(page).toHaveURL(/\/instructor/);
    await expect(page.locator('h1')).toContainText('Instructor Studio');
  });

  test('Admin: session persists across normal page reload', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('#email', 'admin@learnsphere.dev');
    await page.fill('#password', 'AdminPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('h1')).toContainText('Platform Overview');

    // Perform hard browser reload
    await page.reload();

    // Verify admin remains authenticated and on admin portal
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('h1')).toContainText('Platform Overview');
  });

  test('Explicit logout: reloading page keeps user unauthenticated', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('#email', 'alex.learner@learnsphere.dev');
    await page.fill('#password', 'LearnerPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/learner/);

    // Explicit sign out
    await page.click('header button:has-text("Sign out")');
    await expect(page).toHaveURL('/');

    // Navigate to protected page & reload
    await page.goto('/learner');
    await expect(page).toHaveURL(/\/sign-in/);

    await page.reload();
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
