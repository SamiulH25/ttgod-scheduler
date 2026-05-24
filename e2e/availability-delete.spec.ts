import { test, expect } from "@playwright/test";

/**
 * Dev sign-in → create availability via API → delete once → single success path.
 */
test("availability delete does not double-fire", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your name").fill("E2E Delete User");
  await page.getByRole("button", { name: /Go to dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const start = new Date();
  start.setHours(14, 0, 0, 0);
  const end = new Date(start);
  end.setHours(16, 0, 0, 0);

  const createRes = await page.request.post("/api/availability", {
    data: {
      start: start.toISOString(),
      end: end.toISOString(),
      status: "free",
    },
  });
  expect(createRes.ok()).toBeTruthy();
  const { block } = await createRes.json();

  const del1 = await page.request.delete(`/api/availability/${block.id}`);
  expect(del1.ok()).toBeTruthy();

  const del2 = await page.request.delete(`/api/availability/${block.id}`);
  expect(del2.ok()).toBeFalsy();
});
