import { insertProspectSchema, STATUSES } from "../schema";

const validBase = {
  companyName: "Acme",
  roleTitle: "Engineer",
  interestLevel: "Medium" as const,
};

describe("status validation via insertProspectSchema", () => {
  test.each(STATUSES.map((s) => [s]))("accepts valid status: %s", (status) => {
    const result = insertProspectSchema.safeParse({ ...validBase, status });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe(status);
    }
  });

  test("defaults to Bookmarked when status is omitted", () => {
    const result = insertProspectSchema.safeParse({ ...validBase });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("Bookmarked");
    }
  });

  test("rejects an invalid status string", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, status: "Dancing" });
    expect(result.success).toBe(false);
  });

  test("rejects empty string as status", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, status: "" });
    expect(result.success).toBe(false);
  });

  test("rejects numeric status", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, status: 42 });
    expect(result.success).toBe(false);
  });

  test("rejects null status", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, status: null });
    expect(result.success).toBe(false);
  });

  test("status is case-sensitive", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, status: "bookmarked" });
    expect(result.success).toBe(false);
  });

  test("any status can transition to any other status via separate parse calls", () => {
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        const result = insertProspectSchema.safeParse({ ...validBase, status: to });
        expect(result.success).toBe(true);
      }
    }
  });
});
