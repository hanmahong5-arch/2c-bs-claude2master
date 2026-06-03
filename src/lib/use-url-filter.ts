"use client";

import { useEffect, useRef, useState } from "react";

/**
 * URL-query-persisted filter state for list pages.
 *
 * 把当前筛选值同步进 `?<key>=`,这样从列表点进详情页、再用浏览器返回时,
 * 筛选分类与滚动位置都能保留(否则筛选只活在 useState 里,返回时按裸 URL
 * 重新初始化 → 跳回默认 tab)。
 *
 * 为什么用 history.replaceState 而不是 useSearchParams:
 *   useSearchParams 会让所在页退出静态预渲染 —— 首屏 HTML 不含列表条目(伤 SEO,
 *   且首屏空白等 JS)。本 hook 首屏(SSR/SSG)以 `dflt` 渲染全部内容,挂载后再从
 *   URL 应用筛选,对静态导出零影响。replaceState(非 pushState)使切换筛选不堆历史,
 *   返回时直达列表那条历史记录,浏览器自动恢复滚动位置。
 *
 * @param key      query 参数名(如 "cat" / "tool")
 * @param isValid  校验 URL 原始值是否合法;非法 → 回落 `dflt`(防御外部输入)
 * @param dflt     默认值(URL 无此参数或非法时);等于 `dflt` 时从 URL 删除该参数
 */
export function useUrlFilter<T extends string>(
  key: string,
  isValid: (raw: string) => boolean,
  dflt: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(dflt);
  // "latest ref" 模式: isValid 每次渲染新建,用 ref 取最新值,避免把它放进订阅
  // effect 的依赖导致 popstate 反复重订阅。ref 在 effect 内更新(render 阶段写 ref 违反
  // react-hooks/refs)。
  const isValidRef = useRef(isValid);
  useEffect(() => {
    isValidRef.current = isValid;
  });

  useEffect(() => {
    const read = () => {
      const raw = new URLSearchParams(window.location.search).get(key);
      setValue(raw && isValidRef.current(raw) ? (raw as T) : dflt);
    };
    read(); // 挂载即应用 URL(支持深链 + 返回后重挂载)
    // 浏览器前进/后退 → 重新从 URL 读(组件被 router 缓存复用时仍生效)
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [key, dflt]);

  const select = (next: T): void => {
    setValue(next);
    const params = new URLSearchParams(window.location.search);
    if (next === dflt) params.delete(key);
    else params.set(key, next);
    const qs = params.toString();
    // Next 16 官方支持用原生 history API 做浅层 URL 更新(不触发导航/不重渲染服务端)
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  };

  return [value, select];
}
