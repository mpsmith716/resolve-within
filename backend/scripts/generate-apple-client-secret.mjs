#!/usr/bin/env node
/**
 * Generate the Sign in with Apple client secret (ES256 JWT) for Better Auth 1.4.5's
 * APPLE_CLIENT_SECRET. No dependencies (Node 18+ built-in crypto).
 *
 * The token itself is a secret: it is written to a 0600 file and NEVER printed.
 * Only non-secret claims (iss/sub/aud/kid/iat/exp) are shown.
 *
 * Usage:
 *   node backend/scripts/generate-apple-client-secret.mjs \
 *     --team-id BLXJ5X69U3 \
 *     --key-id <10-char Key ID> \
 *     --client-id com.cypherwavestudios.resolvewithin.signin \
 *     --key-file /workspace/secrets/resolve-within-apple/AuthKey_<KEYID>.p8 \
 *     [--out /workspace/secrets/resolve-within-apple/apple-client-secret.jwt] \
 *     [--days 180]
 *
 * Apple rejects client secrets that expire more than 15777000 s (~182.6 days) after iat.
 * Default lifetime is 180 days; set a reminder to regenerate and update Render before then.
 */
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";

const MAX_SECONDS = 15777000;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const teamId = args["team-id"] || process.env.APPLE_TEAM_ID;
const keyId = args["key-id"] || process.env.APPLE_KEY_ID;
const clientId = args["client-id"] || process.env.APPLE_CLIENT_ID;
const keyFile = args["key-file"] || process.env.APPLE_PRIVATE_KEY_FILE;
const days = Number(args.days ?? 180);
const outFile = resolve(args.out || (keyFile ? `${dirname(keyFile)}/apple-client-secret.jwt` : "apple-client-secret.jwt"));

if (!teamId || !/^[A-Z0-9]{10}$/.test(teamId)) fail("--team-id must be the 10-character Apple Team ID");
if (!keyId || !/^[A-Z0-9]{10}$/.test(keyId)) fail("--key-id must be the 10-character Key ID of the Sign in with Apple key");
if (!clientId) fail("--client-id (the Services ID, e.g. com.cypherwavestudios.resolvewithin.signin) is required");
if (!keyFile) fail("--key-file (path to AuthKey_<KEYID>.p8) is required");
if (!Number.isFinite(days) || days <= 0) fail("--days must be a positive number");

let key;
try {
  key = createPrivateKey(readFileSync(keyFile, "utf8"));
} catch (e) {
  fail(`could not read the .p8 private key (${e.code || e.message})`);
}
if (key.asymmetricKeyType !== "ec") fail("the key is not an EC (P-256) key; download the Sign in with Apple key (.p8)");

const iat = Math.floor(Date.now() / 1000);
const exp = iat + Math.min(Math.floor(days * 86400), MAX_SECONDS);

const header = { alg: "ES256", kid: keyId, typ: "JWT" };
const payload = { iss: teamId, iat, exp, aud: "https://appleid.apple.com", sub: clientId };
const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
const signature = sign("sha256", Buffer.from(signingInput), { key, dsaEncoding: "ieee-p1363" });
const jwt = `${signingInput}.${b64url(signature)}`;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, jwt + "\n", { mode: 0o600 });
chmodSync(outFile, 0o600);

console.log("Apple client secret written (token not printed).");
console.log(`  file:      ${outFile}  (mode 600, ${jwt.length} chars)`);
console.log(`  header:    alg=ES256 kid=${keyId}`);
console.log(`  claims:    iss=${teamId} sub=${clientId} aud=https://appleid.apple.com`);
console.log(`  issued:    ${new Date(iat * 1000).toISOString()}`);
console.log(`  expires:   ${new Date(exp * 1000).toISOString()}  <- regenerate + update APPLE_CLIENT_SECRET on Render before this`);
console.log("Paste the file contents into Render as APPLE_CLIENT_SECRET (open the file in an editor; never echo it into chat or logs). Do not commit it.");
