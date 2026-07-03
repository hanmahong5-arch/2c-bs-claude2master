import { describe, expect, it } from "bun:test";
import {
  MODEL_PRICES,
  PRICES_AS_OF,
  getModelPrice,
  toCny,
  USD_CNY_RATE,
} from "./llm-prices";
import { ERROR_KB, getErrorEntry } from "./error-kb";
import {
  MCP_SERVERS,
  MCP_CATEGORIES,
  getMcpServer,
} from "./mcp-directory";

describe("llm-prices 注册表自洽", () => {
  it("id 唯一", () => {
    const ids = MODEL_PRICES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("价格为正数且输出价 ≥ 输入价(业界无反例)", () => {
    for (const m of MODEL_PRICES) {
      expect(m.inputPerM, `${m.id} inputPerM`).toBeGreaterThan(0);
      expect(m.outputPerM, `${m.id} outputPerM`).toBeGreaterThanOrEqual(
        m.inputPerM,
      );
    }
  });

  it("每条都有官方 sourceUrl(https)", () => {
    for (const m of MODEL_PRICES) {
      expect(m.sourceUrl.startsWith("https://"), `${m.id} sourceUrl`).toBe(true);
    }
  });

  it("PRICES_AS_OF 是 YYYY-MM-DD", () => {
    expect(PRICES_AS_OF).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("toCny: CNY 原样, USD 按汇率折算", () => {
    expect(toCny(10, "CNY")).toBe(10);
    expect(toCny(10, "USD")).toBe(10 * USD_CNY_RATE);
  });

  it("getModelPrice 查表", () => {
    expect(getModelPrice(MODEL_PRICES[0].id)).toBeDefined();
    expect(getModelPrice("nope")).toBeUndefined();
  });
});

describe("error-kb 注册表自洽", () => {
  it("slug 唯一且 kebab-case", () => {
    const slugs = ERROR_KB.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) {
      expect(s, `slug "${s}"`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("每条内容完整: errorText/symptom 非空, causes/fixes 非空数组", () => {
    for (const e of ERROR_KB) {
      expect(e.errorText.trim().length, `${e.slug} errorText`).toBeGreaterThan(0);
      expect(e.symptom.trim().length, `${e.slug} symptom`).toBeGreaterThan(0);
      expect(e.causes.length, `${e.slug} causes`).toBeGreaterThan(0);
      expect(e.fixes.length, `${e.slug} fixes`).toBeGreaterThan(0);
    }
  });

  it("getErrorEntry 查表", () => {
    expect(getErrorEntry(ERROR_KB[0].slug)).toBeDefined();
    expect(getErrorEntry("nope")).toBeUndefined();
  });
});

describe("mcp-directory 注册表自洽", () => {
  it("slug 唯一且 kebab-case", () => {
    const slugs = MCP_SERVERS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) {
      expect(s, `slug "${s}"`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("每条内容完整: name/descZh/detail/install 非空, tags 非空", () => {
    for (const s of MCP_SERVERS) {
      expect(s.name.trim().length, `${s.slug} name`).toBeGreaterThan(0);
      expect(s.descZh.trim().length, `${s.slug} descZh`).toBeGreaterThan(0);
      expect(s.detail.trim().length, `${s.slug} detail`).toBeGreaterThan(0);
      expect(s.install.trim().length, `${s.slug} install`).toBeGreaterThan(0);
      expect(s.tags.length, `${s.slug} tags`).toBeGreaterThan(0);
    }
  });

  it("每条 sourceUrl 为 https", () => {
    for (const s of MCP_SERVERS) {
      expect(s.sourceUrl.startsWith("https://"), `${s.slug} sourceUrl`).toBe(true);
    }
  });

  it("category 都在 MCP_CATEGORIES 内", () => {
    for (const s of MCP_SERVERS) {
      expect(MCP_CATEGORIES.includes(s.category), `${s.slug} category`).toBe(true);
    }
  });

  it("hosted/托管 类应给出 remote 端点", () => {
    for (const s of MCP_SERVERS) {
      if (s.runtime === "hosted") {
        expect(s.remote.trim().length, `${s.slug} remote`).toBeGreaterThan(0);
      }
    }
  });

  it("getMcpServer 查表", () => {
    expect(getMcpServer(MCP_SERVERS[0].slug)).toBeDefined();
    expect(getMcpServer("nope")).toBeUndefined();
  });
});
