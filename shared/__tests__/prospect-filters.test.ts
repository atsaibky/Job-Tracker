import { filterByInterest, type InterestFilter } from "../prospect-filters";
import type { Prospect } from "../schema";

function makeProspect(overrides: Partial<Prospect> = {}): Prospect {
  return {
    id: 1,
    companyName: "Acme",
    roleTitle: "Engineer",
    jobUrl: null,
    status: "Bookmarked",
    interestLevel: "Medium",
    notes: null,
    targetSalary: null,
    createdAt: new Date(),
    ...overrides,
  };
}

const sampleProspects: Prospect[] = [
  makeProspect({ id: 1, interestLevel: "High" }),
  makeProspect({ id: 2, interestLevel: "Medium" }),
  makeProspect({ id: 3, interestLevel: "Low" }),
  makeProspect({ id: 4, interestLevel: "High" }),
  makeProspect({ id: 5, interestLevel: "Medium" }),
];

describe("filterByInterest", () => {
  test("returns all prospects when filter is 'All'", () => {
    const result = filterByInterest(sampleProspects, "All");
    expect(result).toHaveLength(5);
    expect(result).toEqual(sampleProspects);
  });

  test("returns only High interest prospects", () => {
    const result = filterByInterest(sampleProspects, "High");
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.interestLevel === "High")).toBe(true);
  });

  test("returns only Medium interest prospects", () => {
    const result = filterByInterest(sampleProspects, "Medium");
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.interestLevel === "Medium")).toBe(true);
  });

  test("returns only Low interest prospects", () => {
    const result = filterByInterest(sampleProspects, "Low");
    expect(result).toHaveLength(1);
    expect(result[0].interestLevel).toBe("Low");
  });

  test("returns empty array when no prospects match the filter", () => {
    const prospects = [
      makeProspect({ id: 1, interestLevel: "High" }),
      makeProspect({ id: 2, interestLevel: "High" }),
    ];
    const result = filterByInterest(prospects, "Low");
    expect(result).toHaveLength(0);
  });

  test("returns empty array when given an empty list", () => {
    const result = filterByInterest([], "High");
    expect(result).toHaveLength(0);
  });

  test("does not mutate the original array", () => {
    const original = [...sampleProspects];
    filterByInterest(sampleProspects, "High");
    expect(sampleProspects).toEqual(original);
  });

  test("each filter option works independently", () => {
    const filters: InterestFilter[] = ["All", "High", "Medium", "Low"];
    const results = filters.map((f) => filterByInterest(sampleProspects, f));

    expect(results[0]).toHaveLength(5);
    expect(results[1]).toHaveLength(2);
    expect(results[2]).toHaveLength(2);
    expect(results[3]).toHaveLength(1);
  });
});
