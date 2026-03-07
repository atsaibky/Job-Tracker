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

test.describe("Interest Level Filter", () => {
  const createdIds: number[] = [];

  test.beforeAll(async ({ request }) => {
    const prospects = [
      { companyName: "FilterHighA", roleTitle: "Dev", status: "Bookmarked", interestLevel: "High" },
      { companyName: "FilterHighB", roleTitle: "Dev", status: "Bookmarked", interestLevel: "High" },
      { companyName: "FilterMedA", roleTitle: "Dev", status: "Bookmarked", interestLevel: "Medium" },
      { companyName: "FilterLowA", roleTitle: "Dev", status: "Bookmarked", interestLevel: "Low" },
      { companyName: "FilterAppliedHigh", roleTitle: "Dev", status: "Applied", interestLevel: "High" },
      { companyName: "FilterAppliedMed", roleTitle: "Dev", status: "Applied", interestLevel: "Medium" },
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

  test("each column has an interest filter dropdown defaulting to All", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    const columns = ["bookmarked", "applied", "phone-screen", "interviewing", "offer", "rejected", "withdrawn"];
    for (const col of columns) {
      const trigger = page.locator(`[data-testid="filter-interest-${col}"]`);
      await expect(trigger).toBeVisible();
      await expect(trigger).toContainText("All");
    }
  });

  test("filtering by High shows only High interest prospects in a column", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    const column = page.locator('[data-testid="column-bookmarked"]');

    await page.locator('[data-testid="filter-interest-bookmarked"]').click();
    await page.locator('[data-testid="filter-option-high-bookmarked"]').click();

    const cards = column.locator('[data-testid^="card-prospect-"]');
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('[data-testid="interest-high"]')).toBeVisible();
    }
  });

  test("filtering by Low shows only Low interest prospects", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    const column = page.locator('[data-testid="column-bookmarked"]');

    await page.locator('[data-testid="filter-interest-bookmarked"]').click();
    await page.locator('[data-testid="filter-option-low-bookmarked"]').click();

    const cards = column.locator('[data-testid^="card-prospect-"]');
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('[data-testid="interest-low"]')).toBeVisible();
    }
  });

  test("switching filter back to All restores all prospects", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    const column = page.locator('[data-testid="column-bookmarked"]');
    const allCardsBefore = await column.locator('[data-testid^="card-prospect-"]').count();

    await page.locator('[data-testid="filter-interest-bookmarked"]').click();
    await page.locator('[data-testid="filter-option-high-bookmarked"]').click();

    await page.locator('[data-testid="filter-interest-bookmarked"]').click();
    await page.locator('[data-testid="filter-option-all-bookmarked"]').click();

    const badge = page.locator('[data-testid="badge-count-bookmarked"]');
    await expect(badge).toHaveText(String(allCardsBefore));
  });

  test("badge count updates when filter is applied", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    const badge = page.locator('[data-testid="badge-count-bookmarked"]');
    const allCount = Number(await badge.textContent());

    await page.locator('[data-testid="filter-interest-bookmarked"]').click();
    await page.locator('[data-testid="filter-option-high-bookmarked"]').click();

    await expect(badge).not.toHaveText(String(allCount));
    const filteredCount = Number(await badge.textContent());
    expect(filteredCount).toBeLessThan(allCount);
  });

  test("filters are independent across columns", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    await page.locator('[data-testid="filter-interest-bookmarked"]').click();
    await page.locator('[data-testid="filter-option-high-bookmarked"]').click();

    const appliedFilter = page.locator('[data-testid="filter-interest-applied"]');
    await expect(appliedFilter).toContainText("All");
  });
});

