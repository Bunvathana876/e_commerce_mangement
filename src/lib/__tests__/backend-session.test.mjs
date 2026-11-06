import assert from "node:assert/strict";
import { beforeEach, afterEach, it } from "node:test";
import { validateManagementSession } from "../management-session.ts";
import { getAccessToken, getCurrentUser, logout, saveAuthSession, USER_KEY, isTokenExpired, getSafeRoleDestination } from "../auth.ts";

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
globalThis.window = { dispatchEvent() {}, location: { pathname: "/login" } };

const realFetch = globalThis.fetch;
const seller = { id: 7, role: "seller", is_active: true, name: "Test Seller", email: "seller@example.invalid" };
const admin = { ...seller, id: 8, role: "admin" };
const tokenFor = (id) => `e30.${Buffer.from(JSON.stringify({ sub: String(id), exp: Date.now() / 1000 + 3600 })).toString("base64url")}.test-only-signature`;
const reply = (data, status = 200) => new Response(JSON.stringify({ success: status === 200, data }), { status });

beforeEach(() => { logout(); storage.clear(); });
afterEach(() => { globalThis.fetch = realFetch; });

it("uses backend identity despite a tampered local administrator role", async () => {
  const token = tokenFor(seller.id);
  saveAuthSession(token, seller);
  localStorage.setItem(USER_KEY, JSON.stringify(admin));
  globalThis.fetch = async (url, options) => {
    assert.match(url, /\/api\/auth\/me$/);
    assert.equal(options.headers.Authorization, `Bearer ${token}`);
    assert.equal(options.cache, "no-store");
    return reply(seller);
  };
  assert.deepEqual(await validateManagementSession(), seller);
  assert.equal(getCurrentUser().role, "seller");
});

it("does not admit an invented browser session when the backend rejects the token", async () => {
  saveAuthSession(tokenFor(admin.id), admin);
  globalThis.fetch = async () => reply(null, 401);
  assert.equal(await validateManagementSession(), null);
  assert.equal(getAccessToken(), null);
  assert.equal(getCurrentUser(), null);
});

for (const user of [{ ...seller, role: "customer" }, { ...admin, is_active: false }]) {
  it(`rejects backend identity with role=${user.role}, active=${user.is_active}`, async () => {
    saveAuthSession(tokenFor(admin.id), admin);
    globalThis.fetch = async () => reply(user);
    assert.equal(await validateManagementSession(), null);
    assert.equal(getAccessToken(), null);
  });
}

it("fails closed and clears the session when identity verification is unavailable", async () => {
  saveAuthSession(tokenFor(admin.id), admin);
  globalThis.fetch = async () => { throw new Error("Network unavailable"); };
  assert.equal(await validateManagementSession(), null);
  assert.equal(getAccessToken(), null);
});

it("never restores identity from a response arriving after logout", async () => {
  saveAuthSession(tokenFor(admin.id), admin);
  let finish;
  globalThis.fetch = () => new Promise((resolve) => { finish = resolve; });
  const pending = validateManagementSession();
  logout();
  finish(reply(admin));
  assert.equal(await pending, null);
  assert.equal(getCurrentUser(), null);
});

it("an old request's 401 cannot log out a newly authenticated account", async () => {
  saveAuthSession(tokenFor(admin.id), admin);
  let finish;
  globalThis.fetch = () => new Promise((resolve) => { finish = resolve; });
  const pending = validateManagementSession();
  const newToken = tokenFor(seller.id);
  saveAuthSession(newToken, seller);
  finish(reply(null, 401));
  assert.equal(await pending, null);
  assert.equal(getAccessToken(), newToken);
  assert.deepEqual(getCurrentUser(), seller);
});

it("rejects tokens without a finite numeric expiry", () => {
  for (const exp of [undefined, "9999999999", null]) {
    const token = `e30.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.test`;
    assert.equal(isTokenExpired(token), true);
  }
});

it("rejects relative schemes, encoded external destinations and cross-role traversal", () => {
  for (const redirect of ["javascript:alert(1)", "https:evil.example", "/%2fexample.com", "/%5cexample.com", "/%", "/seller/../admin/dashboard"]) {
    assert.equal(getSafeRoleDestination("seller", redirect), "/seller");
  }
});
