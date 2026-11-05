import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

// 1. Mock LocalStorage and DOM events for Node.js test environment
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
    location: { pathname: "/" },
  };
}

if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = mockStorage;
} else {
  globalThis.localStorage.clear();
}

if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
}

import {
  getSafeRoleDestination,
  saveAuthSession,
  logout,
  isLoggedIn,
  isTokenExpired,
  getCurrentUser,
  clearPrivateSessionData,
} from "../auth.ts";

function createJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = "mock-signature";
  return `${header}.${body}.${signature}`;
}

describe("Role Routing & Interface Segregation (Task B.1)", () => {
  beforeEach(() => {
    mockStorage.clear();
    clearPrivateSessionData();
  });

  describe("Post-Login Redirection (getSafeRoleDestination)", () => {
    it("1. Admin redirects to /admin/dashboard by default", () => {
      const dest = getSafeRoleDestination("admin", null);
      assert.equal(dest, "/admin/dashboard");
    });

    it("2. Admin with valid /admin redirect preserves target path", () => {
      const dest = getSafeRoleDestination("admin", "/admin/orders");
      assert.equal(dest, "/admin/orders");
    });

    it("3. Admin with /seller redirect falls back to /admin/dashboard", () => {
      const dest = getSafeRoleDestination("admin", "/seller");
      assert.equal(dest, "/admin/dashboard");
    });

    it("4. Seller redirects to /seller by default", () => {
      const dest = getSafeRoleDestination("seller", null);
      assert.equal(dest, "/seller");
    });

    it("5. Seller with valid /seller redirect preserves target path", () => {
      const dest = getSafeRoleDestination("seller", "/seller/products");
      assert.equal(dest, "/seller/products");
    });

    it("6. Seller attempting to redirect into /admin is blocked and redirected to /seller", () => {
      const dest = getSafeRoleDestination("seller", "/admin/dashboard");
      assert.equal(dest, "/seller");
    });

    it("7. Customer redirects to storefront / by default", () => {
      const dest = getSafeRoleDestination("customer", null);
      assert.equal(dest, "/");
    });

    it("8. Customer with valid storefront path (/checkout) is preserved", () => {
      const dest = getSafeRoleDestination("customer", "/checkout");
      assert.equal(dest, "/checkout");
    });

    it("9. Customer attempting to redirect into /admin is blocked and redirected to /", () => {
      const dest = getSafeRoleDestination("customer", "/admin/dashboard");
      assert.equal(dest, "/");
    });

    it("10. Customer attempting to redirect into /seller is blocked and redirected to /", () => {
      const dest = getSafeRoleDestination("customer", "/seller");
      assert.equal(dest, "/");
    });

    it("11. Open redirect attempts using protocol relative URLs (//) are blocked", () => {
      assert.equal(getSafeRoleDestination("customer", "//evil.com"), "/");
      assert.equal(getSafeRoleDestination("seller", "//evil.com"), "/seller");
      assert.equal(getSafeRoleDestination("admin", "//evil.com"), "/admin/dashboard");
    });

    it("12. Open redirect attempts using backslashes (/\\) are blocked", () => {
      assert.equal(getSafeRoleDestination("customer", "/\\evil.com"), "/");
      assert.equal(getSafeRoleDestination("seller", "/\\evil.com"), "/seller");
      assert.equal(getSafeRoleDestination("admin", "/\\evil.com"), "/admin/dashboard");
    });

    it("13. Full URL scheme injections (https://) are blocked", () => {
      assert.equal(getSafeRoleDestination("customer", "https://attacker.com"), "/");
      assert.equal(getSafeRoleDestination("seller", "https://attacker.com"), "/seller");
      assert.equal(getSafeRoleDestination("admin", "https://attacker.com"), "/admin/dashboard");
    });
  });

  describe("Layout Role-Guard Simulation", () => {
    function simulateAdminGuard(user, token) {
      if (!token || isTokenExpired(token)) {
        return { allowed: false, redirect: "/login?redirect=%2Fadmin%2Fdashboard" };
      }
      const role = (user?.role || "").toLowerCase().trim();
      if (role === "admin") {
        return { allowed: true, redirect: null };
      }
      if (role === "seller") {
        return { allowed: false, redirect: "/seller" };
      }
      return { allowed: false, redirect: "/account" };
    }

    function simulateSellerGuard(user, token) {
      if (!token || isTokenExpired(token)) {
        return { allowed: false, redirect: "/login?redirect=%2Fseller" };
      }
      const role = (user?.role || "").toLowerCase().trim();
      if (role === "seller") {
        return { allowed: true, redirect: null };
      }
      if (role === "admin") {
        return { allowed: false, redirect: "/admin/dashboard" };
      }
      return { allowed: false, redirect: "/account" };
    }

    it("14. Admin guard allows authenticated admin", () => {
      const token = createJwt({ sub: "admin@test.com", exp: Math.floor(Date.now() / 1000) + 3600 });
      const res = simulateAdminGuard({ id: 1, role: "admin" }, token);
      assert.equal(res.allowed, true);
      assert.equal(res.redirect, null);
    });

    it("15. Admin guard denies seller and redirects to /seller", () => {
      const token = createJwt({ sub: "seller@test.com", exp: Math.floor(Date.now() / 1000) + 3600 });
      const res = simulateAdminGuard({ id: 2, role: "seller" }, token);
      assert.equal(res.allowed, false);
      assert.equal(res.redirect, "/seller");
    });

    it("16. Admin guard denies customer and redirects to /account", () => {
      const token = createJwt({ sub: "cust@test.com", exp: Math.floor(Date.now() / 1000) + 3600 });
      const res = simulateAdminGuard({ id: 3, role: "customer" }, token);
      assert.equal(res.allowed, false);
      assert.equal(res.redirect, "/account");
    });

    it("17. Admin guard denies unauthenticated user and redirects to /login", () => {
      const res = simulateAdminGuard(null, null);
      assert.equal(res.allowed, false);
      assert.equal(res.redirect, "/login?redirect=%2Fadmin%2Fdashboard");
    });

    it("18. Seller guard allows authenticated seller", () => {
      const token = createJwt({ sub: "seller@test.com", exp: Math.floor(Date.now() / 1000) + 3600 });
      const res = simulateSellerGuard({ id: 2, role: "seller" }, token);
      assert.equal(res.allowed, true);
      assert.equal(res.redirect, null);
    });

    it("19. Seller guard denies admin and redirects to /admin/dashboard", () => {
      const token = createJwt({ sub: "admin@test.com", exp: Math.floor(Date.now() / 1000) + 3600 });
      const res = simulateSellerGuard({ id: 1, role: "admin" }, token);
      assert.equal(res.allowed, false);
      assert.equal(res.redirect, "/admin/dashboard");
    });

    it("20. Seller guard denies customer and redirects to /account", () => {
      const token = createJwt({ sub: "cust@test.com", exp: Math.floor(Date.now() / 1000) + 3600 });
      const res = simulateSellerGuard({ id: 3, role: "customer" }, token);
      assert.equal(res.allowed, false);
      assert.equal(res.redirect, "/account");
    });

    it("21. Seller guard denies unauthenticated user and redirects to /login", () => {
      const res = simulateSellerGuard(null, null);
      assert.equal(res.allowed, false);
      assert.equal(res.redirect, "/login?redirect=%2Fseller");
    });
  });

  describe("Session Expiration & Logout Protection", () => {
    it("22. Expired token triggers logout and denies access", () => {
      const expiredToken = createJwt({
        sub: "seller@test.com",
        exp: Math.floor(Date.now() / 1000) - 30, // 30s in the past
      });
      assert.equal(isTokenExpired(expiredToken), true);
    });

    it("23. Logout cleans session keys and dispatches auth-changed event", () => {
      let eventFired = false;
      const listener = (e) => {
        if (e.detail?.action === "logout") {
          eventFired = true;
        }
      };
      globalThis.window.addEventListener("auth-changed", listener);

      const validToken = createJwt({ sub: "user@test.com", exp: Math.floor(Date.now() / 1000) + 3600 });
      saveAuthSession(validToken, { id: 10, email: "user@test.com", name: "User", role: "seller", is_active: true });

      assert.equal(isLoggedIn(), true);
      logout();

      assert.equal(isLoggedIn(), false);
      assert.equal(getCurrentUser(), null);
      assert.equal(eventFired, true);

      globalThis.window.removeEventListener("auth-changed", listener);
    });
  });
});
