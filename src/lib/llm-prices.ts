import { MODEL_PRICES_PART1 } from "./llm-prices-part1";
import { MODEL_PRICES_PART2 } from "./llm-prices-part2";
import {
  PRICES_AS_OF,
  USD_CNY_RATE,
  type ModelPrice,
} from "./llm-prices-types";

export { PRICES_AS_OF, USD_CNY_RATE, type ModelPrice };

export const MODEL_PRICES: ModelPrice[] = [
  ...MODEL_PRICES_PART1,
  ...MODEL_PRICES_PART2,
];

export function toCny(value: number, currency: "USD" | "CNY"): number {
  return currency === "CNY" ? value : value * USD_CNY_RATE;
}

export function getModelPrice(id: string): ModelPrice | undefined {
  return MODEL_PRICES.find((m) => m.id === id);
}
