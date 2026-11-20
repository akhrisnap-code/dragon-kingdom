import { randomInt } from "node:crypto";

// Bobot simbol demo. Bobot lebih tinggi berarti lebih sering terpilih.
export const SYMBOLS = [
  { id: "gem", label: "Permata", icon: "💎", weight: 18, payout: 8 },
  { id: "flame", label: "Api", icon: "🔥", weight: 22, payout: 6 },
  { id: "crown", label: "Mahkota", icon: "👑", weight: 15, payout: 10 },
  { id: "moon", label: "Bulan", icon: "🌙", weight: 20, payout: 5 },
  { id: "star", label: "Bintang", icon: "⭐", weight: 17, payout: 7 },
  { id: "dragon", label: "Naga", icon: "🐉", weight: 8, payout: 20 }
];

const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);

// Garis horizontal tengah/atas/bawah dan dua diagonal sederhana.
export const PAYLINES = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2]
];

function drawSymbol() {
  let ticket = randomInt(totalWeight);
  for (const symbol of SYMBOLS) {
    if (ticket < symbol.weight) return symbol;
    ticket -= symbol.weight;
  }
  return SYMBOLS[0];
}

export function createSpin(betAmount) {
  const grid = Array.from({ length: 3 }, () =>
    Array.from({ length: 5 }, drawSymbol)
  );

  const winningLines = [];
  let winAmount = 0;

  PAYLINES.forEach((line, index) => {
    const first = grid[line[0]][0];
    let count = 1;
    for (let reel = 1; reel < 5; reel++) {
      if (grid[line[reel]][reel].id === first.id) count++;
      else break;
    }

    if (count >= 3) {
      const multiplier = first.payout * (count === 3 ? 1 : count === 4 ? 2 : 5);
      const lineWin = Math.floor((betAmount * multiplier) / PAYLINES.length);
      winAmount += lineWin;
      winningLines.push({
        line: index + 1,
        symbol: first.id,
        count,
        multiplier,
        winAmount: lineWin
      });
    }
  });

  return {
    grid: grid.map(row => row.map(s => ({
      id: s.id, label: s.label, icon: s.icon
    }))),
    winningLines,
    winAmount
  };
}

export const publicSymbols = SYMBOLS.map(({ id, label, icon, payout }) =>
  ({ id, label, icon, payout })
);
