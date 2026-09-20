#!/usr/bin/env node
/**
 * Validates resolveApiBaseUrl resolution order and production default (Render).
 * Mirrors lib/apiBaseUrl.ts logic so we can test without loading expo-constants/RN.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const RENDER = "https://resolve-within-backend.onrender.com";
const LEGACY_SPECULAR =
  "https://bcbpzb8nm7j2wkh7vmms5j4hf6m3be9b.app.specular.dev";

const src = readFileSync(join(root, "lib/apiBaseUrl.ts"), "utf8");
const appJson = JSON.parse(readFileSync(join(root, "app.json"), "utf8"));
const apiTs = readFileSync(join(root, "utils/api.ts"), "utf8");
const authTs = readFileSync(join(root, "lib/auth.ts"), "utf8");

const defaultMatch = src.match(
  /export const DEFAULT_API_URL\s*=\s*\n?\s*"([^"]+)"/
);
assert.ok(defaultMatch, "DEFAULT_API_URL export not found");
const DEFAULT_API_URL = defaultMatch[1];
assert.equal(
  DEFAULT_API_URL,
  RENDER,
  `DEFAULT_API_URL must be production Render, got ${DEFAULT_API_URL}`
);
assert.equal(
  appJson.expo.extra.backendUrl,
  RENDER,
  "app.json expo.extra.backendUrl must match DEFAULT_API_URL"
);

// Specular must not be the assigned default (comment/rollback docs OK)
const assignmentBlock = src.slice(
  src.indexOf("export const DEFAULT_API_URL"),
  src.indexOf("export function resolveApiBaseUrl")
);
assert.ok(
  !assignmentBlock.includes("specular"),
  "DEFAULT_API_URL assignment must not reference Specular"
);
assert.ok(
  src.includes(LEGACY_SPECULAR) || src.toLowerCase().includes("legacy"),
  "apiBaseUrl should document Specular as legacy/rollback"
);

assert.ok(
  authTs.includes('from "./apiBaseUrl"') || authTs.includes("from './apiBaseUrl'"),
  "lib/auth.ts must import shared apiBaseUrl"
);
assert.ok(
  apiTs.includes("@/lib/apiBaseUrl") || apiTs.includes("lib/apiBaseUrl"),
  "utils/api.ts must import shared apiBaseUrl"
);
assert.ok(
  !apiTs.toLowerCase().includes("specular default"),
  "utils/api.ts must not describe Specular as the default"
);

/** Same resolution order as lib/apiBaseUrl.ts */
function resolveApiBaseUrl(envUrl, extraUrl, defaultUrl = DEFAULT_API_URL) {
  const fromEnv = typeof envUrl === "string" ? envUrl.trim() : "";
  if (fromEnv.length > 0) return fromEnv;
  const fromExtra = typeof extraUrl === "string" ? extraUrl.trim() : "";
  if (fromExtra.length > 0) return fromExtra;
  if (defaultUrl.trim().length > 0) return defaultUrl;
  throw new Error("API base URL is not configured");
}

// 1) no override → production Render
assert.equal(resolveApiBaseUrl(undefined, undefined), RENDER);
assert.equal(resolveApiBaseUrl(undefined, ""), RENDER);
assert.equal(resolveApiBaseUrl(undefined, null), RENDER);

// 2) EXPO_PUBLIC_API_URL=staging → staging
const staging = "https://staging.example.com";
assert.equal(resolveApiBaseUrl(staging, undefined), staging);
assert.equal(resolveApiBaseUrl(` ${staging} `, RENDER), staging);
// env wins over extra
assert.equal(resolveApiBaseUrl(staging, LEGACY_SPECULAR), staging);

// 3) empty EXPO_PUBLIC_API_URL → production Render
assert.equal(resolveApiBaseUrl("", undefined), RENDER);
assert.equal(resolveApiBaseUrl("   ", undefined), RENDER);
assert.equal(resolveApiBaseUrl("", LEGACY_SPECULAR), LEGACY_SPECULAR); // empty env → extra
assert.equal(resolveApiBaseUrl("", ""), RENDER);

console.log("validate-api-base-url: all checks passed");
console.log(`  DEFAULT_API_URL = ${DEFAULT_API_URL}`);
console.log(`  expo.extra.backendUrl = ${appJson.expo.extra.backendUrl}`);