test.describe("Target Salary", () => {
  let salaryProspectId: number | null = null;
  let noSalaryProspectId: number | null = null;

  test.afterAll(async ({ request }) => {
    if (salaryProspectId) await deleteProspect(request, salaryProspectId);
    if (noSalaryProspectId) await deleteProspect(request, noSalaryProspectId);
  });

  test("salary input appears in the Add Prospect form", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');
    await page.locator('[data-testid="button-add-prospect"]').click();
    await expect(page.locator('[data-testid="input-target-salary"]')).toBeVisible();
  });

  test("can create a prospect with a target salary", async ({ page, request }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    await page.locator('[data-testid="button-add-prospect"]').click();

    await page.locator('[data-testid="input-company-name"]').fill("E2ESalaryTestCo");
    await page.locator('[data-testid="input-role-title"]').fill("QA Engineer");
    await page.locator('[data-testid="input-target-salary"]').fill("95000");

    const responsePromise = page.waitForResponse((res) => res.url().includes("/api/prospects") && res.status() === 201);
    await page.locator('[data-testid="button-submit-prospect"]').click();
    const response = await responsePromise;
    const body = await response.json();
    salaryProspectId = body.id;

    const card = page.locator(`[data-testid="card-prospect-${body.id}"]`);
    await expect(card).toBeVisible();
    await expect(card.locator(`[data-testid="text-salary-${body.id}"]`)).toBeVisible();
    await expect(card.locator(`[data-testid="text-salary-${body.id}"]`)).toContainText("95");
  });

  test("can create a prospect without a salary and nothing shows on card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    await page.locator('[data-testid="button-add-prospect"]').click();

    await page.locator('[data-testid="input-company-name"]').fill("E2ENoSalaryCo");
    await page.locator('[data-testid="input-role-title"]').fill("Intern");

    const responsePromise = page.waitForResponse((res) => res.url().includes("/api/prospects") && res.status() === 201);
    await page.locator('[data-testid="button-submit-prospect"]').click();
    const response = await responsePromise;
    const body = await response.json();
    noSalaryProspectId = body.id;

    const card = page.locator(`[data-testid="card-prospect-${body.id}"]`);
    await expect(card).toBeVisible();
    await expect(card.locator(`[data-testid="text-salary-${body.id}"]`)).toHaveCount(0);
  });

  test("salary field rejects negative values via form validation", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    await page.locator('[data-testid="button-add-prospect"]').click();

    await page.locator('[data-testid="input-company-name"]').fill("NegSalaryCo");
    await page.locator('[data-testid="input-role-title"]').fill("Tester");
    await page.locator('[data-testid="input-target-salary"]').fill("-5000");

    await page.locator('[data-testid="button-submit-prospect"]').click();

    await expect(page.getByText("Salary must be a positive number")).toBeVisible();
  });

  test("salary field rejects decimal values via form validation", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="text-app-title"]');

    await page.locator('[data-testid="button-add-prospect"]').click();

    await page.locator('[data-testid="input-company-name"]').fill("DecimalSalaryCo");
    await page.locator('[data-testid="input-role-title"]').fill("Tester");
    await page.locator('[data-testid="input-target-salary"]').fill("50000.99");

    await page.locator('[data-testid="button-submit-prospect"]').click();

    await expect(page.getByText("Salary must be a whole number")).toBeVisible();
  });

  test("salary is editable via the Edit Prospect form", async ({ page, request }) => {
    const created = await createProspect(request, {
      companyName: "E2EEditSalaryCo",
      roleTitle: "Dev",
      status: "Bookmarked",
      interestLevel: "Medium",
      targetSalary: 80000,
    });
    const id = created.id;

    try {
      await page.goto("/");
      await page.waitForSelector('[data-testid="text-app-title"]');

      const card = page.locator(`[data-testid="card-prospect-${id}"]`);
      await expect(card).toBeVisible();
      await card.click();

      const salaryInput = page.locator('[data-testid="input-edit-target-salary"]');
      await expect(salaryInput).toBeVisible();

      await salaryInput.fill("");
      await salaryInput.fill("150000");

      const editResponse = page.waitForResponse((res) => res.url().includes(`/api/prospects/${id}`) && res.status() === 200);
      await page.locator('[data-testid="button-save-prospect"]').click();
      await editResponse;

      const updatedCard = page.locator(`[data-testid="card-prospect-${id}"]`);
      await expect(updatedCard.locator(`[data-testid="text-salary-${id}"]`)).toContainText("150");
    } finally {
      await deleteProspect(request, id);
    }
  });

  test("salary persists after page refresh", async ({ page, request }) => {
    const created = await createProspect(request, {
      companyName: "E2EPersistSalaryCo",
      roleTitle: "Dev",
      status: "Bookmarked",
      interestLevel: "High",
      targetSalary: 200000,
    });
    const id = created.id;

    try {
      await page.goto("/");
      await page.waitForSelector('[data-testid="text-app-title"]');

      const card = page.locator(`[data-testid="card-prospect-${id}"]`);
      await expect(card.locator(`[data-testid="text-salary-${id}"]`)).toContainText("200");

      await page.reload();
      await page.waitForSelector('[data-testid="text-app-title"]');

      const refreshedCard = page.locator(`[data-testid="card-prospect-${id}"]`);
      await expect(refreshedCard.locator(`[data-testid="text-salary-${id}"]`)).toContainText("200");
    } finally {
      await deleteProspect(request, id);
    }
  });

  test("salary can be cleared via edit form", async ({ page, request }) => {
    const created = await createProspect(request, {
      companyName: "E2EClearSalaryCo",
      roleTitle: "Dev",
      status: "Bookmarked",
      interestLevel: "Medium",
      targetSalary: 100000,
    });
    const id = created.id;

    try {
      await page.goto("/");
      await page.waitForSelector('[data-testid="text-app-title"]');

      const card = page.locator(`[data-testid="card-prospect-${id}"]`);
      await expect(card.locator(`[data-testid="text-salary-${id}"]`)).toBeVisible();

      await card.click();

      const salaryInput = page.locator('[data-testid="input-edit-target-salary"]');
      await salaryInput.fill("");

      const clearResponse = page.waitForResponse((res) => res.url().includes(`/api/prospects/${id}`) && res.status() === 200);
      await page.locator('[data-testid="button-save-prospect"]').click();
      await clearResponse;

      const updatedCard = page.locator(`[data-testid="card-prospect-${id}"]`);
      await expect(updatedCard.locator(`[data-testid="text-salary-${id}"]`)).toHaveCount(0);
    } finally {
      await deleteProspect(request, id);
    }
  });
});
