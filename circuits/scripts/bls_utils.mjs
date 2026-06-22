// Helpers to convert snarkjs BLS12-381 points into the byte encoding expected
// by Soroban's BLS12-381 host functions.
//
// Soroban encodings (uncompressed, big-endian):
//   G1 (96 bytes): be(X) || be(Y)                         (X, Y in Fp, 48 bytes each)
//   G2 (192 bytes): be(X_c1) || be(X_c0) || be(Y_c1) || be(Y_c0)
//
// snarkjs represents an Fp2 element as [c0, c1].

function be48(decStr) {
  const hex = BigInt(decStr).toString(16).padStart(96, "0");
  if (hex.length !== 96) throw new Error("Fp element too large: " + decStr);
  return hex;
}

// G1 point from snarkjs: [x, y, "1"]  ->  96-byte hex
export function g1ToHex(p) {
  return be48(p[0]) + be48(p[1]);
}

// G2 point from snarkjs: [[x_c0, x_c1], [y_c0, y_c1], ["1","0"]] -> 192-byte hex
// Soroban wants c1 before c0.
export function g2ToHex(p) {
  const x = p[0];
  const y = p[1];
  return be48(x[1]) + be48(x[0]) + be48(y[1]) + be48(y[0]);
}

export function hexToByteArrayLiteral(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push("0x" + hex.slice(i, i + 2));
  }
  return bytes;
}
