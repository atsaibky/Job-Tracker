import { insertProspectSchema } from "../schema";

const validBase = {
  companyName: "Acme",
  roleTitle: "Engineer",
  status: "Bookmarked" as const,
  interestLevel: "Medium" as const,
};

describe("targetSalary validation", () => {
  test("accepts a valid positive integer", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, targetSalary: 120000 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetSalary).toBe(120000);
    }
  });

  test("accepts null (field is optional)", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, targetSalary: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetSalary).toBeNull();
    }
  });

  test("accepts undefined (field is optional)", () => {
    const result = insertProspectSchema.safeParse({ ...validBase });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetSalary).toBeUndefined();
    }
  });

  test("rejects negative numbers", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, targetSalary: -50000 });
    expect(result.success).toBe(false);
  });

  test("rejects zero", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, targetSalary: 0 });
    expect(result.success).toBe(false);
  });

  test("rejects decimal numbers", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, targetSalary: 99999.99 });
    expect(result.success).toBe(false);
  });

  test("rejects non-numeric strings", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, targetSalary: "abc" });
    expect(result.success).toBe(false);
  });

  test("rejects numeric strings (must be actual number type)", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, targetSalary: "120000" });
    expect(result.success).toBe(false);
  });

  test("accepts salary of 1 (minimum positive integer)", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, targetSalary: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetSalary).toBe(1);
    }
  });

  test("accepts large salary values", () => {
    const result = insertProspectSchema.safeParse({ ...validBase, targetSalary: 1000000 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetSalary).toBe(1000000);
    }
  });
});
