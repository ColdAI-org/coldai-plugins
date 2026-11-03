// Checks plugins/exclip/platform.json: exactly its six keys, ColdAI's receiver in EIP-55 form, its name, the rate 875,
// no fee on stock swaps, and a full ExClip commit. Node alone, no packages: node scripts/check-platform.mjs
import { readFileSync } from "node:fs";

const FILE = new URL("../plugins/exclip/platform.json", import.meta.url);
const RECEIVER = "0x90291104f2D1ef9Ffe2Bc1635A3a270A09C8f313";
const KEYS = ["$comment", "receiver", "receiverName", "rate", "stockFeeBps", "exclipCommit"];

// Keccak-256, the hash EIP-55 uses. Node's "sha3-256" is NIST SHA-3, whose padding differs, so it is written out here.
const MASK = (1n << 64n) - 1n;
const ROUND_CONSTANTS = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n, 0x000000000000808bn,
  0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an, 0x0000000000000088n,
  0x0000000080008009n, 0x000000008000000an, 0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
  0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];
// Rotation offsets, indexed x + 5y.
const ROTATIONS = [0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14];

const rotl = (lane, n) => (n === 0 ? lane : ((lane << BigInt(n)) | (lane >> BigInt(64 - n))) & MASK);

function keccakF(state) {
  for (const constant of ROUND_CONSTANTS) {
    const c = [0, 1, 2, 3, 4].map((x) => state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20]);
    for (let x = 0; x < 5; x++) {
      const d = c[(x + 4) % 5] ^ rotl(c[(x + 1) % 5], 1);
      for (let y = 0; y < 25; y += 5) state[x + y] ^= d;
    }
    const b = new Array(25);
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) b[y + 5 * ((2 * x + 3 * y) % 5)] = rotl(state[x + 5 * y], ROTATIONS[x + 5 * y]);
    }
    for (let y = 0; y < 25; y += 5) {
      for (let x = 0; x < 5; x++) state[x + y] = b[x + y] ^ (~b[((x + 1) % 5) + y] & MASK & b[((x + 2) % 5) + y]);
    }
    state[0] ^= constant;
  }
}

function keccak256(bytes) {
  const rate = 136;
  const padded = new Uint8Array(Math.floor(bytes.length / rate) * rate + rate);
  padded.set(bytes);
  padded[bytes.length] ^= 0x01;
  padded[padded.length - 1] ^= 0x80;
  const state = new Array(25).fill(0n);
  for (let offset = 0; offset < padded.length; offset += rate) {
    for (let i = 0; i < rate / 8; i++) {
      let lane = 0n;
      for (let j = 7; j >= 0; j--) lane = (lane << 8n) | BigInt(padded[offset + 8 * i + j]);
      state[i] ^= lane;
    }
    keccakF(state);
  }
  let hex = "";
  for (let i = 0; i < 32; i++) hex += Number((state[i >> 3] >> BigInt(8 * (i & 7))) & 0xffn).toString(16).padStart(2, "0");
  return hex;
}

// EIP-55: a hex letter is upper case where the matching nibble of keccak256(the lower-case hex) is 8 or more.
function checksummed(address) {
  const hex = address.slice(2).toLowerCase();
  const hash = keccak256(new TextEncoder().encode(hex));
  return "0x" + [...hex].map((ch, i) => (parseInt(hash[i], 16) >= 8 ? ch.toUpperCase() : ch)).join("");
}

const isChecksummed = (value) => typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value) && checksummed(value) === value;

// Test the hash before trusting it: Keccak-256 of "" and of "abc", and the mixed-case examples in EIP-55.
const vectors = [
  [keccak256(new Uint8Array()), "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"],
  [keccak256(new TextEncoder().encode("abc")), "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45"],
];
for (const address of [
  "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
  "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
  "0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB",
  "0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb",
]) {
  vectors.push([checksummed(address.toLowerCase()), address]);
}
for (const [got, want] of vectors) {
  if (got !== want) {
    console.error(`error: the Keccak-256 self-test failed: got ${got}, want ${want}`);
    process.exit(1);
  }
}

const platform = JSON.parse(readFileSync(FILE, "utf8"));
const problems = [];

for (const key of Object.keys(platform)) if (!KEYS.includes(key)) problems.push(`unknown key "${key}"`);
for (const key of KEYS) if (!(key in platform)) problems.push(`missing key "${key}"`);
if (typeof platform.$comment !== "string") problems.push("$comment must be a string");
if (platform.receiver !== RECEIVER) problems.push(`receiver must be ${RECEIVER}`);
if (!isChecksummed(platform.receiver)) problems.push("receiver must be an EIP-55 checksummed address");
if (platform.receiverName !== "ColdAI") problems.push('receiverName must be "ColdAI"');
if (platform.rate !== 875) problems.push("rate must be 875 (0.875 %)");
if (platform.stockFeeBps !== 0) problems.push("stockFeeBps must be 0 (no fee on swaps with a tokenised stock)");
if (typeof platform.exclipCommit !== "string" || !/^[0-9a-f]{40}$/.test(platform.exclipCommit)) {
  problems.push("exclipCommit must be a full commit: 40 lower-case hex digits");
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`error: plugins/exclip/platform.json: ${problem}`);
  process.exit(1);
}
console.log(
  `plugins/exclip/platform.json: receiver ${platform.receiver} (EIP-55), named "ColdAI", rate 875 (0.875 %), ` +
    `no fee on stock swaps, ExClip ${platform.exclipCommit}`,
);
