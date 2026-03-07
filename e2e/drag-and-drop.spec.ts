import { test, expect, type APIRequestContext } from "@playwright/test";

async function createProspect(
  request: APIRequestContext,
  data: Record<string, unknown>
) {
  const res = await request.post("http://localhost:5000/api/prospects", { data });
  expect(res.status()).toBe(201);
  return res.json();
}

async function deleteProspect(request: APIRequestContext, id: number) {
  await request.delete(`http://localhost:5000/api/prospects/${id}`);
}

test.describe("Drag and Drop", () => {
  const createdIds: number[] = [];

  test.beforeAll(async ({ request }) => {
    const prospects = [
      { companyName: "DragTestAlpha", roleTitle: "Dev", status: "Bookmarked", interestLevel: "High" },
      { companyName: "DragTestBeta", roleTitle: "Designer", status: "Bookmarked", interestLevel: "Medium" },
      { companyName: "DragTestGamma", roleTitle: "PM", status: "Applied", interestLevel: "Low" },
    ];
    for (const p of prospects) {
      const created = await createProspect(request, p);
      createdIds.push(created.id);
    }
  });

  test.afterAll(async ({ request }) => {
    for (const id of createdIds) {
      await deleteProspect(request, id);
    }
  });

  test("can drag a card from Bookmarked to Applied and card appears in new column", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    const cardId = createdIds[0];
    const card = page.locator(`[data-testid="draggable-prospect-${cardId}"]`);
    const targetColumn = page.locator('[data-testid="column-applied"]');

    await expect(card).toBeVisible();

    const cardBox = await card.boundingBox();
    const targetBox = await targetColumn.boundingBox();

    if (!cardBox || !targetBox) throw new Error("Could not get bounding boxes");

    const startX = cardBox.x + cardBox.width / 2;
    const startY = cardBox.y + cardBox.height / 2;
    const endX = targetBox.x + targetBox.width / 2;
    const endY = targetBox.y + targetBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.mouse.up();

    await page.waitForTimeout(1000);

    const updatedCard = page.locator(`[data-testid="card-prospect-${cardId}"]`);
    const appliedColumn = page.locator('[data-testid="column-applied"]');
    await expect(appliedColumn.locator(`[data-testid="card-prospect-${cardId}"]`)).toBeVisible({ timeout: 5000 });
  });

  test("column count updates after drag", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    const bookmarkedBadge = page.locator('[data-testid="badge-count-bookmarked"]');
    const appliedBadge = page.locator('[data-testid="badge-count-applied"]');

    const bookmarkedCountBefore = Number(await bookmarkedBadge.textContent());
    const appliedCountBefore = Number(await appliedBadge.textContent());

    const cardId = createdIds[1];
    const card = page.locator(`[data-testid="draggable-prospect-${cardId}"]`);
    const targetColumn = page.locator('[data-testid="column-applied"]');

    const cardBox = await card.boundingBox();
    const targetBox = await targetColumn.boundingBox();

    if (!cardBox || !targetBox) throw new Error("Could not get bounding boxes");

    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 20 });
    await page.mouse.up();

    await page.waitForTimeout(1000);

    await expect(bookmarkedBadge).toHaveText(String(bookmarkedCountBefore - 1), { timeout: 5000 });
    await expect(appliedBadge).toHaveText(String(appliedCountBefore + 1), { timeout: 5000 });
  });

  test("dragged card persists in new column after page refresh", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    const cardId = createdIds[0];
    const appliedColumn = page.locator('[data-testid="column-applied"]');
    await expect(appliedColumn.locator(`[data-testid="card-prospect-${cardId}"]`)).toBeVisible({ timeout: 5000 });

    await page.reload();
    await page.waitForSelector('[data-testid="text-app-title"]');

    const refreshedAppliedColumn = page.locator('[data-testid="column-applied"]');
    await expect(refreshedAppliedColumn.locator(`[data-testid="card-prospect-${cardId}"]`)).toBeVisible({ timeout: 5000 });
  });

  test("card dragged to filtered column is hidden by filter but visible when set to All", async ({ page, request }) => {
    const lowProspect = await createProspect(request, {
      companyName: "DragFilterTest",
      roleTitle: "Tester",
      status: "Bookmarked",
      interestLevel: "Low",
    });
    createdIds.push(lowProspect.id);

    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    await page.locator('[data-testid="filter-interest-applied"]').click();
    await page.locator('[data-testid="filter-option-high-applied"]').click();

    const card = page.locator(`[data-testid="draggable-prospect-${lowProspect.id}"]`);
    const targetColumn = page.locator('[data-testid="column-applied"]');

    const cardBox = await card.boundingBox();
    const targetBox = await targetColumn.boundingBox();

    if (!cardBox || !targetBox) throw new Error("Could not get bounding boxes");

    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 20 });
    await page.mouse.up();

    await page.waitForTimeout(1000);

    const appliedColumn = page.locator('[data-testid="column-applied"]');
    await expect(appliedColumn.locator(`[data-testid="card-prospect-${lowProspect.id}"]`)).toHaveCount(0, { timeout: 5000 });

    await page.locator('[data-testid="filter-interest-applied"]').click();
    await page.locator('[data-testid="filter-option-all-applied"]').click();

    await expect(appliedColumn.locator(`[data-testid="card-prospect-${lowProspect.id}"]`)).toBeVisible({ timeout: 5000 });
  });
});
