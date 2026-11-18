"use client";

import { useEffect, useRef, useState } from "react";

/**
 * URL-query-persisted filter state for list pages.
 *
 * 把当前筛选值同步进 `?<key>=`,这样从列表点进详情页、再用浏览器返回时,
 * 筛选分类与滚动位置都能保留。
 *
 * @param key      query 参数名(如 "cat" / "tool")
 * @param isValid  校验 URL 原始值是否合法;非法 → 回落 `dflt`
 * @param dflt     默认值(URL 无此参数或非法时);等于 `dflt` 时从 URL 删除该参数
 */
export function useUrlFilter<T extends string>(
  key: string,
  isValid: (raw: string) => boolean,
  dflt: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(dflt);
  const isValidRef = useRef(isValid);
  useEffect(() => {
    isValidRef.current = isValid;
  });

  useEffect(() => {
    const read = () => {
      const raw = new URLSearchParams(window.location.search).get(key);
      setValue(raw && isValidRef.current(raw) ? (raw as T) : dflt);
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [key, dflt]);

  const select = (next: T): void => {
    setValue(next);
    const params = new URLSearchParams(window.location.search);
    if (next === dflt) params.delete(key);
    else params.set(key, next);
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  };

  return [value, select];
}
