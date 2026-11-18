import { TUTORIALS_PART1 } from "./tutorials-part1";
import { TUTORIALS_PART2 } from "./tutorials-part2";
import { TUTORIALS_PART3 } from "./tutorials-part3";
import {
  TUTORIAL_CATEGORIES,
  type Tutorial,
  type TutorialCategory,
} from "./tutorials-types";

export { TUTORIAL_CATEGORIES, type Tutorial, type TutorialCategory };

export const TUTORIALS: Tutorial[] = [
  ...TUTORIALS_PART1,
  ...TUTORIALS_PART2,
  ...TUTORIALS_PART3,
];

export function getTutorial(slug: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.slug === slug);
}
