"use client";

// useBroadcast — 播报器 context 的访问 hook。
// Context 定义放这里(而非 Provider)以打破 Provider↔Bar↔hook 的循环 import:
//   Provider → useBroadcast(取 Context) + BroadcastBar → useBroadcast。无环。

import { createContext, useContext } from "react";
import type { BroadcastContextValue } from "./types";

export const BroadcastContext = createContext<BroadcastContextValue | null>(null);

export function useBroadcast(): BroadcastContextValue {
  const ctx = useContext(BroadcastContext);
  if (!ctx) {
    throw new Error("useBroadcast 必须在 <BroadcastProvider> 内使用");
  }
  return ctx;
}
