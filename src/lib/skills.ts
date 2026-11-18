import { SKILLS_PART1 } from "./skills-part1";
import { SKILLS_PART2 } from "./skills-part2";
import {
  SKILL_CATEGORIES,
  type Skill,
  type SkillCategory,
  type SkillSource,
} from "./skills-types";

export { SKILL_CATEGORIES, type Skill, type SkillCategory, type SkillSource };

export const SKILLS: Skill[] = [...SKILLS_PART1, ...SKILLS_PART2];

export function getSkill(slug: string): Skill | undefined {
  return SKILLS.find((s) => s.slug === slug);
}
