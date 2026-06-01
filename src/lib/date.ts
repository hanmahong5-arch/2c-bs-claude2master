// date.ts — 展示用相对时间。
// 目的: changelog 卡片在绝对日期旁给「N 个月前」弱提示, 让读者区分
// 「这工具停更了」(最新 release 也很旧) 与「我们断抓了」。
//
// now 可注入 → 决定论可测(避免 new Date() 散落业务逻辑)。

const DAY_MS = 86_400_000;

/**
 * 把 ISO 日期(YYYY-MM-DD 或完整 ISO)转成粗粒度中文相对时间。
 * 解析失败返回空串(调用方据此不渲染), 不抛错。
 */
export function relativeAge(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const t = then.getTime();
  if (Number.isNaN(t)) return "";

  const diffDays = Math.floor((now.getTime() - t) / DAY_MS);
  if (diffDays < 0) return ""; // 未来日期(时区/脏数据), 不显示
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`;
  return `${Math.floor(diffDays / 365)} 年前`;
}
