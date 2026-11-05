import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

class MockStorage {
  privateStore = new Map();
  getItem(key) {
    return this.privateStore.get(key) ?? null;
  }
  setItem(key, val) {
    this.privateStore.set(key, String(val));
  }
  removeItem(key) {
    this.privateStore.delete(key);
  }
  clear() {
    this.privateStore.clear();
  }
}

const mockStorage = new MockStorage();

if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = mockStorage;
}
if (typeof globalThis.window === "undefined") {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
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
  AUTH_KEY,
  TOKEN_KEY,
  USER_KEY,
  isLoggedIn,
  getCurrentUser,
  saveAuthSession,
  logout,
  clearPrivateSessionData,
  getSafeRoleDestination,
  getSessionEpoch,
  isTokenExpired,
  isAllowlistedOrigin,
} from "../auth.ts";

function createJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = "mock-signature";
  return `${header}.${body}.${signature}`;
}

describe("Management Portal Session & Role Isolation", () => {
  beforeEach(() => {
    mockStorage.clear();
    clearPrivateSessionData();
  });

  it("1. Uses isolated management persistence keys", () => {
    assert.equal(AUTH_KEY, "mgmt_isLoggedIn");
    assert.equal(TOKEN_KEY, "mgmt_accessToken");
    assert.equal(USER_KEY, "mgmt_currentUser");
  });

  it("2. Admin session saves cleanly and routes to /admin/dashboard", () => {
    const adminUser = { id: 1, name: "Admin", email: "admin@test.com", role: "admin" };
    const token = createJwt({ sub: adminUser.email, exp: Math.floor(Date.now() / 1000) + 3600 });

    saveAuthSession(token, adminUser);
    assert.equal(isLoggedIn(), true);
    assert.deepEqual(getCurrentUser(), adminUser);
    assert.equal(getSafeRoleDestination(adminUser.role), "/admin/dashboard");
  });

  it("3. Seller session saves cleanly and routes to /seller", () => {
    const sellerUser = { id: 2, name: "Seller", email: "seller@test.com", role: "seller" };
    const token = createJwt({ sub: sellerUser.email, exp: Math.floor(Date.now() / 1000) + 3600 });

    saveAuthSession(token, sellerUser);
    assert.equal(isLoggedIn(), true);
    assert.deepEqual(getCurrentUser(), sellerUser);
    assert.equal(getSafeRoleDestination(sellerUser.role), "/seller");
  });

  it("4. Customer role cannot route to /admin or /seller", () => {
    assert.equal(getSafeRoleDestination("customer"), "/");
    assert.equal(getSafeRoleDestination("customer", "/admin/dashboard"), "/");
    assert.equal(getSafeRoleDestination("customer", "/seller"), "/");
  });

  it("5. Seller cannot route to /admin and is clamped to /seller", () => {
    assert.equal(getSafeRoleDestination("seller", "/admin"), "/seller");
    assert.equal(getSafeRoleDestination("seller", "/admin/dashboard"), "/seller");
    assert.equal(getSafeRoleDestination("seller", "/admin/products"), "/seller");
  });

  it("6. Admin cannot route to /seller and is clamped to /admin/dashboard", () => {
    assert.equal(getSafeRoleDestination("admin", "/seller"), "/admin/dashboard");
    assert.equal(getSafeRoleDestination("admin", "/seller/products"), "/admin/dashboard");
  });

  it("7. Open redirect attacks are blocked and clamped to role home", () => {
    assert.equal(getSafeRoleDestination("admin", "//evil.com"), "/admin/dashboard");
    assert.equal(getSafeRoleDestination("admin", "/\\evil.com"), "/admin/dashboard");
    assert.equal(getSafeRoleDestination("admin", "\\\\evil.com"), "/admin/dashboard");
    assert.equal(getSafeRoleDestination("admin", "javascript:alert(1)"), "/admin/dashboard");
    assert.equal(getSafeRoleDestination("seller", "https://attacker.com"), "/seller");
  });

  it("8. Cross-origin redirects are validated against allowlist", () => {
    assert.equal(isAllowlistedOrigin("http://localhost:3000"), true);
    assert.equal(isAllowlistedOrigin("http://localhost:3001"), true);
    assert.equal(isAllowlistedOrigin("http://127.0.0.1:3000"), true);
    assert.equal(isAllowlistedOrigin("http://127.0.0.1:3001"), true);
    assert.equal(isAllowlistedOrigin("https://evil.com"), false);
    assert.equal(isAllowlistedOrigin("http://localhost:8000"), false);
  });

  it("9. Logout clears private management keys and advances epoch", () => {
    const initialEpoch = getSessionEpoch();
    const adminUser = { id: 1, name: "Admin", email: "admin@test.com", role: "admin" };
    const token = createJwt({ sub: adminUser.email, exp: Math.floor(Date.now() / 1000) + 3600 });

    saveAuthSession(token, adminUser);
    mockStorage.setItem("pos_parked_carts", JSON.stringify([{ id: 101 }]));
    mockStorage.setItem("blue-panda-shop-storage", "customer_cart_data");
    mockStorage.setItem("storefront_isLoggedIn", "true");
    mockStorage.setItem("storefront_accessToken", "cust_token_456");

    logout();
    assert.equal(isLoggedIn(), false);
    assert.equal(mockStorage.getItem(AUTH_KEY), null);
    assert.equal(mockStorage.getItem(TOKEN_KEY), null);
    assert.equal(mockStorage.getItem(USER_KEY), null);
    assert.equal(mockStorage.getItem("pos_parked_carts"), null);

    // Preserves customer storefront storage and session
    assert.equal(mockStorage.getItem("blue-panda-shop-storage"), "customer_cart_data");
    assert.equal(mockStorage.getItem("storefront_isLoggedIn"), "true");
    assert.equal(mockStorage.getItem("storefront_accessToken"), "cust_token_456");
    assert.ok(getSessionEpoch() > initialEpoch);
  });

  it("10. Account switching discards prior private state", () => {
    const adminUser = { id: 1, name: "Admin", email: "admin@test.com", role: "admin" };
    const token1 = createJwt({ sub: adminUser.email, exp: Math.floor(Date.now() / 1000) + 3600 });
    saveAuthSession(token1, adminUser);
    mockStorage.setItem("pos_parked_carts", JSON.stringify([{ id: 55 }]));

    const sellerUser = { id: 2, name: "Seller", email: "seller@test.com", role: "seller" };
    const token2 = createJwt({ sub: sellerUser.email, exp: Math.floor(Date.now() / 1000) + 3600 });
    saveAuthSession(token2, sellerUser);

    assert.equal(getCurrentUser().id, 2);
    assert.equal(getCurrentUser().role, "seller");
    assert.equal(mockStorage.getItem("pos_parked_carts"), null);
  });

  it("11. Expired token triggers invalidation and denies access", () => {
    const expiredToken = createJwt({ sub: "expired@test.com", exp: Math.floor(Date.now() / 1000) - 300 });
    assert.equal(isTokenExpired(expiredToken), true);

    mockStorage.setItem(AUTH_KEY, "true");
    mockStorage.setItem(TOKEN_KEY, expiredToken);
    mockStorage.setItem(USER_KEY, JSON.stringify({ id: 5, role: "admin" }));

    assert.equal(isLoggedIn(), false);
    assert.equal(mockStorage.getItem(AUTH_KEY), null);
  });
});
