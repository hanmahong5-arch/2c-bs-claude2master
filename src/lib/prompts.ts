import { PROMPTS_PART1 } from "./prompts-part1";
import { PROMPTS_PART2 } from "./prompts-part2";
import { PROMPTS_PART3 } from "./prompts-part3";
import { PROMPTS_PART4 } from "./prompts-part4";
import { PROMPTS_PART5 } from "./prompts-part5";
import {
  PROMPT_CATEGORIES,
  type ModelKey,
  type Prompt,
  type PromptCategory,
} from "./prompts-types";

export { PROMPT_CATEGORIES, type ModelKey, type Prompt, type PromptCategory };

export const PROMPTS: Prompt[] = [
  ...PROMPTS_PART1,
  ...PROMPTS_PART2,
  ...PROMPTS_PART3,
  ...PROMPTS_PART4,
  ...PROMPTS_PART5,
];

export function getPrompt(slug: string): Prompt | undefined {
  return PROMPTS.find((p) => p.slug === slug);
}
