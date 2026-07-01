/** Pure nullifier helpers — no snarkjs dependency. */

export function nullifierToBytes32(nullifier: string): string {
  const s = nullifier.trim();
  const hex = /^0x/i.test(s) || /[a-f]/i.test(s)
    ? s.replace(/^0x/i, "")
    : BigInt(s).toString(16);
  return hex.padStart(64, "0");
}
