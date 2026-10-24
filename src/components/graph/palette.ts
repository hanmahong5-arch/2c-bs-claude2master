import type { EntityType } from "@/lib/graph";

// 图谱配色: 与站点语义色同源 (globals.css --c2m-accent / --lt-ok / --lt-warn / --lt-info / --lt-err),
// 写死十六进制是因为 SVG stroke 与 color-mix 需要具体颜色值参与计算。
export const BRANCH_COLORS = ["#7C5CFF", "#1F7A4F", "#B8821F", "#2D4A8A", "#B3392B"] as const;

export const ENTITY_COLORS: Record<EntityType, string> = {
  company: "#2D4A8A",
  product: "#7C5CFF",
  model: "#B3392B",
  person: "#B8821F",
  concept: "#1F7A4F",
  technique: "#0E7490",
};
