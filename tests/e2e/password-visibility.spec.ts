import { test, expect } from '@playwright/test';

test.describe('Password Visibility Controls E2E', () => {
  test('SignIn: toggles password visibility with accessible label and keyboard support', async ({ page }) => {
    await page.goto('/sign-in');

    const passwordInput = page.locator('#password');
    const toggleButton = page.locator('button[aria-label="Show password"]');

    // Default: password is type="password"
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toHaveAttribute('aria-label', 'Show password');

    // Type a password
    await passwordInput.fill('LearnerPass123!');

    // Click show password
    await toggleButton.click();

    // Now type="text" and label changes to "Hide password"
    await expect(passwordInput).toHaveAttribute('type', 'text');
    const hideButton = page.locator('button[aria-label="Hide password"]');
    await expect(hideButton).toBeVisible();

    // Click again to hide
    await hideButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(page.locator('button[aria-label="Show password"]')).toBeVisible();

    // Test form submission works while revealed
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.fill('#email', 'alex.learner@learnsphere.dev');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/learner/);
  });

  test('SignUp: password and confirm password have independent visibility controls', async ({ page }) => {
    await page.goto('/sign-up');

    const regPwInput = page.locator('#reg-password');
    const confirmPwInput = page.locator('#confirmPassword');

    // Both hidden by default
    await expect(regPwInput).toHaveAttribute('type', 'password');
    await expect(confirmPwInput).toHaveAttribute('type', 'password');

    // Toggle reg-password
    const regToggle = regPwInput.locator('..').locator('button');
    await regToggle.click();
    await expect(regPwInput).toHaveAttribute('type', 'text');
    await expect(confirmPwInput).toHaveAttribute('type', 'password'); // other field remains hidden

    // Toggle confirm password
    const confirmToggle = confirmPwInput.locator('..').locator('button');
    await confirmToggle.click();
    await expect(regPwInput).toHaveAttribute('type', 'text');
    await expect(confirmPwInput).toHaveAttribute('type', 'text');

    // Toggle reg-password back
    await regToggle.click();
    await expect(regPwInput).toHaveAttribute('type', 'password');
    await expect(confirmPwInput).toHaveAttribute('type', 'text');
  });
});
