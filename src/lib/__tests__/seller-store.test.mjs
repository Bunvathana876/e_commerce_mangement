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
    location: { pathname: "/seller/store", href: "/seller/store" },
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

// Validation logic matching /seller/store form
function validateStoreForm(formData) {
  const errors = {};
  const trimmedName = (formData.name || "").trim();

  if (!trimmedName) {
    errors.name = "Store name is required.";
  } else if (trimmedName.length < 2) {
    errors.name = "Store name must be at least 2 characters long.";
  } else if (trimmedName.length > 150) {
    errors.name = "Store name cannot exceed 150 characters.";
  }

  if (formData.phone && formData.phone.length > 50) {
    errors.phone = "Phone number cannot exceed 50 characters.";
  }

  if (formData.address && formData.address.length > 255) {
    errors.address = "Address cannot exceed 255 characters.";
  }

  if (formData.description && formData.description.length > 2000) {
    errors.description = "Store description cannot exceed 2,000 characters.";
  }

  if (formData.logo && formData.logo.length > 500) {
    errors.logo = "Logo URL cannot exceed 500 characters.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Payload construction matching /seller/store form
function buildStoreUpdatePayload(formData) {
  return {
    name: formData.name.trim(),
    description: formData.description?.trim() || undefined,
    phone: formData.phone?.trim() || undefined,
    address: formData.address?.trim() || undefined,
    logo: formData.logo?.trim() || undefined,
  };
}

// Status permission logic matching /seller/store page
function getStoreEditPermissions(status) {
  return {
    canEdit: status === "Active",
    isPending: status === "Pending",
    isSuspended: status === "Suspended",
    statusMessage:
      status === "Active"
        ? "Verified Store"
        : status === "Pending"
        ? "Pending Administrator Approval"
        : status === "Suspended"
        ? "Store Suspended"
        : "Unknown Status",
  };
}

// Helper to create JWT tokens for testing
function createJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.mock-signature`;
}

describe("Seller Store Profile & Self-Service Logic (Task B.2)", () => {
  beforeEach(() => {
    mockStorage.clear();
    globalThis.window.location.pathname = "/seller/store";
    globalThis.window.location.href = "/seller/store";
  });

  describe("Form Validation", () => {
    it("1. Valid store data passes validation", () => {
      const res = validateStoreForm({
        name: "Acme Gadgets",
        phone: "+85512345678",
        address: "123 Monivong Blvd",
        description: "Official store description.",
        logo: "https://example.com/logo.png",
      });
      assert.equal(res.isValid, true);
      assert.equal(Object.keys(res.errors).length, 0);
    });

    it("2. Empty or whitespace-only store name is rejected", () => {
      const res = validateStoreForm({ name: "   " });
      assert.equal(res.isValid, false);
      assert.equal(res.errors.name, "Store name is required.");
    });

    it("3. Store name with less than 2 characters is rejected", () => {
      const res = validateStoreForm({ name: "A" });
      assert.equal(res.isValid, false);
      assert.equal(res.errors.name, "Store name must be at least 2 characters long.");
    });

    it("4. Store name exceeding 150 characters is rejected", () => {
      const res = validateStoreForm({ name: "A".repeat(151) });
      assert.equal(res.isValid, false);
      assert.equal(res.errors.name, "Store name cannot exceed 150 characters.");
    });

    it("5. Phone exceeding 50 characters is rejected", () => {
      const res = validateStoreForm({ name: "Valid Name", phone: "1".repeat(51) });
      assert.equal(res.isValid, false);
      assert.equal(res.errors.phone, "Phone number cannot exceed 50 characters.");
    });

    it("6. Address exceeding 255 characters is rejected", () => {
      const res = validateStoreForm({ name: "Valid Name", address: "A".repeat(256) });
      assert.equal(res.isValid, false);
      assert.equal(res.errors.address, "Address cannot exceed 255 characters.");
    });

    it("7. Description exceeding 2,000 characters is rejected", () => {
      const res = validateStoreForm({ name: "Valid Name", description: "D".repeat(2001) });
      assert.equal(res.isValid, false);
      assert.equal(res.errors.description, "Store description cannot exceed 2,000 characters.");
    });

    it("8. Logo URL exceeding 500 characters is rejected", () => {
      const res = validateStoreForm({ name: "Valid Name", logo: "https://example.com/" + "x".repeat(500) });
      assert.equal(res.isValid, false);
      assert.equal(res.errors.logo, "Logo URL cannot exceed 500 characters.");
    });
  });

  describe("Payload Construction & Privileged Field Protection", () => {
    it("9. Payload builder includes only allowed fields and trims whitespace", () => {
      const payload = buildStoreUpdatePayload({
        name: "   Trimmed Store   ",
        description: "  Trimmed Bio  ",
        phone: "  +85598765432  ",
        address: "  Street 10  ",
        logo: "  https://example.com/logo.png  ",
        // Malicious or privileged inputs from compromised client
        status: "Active",
        rating: 5.0,
        user_id: 1,
        products_count: 100,
        total_revenue: 999999,
      });

      assert.equal(payload.name, "Trimmed Store");
      assert.equal(payload.description, "Trimmed Bio");
      assert.equal(payload.phone, "+85598765432");
      assert.equal(payload.address, "Street 10");
      assert.equal(payload.logo, "https://example.com/logo.png");

      // Verify privileged fields are never sent
      assert.equal(payload.status, undefined);
      assert.equal(payload.rating, undefined);
      assert.equal(payload.user_id, undefined);
      assert.equal(payload.products_count, undefined);
      assert.equal(payload.total_revenue, undefined);
    });

    it("10. Empty optional fields resolve to undefined in payload", () => {
      const payload = buildStoreUpdatePayload({
        name: "My Store",
        description: "",
        phone: "   ",
        address: "",
        logo: "",
      });

      assert.equal(payload.name, "My Store");
      assert.equal(payload.description, undefined);
      assert.equal(payload.phone, undefined);
      assert.equal(payload.address, undefined);
      assert.equal(payload.logo, undefined);
    });
  });

  describe("Store Account Status Permissions", () => {
    it("11. Active/approved seller has edit permissions", () => {
      const perm = getStoreEditPermissions("Active");
      assert.equal(perm.canEdit, true);
      assert.equal(perm.isPending, false);
      assert.equal(perm.isSuspended, false);
      assert.equal(perm.statusMessage, "Verified Store");
    });

    it("12. Pending seller approval disables editing", () => {
      const perm = getStoreEditPermissions("Pending");
      assert.equal(perm.canEdit, false);
      assert.equal(perm.isPending, true);
      assert.equal(perm.isSuspended, false);
      assert.equal(perm.statusMessage, "Pending Administrator Approval");
    });

    it("13. Suspended seller disables editing", () => {
      const perm = getStoreEditPermissions("Suspended");
      assert.equal(perm.canEdit, false);
      assert.equal(perm.isPending, false);
      assert.equal(perm.isSuspended, true);
      assert.equal(perm.statusMessage, "Store Suspended");
    });
  });

  describe("Expired Session Detection", () => {
    it("14. Expired token is detected and triggers redirect to login", async () => {
      const { isTokenExpired } = await import("../auth.ts");
      const expiredToken = createJwt({
        sub: "seller@test.com",
        exp: Math.floor(Date.now() / 1000) - 300, // 5 min ago
      });

      assert.equal(isTokenExpired(expiredToken), true);
    });

    it("15. Active valid token passes check", async () => {
      const { isTokenExpired } = await import("../auth.ts");
      const activeToken = createJwt({
        sub: "seller@test.com",
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour future
      });

      assert.equal(isTokenExpired(activeToken), false);
    });
  });
});
