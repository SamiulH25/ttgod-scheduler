import { test, expect } from "@playwright/test";

/**
 * Smoke flow: landing → dev credentials sign-in → dashboard.
 * Run with dev server: `npm run dev` in another terminal, then `npm run test:e2e`.
 */
test("dev demo sign-in reaches dashboard", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your name").fill("E2E User");
  await page.getByRole("button", { name: /Go to dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Hello/i })).toBeVisible();
});
