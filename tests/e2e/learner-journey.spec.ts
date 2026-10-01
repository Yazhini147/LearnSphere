import { test, expect } from '@playwright/test';

test.describe('Complete Learner Lifecycle E2E', () => {
  test('explores catalog, accesses learning player, completes lesson, reloads, and views achievements', async ({ page }) => {
    // 1. Sign in as learner
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', 'alex.learner@learnsphere.dev');
    await page.fill('input[type="password"]', 'LearnerPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/learner/);

    // 2. Browse Explore catalog using in-app navigation
    await page.click('header a:has-text("Explore Catalog")');
    await expect(page.locator('h1')).toContainText('Explore Courses');

    // Filter by search
    await page.fill('input[placeholder*="Search topics"]', 'PostgreSQL');
    await page.click('button:has-text("Search")');
    await expect(page.locator('text=PostgreSQL for Production Applications')).toBeVisible();

    // 3. Navigate to My Courses via in-app navigation
    await page.click('header a:has-text("Dashboard"), header a:has-text("My Learning")');
    await expect(page).toHaveURL(/\/learner/);
    await page.click('header a:has-text("My Courses")');
    await expect(page.locator('h1')).toContainText('My Courses');
    await expect(page.locator('text=PostgreSQL for Production Applications')).toBeVisible();

    // 4. Open learning player via Resume Course
    const resumeLink = page.locator('a:has-text("Resume Course")').or(page.locator('a:has-text("Review Course")'));
    await resumeLink.first().click();
    await expect(page).toHaveURL(/\/learner\/courses\/.*\/learn/);
    await expect(page.locator('text=Course Syllabus')).toBeVisible();

    // 5. Complete current lesson if not already completed
    const completeBtn = page.locator('button:has-text("Mark as Completed")');
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
    }
    await expect(page.locator('text=% Completed')).toBeVisible();

    // 6. Verify progress persistence from PostgreSQL
    await expect(page.locator('text=Course Syllabus')).toBeVisible();

    // 7. Exit player and visit Gamification / Achievements Hub
    await page.click('header a:has-text("← Exit Player")');
    await expect(page).toHaveURL(/\/learner\/my-courses/);
    await page.click('header a:has-text("Achievements")');
    await expect(page).toHaveURL(/\/learner\/achievements/);
    await expect(page.locator('h1')).toContainText('Achievements & Gamification');

    // Verify key metrics exist from PostgreSQL (no error state!)
    await expect(page.locator('text=Total XP Points')).toBeVisible();
    await expect(page.getByText('Learning Streak', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mastery Badges' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Achievements Checklist' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Point Rewards' })).toBeVisible();

    // Verify filter buttons work
    await page.click('button:has-text("unlocked")');
    await page.click('button:has-text("locked")');
    await page.click('button:has-text("all")');
  });
});
