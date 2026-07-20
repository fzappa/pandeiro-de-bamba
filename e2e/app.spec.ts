import { expect, test } from "@playwright/test";

test.describe("Pandeiro de Bamba", () => {
  test("loads the main editor and pandeiro view", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("header.app-header")).toBeVisible();
    await expect(page.locator(".editor")).toBeVisible();
    await expect(page.locator(".pandeiro-wrapper")).toBeVisible();
  });

  test("can start playback from the toolbar", async ({ page }) => {
    await page.goto("/");

    const playButton = page.getByTitle("Tocar");
    await expect(playButton).toBeVisible();
    await playButton.click();

    await expect(page.getByTitle("Pausar")).toBeVisible();
    await expect(page.getByTitle("Parar")).toBeVisible();
  });
});
