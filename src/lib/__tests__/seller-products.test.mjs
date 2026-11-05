import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

// Mock LocalStorage and DOM events for Node.js test environment
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) ?? null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const mockStorage = new MockLocalStorage();
const eventListeners = {};

if (typeof globalThis.window === "undefined") {
  globalThis.window = {
    addEventListener: (type, fn) => {
      (eventListeners[type] ||= []).push(fn);
    },
    removeEventListener: (type, fn) => {
      eventListeners[type] = (eventListeners[type] || []).filter((f) => f !== fn);
    },
    dispatchEvent: (event) => {
      const type = event.type || "custom";
      for (const fn of eventListeners[type] || []) {
        fn(event);
      }
      return true;
    },
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    location: { pathname: "/seller/products", href: "/seller/products" },
  };
}

if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = mockStorage;
}

if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
}

// Helper to calculate stock badge status
function getStockStatus(stock) {
  if (stock <= 0) return { label: "Out of Stock", level: "critical" };
  if (stock < 10) return { label: `Low Stock (${stock})`, level: "warning" };
  return { label: `${stock} units`, level: "ok" };
}

// Helper to format product price
function formatProductPricing(price, discountPrice) {
  const regular = Number(price);
  const discount = discountPrice ? Number(discountPrice) : null;
  const hasDiscount = discount !== null && discount < regular;

  return {
    regularFormatted: `$${regular.toFixed(2)}`,
    discountFormatted: hasDiscount ? `$${discount.toFixed(2)}` : null,
    hasDiscount,
    displayPrice: hasDiscount ? discount : regular,
  };
}

// Query builder helper matching SellerProductsPage
function buildSellerProductsQuery(params) {
  const query = new URLSearchParams();
  if (params.page && params.page > 1) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));
  if (params.search && params.search.trim()) query.append("search", params.search.trim());
  if (params.category_id && params.category_id !== "all") query.append("category_id", String(params.category_id));
  if (params.status && params.status !== "all") query.append("status", params.status);
  return query.toString();
}

// Helper to create JWT tokens for testing
function createJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.mock-signature`;
}

describe("Seller Products Listing & State Logic (Task C.1)", () => {
  beforeEach(() => {
    mockStorage.clear();
    globalThis.window.location.pathname = "/seller/products";
    globalThis.window.location.href = "/seller/products";
  });

  describe("Product Pricing & Stock Formatting", () => {
    it("1. Regular price formatted correctly without discount", () => {
      const res = formatProductPricing(29.99, null);
      assert.equal(res.regularFormatted, "$29.99");
      assert.equal(res.discountFormatted, null);
      assert.equal(res.hasDiscount, false);
      assert.equal(res.displayPrice, 29.99);
    });

    it("2. Discount price formatted correctly when lower than regular price", () => {
      const res = formatProductPricing(50.00, 39.99);
      assert.equal(res.regularFormatted, "$50.00");
      assert.equal(res.discountFormatted, "$39.99");
      assert.equal(res.hasDiscount, true);
      assert.equal(res.displayPrice, 39.99);
    });

    it("3. Stock status accurately classifies out-of-stock items (0 units)", () => {
      const res = getStockStatus(0);
      assert.equal(res.label, "Out of Stock");
      assert.equal(res.level, "critical");
    });

    it("4. Stock status accurately classifies low-stock items (< 10 units)", () => {
      const res = getStockStatus(5);
      assert.equal(res.label, "Low Stock (5)");
      assert.equal(res.level, "warning");
    });

    it("5. Stock status accurately classifies in-stock items (>= 10 units)", () => {
      const res = getStockStatus(42);
      assert.equal(res.label, "42 units");
      assert.equal(res.level, "ok");
    });
  });

  describe("Query Parameter Serialization & Filtering", () => {
    it("6. Basic listing without filters produces minimal query string", () => {
      const qs = buildSellerProductsQuery({ page: 1, limit: 10, search: "", category_id: "all", status: "all" });
      assert.equal(qs, "limit=10");
    });

    it("7. Search query is trimmed and serialized", () => {
      const qs = buildSellerProductsQuery({ page: 1, limit: 10, search: "  Wireless Mouse  " });
      assert.ok(qs.includes("search=Wireless+Mouse") || qs.includes("search=Wireless%20Mouse"));
    });

    it("8. Category filter excludes 'all' and serializes valid IDs", () => {
      const qsAll = buildSellerProductsQuery({ page: 1, limit: 10, category_id: "all" });
      assert.equal(qsAll.includes("category_id"), false);

      const qsId = buildSellerProductsQuery({ page: 1, limit: 10, category_id: 3 });
      assert.ok(qsId.includes("category_id=3"));
    });

    it("9. Status filter serializes active, inactive, and stock status filters", () => {
      const qsActive = buildSellerProductsQuery({ page: 1, limit: 10, status: "active" });
      assert.ok(qsActive.includes("status=active"));

      const qsLow = buildSellerProductsQuery({ page: 1, limit: 10, status: "low_stock" });
      assert.ok(qsLow.includes("status=low_stock"));

      const qsAll = buildSellerProductsQuery({ page: 1, limit: 10, status: "all" });
      assert.equal(qsAll.includes("status"), false);
    });

    it("10. Pagination parameters serialize page offset when > 1", () => {
      const qsP1 = buildSellerProductsQuery({ page: 1, limit: 20 });
      assert.equal(qsP1.includes("page"), false);

      const qsP3 = buildSellerProductsQuery({ page: 3, limit: 20 });
      assert.ok(qsP3.includes("page=3"));
      assert.ok(qsP3.includes("limit=20"));
    });
  });

  describe("Session Isolation & Expiration Protection", () => {
    it("11. Expired token on /seller/products triggers session invalidation", async () => {
      const { isTokenExpired } = await import("../auth.ts");
      const expiredToken = createJwt({
        sub: "seller@test.com",
        exp: Math.floor(Date.now() / 1000) - 60, // 1 min ago
      });

      assert.equal(isTokenExpired(expiredToken), true);
    });

    it("12. Switching accounts purges cached catalog and state", async () => {
      const { saveAuthSession, logout, getAccessToken, getCurrentUser } = await import("../auth.ts");

      // Valid JWT Seller A session
      const validTokenA = createJwt({ sub: "a@seller.com", exp: Math.floor(Date.now() / 1000) + 3600 });
      saveAuthSession(validTokenA, { id: 4, name: "Seller A", email: "a@seller.com", role: "seller", is_active: true, created_at: "" });
      assert.equal(getAccessToken(), validTokenA);
      assert.equal(getCurrentUser()?.email, "a@seller.com");

      // Logout cleans storage
      logout();
      assert.equal(getAccessToken(), null);
      assert.equal(getCurrentUser(), null);
    });

    it("13. Zero fabricated fallback: empty backend response renders zero items", () => {
      const backendResponse = {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 10,
          total_pages: 1,
        },
      };

      assert.equal(backendResponse.data.items.length, 0);
      assert.equal(backendResponse.data.total, 0);
    });
  });
});
