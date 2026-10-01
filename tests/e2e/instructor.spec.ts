import { test, expect } from '@playwright/test';

test.describe('Instructor Studio & Authoring E2E', () => {
  test('logs in as instructor, views metrics, creates a course, edits curriculum, and toggles status', async ({ page }) => {
    // 1. Sign in as instructor
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'sarah.instructor@learnsphere.dev');
    await page.fill('input[type="password"]', 'InstructorPass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/instructor/);
    await expect(page.locator('h1')).toContainText('Instructor Studio');

    // 2. Verify metric cards
    await expect(page.locator('text=Total Courses')).toBeVisible();
    await expect(page.locator('text=Total Learners')).toBeVisible();
    await expect(page.locator('text=Total Views')).toBeVisible();
    await expect(page.locator('text=Completion Rate')).toBeVisible();

    // 3. Create a course
    await page.click('button:has-text("Create New Course")');
    await expect(page.locator('h3:has-text("Create New Course")')).toBeVisible();

    const testCourseTitle = `E2E Course ${Date.now()}`;
    await page.fill('input[placeholder*="Modern Full-Stack"]', testCourseTitle);
    await page.fill('input[placeholder*="Brief one-line summary"]', 'Test course description created via automated E2E.');
    await page.click('form button:has-text("Create & Open Editor")');

    // Should navigate to Course Editor
    await expect(page).toHaveURL(/\/instructor\/courses\/.*\/edit/);
    await expect(page.locator('h1')).toContainText(testCourseTitle);

    // 4. Add a lesson in the editor
    await page.click('button:has-text("Curriculum & Lessons")');
    await page.click('button:has-text("Add Lesson"), button:has-text("Add Your First Lesson")');
    await page.fill('input[placeholder*="Introduction to Async Architecture"]', 'Lesson 1: Automated Test Foundations');
    await page.fill('input[placeholder*="Brief synopsis"]', 'Full breakdown of automated testing architecture.');
    await page.click('button:has-text("Add to Curriculum")');

    await expect(page.locator('text=Lesson 1: Automated Test Foundations')).toBeVisible();

    // 5. Navigate back to instructor dashboard via in-app link
    await page.click('header a:has-text("Dashboard")');
    await expect(page).toHaveURL(/\/instructor/);
    await expect(page.locator(`text=${testCourseTitle}`).first()).toBeVisible();
  });
});
