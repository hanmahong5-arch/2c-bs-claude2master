import { SEO_LANDINGS_PART1 } from "./seo-landings-part1";
import { SEO_LANDINGS_PART2 } from "./seo-landings-part2";
import { SEO_LANDINGS_PART3 } from "./seo-landings-part3";
import { SEO_LANDINGS_PART4 } from "./seo-landings-part4";
import type { SeoCta, SeoLanding, SeoSection } from "./seo-landings-types";

export type { SeoCta, SeoLanding, SeoSection };

export const SEO_LANDINGS: SeoLanding[] = [
  ...SEO_LANDINGS_PART1,
  ...SEO_LANDINGS_PART2,
  ...SEO_LANDINGS_PART3,
  ...SEO_LANDINGS_PART4,
];

export function getSeoLanding(slug: string): SeoLanding | undefined {
  return SEO_LANDINGS.find((l) => l.slug === slug);
}
