import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAuthenticatedHeaders,
  extractSessionToken,
  hasAuthCredential,
} from "./authHeaders";

describe("buildAuthenticatedHeaders", () => {
  it("prefers Cookie and includes Bearer when both present", () => {
    const headers = buildAuthenticatedHeaders({
      cookie: "better-auth.session_token=abc",
      bearerToken: "raw-token",
    });
    assert.equal(headers.Cookie, "better-auth.session_token=abc");
    assert.equal(headers.Authorization, "Bearer raw-token");
    assert.equal(hasAuthCredential(headers), true);
  });

  it("works with bearer only (staging-compatible fallback)", () => {
    const headers = buildAuthenticatedHeaders({ bearerToken: " raw " });
    assert.equal(headers.Authorization, "Bearer raw");
    assert.equal(headers.Cookie, undefined);
    assert.equal(hasAuthCredential(headers), true);
  });

  it("works with cookie only (documented Expo path)", () => {
    const headers = buildAuthenticatedHeaders({
      cookie: " better-auth.session_token=xyz ",
    });
    assert.equal(headers.Cookie, "better-auth.session_token=xyz");
    assert.ok(headers.Cookie);
    assert.equal(hasAuthCredential(headers), true);
  });

  it("reports missing credentials when empty", () => {
    const headers = buildAuthenticatedHeaders({ cookie: "  ", bearerToken: null });
    assert.equal(hasAuthCredential(headers), false);
  });
});

describe("extractSessionToken", () => {
  it("reads top-level token from email sign-in/up body", () => {
    assert.equal(extractSessionToken({ token: "t1", user: { id: "u" } }), "t1");
  });

  it("reads nested session.token from getSession payload", () => {
    assert.equal(
      extractSessionToken({ session: { token: "t2" }, user: { id: "u" } }),
      "t2"
    );
  });

  it("returns null when absent", () => {
    assert.equal(extractSessionToken(null), null);
    assert.equal(extractSessionToken({ user: {} }), null);
  });
});
