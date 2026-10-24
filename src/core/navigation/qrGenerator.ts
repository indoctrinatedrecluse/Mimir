/**
 * ᛗ Mímir Offline QR Matrix Generator
 * Compact, zero-dependency pure TypeScript QR Code matrix generator (ECC Level M)
 * Suitable for encoding URLs up to ~120 characters in Version 1-5 QR matrices.
 */

// Galois field tables for GF(256)
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    EXP[i + 255] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
})();

function gmul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsCompute(data: number[], numEc: number): number[] {
  let gen = [1];
  for (let i = 0; i < numEc; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gmul(gen[j], EXP[i]);
      next[j + 1] ^= gen[j];
    }
    gen = next;
  }

  const res = new Array(data.length + numEc).fill(0);
  for (let i = 0; i < data.length; i++) res[i] = data[i];

  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] ^= gmul(gen[j], coef);
      }
    }
  }

  return res.slice(data.length);
}

// Version capacities (ECC M): [version, totalModules, dataBytes, ecBytes]
const QR_VERSIONS = [
  { ver: 1, size: 21, dataCap: 14, ecCount: 10, align: [] },
  { ver: 2, size: 25, dataCap: 26, ecCount: 16, align: [6, 18] },
  { ver: 3, size: 29, dataCap: 42, ecCount: 26, align: [6, 22] },
  { ver: 4, size: 33, dataCap: 62, ecCount: 36, align: [6, 26] },
  { ver: 5, size: 37, dataCap: 84, ecCount: 48, align: [6, 30] },
  { ver: 6, size: 41, dataCap: 106, ecCount: 64, align: [6, 34] },
];

export function generateQrMatrix(text: string): boolean[][] {
  const enc = new TextEncoder();
  const rawBytes = Array.from(enc.encode(text));

  // Find lowest version that fits
  const config = QR_VERSIONS.find((v) => rawBytes.length <= v.dataCap) || QR_VERSIONS[QR_VERSIONS.length - 1];
  const { size, dataCap, ecCount, align } = config;

  // Build bitstream
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  // 1. Mode Indicator (Byte mode = 0100)
  pushBits(0b0100, 4);

  // 2. Character Count Indicator (8 bits for versions 1-9 in byte mode)
  pushBits(Math.min(rawBytes.length, dataCap), 8);

  // 3. Data bytes
  for (let i = 0; i < Math.min(rawBytes.length, dataCap); i++) {
    pushBits(rawBytes[i], 8);
  }

  // 4. Terminator (up to 4 zero bits)
  const maxBits = dataCap * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);

  // 5. Pad to multiple of 8
  while (bits.length % 8 !== 0) bits.push(0);

  // 6. Pad bytes 0xEC, 0x11
  const dataBytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i + b];
    dataBytes.push(byte);
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataBytes.length < dataCap) {
    dataBytes.push(padBytes[padIdx]);
    padIdx = (padIdx + 1) % 2;
  }

  // 7. Error Correction
  const ecBytes = rsCompute(dataBytes, ecCount);
  const allBytes = [...dataBytes, ...ecBytes];

  // 8. Place Modules in Matrix
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      isFunction[r][c] = true;
    }
  };

  // Finder Patterns
  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            setModule(nr, nc, isBorder || isCenter);
          } else {
            setModule(nr, nc, false); // separator
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // Alignment pattern if version >= 2
  if (align.length === 2) {
    const ar = align[1];
    const ac = align[1];
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        setModule(ar + r, ac + c, isBorder || isCenter);
      }
    }
  }

  // Dark module
  setModule(size - 8, 8, true);

  // Reserve format info areas
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      setModule(8, i, false);
      setModule(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setModule(8, size - 1 - i, false);
    setModule(size - 1 - i, 8, false);
  }

  // Convert allBytes to bits
  const finalBits: number[] = [];
  allBytes.forEach((byte) => {
    for (let b = 7; b >= 0; b--) finalBits.push((byte >> b) & 1);
  });

  // Zigzag placement
  let bitIdx = 0;
  let dir = -1; // upward
  let row = size - 1;
  let col = size - 1;

  while (col > 0) {
    if (col === 6) col--; // skip timing col
    for (let i = 0; i < size; i++) {
      const r = row + dir * i;
      for (let c = 0; c < 2; c++) {
        const currCol = col - c;
        if (!isFunction[r][currCol]) {
          const bitVal = bitIdx < finalBits.length ? finalBits[bitIdx++] === 1 : false;
          // Apply standard mask 0: (r + c) % 2 === 0
          const masked = bitVal !== ((r + currCol) % 2 === 0);
          matrix[r][currCol] = masked;
        }
      }
    }
    row += dir * (size - 1);
    dir = -dir;
    col -= 2;
  }

  // Format info (ECC M, Mask 0): 101010000010010 (precomputed XORed with 101010000010010 = 0x5412)
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  // Around top-left
  const positionsTopLeft = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = positionsTopLeft[i];
    matrix[r][c] = formatBits[i] === 1;
  }
  // Split across top-right & bottom-left
  for (let i = 0; i < 8; i++) {
    matrix[size - 1 - i][8] = formatBits[i] === 1;
  }
  for (let i = 0; i < 7; i++) {
    matrix[8][size - 7 + i] = formatBits[8 + i] === 1;
  }

  return matrix;
}
