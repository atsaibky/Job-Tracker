import type { Prospect } from "./schema";
import { INTEREST_LEVELS } from "./schema";

export type InterestFilter = "All" | typeof INTEREST_LEVELS[number];

export function filterByInterest(
  prospects: Prospect[],
  filter: InterestFilter,
): Prospect[] {
  if (filter === "All") {
    return prospects;
  }
  return prospects.filter((p) => p.interestLevel === filter);
}
