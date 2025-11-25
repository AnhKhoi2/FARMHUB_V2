#!/usr/bin/env node
// Simple helper to verify VNPay HMAC-SHA512 signature locally.
// Usage:
//   node verify_vnpay_signature.js "vnp_Amount=9900000&vnp_TxnRef=...&...&vnp_SecureHash=..."
// Or set ENV VNP_HASH_SECRET and pass only the query string without secret.

import qs from "qs";
import crypto from "crypto";

const argv = process.argv.slice(2);
if (!argv[0]) {
  console.error(
    "Usage: node verify_vnpay_signature.js '<query_string>' [secret]"
  );
  process.exit(2);
}

const raw = argv[0];
const providedSecret = argv[1] || process.env.VNP_HASH_SECRET;
if (!providedSecret) {
  console.error(
    "No secret provided. Pass as second arg or set VNP_HASH_SECRET in env."
  );
  process.exit(2);
}

const parsed = qs.parse(raw);
const received = parsed.vnp_SecureHash || parsed.vnp_SecureHash.toString?.();
delete parsed.vnp_SecureHash;
delete parsed.vnp_SecureHashType;

// sort params alphabetically
const keys = Object.keys(parsed).sort();
const sorted = {};
for (const k of keys) sorted[k] = parsed[k];

const signData = qs.stringify(sorted, { encode: false });
const hmac = crypto.createHmac("sha512", providedSecret);
const computed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

console.log("signData:", signData);
console.log("received:", received);
console.log("computed:", computed);
console.log(
  "match:",
  received && received.toLowerCase() === computed.toLowerCase()
);

if (received && received.toLowerCase() !== computed.toLowerCase())
  process.exit(1);
process.exit(0);
