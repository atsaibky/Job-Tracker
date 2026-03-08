import { validateProspect, getNextStatus, isTerminalStatus } from "../prospect-helpers";
import { STATUSES, INTEREST_LEVELS } from "@shared/schema";

describe("validateProspect", () => {
  test("rejects a blank company name", () => {
    const result = validateProspect({
      companyName: "",
      roleTitle: "Software Engineer",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Company name is required");
  });

  test("rejects a blank role title", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Role title is required");
  });

  test("rejects missing company name", () => {
    const result = validateProspect({ roleTitle: "Dev" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Company name is required");
  });

  test("rejects missing role title", () => {
    const result = validateProspect({ companyName: "Acme" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Role title is required");
  });

  test("accepts valid company name and role title", () => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Engineer",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test.each(STATUSES.map((s) => [s]))("accepts valid status: %s", (status) => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Dev",
      status,
    });
    expect(result.valid).toBe(true);
  });

  test("rejects invalid status", () => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Dev",
      status: "InvalidStatus",
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Status must be one of");
  });

  test.each(INTEREST_LEVELS.map((l) => [l]))("accepts valid interest level: %s", (level) => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Dev",
      interestLevel: level,
    });
    expect(result.valid).toBe(true);
  });

  test("rejects invalid interest level", () => {
    const result = validateProspect({
      companyName: "Acme",
      roleTitle: "Dev",
      interestLevel: "VeryHigh",
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Interest level must be one of");
  });

  test("collects multiple errors", () => {
    const result = validateProspect({
      companyName: "",
      roleTitle: "",
      status: "Nope",
      interestLevel: "Nope",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});

describe("getNextStatus", () => {
  test("advances Bookmarked to Applied", () => {
    expect(getNextStatus("Bookmarked")).toBe("Applied");
  });

  test("advances Applied to Phone Screen", () => {
    expect(getNextStatus("Applied")).toBe("Phone Screen");
  });

  test("advances Phone Screen to Interviewing", () => {
    expect(getNextStatus("Phone Screen")).toBe("Interviewing");
  });

  test("does not advance terminal statuses", () => {
    expect(getNextStatus("Offer")).toBe("Offer");
    expect(getNextStatus("Rejected")).toBe("Rejected");
    expect(getNextStatus("Withdrawn")).toBe("Withdrawn");
  });

  test("advances Interviewing to Offer", () => {
    expect(getNextStatus("Interviewing")).toBe("Offer");
  });

  test("returns current status for unknown status", () => {
    expect(getNextStatus("Unknown")).toBe("Unknown");
  });
});

describe("isTerminalStatus", () => {
  test("Offer is terminal", () => {
    expect(isTerminalStatus("Offer")).toBe(true);
  });

  test("Rejected is terminal", () => {
    expect(isTerminalStatus("Rejected")).toBe(true);
  });

  test("Withdrawn is terminal", () => {
    expect(isTerminalStatus("Withdrawn")).toBe(true);
  });

  test("Bookmarked is not terminal", () => {
    expect(isTerminalStatus("Bookmarked")).toBe(false);
  });

  test("Applied is not terminal", () => {
    expect(isTerminalStatus("Applied")).toBe(false);
  });

  test("Phone Screen is not terminal", () => {
    expect(isTerminalStatus("Phone Screen")).toBe(false);
  });

  test("Interviewing is not terminal", () => {
    expect(isTerminalStatus("Interviewing")).toBe(false);
  });
});
