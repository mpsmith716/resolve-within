import { describe, test, expect } from "bun:test";
import { api, expectStatus } from "./helpers";
import { buildSocialProviders, enabledAuthProviders } from "../src/auth-social";

describe("Auth providers", () => {
  test("enabledAuthProviders mirrors the env checks (booleans only)", () => {
    expect(enabledAuthProviders(buildSocialProviders({}))).toEqual({ google: false, apple: false });
    expect(
      enabledAuthProviders(buildSocialProviders({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" }))
    ).toEqual({ google: true, apple: false });
    // Half-configured providers stay off
    expect(enabledAuthProviders(buildSocialProviders({ GOOGLE_CLIENT_ID: "id", APPLE_CLIENT_ID: "x" }))).toEqual({
      google: false,
      apple: false,
    });
    expect(
      enabledAuthProviders(buildSocialProviders({ APPLE_CLIENT_ID: "svc", APPLE_CLIENT_SECRET: "jwt" }))
    ).toEqual({ google: false, apple: true });
  });

  test("GET /api/auth-providers is public and returns only booleans", async () => {
    const res = await api("/api/auth-providers");
    await expectStatus(res, 200);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["apple", "google"]);
    expect(typeof body.google).toBe("boolean");
    expect(typeof body.apple).toBe("boolean");
  });
});
