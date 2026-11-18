import { ERROR_KB_PART1 } from "./error-kb-part1";
import { ERROR_KB_PART2 } from "./error-kb-part2";
import type { ErrorEntry } from "./error-kb-types";

export type { ErrorEntry };

export const ERROR_KB: ErrorEntry[] = [...ERROR_KB_PART1, ...ERROR_KB_PART2];

export function getErrorEntry(slug: string): ErrorEntry | undefined {
  return ERROR_KB.find((e) => e.slug === slug);
}
